import { Euler, type Object3D, Quaternion, Vector3 } from 'three';
import type { Mat4 } from '../core/mat4';
import * as mat4 from '../core/mat4';
import type { Quat } from '../core/quat';
import type { Vec3 } from '../core/vec3';

// Object3D transform views share math tuples. Euler angles are derived on demand.
// The fixed subtree pass does not support pivots or per-node manual matrices.

type Vec3View = Vector3 & { readonly t: Vec3 };
type QuatView = Quaternion & { readonly t: Quat };
type LazyEuler = Euler & {
    __x: number;
    __y: number;
    __z: number;
    __order: Euler['order'];
    // Quaternion values corresponding to the stored Euler angles.
    sx: number;
    sy: number;
    sz: number;
    sw: number;
    readonly q: QuatView;
};

// Shared prototypes bypass constructors that would write through the tuple accessors.

function Vec3ViewCtor(this: Vec3View, t: Vec3) {
    (this as { t: Vec3 }).t = t;
}
Vec3ViewCtor.prototype = Object.create(Vector3.prototype, {
    constructor: { value: Vector3 },
    x: {
        get(this: Vec3View) {
            return this.t[0];
        },
        set(this: Vec3View, v: number) {
            this.t[0] = v;
        },
    },
    y: {
        get(this: Vec3View) {
            return this.t[1];
        },
        set(this: Vec3View, v: number) {
            this.t[1] = v;
        },
    },
    z: {
        get(this: Vec3View) {
            return this.t[2];
        },
        set(this: Vec3View, v: number) {
            this.t[2] = v;
        },
    },
});
const Vec3ViewClass = Vec3ViewCtor as unknown as new (t: Vec3) => Vec3View;

function QuatViewCtor(this: QuatView, t: Quat) {
    (this as { isQuaternion: boolean }).isQuaternion = true;
    (this as { t: Quat }).t = t;
}
QuatViewCtor.prototype = Object.create(Quaternion.prototype, {
    constructor: { value: Quaternion },
    _x: {
        get(this: QuatView) {
            return this.t[0];
        },
        set(this: QuatView, v: number) {
            this.t[0] = v;
        },
    },
    _y: {
        get(this: QuatView) {
            return this.t[1];
        },
        set(this: QuatView, v: number) {
            this.t[1] = v;
        },
    },
    _z: {
        get(this: QuatView) {
            return this.t[2];
        },
        set(this: QuatView, v: number) {
            this.t[2] = v;
        },
    },
    _w: {
        get(this: QuatView) {
            return this.t[3];
        },
        set(this: QuatView, v: number) {
            this.t[3] = v;
        },
    },
});
const QuatViewClass = QuatViewCtor as unknown as new (t: Quat) => QuatView;

// Preserve explicit angles until the quaternion changes. Re-deriving an equivalent Euler
// can change its angles and reverse subsequent component increments.
function eulerStale(e: LazyEuler): boolean {
    const t = e.q.t;
    return t[0] !== e.sx || t[1] !== e.sy || t[2] !== e.sz || t[3] !== e.sw;
}

function snapshotEuler(e: LazyEuler): void {
    const t = e.q.t;
    e.sx = t[0];
    e.sy = t[1];
    e.sz = t[2];
    e.sw = t[3];
}

function deriveEuler(e: LazyEuler): void {
    // Snapshot first because derivation writes through the Euler accessors.
    snapshotEuler(e);
    Euler.prototype.setFromQuaternion.call(e, e.q, undefined, false);
}

function eulerComponent(field: '__x' | '__y' | '__z'): PropertyDescriptor {
    return {
        get(this: LazyEuler) {
            if (eulerStale(this)) deriveEuler(this);
            return this[field];
        },
        set(this: LazyEuler, v: number) {
            if (eulerStale(this)) deriveEuler(this);
            this[field] = v;
        },
    };
}

function LazyEulerCtor(this: LazyEuler, q: QuatView, source: Euler) {
    const self = this as unknown as {
        isEuler: boolean;
        __x: number;
        __y: number;
        __z: number;
        __order: Euler['order'];
        sx: number;
        sy: number;
        sz: number;
        sw: number;
        q: QuatView;
    };
    self.isEuler = true;
    self.__x = source.x;
    self.__y = source.y;
    self.__z = source.z;
    self.__order = source.order;
    self.sx = q.t[0];
    self.sy = q.t[1];
    self.sz = q.t[2];
    self.sw = q.t[3];
    self.q = q;
}
LazyEulerCtor.prototype = Object.create(Euler.prototype, {
    constructor: { value: Euler },
    _x: eulerComponent('__x'),
    _y: eulerComponent('__y'),
    _z: eulerComponent('__z'),
    // Sync in the old order before reinterpreting the angles in a new order.
    _order: {
        get(this: LazyEuler) {
            return this.__order;
        },
        set(this: LazyEuler, v: Euler['order']) {
            if (eulerStale(this)) deriveEuler(this);
            this.__order = v;
        },
    },
});
const LazyEulerClass = LazyEulerCtor as unknown as new (q: QuatView, source: Euler) => LazyEuler;

export function createMirrorGraph(capacity: number) {
    const positions: Vec3[] = new Array(capacity);
    const rotations: Quat[] = new Array(capacity);
    const scales: Vec3[] = new Array(capacity);
    const locals: Mat4[] = new Array(capacity);
    const worlds: Mat4[] = new Array(capacity);
    const parents: Mat4[] = new Array(capacity);
    return { capacity, count: 0, version: 0, positions, rotations, scales, locals, worlds, parents };
}
export type MirrorGraph = ReturnType<typeof createMirrorGraph>;

/**
 * Seeds tuples from the current transform and installs views. Extend parents before their
 * children and pass the parent's `matrixWorld.elements` as `parentWorld`.
 */
export function extendTransform(g: MirrorGraph, object: Object3D, parentWorld: Mat4): number {
    if (g.count >= g.capacity) throw new Error('mirror graph is full');
    const i = g.count++;

    const p: Vec3 = [object.position.x, object.position.y, object.position.z];
    const q: Quat = [object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w];
    const s: Vec3 = [object.scale.x, object.scale.y, object.scale.z];
    g.positions[i] = p;
    g.rotations[i] = q;
    g.scales[i] = s;
    g.locals[i] = object.matrix.elements;
    g.worlds[i] = object.matrixWorld.elements;
    g.parents[i] = parentWorld;

    installViews(object, p, q, s);
    return i;
}

/** Swaps an object's transform properties for views over the given tuples. */
export function installViews(object: Object3D, p: Vec3, q: Quat, s: Vec3): void {
    const position = new Vec3ViewClass(p);
    const quaternion = new QuatViewClass(q);
    const scale = new Vec3ViewClass(s);
    const rotation = new LazyEulerClass(quaternion, object.rotation);

    // Keep explicitly written angles synchronized with their quaternion.
    rotation._onChange(() => {
        quaternion.setFromEuler(rotation, false);
        snapshotEuler(rotation);
    });
    // Keep accessors on the views so Object3D retains ordinary data properties.
    Object.defineProperties(object, {
        position: { configurable: true, enumerable: true, value: position },
        rotation: { configurable: true, enumerable: true, value: rotation },
        quaternion: { configurable: true, enumerable: true, value: quaternion },
        scale: { configurable: true, enumerable: true, value: scale },
    });
}

/** Restores stock transform objects and their Euler and quaternion change callbacks. */
export function releaseViews(object: Object3D): void {
    const position = new Vector3().copy(object.position);
    const quaternion = new Quaternion().copy(object.quaternion);
    const scale = new Vector3().copy(object.scale);
    const rotation = new Euler().copy(object.rotation);
    rotation._onChange(() => {
        quaternion.setFromEuler(rotation, false);
    });
    quaternion._onChange(() => {
        rotation.setFromQuaternion(quaternion, undefined, false);
    });
    Object.defineProperties(object, {
        position: { configurable: true, enumerable: true, value: position },
        rotation: { configurable: true, enumerable: true, value: rotation },
        quaternion: { configurable: true, enumerable: true, value: quaternion },
        scale: { configurable: true, enumerable: true, value: scale },
    });
}

/** Composes every extended node from its tuples and propagates world matrices, parents first. */
export function propagate(g: MirrorGraph): MirrorGraph {
    g.version++;
    const { count, positions, rotations, scales, locals, worlds, parents } = g;
    for (let i = 0; i < count; i++) {
        mat4.fromRotationTranslationScale(locals[i], rotations[i], positions[i], scales[i]);
        mat4.multiply(worlds[i], parents[i], locals[i]);
    }
    return g;
}

/**
 * Routes subtree updates and ancestor updates from world queries through the flat pass.
 */
export function claimSubtree(g: MirrorGraph, root: Object3D): void {
    root.updateMatrixWorld = () => {
        propagate(g);
    };
    root.updateWorldMatrix = (updateParents?: boolean) => {
        if (updateParents === true && root.parent !== null) root.parent.updateWorldMatrix(true, false);
        propagate(g);
    };
}
