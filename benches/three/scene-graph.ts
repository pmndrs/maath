import { Object3D, Quaternion, Scene, Vector3 } from 'three';
import type { Mat4 } from '../../src/core/mat4';
import * as mat4 from '../../src/core/mat4';
import * as quat from '../../src/core/quat';
import type { Vec3 } from '../../src/core/vec3';
import * as vec3 from '../../src/core/vec3';
import * as mulberry32 from '../../src/random/mulberry32';
import { claimTransform } from '../../src/three';
import { extend, transformOf, type Transform } from '../../src/three';
import { claimSubtree, createMirrorGraph, extendTransform, type MirrorGraph } from '../../src/three/mirror';

// Each variant animates a 4-ary tree and propagates its world matrices.

export const NODES = 4096;
export const FRAME_T = 0.5;

const AXIS: Vec3 = [0.267261, 0.534522, 0.801784];
const ONE: Vec3 = [1, 1, 1];

export function createSceneGraph(count: number, makeNode: () => Object3D = () => new Object3D()) {
    const rand = mulberry32.create(42);
    const scene = new Scene();
    const objects: Object3D[] = [];
    const base = new Float64Array(count * 3);
    const phase = new Float64Array(count);
    for (let i = 0; i < count; i++) {
        const object = makeNode();
        const parent = i === 0 ? scene : objects[(i - 1) >> 2];
        parent.add(object);
        objects.push(object);
        base[i * 3] = (mulberry32.sample(rand) - 0.5) * 4;
        base[i * 3 + 1] = (mulberry32.sample(rand) - 0.5) * 4;
        base[i * 3 + 2] = (mulberry32.sample(rand) - 0.5) * 4;
        phase[i] = mulberry32.sample(rand) * Math.PI * 2;
    }
    scene.updateMatrixWorld();
    return { scene, objects, count, base, phase };
}
export type SceneGraph = ReturnType<typeof createSceneGraph>;

const threeAxis = new Vector3(AXIS[0], AXIS[1], AXIS[2]);

export function updateThree(s: SceneGraph, t: number): void {
    const { scene, objects, count, base, phase } = s;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        const object = objects[i];
        object.position.set(base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        object.quaternion.setFromAxisAngle(threeAxis, phase[i] + t);
    }
    scene.updateMatrixWorld();
}

// Reusable scratch objects avoid allocation and Object3D's Euler synchronization.
const position = new Vector3();
const rotation = new Quaternion();
const scale = new Vector3(1, 1, 1);

export function prepareThreeManual(s: SceneGraph): void {
    for (const object of s.objects) object.matrixAutoUpdate = false;
}

export function updateThreeManual(s: SceneGraph, t: number): void {
    const { scene, objects, count, base, phase } = s;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        const object = objects[i];
        position.set(base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        rotation.setFromAxisAngle(threeAxis, phase[i] + t);
        object.matrix.compose(position, rotation, scale);
        object.matrixWorldNeedsUpdate = true;
    }
    scene.updateMatrixWorld();
}

export function createMathGraph(s: SceneGraph) {
    const locals: Mat4[] = new Array(s.count);
    const worlds: Mat4[] = new Array(s.count);
    const parents: Mat4[] = new Array(s.count);
    for (let i = 0; i < s.count; i++) {
        const { local, world } = claimTransform(s.objects[i]);
        locals[i] = local;
        worlds[i] = world;
        parents[i] = i === 0 ? s.scene.matrixWorld.elements : worlds[(i - 1) >> 2];
    }
    return { locals, worlds, parents, p: vec3.create(), q: quat.create() };
}
export type MathGraph = ReturnType<typeof createMathGraph>;

export function updateMath(s: SceneGraph, g: MathGraph, t: number): void {
    const { count, base, phase } = s;
    const { locals, worlds, parents, p, q } = g;
    // Parent indices precede children so one pass propagates the entire tree.
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        vec3.set(p, base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        quat.setAxisAngle(q, AXIS, phase[i] + t);
        mat4.fromRotationTranslationScale(locals[i], q, p, ONE);
        mat4.multiply(worlds[i], parents[i], locals[i]);
    }
}

export function checksum(s: SceneGraph): number {
    let sum = 0;
    for (let i = 0; i < s.count; i++) {
        const e = s.objects[i].matrixWorld.elements;
        for (let k = 0; k < 16; k++) sum += e[k];
    }
    return sum;
}

export function createMirror(s: SceneGraph): MirrorGraph {
    const g = createMirrorGraph(s.count);
    for (let i = 0; i < s.count; i++) {
        const parentWorld = i === 0 ? s.scene.matrixWorld.elements : g.worlds[(i - 1) >> 2];
        extendTransform(g, s.objects[i], parentWorld);
    }
    claimSubtree(g, s.objects[0]);
    return g;
}

// The scene update reaches the subtree root and propagates the tuple writes.
export function updateMirror(s: SceneGraph, g: MirrorGraph, t: number): void {
    const { scene, count, base, phase } = s;
    const { positions, rotations } = g;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        vec3.set(positions[i], base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        quat.setAxisAngle(rotations[i], AXIS, phase[i] + t);
    }
    scene.updateMatrixWorld();
}

export function updateMirrorViaObject3D(s: SceneGraph, _g: MirrorGraph, t: number): void {
    const { scene, objects, count, base, phase } = s;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        const object = objects[i];
        object.position.set(base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        object.quaternion.setFromAxisAngle(threeAxis, phase[i] + t);
    }
    scene.updateMatrixWorld();
}

export function readTransforms(s: SceneGraph): number {
    let acc = 0;
    for (let i = 0; i < s.count; i++) {
        const object = s.objects[i];
        acc += object.position.y + object.rotation.y;
    }
    return acc;
}

// Cache records during setup so the measured loop only writes tuples and propagates.
export function createExtended(s: SceneGraph): Transform[] {
    extend(s.scene);
    return s.objects.map(transformOf);
}

export function updateExtended(s: SceneGraph, records: Transform[], t: number): void {
    const { scene, count, base, phase } = s;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        const record = records[i];
        vec3.set(record.position, base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        quat.setAxisAngle(record.rotation, AXIS, phase[i] + t);
    }
    scene.updateMatrixWorld();
}
