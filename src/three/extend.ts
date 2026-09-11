import { Object3D } from 'three';
import type { Vector3 } from 'three';
import type { Mat4 } from '../core/mat4';
import * as mat4 from '../core/mat4';
import type { Quat } from '../core/quat';
import type { Vec3 } from '../core/vec3';
import { installViews, releaseViews } from './mirror';

// extend(scene) makes a whole scene math-backed in one call.
//
// Every object gets a Transform record: tuples for position, rotation and scale, plus the
// object's own matrix storage. Views over the tuples replace the object's transform
// properties (see mirror.ts), so three's API keeps working and reads the same numbers math
// writes. The scene's `updateMatrixWorld` is overridden so the renderer's per-frame call runs
// one flat parents-first pass instead of a recursive walk. Objects added later join from
// three's `childadded` event, so loaders, clone(), react-three-fiber and friends are covered
// automatically. Objects that leave the scene are released on the next pass. Nodes that are
// not extended (released by hand) still get three's own per-node update inside the same pass.
//
// Honors per-node `matrixAutoUpdate`, `matrixWorldAutoUpdate` and `pivot`, and clears
// `matrixWorldNeedsUpdate`, the same as three's `updateMatrixWorld` on the renderer path.
//
// Classes that extend `updateMatrixWorld` (Camera computes matrixWorldInverse, SkinnedMesh
// its bindMatrixInverse, TransformControls its gizmo, user subclasses whatever they like)
// keep their behavior. The pass delegates to their own method and skips their subtree,
// which that method walks itself. Their records and views still work, because three's
// `updateMatrix` composes from the views.

/** The math side of an extended object. Stable for as long as the object stays extended. */
export type Transform = {
    position: Vec3;
    rotation: Quat;
    scale: Vec3;
    /** aliases `object.matrix.elements` */
    local: Mat4;
    /** aliases `object.matrixWorld.elements` */
    world: Mat4;
};

type Pivoted = Object3D & { pivot?: Vector3 | null };
type ChildEvent = { child: Object3D };

// object to its record, and to the scene that owns its views (null for standalone objects)
const records = new WeakMap<Object3D, Transform>();
const owners = new WeakMap<Object3D, Graph | null>();
const graphs = new WeakMap<Object3D, Graph>();

function createGraph(root: Object3D) {
    const g = {
        root,
        version: 0,
        // every extended object under the root
        members: new Set<Object3D>(),
        // every node in the scene reports hierarchy changes, extended or not, until it leaves
        tracked: new Set<Object3D>(),
        // flat traversal of the scene, rebuilt lazily after any structural change. The pass
        // reads parallel arrays by traversal index, with the tuple references copied out of
        // the records at rebuild, so the per-node work touches no record and no lookup.
        orderDirty: true,
        orderObjects: [] as Object3D[],
        orderParents: [] as Mat4[],
        orderPositions: [] as Vec3[],
        orderRotations: [] as Quat[],
        orderScales: [] as Vec3[],
        orderLocals: [] as Mat4[],
        orderWorlds: [] as Mat4[],
        // per order entry: 0 extended, 1 delegate to the object's own updateMatrixWorld, 2 plain three
        orderKinds: new Int32Array(0),
        // per order entry, the index just past its last descendant, to skip a delegated subtree
        orderEnds: new Int32Array(0),
        orderCount: 0,
        onChildAdded: null as unknown as (event: ChildEvent) => void,
        onChildRemoved: null as unknown as () => void,
    };
    g.onChildAdded = (event) => {
        event.child.traverse((node) => {
            extendNode(g, node);
        });
    };
    g.onChildRemoved = () => {
        g.orderDirty = true;
    };
    return g;
}
type Graph = ReturnType<typeof createGraph>;

/** The Transform of an extended object. Throws for an object that is not extended. */
export function transformOf(object: Object3D): Transform {
    const record = records.get(object);
    if (record === undefined) throw new Error(`object "${object.name || object.type}" is not extended`);
    return record;
}

function createRecord(object: Object3D): Transform {
    const record: Transform = {
        position: [object.position.x, object.position.y, object.position.z],
        rotation: [object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w],
        scale: [object.scale.x, object.scale.y, object.scale.z],
        local: object.matrix.elements,
        world: object.matrixWorld.elements,
    };
    installViews(object, record.position, record.rotation, record.scale);
    records.set(object, record);
    return record;
}

/**
 * Extends one object on its own, such as a camera outside the scene tree. Its own
 * `updateMatrixWorld` composes from the views. Stays extended until `release`.
 */
export function extendObject(object: Object3D): Transform {
    const existing = records.get(object);
    if (existing !== undefined) return existing;
    owners.set(object, null);
    return createRecord(object);
}

function extendNode(g: Graph, object: Object3D): void {
    g.orderDirty = true;
    if (owners.get(object) === g) return;
    if (records.has(object)) {
        // owned elsewhere, standalone or another scene: take over, keeping the same record
        const previous = owners.get(object);
        if (previous != null) previous.members.delete(object);
        owners.set(object, g);
    } else {
        owners.set(object, g);
        createRecord(object);
    }
    g.members.add(object);
    track(g, object);
}

function track(g: Graph, object: Object3D): void {
    if (g.tracked.has(object)) return;
    g.tracked.add(object);
    object.addEventListener('childadded', g.onChildAdded);
    object.addEventListener('childremoved', g.onChildRemoved);
}

function untrack(g: Graph, object: Object3D): void {
    if (!g.tracked.delete(object)) return;
    object.removeEventListener('childadded', g.onChildAdded);
    object.removeEventListener('childremoved', g.onChildRemoved);
}

/**
 * Gives an object its plain three transform back. An object that stays in an extended scene
 * keeps reporting hierarchy changes, so children added under it later are still extended.
 */
export function release(object: Object3D): void {
    if (!records.has(object)) return;
    const g = owners.get(object);
    if (g != null) {
        g.members.delete(object);
        g.orderDirty = true;
    }
    owners.delete(object);
    records.delete(object);
    releaseViews(object);
}

// plain nodes compose through three, so their tuple entries are never read
const unusedPosition: Vec3 = [0, 0, 0];
const unusedRotation: Quat = [0, 0, 0, 1];
const unusedScale: Vec3 = [1, 1, 1];

function rebuildOrder(g: Graph): void {
    const { root, orderObjects, orderParents, orderPositions, orderRotations, orderScales, orderLocals, orderWorlds } = g;
    const visited = new Set<Object3D>();
    const kinds: number[] = [];
    const ends: number[] = [];
    let count = 0;
    // parents-first, every node in the scene, extended or not
    const visit = (object: Object3D, parentWorld: Mat4): void => {
        const k = count++;
        orderObjects[k] = object;
        orderParents[k] = parentWorld;
        const record = owners.get(object) === g ? records.get(object) : undefined;
        if (record !== undefined) {
            orderPositions[k] = record.position;
            orderRotations[k] = record.rotation;
            orderScales[k] = record.scale;
            orderLocals[k] = record.local;
            orderWorlds[k] = record.world;
            kinds[k] = object.updateMatrixWorld === Object3D.prototype.updateMatrixWorld ? 0 : 1;
        } else {
            orderPositions[k] = unusedPosition;
            orderRotations[k] = unusedRotation;
            orderScales[k] = unusedScale;
            orderLocals[k] = object.matrix.elements;
            orderWorlds[k] = object.matrixWorld.elements;
            kinds[k] = object.updateMatrixWorld === Object3D.prototype.updateMatrixWorld ? 2 : 1;
        }
        visited.add(object);
        track(g, object);
        const world = object.matrixWorld.elements;
        const children = object.children;
        for (let i = 0; i < children.length; i++) visit(children[i], world);
        ends[k] = count;
    };
    const rootWorld = root.matrixWorld.elements;
    for (let i = 0; i < root.children.length; i++) visit(root.children[i], rootWorld);
    orderObjects.length = count;
    orderParents.length = count;
    orderPositions.length = count;
    orderRotations.length = count;
    orderScales.length = count;
    orderLocals.length = count;
    orderWorlds.length = count;
    if (g.orderKinds.length !== count) {
        g.orderKinds = new Int32Array(count);
        g.orderEnds = new Int32Array(count);
    }
    for (let k = 0; k < count; k++) {
        g.orderKinds[k] = kinds[k];
        g.orderEnds[k] = ends[k];
    }
    g.orderCount = count;
    // anything tracked that is no longer under the root has left the scene
    for (const object of g.tracked) {
        if (visited.has(object)) continue;
        if (owners.get(object) === g) release(object);
        untrack(g, object);
    }
    g.orderDirty = false;
}

function applyPivot(local: Mat4, pivot: Vector3): void {
    // the same arithmetic as three's Object3D.updateMatrix
    const px = pivot.x;
    const py = pivot.y;
    const pz = pivot.z;
    local[12] += px - local[0] * px - local[4] * py - local[8] * pz;
    local[13] += py - local[1] * px - local[5] * py - local[9] * pz;
    local[14] += pz - local[2] * px - local[6] * py - local[10] * pz;
}

/** One flat pass over the scene: compose extended nodes from their records, propagate world matrices. */
export function propagate(scene: Object3D): void {
    const g = graphs.get(scene);
    if (g === undefined) throw new Error('scene is not extended');
    run(g);
}

function run(g: Graph): void {
    if (g.orderDirty) rebuildOrder(g);
    g.version++;
    const { orderObjects, orderParents, orderPositions, orderRotations, orderScales, orderLocals, orderWorlds } = g;
    const { orderKinds, orderEnds, orderCount } = g;
    for (let k = 0; k < orderCount; ) {
        const object = orderObjects[k] as Pivoted;
        const kind = orderKinds[k];
        if (kind === 1) {
            // a subclass with its own updateMatrixWorld: let it run and walk its subtree
            object.updateMatrixWorld(true);
            k = orderEnds[k];
            continue;
        }
        if (object.matrixAutoUpdate) {
            if (kind === 0) {
                const local = orderLocals[k];
                mat4.fromRotationTranslationScale(local, orderRotations[k], orderPositions[k], orderScales[k]);
                const pivot = object.pivot;
                if (pivot != null) applyPivot(local, pivot);
            } else {
                object.updateMatrix();
            }
        }
        if (object.matrixWorldAutoUpdate) mat4.multiply(orderWorlds[k], orderParents[k], orderLocals[k]);
        object.matrixWorldNeedsUpdate = false;
        k++;
    }
}

function updateSelf(root: Object3D): void {
    if (root.matrixAutoUpdate) root.updateMatrix();
    if (root.matrixWorldAutoUpdate) {
        if (root.parent === null) root.matrixWorld.copy(root.matrix);
        else root.matrixWorld.multiplyMatrices(root.parent.matrixWorld, root.matrix);
    }
    root.matrixWorldNeedsUpdate = false;
}

/**
 * Extends every object under `scene` and makes the scene's own update entry points run the
 * flat pass. Returns the scene. The scene itself keeps plain three transforms. Calling it on
 * an already extended scene is a no-op.
 */
export function extend<T extends Object3D>(scene: T): T {
    if (graphs.has(scene)) return scene;
    const g = createGraph(scene);
    graphs.set(scene, g);
    scene.updateMatrixWorld = () => {
        updateSelf(scene);
        run(g);
    };
    scene.updateWorldMatrix = (updateParents?: boolean, updateChildren?: boolean) => {
        if (updateParents === true && scene.parent !== null) scene.parent.updateWorldMatrix(true, false);
        updateSelf(scene);
        if (updateChildren === true) run(g);
    };
    scene.addEventListener('childadded', g.onChildAdded);
    scene.addEventListener('childremoved', g.onChildRemoved);
    for (let i = 0; i < scene.children.length; i++) {
        scene.children[i].traverse((node) => {
            extendNode(g, node);
        });
    }
    return scene;
}

/** Undoes extend: every object under the scene gets plain transforms back, the scene its own methods. */
export function unextend(scene: Object3D): void {
    const g = graphs.get(scene);
    if (g === undefined) return;
    for (const object of g.members) release(object);
    for (const object of g.tracked) untrack(g, object);
    scene.removeEventListener('childadded', g.onChildAdded);
    scene.removeEventListener('childremoved', g.onChildRemoved);
    delete (scene as Partial<Object3D>).updateMatrixWorld;
    delete (scene as Partial<Object3D>).updateWorldMatrix;
    graphs.delete(scene);
}
