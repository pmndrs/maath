import type {
    BufferAttribute,
    Camera,
    InstancedMesh,
    Matrix4,
    Object3D,
    Quaternion,
    Sphere as ThreeSphere,
    Vector3,
} from 'three';
import { MathUtils } from 'three';

// three's normalize helpers are typed without Uint8ClampedArray, which BufferAttribute allows
type NormalizableArray = Parameters<typeof MathUtils.denormalize>[1];
import type { Mat4 } from '../core/mat4';
import type { Quat } from '../core/quat';
import type { Vec3 } from '../core/vec3';
import * as vec3 from '../core/vec3';
import type { Frustum } from '../shapes/frustum';
import * as frustum from '../shapes/frustum';
import type { Sphere } from '../shapes/sphere';

// Three's column-major matrix tuples and attribute arrays can be used directly by math.

/** A three Matrix4's storage, usable as a math Mat4 with no cast and no copy */
export function mat4Of(m: Matrix4): Mat4 {
    return m.elements;
}

/**
 * Disables automatic transform updates. The caller owns the local and world matrices
 * used by rendering and raycasting. Call once at setup.
 */
export function claimTransform(object: Object3D): { local: Mat4; world: Mat4 } {
    object.matrixAutoUpdate = false;
    object.matrixWorldAutoUpdate = false;
    return { local: object.matrix.elements, world: object.matrixWorld.elements };
}

/**
 * Allocates one Mat4 view per instance over the upload buffer. Call once at setup and set
 * `instanceMatrix.needsUpdate` after writing. Keep simulation state separate because reads
 * through these views are rounded to float32.
 */
export function instanceMat4Views(mesh: InstancedMesh): Mat4[] {
    const array = mesh.instanceMatrix.array;
    const count = mesh.count;
    const views: Mat4[] = new Array(count);
    for (let i = 0; i < count; i++) {
        const offset = i * 16;
        views[i] = array.subarray(offset, offset + 16) as unknown as Mat4;
    }
    return views;
}

/** Reads vertex `index` of a 3-component attribute into a Vec3, denormalizing like `getX` does. */
export function vec3FromAttribute(out: Vec3, attribute: BufferAttribute, index: number): Vec3 {
    const array = attribute.array;
    const offset = index * 3;
    if (attribute.normalized) {
        const kind = array as NormalizableArray;
        out[0] = MathUtils.denormalize(array[offset], kind);
        out[1] = MathUtils.denormalize(array[offset + 1], kind);
        out[2] = MathUtils.denormalize(array[offset + 2], kind);
        return out;
    }
    return vec3.fromBuffer(out, array, offset);
}

/** Writes a Vec3 into vertex `index` of a 3-component attribute, normalizing like `setXYZ` does. Set `needsUpdate` afterwards. */
export function vec3ToAttribute(attribute: BufferAttribute, a: Vec3, index: number): void {
    const array = attribute.array;
    const offset = index * 3;
    if (attribute.normalized) {
        const kind = array as NormalizableArray;
        array[offset] = MathUtils.normalize(a[0], kind);
        array[offset + 1] = MathUtils.normalize(a[1], kind);
        array[offset + 2] = MathUtils.normalize(a[2], kind);
        return;
    }
    vec3.toBuffer(array, a, offset);
}

/**
 * Extracts a frustum for a camera using WebGL depth in [-1, 1].
 * Call after `camera.updateMatrixWorld()` to read the current view matrix.
 */
export function frustumFromCamera(out: Frustum, camera: Camera): Frustum {
    return frustum.setFromViewProjectionMatrixNO(out, camera.projectionMatrix.elements, camera.matrixWorldInverse.elements);
}

/**
 * Transforms a local bounding sphere to world space. Scales the radius by the largest
 * axis scale, matching three's `Sphere.applyMatrix4`.
 */
export function sphereToWorld(out: Sphere, local: ThreeSphere, world: Mat4): Sphere {
    const c = out.center;
    c[0] = local.center.x;
    c[1] = local.center.y;
    c[2] = local.center.z;
    vec3.transformMat4(c, c, world);
    const sx = world[0] * world[0] + world[1] * world[1] + world[2] * world[2];
    const sy = world[4] * world[4] + world[5] * world[5] + world[6] * world[6];
    const sz = world[8] * world[8] + world[9] * world[9] + world[10] * world[10];
    out.radius = local.radius * Math.sqrt(Math.max(sx, sy, sz));
    return out;
}

// Copy helpers for stock three vectors and quaternions.

export function vec3FromVector3(out: Vec3, v: Vector3): Vec3 {
    out[0] = v.x;
    out[1] = v.y;
    out[2] = v.z;
    return out;
}

export function vec3ToVector3(out: Vector3, a: Vec3): Vector3 {
    return out.set(a[0], a[1], a[2]);
}

export function quatFromQuaternion(out: Quat, q: Quaternion): Quat {
    out[0] = q.x;
    out[1] = q.y;
    out[2] = q.z;
    out[3] = q.w;
    return out;
}

/** Fires the quaternion's change callback once. On an Object3D's quaternion that re-derives `rotation`. */
export function quatToQuaternion(out: Quaternion, q: Quat): Quaternion {
    return out.set(q[0], q[1], q[2], q[3]);
}
