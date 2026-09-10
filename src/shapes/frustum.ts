import type { RMat4 } from '../core/mat4';
import type { RVec3, Vec3 } from '../core/vec3';
import type { RBox3 } from './box3';
import type { Plane3, RPlane3 } from './plane3';
import * as plane3 from './plane3';
import type { RSphere } from './sphere';

/**
 * A view frustum, represented as the six bounding planes of a camera's view volume.
 * Ordered as [left, right, bottom, top, near, far]. Plane normals point inward, so a
 * point is inside the frustum when its signed distance to every plane is >= 0.
 */
export type Frustum = [Plane3, Plane3, Plane3, Plane3, Plane3, Plane3];

/** A read-only view frustum */
export type RFrustum = readonly [RPlane3, RPlane3, RPlane3, RPlane3, RPlane3, RPlane3];

/**
 * The eight corners of a frustum, as returned by [[corners]].
 * Ordered near bottom-left, near top-left, near top-right, near bottom-right,
 * then the same four in the far plane.
 */
export type FrustumCorners = [Vec3, Vec3, Vec3, Vec3, Vec3, Vec3, Vec3, Vec3];

/** The eight read-only corners of a frustum */
export type RFrustumCorners = readonly [RVec3, RVec3, RVec3, RVec3, RVec3, RVec3, RVec3, RVec3];

/**
 * Creates a new frustum of zeroed planes.
 * @returns A new frustum
 */
export function create(): Frustum {
    return [
        { normal: [0, 1, 0], constant: 0 },
        { normal: [0, 1, 0], constant: 0 },
        { normal: [0, 1, 0], constant: 0 },
        { normal: [0, 1, 0], constant: 0 },
        { normal: [0, 1, 0], constant: 0 },
        { normal: [0, 1, 0], constant: 0 },
    ];
}

/**
 * Clones a frustum.
 * @param f - The frustum to clone
 * @returns A new frustum
 */
export function clone(f: RFrustum): Frustum {
    const p0 = f[0];
    const p1 = f[1];
    const p2 = f[2];
    const p3 = f[3];
    const p4 = f[4];
    const p5 = f[5];
    return [
        { normal: [p0.normal[0], p0.normal[1], p0.normal[2]], constant: p0.constant },
        { normal: [p1.normal[0], p1.normal[1], p1.normal[2]], constant: p1.constant },
        { normal: [p2.normal[0], p2.normal[1], p2.normal[2]], constant: p2.constant },
        { normal: [p3.normal[0], p3.normal[1], p3.normal[2]], constant: p3.constant },
        { normal: [p4.normal[0], p4.normal[1], p4.normal[2]], constant: p4.constant },
        { normal: [p5.normal[0], p5.normal[1], p5.normal[2]], constant: p5.constant },
    ];
}

/**
 * Copies one frustum to another.
 * @param out - The output frustum
 * @param f - The source frustum
 * @returns The output frustum
 */
export function copy(out: Frustum, f: RFrustum): Frustum {
    plane3.copy(out[0], f[0]);
    plane3.copy(out[1], f[1]);
    plane3.copy(out[2], f[2]);
    plane3.copy(out[3], f[3]);
    plane3.copy(out[4], f[4]);
    plane3.copy(out[5], f[5]);
    return out;
}

/**
 * Extracts the six planes of a view frustum from a projection and view matrix, using the
 * OpenGL / WebGL clip-space depth convention (NDC z in [-1, 1]).
 *
 * Pair this with `mat4.perspectiveNO`, `mat4.frustumNO` or `mat4.orthoNO`.
 *
 * @param out - The output frustum
 * @param proj - The projection matrix
 * @param view - The view matrix
 * @returns The output frustum
 */
export function setFromViewProjectionMatrixNO(out: Frustum, proj: RMat4, view: RMat4): Frustum {
    const p0 = proj[0];
    const p1 = proj[1];
    const p2 = proj[2];
    const p3 = proj[3];
    const p4 = proj[4];
    const p5 = proj[5];
    const p6 = proj[6];
    const p7 = proj[7];
    const p8 = proj[8];
    const p9 = proj[9];
    const p10 = proj[10];
    const p11 = proj[11];
    const p12 = proj[12];
    const p13 = proj[13];
    const p14 = proj[14];
    const p15 = proj[15];

    const v0 = view[0];
    const v1 = view[1];
    const v2 = view[2];
    const v3 = view[3];
    const v4 = view[4];
    const v5 = view[5];
    const v6 = view[6];
    const v7 = view[7];
    const v8 = view[8];
    const v9 = view[9];
    const v10 = view[10];
    const v11 = view[11];
    const v12 = view[12];
    const v13 = view[13];
    const v14 = view[14];
    const v15 = view[15];

    // rows of (proj * view), computed directly
    const r00 = p0 * v0 + p4 * v1 + p8 * v2 + p12 * v3;
    const r01 = p0 * v4 + p4 * v5 + p8 * v6 + p12 * v7;
    const r02 = p0 * v8 + p4 * v9 + p8 * v10 + p12 * v11;
    const r03 = p0 * v12 + p4 * v13 + p8 * v14 + p12 * v15;

    const r10 = p1 * v0 + p5 * v1 + p9 * v2 + p13 * v3;
    const r11 = p1 * v4 + p5 * v5 + p9 * v6 + p13 * v7;
    const r12 = p1 * v8 + p5 * v9 + p9 * v10 + p13 * v11;
    const r13 = p1 * v12 + p5 * v13 + p9 * v14 + p13 * v15;

    const r20 = p2 * v0 + p6 * v1 + p10 * v2 + p14 * v3;
    const r21 = p2 * v4 + p6 * v5 + p10 * v6 + p14 * v7;
    const r22 = p2 * v8 + p6 * v9 + p10 * v10 + p14 * v11;
    const r23 = p2 * v12 + p6 * v13 + p10 * v14 + p14 * v15;

    const r30 = p3 * v0 + p7 * v1 + p11 * v2 + p15 * v3;
    const r31 = p3 * v4 + p7 * v5 + p11 * v6 + p15 * v7;
    const r32 = p3 * v8 + p7 * v9 + p11 * v10 + p15 * v11;
    const r33 = p3 * v12 + p7 * v13 + p11 * v14 + p15 * v15;

    // left = row3 + row0
    let nx = r30 + r00;
    let ny = r31 + r01;
    let nz = r32 + r02;
    let c = r33 + r03;
    let inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[0].normal[0] = nx * inv;
    out[0].normal[1] = ny * inv;
    out[0].normal[2] = nz * inv;
    out[0].constant = c * inv;

    // right = row3 - row0
    nx = r30 - r00;
    ny = r31 - r01;
    nz = r32 - r02;
    c = r33 - r03;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[1].normal[0] = nx * inv;
    out[1].normal[1] = ny * inv;
    out[1].normal[2] = nz * inv;
    out[1].constant = c * inv;

    // bottom = row3 + row1
    nx = r30 + r10;
    ny = r31 + r11;
    nz = r32 + r12;
    c = r33 + r13;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[2].normal[0] = nx * inv;
    out[2].normal[1] = ny * inv;
    out[2].normal[2] = nz * inv;
    out[2].constant = c * inv;

    // top = row3 - row1
    nx = r30 - r10;
    ny = r31 - r11;
    nz = r32 - r12;
    c = r33 - r13;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[3].normal[0] = nx * inv;
    out[3].normal[1] = ny * inv;
    out[3].normal[2] = nz * inv;
    out[3].constant = c * inv;

    // near (NO) = row3 + row2
    nx = r30 + r20;
    ny = r31 + r21;
    nz = r32 + r22;
    c = r33 + r23;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[4].normal[0] = nx * inv;
    out[4].normal[1] = ny * inv;
    out[4].normal[2] = nz * inv;
    out[4].constant = c * inv;

    // far = row3 - row2
    nx = r30 - r20;
    ny = r31 - r21;
    nz = r32 - r22;
    c = r33 - r23;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[5].normal[0] = nx * inv;
    out[5].normal[1] = ny * inv;
    out[5].normal[2] = nz * inv;
    out[5].constant = c * inv;

    return out;
}

/**
 * Extracts the six planes of a view frustum from a projection and view matrix, using the
 * WebGPU / Vulkan / D3D / Metal clip-space depth convention (NDC z in [0, 1]).
 *
 * Pair this with `mat4.perspectiveZO`, `mat4.frustumZO` or `mat4.orthoZO`.
 *
 * @param out - The output frustum
 * @param proj - The projection matrix
 * @param view - The view matrix
 * @returns The output frustum
 */
export function setFromViewProjectionMatrixZO(out: Frustum, proj: RMat4, view: RMat4): Frustum {
    const p0 = proj[0];
    const p1 = proj[1];
    const p2 = proj[2];
    const p3 = proj[3];
    const p4 = proj[4];
    const p5 = proj[5];
    const p6 = proj[6];
    const p7 = proj[7];
    const p8 = proj[8];
    const p9 = proj[9];
    const p10 = proj[10];
    const p11 = proj[11];
    const p12 = proj[12];
    const p13 = proj[13];
    const p14 = proj[14];
    const p15 = proj[15];

    const v0 = view[0];
    const v1 = view[1];
    const v2 = view[2];
    const v3 = view[3];
    const v4 = view[4];
    const v5 = view[5];
    const v6 = view[6];
    const v7 = view[7];
    const v8 = view[8];
    const v9 = view[9];
    const v10 = view[10];
    const v11 = view[11];
    const v12 = view[12];
    const v13 = view[13];
    const v14 = view[14];
    const v15 = view[15];

    // rows of (proj * view), computed directly
    const r00 = p0 * v0 + p4 * v1 + p8 * v2 + p12 * v3;
    const r01 = p0 * v4 + p4 * v5 + p8 * v6 + p12 * v7;
    const r02 = p0 * v8 + p4 * v9 + p8 * v10 + p12 * v11;
    const r03 = p0 * v12 + p4 * v13 + p8 * v14 + p12 * v15;

    const r10 = p1 * v0 + p5 * v1 + p9 * v2 + p13 * v3;
    const r11 = p1 * v4 + p5 * v5 + p9 * v6 + p13 * v7;
    const r12 = p1 * v8 + p5 * v9 + p9 * v10 + p13 * v11;
    const r13 = p1 * v12 + p5 * v13 + p9 * v14 + p13 * v15;

    const r20 = p2 * v0 + p6 * v1 + p10 * v2 + p14 * v3;
    const r21 = p2 * v4 + p6 * v5 + p10 * v6 + p14 * v7;
    const r22 = p2 * v8 + p6 * v9 + p10 * v10 + p14 * v11;
    const r23 = p2 * v12 + p6 * v13 + p10 * v14 + p14 * v15;

    const r30 = p3 * v0 + p7 * v1 + p11 * v2 + p15 * v3;
    const r31 = p3 * v4 + p7 * v5 + p11 * v6 + p15 * v7;
    const r32 = p3 * v8 + p7 * v9 + p11 * v10 + p15 * v11;
    const r33 = p3 * v12 + p7 * v13 + p11 * v14 + p15 * v15;

    // left = row3 + row0
    let nx = r30 + r00;
    let ny = r31 + r01;
    let nz = r32 + r02;
    let c = r33 + r03;
    let inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[0].normal[0] = nx * inv;
    out[0].normal[1] = ny * inv;
    out[0].normal[2] = nz * inv;
    out[0].constant = c * inv;

    // right = row3 - row0
    nx = r30 - r00;
    ny = r31 - r01;
    nz = r32 - r02;
    c = r33 - r03;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[1].normal[0] = nx * inv;
    out[1].normal[1] = ny * inv;
    out[1].normal[2] = nz * inv;
    out[1].constant = c * inv;

    // bottom = row3 + row1
    nx = r30 + r10;
    ny = r31 + r11;
    nz = r32 + r12;
    c = r33 + r13;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[2].normal[0] = nx * inv;
    out[2].normal[1] = ny * inv;
    out[2].normal[2] = nz * inv;
    out[2].constant = c * inv;

    // top = row3 - row1
    nx = r30 - r10;
    ny = r31 - r11;
    nz = r32 - r12;
    c = r33 - r13;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[3].normal[0] = nx * inv;
    out[3].normal[1] = ny * inv;
    out[3].normal[2] = nz * inv;
    out[3].constant = c * inv;

    // near (ZO) = row2
    nx = r20;
    ny = r21;
    nz = r22;
    c = r23;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[4].normal[0] = nx * inv;
    out[4].normal[1] = ny * inv;
    out[4].normal[2] = nz * inv;
    out[4].constant = c * inv;

    // far = row3 - row2
    nx = r30 - r20;
    ny = r31 - r21;
    nz = r32 - r22;
    c = r33 - r23;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[5].normal[0] = nx * inv;
    out[5].normal[1] = ny * inv;
    out[5].normal[2] = nz * inv;
    out[5].constant = c * inv;

    return out;
}

/**
 * Extracts only the four lateral planes (left, right, bottom, top) of a view frustum from a
 * projection and view matrix, skipping near and far. This is convention-independent — the
 * NO/ZO split only affects the near plane — so it pairs with any projection matrix.
 *
 * Intended for streaming pipelines that already cull distant content and only need to reject
 * objects outside the camera's sides. Test against the result with `frustum.sidesIntersectsSphere`,
 * `frustum.sidesIntersectsBox3`, `frustum.sidesContainsPoint` or `frustum.sidesIntersectsRay`.
 *
 * @param out - The output frustum; only slots 0-3 are written
 * @param proj - The projection matrix
 * @param view - The view matrix
 * @returns The output frustum
 */
export function setFromViewProjectionMatrixSides(out: Frustum, proj: RMat4, view: RMat4): Frustum {
    // row2 (near/far) coefficients are not needed, so skip p2, p6, p10, p14
    const p0 = proj[0];
    const p1 = proj[1];
    const p3 = proj[3];
    const p4 = proj[4];
    const p5 = proj[5];
    const p7 = proj[7];
    const p8 = proj[8];
    const p9 = proj[9];
    const p11 = proj[11];
    const p12 = proj[12];
    const p13 = proj[13];
    const p15 = proj[15];

    const v0 = view[0];
    const v1 = view[1];
    const v2 = view[2];
    const v3 = view[3];
    const v4 = view[4];
    const v5 = view[5];
    const v6 = view[6];
    const v7 = view[7];
    const v8 = view[8];
    const v9 = view[9];
    const v10 = view[10];
    const v11 = view[11];
    const v12 = view[12];
    const v13 = view[13];
    const v14 = view[14];
    const v15 = view[15];

    // rows of (proj * view), computed directly
    const r00 = p0 * v0 + p4 * v1 + p8 * v2 + p12 * v3;
    const r01 = p0 * v4 + p4 * v5 + p8 * v6 + p12 * v7;
    const r02 = p0 * v8 + p4 * v9 + p8 * v10 + p12 * v11;
    const r03 = p0 * v12 + p4 * v13 + p8 * v14 + p12 * v15;

    const r10 = p1 * v0 + p5 * v1 + p9 * v2 + p13 * v3;
    const r11 = p1 * v4 + p5 * v5 + p9 * v6 + p13 * v7;
    const r12 = p1 * v8 + p5 * v9 + p9 * v10 + p13 * v11;
    const r13 = p1 * v12 + p5 * v13 + p9 * v14 + p13 * v15;

    const r30 = p3 * v0 + p7 * v1 + p11 * v2 + p15 * v3;
    const r31 = p3 * v4 + p7 * v5 + p11 * v6 + p15 * v7;
    const r32 = p3 * v8 + p7 * v9 + p11 * v10 + p15 * v11;
    const r33 = p3 * v12 + p7 * v13 + p11 * v14 + p15 * v15;

    // left = row3 + row0
    let nx = r30 + r00;
    let ny = r31 + r01;
    let nz = r32 + r02;
    let c = r33 + r03;
    let inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[0].normal[0] = nx * inv;
    out[0].normal[1] = ny * inv;
    out[0].normal[2] = nz * inv;
    out[0].constant = c * inv;

    // right = row3 - row0
    nx = r30 - r00;
    ny = r31 - r01;
    nz = r32 - r02;
    c = r33 - r03;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[1].normal[0] = nx * inv;
    out[1].normal[1] = ny * inv;
    out[1].normal[2] = nz * inv;
    out[1].constant = c * inv;

    // bottom = row3 + row1
    nx = r30 + r10;
    ny = r31 + r11;
    nz = r32 + r12;
    c = r33 + r13;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[2].normal[0] = nx * inv;
    out[2].normal[1] = ny * inv;
    out[2].normal[2] = nz * inv;
    out[2].constant = c * inv;

    // top = row3 - row1
    nx = r30 - r10;
    ny = r31 - r11;
    nz = r32 - r12;
    c = r33 - r13;
    inv = nx * nx + ny * ny + nz * nz;
    if (inv > 0) inv = 1 / Math.sqrt(inv);
    out[3].normal[0] = nx * inv;
    out[3].normal[1] = ny * inv;
    out[3].normal[2] = nz * inv;
    out[3].constant = c * inv;

    return out;
}

/**
 * Tests if a sphere intersects the frustum.
 * @param f - The frustum
 * @param s - The sphere
 * @returns True if the sphere intersects or is inside the frustum
 */
export function intersectsSphere(f: RFrustum, s: RSphere): boolean {
    const cx = s.center[0];
    const cy = s.center[1];
    const cz = s.center[2];
    const r = s.radius;
    for (let i = 0; i < 6; i++) {
        const p = f[i];
        if (p.normal[0] * cx + p.normal[1] * cy + p.normal[2] * cz + p.constant < -r) return false;
    }
    return true;
}

/**
 * Tests if a sphere intersects the lateral planes of a sides-only frustum, skipping near and far.
 * @param f - The sides-only frustum
 * @param s - The sphere
 * @returns True if the sphere intersects or is inside the frustum's sides
 */
export function sidesIntersectsSphere(f: RFrustum, s: RSphere): boolean {
    const cx = s.center[0];
    const cy = s.center[1];
    const cz = s.center[2];
    const r = s.radius;
    for (let i = 0; i < 4; i++) {
        const p = f[i];
        if (p.normal[0] * cx + p.normal[1] * cy + p.normal[2] * cz + p.constant < -r) return false;
    }
    return true;
}

/**
 * Tests if an axis-aligned box intersects the frustum, using the p-vertex test.
 * @param f - The frustum
 * @param box - The box
 * @returns True if the box intersects or is inside the frustum
 */
export function intersectsBox3(f: RFrustum, box: RBox3): boolean {
    const minX = box[0];
    const minY = box[1];
    const minZ = box[2];
    const maxX = box[3];
    const maxY = box[4];
    const maxZ = box[5];
    for (let i = 0; i < 6; i++) {
        const nx = f[i].normal[0];
        const ny = f[i].normal[1];
        const nz = f[i].normal[2];
        const px = nx >= 0 ? maxX : minX;
        const py = ny >= 0 ? maxY : minY;
        const pz = nz >= 0 ? maxZ : minZ;
        if (nx * px + ny * py + nz * pz + f[i].constant < 0) return false;
    }
    return true;
}

/**
 * Tests if an axis-aligned box intersects the lateral planes of a sides-only frustum, using the
 * p-vertex test, skipping near and far.
 * @param f - The sides-only frustum
 * @param box - The box
 * @returns True if the box intersects or is inside the frustum's sides
 */
export function sidesIntersectsBox3(f: RFrustum, box: RBox3): boolean {
    const minX = box[0];
    const minY = box[1];
    const minZ = box[2];
    const maxX = box[3];
    const maxY = box[4];
    const maxZ = box[5];
    for (let i = 0; i < 4; i++) {
        const nx = f[i].normal[0];
        const ny = f[i].normal[1];
        const nz = f[i].normal[2];
        const px = nx >= 0 ? maxX : minX;
        const py = ny >= 0 ? maxY : minY;
        const pz = nz >= 0 ? maxZ : minZ;
        if (nx * px + ny * py + nz * pz + f[i].constant < 0) return false;
    }
    return true;
}

/**
 * Tests if a point is inside the frustum.
 * @param f - The frustum
 * @param p - The point
 * @returns True if the point is inside or on the boundary of the frustum
 */
export function containsPoint(f: RFrustum, p: RVec3): boolean {
    const x = p[0];
    const y = p[1];
    const z = p[2];
    for (let i = 0; i < 6; i++) {
        const n = f[i].normal;
        if (n[0] * x + n[1] * y + n[2] * z + f[i].constant < 0) return false;
    }
    return true;
}

/**
 * Tests if a point is inside the lateral planes of a sides-only frustum, skipping near and far.
 * @param f - The sides-only frustum
 * @param p - The point
 * @returns True if the point is inside or on the boundary of the frustum's sides
 */
export function sidesContainsPoint(f: RFrustum, p: RVec3): boolean {
    const x = p[0];
    const y = p[1];
    const z = p[2];
    for (let i = 0; i < 4; i++) {
        const n = f[i].normal;
        if (n[0] * x + n[1] * y + n[2] * z + f[i].constant < 0) return false;
    }
    return true;
}

/**
 * Tests if a ray intersects the frustum, using a slab test over the planes.
 * A ray that starts inside the frustum always intersects.
 * @param f - The frustum
 * @param origin - Ray origin
 * @param direction - Ray direction (need not be normalized)
 * @returns True if the ray intersects the frustum
 */
export function intersectsRay(f: RFrustum, origin: RVec3, direction: RVec3): boolean {
    const ox = origin[0];
    const oy = origin[1];
    const oz = origin[2];
    const dx = direction[0];
    const dy = direction[1];
    const dz = direction[2];
    let tmin = 0;
    let tmax = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 6; i++) {
        const nx = f[i].normal[0];
        const ny = f[i].normal[1];
        const nz = f[i].normal[2];
        const s0 = nx * ox + ny * oy + nz * oz + f[i].constant;
        const r = nx * dx + ny * dy + nz * dz;
        if (Math.abs(r) < 1e-10) {
            if (s0 < 0) return false;
        } else {
            const t = -s0 / r;
            if (r > 0) {
                if (t > tmin) tmin = t;
            } else {
                if (t < tmax) tmax = t;
            }
        }
        if (tmin > tmax) return false;
    }
    return true;
}

/**
 * Tests if a ray intersects the lateral planes of a sides-only frustum, using a slab test over the
 * planes, skipping near and far. A ray that starts inside the sides always intersects.
 * @param f - The sides-only frustum
 * @param origin - Ray origin
 * @param direction - Ray direction (need not be normalized)
 * @returns True if the ray intersects the frustum's sides
 */
export function sidesIntersectsRay(f: RFrustum, origin: RVec3, direction: RVec3): boolean {
    const ox = origin[0];
    const oy = origin[1];
    const oz = origin[2];
    const dx = direction[0];
    const dy = direction[1];
    const dz = direction[2];
    let tmin = 0;
    let tmax = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 4; i++) {
        const nx = f[i].normal[0];
        const ny = f[i].normal[1];
        const nz = f[i].normal[2];
        const s0 = nx * ox + ny * oy + nz * oz + f[i].constant;
        const r = nx * dx + ny * dy + nz * dz;
        if (Math.abs(r) < 1e-10) {
            if (s0 < 0) return false;
        } else {
            const t = -s0 / r;
            if (r > 0) {
                if (t > tmin) tmin = t;
            } else {
                if (t < tmax) tmax = t;
            }
        }
        if (tmin > tmax) return false;
    }
    return true;
}

/**
 * Computes the eight corners of the frustum by intersecting three planes each.
 * The frustum must be a full six-plane frustum (near and far present).
 *
 * Output order: near bottom-left, near top-left, near top-right, near bottom-right,
 * far bottom-left, far top-left, far top-right, far bottom-right.
 *
 * @param out - The output corners (8 vec3s)
 * @param f - The frustum
 * @returns The output corners
 */
export function corners(out: FrustumCorners, f: RFrustum): FrustumCorners {
    // near = f[4], far = f[5], left = f[0], right = f[1], bottom = f[2], top = f[3]
    plane3.intersect(out[0], f[4], f[0], f[2]);
    plane3.intersect(out[1], f[4], f[0], f[3]);
    plane3.intersect(out[2], f[4], f[1], f[3]);
    plane3.intersect(out[3], f[4], f[1], f[2]);
    plane3.intersect(out[4], f[5], f[0], f[2]);
    plane3.intersect(out[5], f[5], f[0], f[3]);
    plane3.intersect(out[6], f[5], f[1], f[3]);
    plane3.intersect(out[7], f[5], f[1], f[2]);
    return out;
}
