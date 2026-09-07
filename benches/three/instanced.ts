import { BoxGeometry, InstancedMesh, Matrix4, MeshBasicMaterial, Object3D, Quaternion, Vector3 } from 'three';
import * as mat4 from '../../src/core/mat4';
import * as quat from '../../src/core/quat';
import type { Vec3 } from '../../src/core/vec3';
import * as vec3 from '../../src/core/vec3';
import * as mulberry32 from '../../src/random/mulberry32';
import { instanceMat4Views } from '../../src/three';

// Each variant moves instances on a sine wave and rotates them about a fixed axis.

export const INSTANCES = 10000;
export const FRAME_T = 0.5;

const AXIS: Vec3 = [0.267261, 0.534522, 0.801784];
const ONE: Vec3 = [1, 1, 1];

export function createInstanced(count: number) {
    const rand = mulberry32.create(7);
    const mesh = new InstancedMesh(new BoxGeometry(), new MeshBasicMaterial(), count);
    const base = new Float64Array(count * 3);
    const phase = new Float64Array(count);
    for (let i = 0; i < count; i++) {
        base[i * 3] = (mulberry32.sample(rand) - 0.5) * 100;
        base[i * 3 + 1] = (mulberry32.sample(rand) - 0.5) * 100;
        base[i * 3 + 2] = (mulberry32.sample(rand) - 0.5) * 100;
        phase[i] = mulberry32.sample(rand) * Math.PI * 2;
    }
    return { mesh, count, base, phase };
}
export type Instanced = ReturnType<typeof createInstanced>;

// Reuse one Object3D to compose every instance matrix.
const dummy = new Object3D();
const threeAxis = new Vector3(AXIS[0], AXIS[1], AXIS[2]);

export function updateThreeObject3D(s: Instanced, t: number): void {
    const { mesh, count, base, phase } = s;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        dummy.position.set(base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        dummy.quaternion.setFromAxisAngle(threeAxis, phase[i] + t);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
}

// Bare transform objects avoid Object3D's Euler synchronization.
const position = new Vector3();
const rotation = new Quaternion();
const scale = new Vector3(1, 1, 1);
const matrix = new Matrix4();

export function updateThreeCompose(s: Instanced, t: number): void {
    const { mesh, count, base, phase } = s;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        position.set(base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        rotation.setFromAxisAngle(threeAxis, phase[i] + t);
        matrix.compose(position, rotation, scale);
        mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
}

export function createMathInstanced(s: Instanced) {
    return { views: instanceMat4Views(s.mesh), p: vec3.create(), q: quat.create() };
}
export type MathInstanced = ReturnType<typeof createMathInstanced>;

export function updateMath(s: Instanced, m: MathInstanced, t: number): void {
    const { mesh, count, base, phase } = s;
    const { views, p, q } = m;
    for (let i = 0; i < count; i++) {
        const o = i * 3;
        vec3.set(p, base[o], base[o + 1] + Math.sin(t + phase[i]), base[o + 2]);
        quat.setAxisAngle(q, AXIS, phase[i] + t);
        mat4.fromRotationTranslationScale(views[i], q, p, ONE);
    }
    mesh.instanceMatrix.needsUpdate = true;
}

export function checksum(s: Instanced): number {
    const a = s.mesh.instanceMatrix.array;
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i];
    return sum;
}
