import type { Mat3, RMat3 } from '../core/mat3';
import * as mat3 from '../core/mat3';
import type { RMat4 } from '../core/mat4';
import type { RQuat } from '../core/quat';
import { EPSILON } from '../core/scalar';
import type { RVec3, Vec3 } from '../core/vec3';
import type { RBox3 } from './box3';

/** An oriented bounding box in 3D space */
export type OBB3 = { center: Vec3; halfExtents: Vec3; rotation: Mat3 };

/** A read-only oriented bounding box in 3D space */
export type ROBB3 = { readonly center: RVec3; readonly halfExtents: RVec3; readonly rotation: RMat3 };

export function create(): OBB3 {
    return { center: [0, 0, 0], halfExtents: [1, 1, 1], rotation: mat3.create() };
}

export function clone(a: ROBB3): OBB3 {
    return {
        center: [a.center[0], a.center[1], a.center[2]],
        halfExtents: [a.halfExtents[0], a.halfExtents[1], a.halfExtents[2]],
        rotation: mat3.clone(a.rotation),
    };
}

export function copy(out: OBB3, a: ROBB3): OBB3 {
    out.center[0] = a.center[0];
    out.center[1] = a.center[1];
    out.center[2] = a.center[2];
    out.halfExtents[0] = a.halfExtents[0];
    out.halfExtents[1] = a.halfExtents[1];
    out.halfExtents[2] = a.halfExtents[2];
    out.rotation[0] = a.rotation[0];
    out.rotation[1] = a.rotation[1];
    out.rotation[2] = a.rotation[2];
    out.rotation[3] = a.rotation[3];
    out.rotation[4] = a.rotation[4];
    out.rotation[5] = a.rotation[5];
    out.rotation[6] = a.rotation[6];
    out.rotation[7] = a.rotation[7];
    out.rotation[8] = a.rotation[8];
    return out;
}

/**
 * Sets an OBB from center, half extents, and a rotation matrix.
 * @param out the OBB to store the result
 * @param center the center of the OBB
 * @param halfExtents the half extents of the OBB
 * @param rotation the Mat3 rotation matrix
 * @returns the OBB with the given center, half extents, and rotation
 */
export function set(out: OBB3, center: RVec3, halfExtents: RVec3, rotation: RMat3): OBB3 {
    out.center[0] = center[0];
    out.center[1] = center[1];
    out.center[2] = center[2];
    out.halfExtents[0] = halfExtents[0];
    out.halfExtents[1] = halfExtents[1];
    out.halfExtents[2] = halfExtents[2];
    out.rotation[0] = rotation[0];
    out.rotation[1] = rotation[1];
    out.rotation[2] = rotation[2];
    out.rotation[3] = rotation[3];
    out.rotation[4] = rotation[4];
    out.rotation[5] = rotation[5];
    out.rotation[6] = rotation[6];
    out.rotation[7] = rotation[7];
    out.rotation[8] = rotation[8];
    return out;
}

/**
 * Sets an OBB from center, half extents, and a quaternion.
 * Convenience helper for users who store orientation as a quaternion.
 *
 * @param out - The OBB to store the result
 * @param center - The center of the OBB
 * @param halfExtents - The half extents of the OBB
 * @param q - The quaternion representing the OBB's orientation
 * @returns out
 */
export function setFromCenterHalfExtentsQuaternion(out: OBB3, center: RVec3, halfExtents: RVec3, q: RQuat): OBB3 {
    out.center[0] = center[0];
    out.center[1] = center[1];
    out.center[2] = center[2];
    out.halfExtents[0] = halfExtents[0];
    out.halfExtents[1] = halfExtents[1];
    out.halfExtents[2] = halfExtents[2];
    mat3.fromQuat(out.rotation, q);
    return out;
}

/**
 * Creates an OBB from an axis-aligned bounding box (AABB).
 * The resulting OBB will have the same center and extents as the AABB,
 * with no rotation (identity orientation).
 *
 * @param out - The OBB to store the result
 * @param aabb - The AABB (min and max corners)
 * @returns out
 */
export function setFromBox3(out: OBB3, aabb: RBox3): OBB3 {
    // Center = (min + max) / 2
    out.center[0] = (aabb[0] + aabb[3]) * 0.5;
    out.center[1] = (aabb[1] + aabb[4]) * 0.5;
    out.center[2] = (aabb[2] + aabb[5]) * 0.5;

    // Half extents = (max - min) / 2
    out.halfExtents[0] = (aabb[3] - aabb[0]) * 0.5;
    out.halfExtents[1] = (aabb[4] - aabb[1]) * 0.5;
    out.halfExtents[2] = (aabb[5] - aabb[2]) * 0.5;

    // Identity rotation
    mat3.identity(out.rotation);

    return out;
}

/**
 * Tests whether a point is contained within an OBB.
 *
 * @param obb - The OBB to test
 * @param point - The point to test
 * @returns true if the point is inside the OBB
 */
export function containsPoint(obb: ROBB3, point: RVec3): boolean {
    // Vector from center to point
    const dx = point[0] - obb.center[0];
    const dy = point[1] - obb.center[1];
    const dz = point[2] - obb.center[2];

    // Project onto each OBB axis (columns of the rotation matrix) and compare against
    // the half extents. The projections are used once, so keep them as scalars.
    const r = obb.rotation;
    const lx = dx * r[0] + dy * r[1] + dz * r[2];
    const ly = dx * r[3] + dy * r[4] + dz * r[5];
    const lz = dx * r[6] + dy * r[7] + dz * r[8];

    return Math.abs(lx) <= obb.halfExtents[0] && Math.abs(ly) <= obb.halfExtents[1] && Math.abs(lz) <= obb.halfExtents[2];
}

/**
 * Clamps a point to the surface or interior of an OBB.
 * Reference: Closest Point on OBB to Point in Real-Time Collision Detection
 * by Christer Ericson (chapter 5.1.4)
 *
 * @param out - The clamped point result
 * @param obb - The OBB
 * @param point - The point to clamp
 * @returns out
 */
export function clampPoint(out: Vec3, obb: ROBB3, point: RVec3): Vec3 {
    // OBB axes are the columns of the rotation matrix, read directly from r[].
    const r = obb.rotation;

    // Vector from center to point (captured before writing out, in case out === point)
    const dx = point[0] - obb.center[0];
    const dy = point[1] - obb.center[1];
    const dz = point[2] - obb.center[2];

    // Start at center, then walk along each axis by the clamped projection distance.
    out[0] = obb.center[0];
    out[1] = obb.center[1];
    out[2] = obb.center[2];

    // x axis = r[0..2]
    let dist = dx * r[0] + dy * r[1] + dz * r[2];
    dist = Math.max(-obb.halfExtents[0], Math.min(obb.halfExtents[0], dist));
    out[0] += r[0] * dist;
    out[1] += r[1] * dist;
    out[2] += r[2] * dist;

    // y axis = r[3..5]
    dist = dx * r[3] + dy * r[4] + dz * r[5];
    dist = Math.max(-obb.halfExtents[1], Math.min(obb.halfExtents[1], dist));
    out[0] += r[3] * dist;
    out[1] += r[4] * dist;
    out[2] += r[5] * dist;

    // z axis = r[6..8]
    dist = dx * r[6] + dy * r[7] + dz * r[8];
    dist = Math.max(-obb.halfExtents[2], Math.min(obb.halfExtents[2], dist));
    out[0] += r[6] * dist;
    out[1] += r[7] * dist;
    out[2] += r[8] * dist;

    return out;
}

/**
 * Tests whether an OBB intersects with another OBB using the Separating Axis Theorem.
 * Reference: OBB-OBB Intersection in Real-Time Collision Detection
 * by Christer Ericson (chapter 4.4.1)
 *
 * A cross-product axis A_i x B_j degenerates to ~zero when those edges are near
 * parallel, which makes its (un-normalised) separation test numerically unstable.
 * Such an axis carries no separation information not already covered by the face
 * axes, so it is skipped when `1 - R[i][j]^2` (its squared length, = sin^2 of the
 * angle between the edges) falls below `epsilon`. This is scale-invariant — R is a
 * matrix of cosines — unlike fudging the projected radii.
 *
 * @param a - The first OBB
 * @param b - The second OBB
 * @param epsilon - Squared-sine threshold below which near-parallel edge axes are skipped
 * @returns true if the OBBs intersect
 */
export function intersectsOBB3(a: ROBB3, b: ROBB3, epsilon = EPSILON): boolean {
    const rotA = a.rotation;
    const rotB = b.rotation;

    const a00 = rotA[0];
    const a01 = rotA[1];
    const a02 = rotA[2];
    const a10 = rotA[3];
    const a11 = rotA[4];
    const a12 = rotA[5];
    const a20 = rotA[6];
    const a21 = rotA[7];
    const a22 = rotA[8];

    const b00 = rotB[0];
    const b01 = rotB[1];
    const b02 = rotB[2];
    const b10 = rotB[3];
    const b11 = rotB[4];
    const b12 = rotB[5];
    const b20 = rotB[6];
    const b21 = rotB[7];
    const b22 = rotB[8];

    // R[i][j] = dot(A axis i, B axis j); OBB axes are the rows read above. Kept as
    // flat scalar locals so every access stays in a register (no nested-array loads).
    const r00 = a00 * b00 + a01 * b01 + a02 * b02;
    const r01 = a00 * b10 + a01 * b11 + a02 * b12;
    const r02 = a00 * b20 + a01 * b21 + a02 * b22;
    const r10 = a10 * b00 + a11 * b01 + a12 * b02;
    const r11 = a10 * b10 + a11 * b11 + a12 * b12;
    const r12 = a10 * b20 + a11 * b21 + a12 * b22;
    const r20 = a20 * b00 + a21 * b01 + a22 * b02;
    const r21 = a20 * b10 + a21 * b11 + a22 * b12;
    const r22 = a20 * b20 + a21 * b21 + a22 * b22;

    // |R|, used to project box extents onto each candidate axis
    const q00 = Math.abs(r00);
    const q01 = Math.abs(r01);
    const q02 = Math.abs(r02);
    const q10 = Math.abs(r10);
    const q11 = Math.abs(r11);
    const q12 = Math.abs(r12);
    const q20 = Math.abs(r20);
    const q21 = Math.abs(r21);
    const q22 = Math.abs(r22);

    // Translation (b.center - a.center) brought into a's frame: t[i] = dot(t, A axis i)
    const dx = b.center[0] - a.center[0];
    const dy = b.center[1] - a.center[1];
    const dz = b.center[2] - a.center[2];
    const t0 = dx * a00 + dy * a01 + dz * a02;
    const t1 = dx * a10 + dy * a11 + dz * a12;
    const t2 = dx * a20 + dy * a21 + dz * a22;

    const ae0 = a.halfExtents[0];
    const ae1 = a.halfExtents[1];
    const ae2 = a.halfExtents[2];
    const be0 = b.halfExtents[0];
    const be1 = b.halfExtents[1];
    const be2 = b.halfExtents[2];

    let ra: number;
    let rb: number;

    // Test axes L = A0, A1, A2
    ra = ae0;
    rb = be0 * q00 + be1 * q01 + be2 * q02;
    if (Math.abs(t0) > ra + rb) return false;
    ra = ae1;
    rb = be0 * q10 + be1 * q11 + be2 * q12;
    if (Math.abs(t1) > ra + rb) return false;
    ra = ae2;
    rb = be0 * q20 + be1 * q21 + be2 * q22;
    if (Math.abs(t2) > ra + rb) return false;

    // Test axes L = B0, B1, B2
    ra = ae0 * q00 + ae1 * q10 + ae2 * q20;
    rb = be0;
    if (Math.abs(t0 * r00 + t1 * r10 + t2 * r20) > ra + rb) return false;
    ra = ae0 * q01 + ae1 * q11 + ae2 * q21;
    rb = be1;
    if (Math.abs(t0 * r01 + t1 * r11 + t2 * r21) > ra + rb) return false;
    ra = ae0 * q02 + ae1 * q12 + ae2 * q22;
    rb = be2;
    if (Math.abs(t0 * r02 + t1 * r12 + t2 * r22) > ra + rb) return false;

    // Test axis L = A0 x B0 (skip when A0 ∥ B0)
    if (1 - r00 * r00 >= epsilon) {
        ra = ae1 * q20 + ae2 * q10;
        rb = be1 * q02 + be2 * q01;
        if (Math.abs(t2 * r10 - t1 * r20) > ra + rb) return false;
    }

    // Test axis L = A0 x B1 (skip when A0 ∥ B1)
    if (1 - r01 * r01 >= epsilon) {
        ra = ae1 * q21 + ae2 * q11;
        rb = be0 * q02 + be2 * q00;
        if (Math.abs(t2 * r11 - t1 * r21) > ra + rb) return false;
    }

    // Test axis L = A0 x B2 (skip when A0 ∥ B2)
    if (1 - r02 * r02 >= epsilon) {
        ra = ae1 * q22 + ae2 * q12;
        rb = be0 * q01 + be1 * q00;
        if (Math.abs(t2 * r12 - t1 * r22) > ra + rb) return false;
    }

    // Test axis L = A1 x B0 (skip when A1 ∥ B0)
    if (1 - r10 * r10 >= epsilon) {
        ra = ae0 * q20 + ae2 * q00;
        rb = be1 * q12 + be2 * q11;
        if (Math.abs(t0 * r20 - t2 * r00) > ra + rb) return false;
    }

    // Test axis L = A1 x B1 (skip when A1 ∥ B1)
    if (1 - r11 * r11 >= epsilon) {
        ra = ae0 * q21 + ae2 * q01;
        rb = be0 * q12 + be2 * q10;
        if (Math.abs(t0 * r21 - t2 * r01) > ra + rb) return false;
    }

    // Test axis L = A1 x B2 (skip when A1 ∥ B2)
    if (1 - r12 * r12 >= epsilon) {
        ra = ae0 * q22 + ae2 * q02;
        rb = be0 * q11 + be1 * q10;
        if (Math.abs(t0 * r22 - t2 * r02) > ra + rb) return false;
    }

    // Test axis L = A2 x B0 (skip when A2 ∥ B0)
    if (1 - r20 * r20 >= epsilon) {
        ra = ae0 * q10 + ae1 * q00;
        rb = be1 * q22 + be2 * q21;
        if (Math.abs(t1 * r00 - t0 * r10) > ra + rb) return false;
    }

    // Test axis L = A2 x B1 (skip when A2 ∥ B1)
    if (1 - r21 * r21 >= epsilon) {
        ra = ae0 * q11 + ae1 * q01;
        rb = be0 * q22 + be2 * q20;
        if (Math.abs(t1 * r01 - t0 * r11) > ra + rb) return false;
    }

    // Test axis L = A2 x B2 (skip when A2 ∥ B2)
    if (1 - r22 * r22 >= epsilon) {
        ra = ae0 * q12 + ae1 * q02;
        rb = be0 * q21 + be1 * q20;
        if (Math.abs(t1 * r02 - t0 * r12) > ra + rb) return false;
    }

    // No separating axis found - OBBs must be intersecting
    return true;
}

/**
 * Tests whether an OBB intersects with an AABB.
 *
 * Specialised form of {@link intersectsOBB3}: the AABB's axes are the world axes, so
 * the axis dot-product matrix R is just the OBB's rotation (no 9 dot-products), and the
 * AABB's centre/half-extents come straight from its min/max. The near-parallel edge
 * skip works identically — here it fires when an OBB axis aligns with a world axis.
 *
 * @param obb - The OBB
 * @param aabb - The AABB (axis-aligned bounding box)
 * @returns true if they intersect
 */
export function intersectsBox3(obb: ROBB3, aabb: RBox3): boolean {
    const rotA = obb.rotation;
    const epsilon = EPSILON;

    // R[i][j] = dot(A axis i, AABB axis j) = A axis i's j-th component = rotA itself
    const r00 = rotA[0];
    const r01 = rotA[1];
    const r02 = rotA[2];
    const r10 = rotA[3];
    const r11 = rotA[4];
    const r12 = rotA[5];
    const r20 = rotA[6];
    const r21 = rotA[7];
    const r22 = rotA[8];

    const q00 = Math.abs(r00);
    const q01 = Math.abs(r01);
    const q02 = Math.abs(r02);
    const q10 = Math.abs(r10);
    const q11 = Math.abs(r11);
    const q12 = Math.abs(r12);
    const q20 = Math.abs(r20);
    const q21 = Math.abs(r21);
    const q22 = Math.abs(r22);

    // AABB centre and half-extents
    const bcx = (aabb[0] + aabb[3]) * 0.5;
    const bcy = (aabb[1] + aabb[4]) * 0.5;
    const bcz = (aabb[2] + aabb[5]) * 0.5;
    const be0 = (aabb[3] - aabb[0]) * 0.5;
    const be1 = (aabb[4] - aabb[1]) * 0.5;
    const be2 = (aabb[5] - aabb[2]) * 0.5;

    // Translation (aabb.center - obb.center) brought into the OBB's frame
    const dx = bcx - obb.center[0];
    const dy = bcy - obb.center[1];
    const dz = bcz - obb.center[2];
    const t0 = dx * r00 + dy * r01 + dz * r02;
    const t1 = dx * r10 + dy * r11 + dz * r12;
    const t2 = dx * r20 + dy * r21 + dz * r22;

    const ae0 = obb.halfExtents[0];
    const ae1 = obb.halfExtents[1];
    const ae2 = obb.halfExtents[2];

    let ra: number;
    let rb: number;

    // Test axes L = A0, A1, A2
    ra = ae0;
    rb = be0 * q00 + be1 * q01 + be2 * q02;
    if (Math.abs(t0) > ra + rb) return false;
    ra = ae1;
    rb = be0 * q10 + be1 * q11 + be2 * q12;
    if (Math.abs(t1) > ra + rb) return false;
    ra = ae2;
    rb = be0 * q20 + be1 * q21 + be2 * q22;
    if (Math.abs(t2) > ra + rb) return false;

    // Test axes L = B0, B1, B2
    ra = ae0 * q00 + ae1 * q10 + ae2 * q20;
    rb = be0;
    if (Math.abs(t0 * r00 + t1 * r10 + t2 * r20) > ra + rb) return false;
    ra = ae0 * q01 + ae1 * q11 + ae2 * q21;
    rb = be1;
    if (Math.abs(t0 * r01 + t1 * r11 + t2 * r21) > ra + rb) return false;
    ra = ae0 * q02 + ae1 * q12 + ae2 * q22;
    rb = be2;
    if (Math.abs(t0 * r02 + t1 * r12 + t2 * r22) > ra + rb) return false;

    // Test axis L = A0 x B0 (skip when A0 aligns with world X)
    if (1 - r00 * r00 >= epsilon) {
        ra = ae1 * q20 + ae2 * q10;
        rb = be1 * q02 + be2 * q01;
        if (Math.abs(t2 * r10 - t1 * r20) > ra + rb) return false;
    }

    // Test axis L = A0 x B1 (skip when A0 aligns with world Y)
    if (1 - r01 * r01 >= epsilon) {
        ra = ae1 * q21 + ae2 * q11;
        rb = be0 * q02 + be2 * q00;
        if (Math.abs(t2 * r11 - t1 * r21) > ra + rb) return false;
    }

    // Test axis L = A0 x B2 (skip when A0 aligns with world Z)
    if (1 - r02 * r02 >= epsilon) {
        ra = ae1 * q22 + ae2 * q12;
        rb = be0 * q01 + be1 * q00;
        if (Math.abs(t2 * r12 - t1 * r22) > ra + rb) return false;
    }

    // Test axis L = A1 x B0 (skip when A1 aligns with world X)
    if (1 - r10 * r10 >= epsilon) {
        ra = ae0 * q20 + ae2 * q00;
        rb = be1 * q12 + be2 * q11;
        if (Math.abs(t0 * r20 - t2 * r00) > ra + rb) return false;
    }

    // Test axis L = A1 x B1 (skip when A1 aligns with world Y)
    if (1 - r11 * r11 >= epsilon) {
        ra = ae0 * q21 + ae2 * q01;
        rb = be0 * q12 + be2 * q10;
        if (Math.abs(t0 * r21 - t2 * r01) > ra + rb) return false;
    }

    // Test axis L = A1 x B2 (skip when A1 aligns with world Z)
    if (1 - r12 * r12 >= epsilon) {
        ra = ae0 * q22 + ae2 * q02;
        rb = be0 * q11 + be1 * q10;
        if (Math.abs(t0 * r22 - t2 * r02) > ra + rb) return false;
    }

    // Test axis L = A2 x B0 (skip when A2 aligns with world X)
    if (1 - r20 * r20 >= epsilon) {
        ra = ae0 * q10 + ae1 * q00;
        rb = be1 * q22 + be2 * q21;
        if (Math.abs(t1 * r00 - t0 * r10) > ra + rb) return false;
    }

    // Test axis L = A2 x B1 (skip when A2 aligns with world Y)
    if (1 - r21 * r21 >= epsilon) {
        ra = ae0 * q11 + ae1 * q01;
        rb = be0 * q22 + be2 * q20;
        if (Math.abs(t1 * r01 - t0 * r11) > ra + rb) return false;
    }

    // Test axis L = A2 x B2 (skip when A2 aligns with world Z)
    if (1 - r22 * r22 >= epsilon) {
        ra = ae0 * q12 + ae1 * q02;
        rb = be0 * q21 + be1 * q20;
        if (Math.abs(t1 * r02 - t0 * r12) > ra + rb) return false;
    }

    return true;
}

/**
 * Applies a 4x4 transformation matrix to an OBB.
 * This can be used to transform the bounding volume with the world matrix
 * of a 3D object to keep both entities in sync.
 *
 * @param out - The transformed OBB
 * @param obb - The OBB to transform
 * @param matrix - The 4x4 transformation matrix
 * @returns out
 */
export function applyMatrix4(out: OBB3, obb: ROBB3, matrix: RMat4): OBB3 {
    // read the upper-left 3x3 (the affine linear part) into locals once. Columns
    // m0*, m1*, m2* correspond to mat4 columns 0, 1, 2.
    const m00 = matrix[0];
    const m01 = matrix[1];
    const m02 = matrix[2];
    const m10 = matrix[4];
    const m11 = matrix[5];
    const m12 = matrix[6];
    const m20 = matrix[8];
    const m21 = matrix[9];
    const m22 = matrix[10];

    // extract scale as the length of each column (always non-negative).
    const sx = Math.sqrt(m00 * m00 + m01 * m01 + m02 * m02);
    const sy = Math.sqrt(m10 * m10 + m11 * m11 + m12 * m12);
    const sz = Math.sqrt(m20 * m20 + m21 * m21 + m22 * m22);

    // handle negative scale (reflection).
    // for an affine matrix the 4x4 determinant equals the upper-left 3x3 determinant, so we only need that (and only its sign).
    // the reflection is folded into the first rotation column via invSX so that the extracted basis stays right-handed while the half extents remain positive.
    const det = m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
    const invSX = (det < 0 ? -1 : 1) / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;

    // normalized rotation columns (scale removed).
    const r00 = m00 * invSX;
    const r01 = m01 * invSX;
    const r02 = m02 * invSX;
    const r10 = m10 * invSY;
    const r11 = m11 * invSY;
    const r12 = m12 * invSY;
    const r20 = m20 * invSZ;
    const r21 = m21 * invSZ;
    const r22 = m22 * invSZ;

    // cache the obb's rotation before writing to out.rotation (supports out === obb).
    const q = obb.rotation;
    const q0 = q[0];
    const q1 = q[1];
    const q2 = q[2];
    const q3 = q[3];
    const q4 = q[4];
    const q5 = q[5];
    const q6 = q[6];
    const q7 = q[7];
    const q8 = q[8];

    // combine rotations: out.rotation = extractedRotation * obb.rotation (inlined mat3.multiply).
    const outRotation = out.rotation;
    outRotation[0] = q0 * r00 + q1 * r10 + q2 * r20;
    outRotation[1] = q0 * r01 + q1 * r11 + q2 * r21;
    outRotation[2] = q0 * r02 + q1 * r12 + q2 * r22;
    outRotation[3] = q3 * r00 + q4 * r10 + q5 * r20;
    outRotation[4] = q3 * r01 + q4 * r11 + q5 * r21;
    outRotation[5] = q3 * r02 + q4 * r12 + q5 * r22;
    outRotation[6] = q6 * r00 + q7 * r10 + q8 * r20;
    outRotation[7] = q6 * r01 + q7 * r11 + q8 * r21;
    outRotation[8] = q6 * r02 + q7 * r12 + q8 * r22;

    // scale half extents (sx/sy/sz are already the positive scale magnitudes).
    const he = obb.halfExtents;
    const outHalfExtents = out.halfExtents;
    outHalfExtents[0] = he[0] * sx;
    outHalfExtents[1] = he[1] * sy;
    outHalfExtents[2] = he[2] * sz;

    // transform center through the full matrix (rotation + translation, inlined transformMat4).
    const c = obb.center;
    const cx = c[0];
    const cy = c[1];
    const cz = c[2];
    let w = matrix[3] * cx + matrix[7] * cy + matrix[11] * cz + matrix[15];
    w = w || 1.0;
    const outCenter = out.center;
    outCenter[0] = (m00 * cx + m10 * cy + m20 * cz + matrix[12]) / w;
    outCenter[1] = (m01 * cx + m11 * cy + m21 * cz + matrix[13]) / w;
    outCenter[2] = (m02 * cx + m12 * cy + m22 * cz + matrix[14]) / w;

    return out;
}
