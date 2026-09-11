import { EPSILON } from '../core/scalar';
import type { RMat4 } from '../core/mat4';
import type { RVec3, Vec3 } from '../core/vec3';
import type { RPlane3 } from './plane3';
import type { RSphere } from './sphere';

/** A box in 3D space */
export type Box3 = [minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number];

/** A read-only 3D axis-aligned bounding box */
export type RBox3 = Readonly<Box3>;

/**
 * Create a new empty Box3 with "min" set to positive infinity and "max" set to negative infinity
 * @returns A new Box3
 */
export function create(): Box3 {
    return [
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
    ];
}

/**
 * Clones a Box3
 * @param box - A Box3 to clone
 * @returns a clone of box
 */
export function clone(box: RBox3): Box3 {
    return [box[0], box[1], box[2], box[3], box[4], box[5]];
}

/**
 * Copies a Box3 to another Box3
 * @param out the output Box3
 * @param box the input Box3
 * @returns the output Box3
 */
export function copy(out: Box3, box: RBox3): Box3 {
    out[0] = box[0];
    out[1] = box[1];
    out[2] = box[2];
    out[3] = box[3];
    out[4] = box[4];
    out[5] = box[5];
    return out;
}

/**
 * Sets the min and max values of a Box3
 * @param out - The output Box3
 * @param minX - The minimum X coordinate
 * @param minY - The minimum Y coordinate
 * @param minZ - The minimum Z coordinate
 * @param maxX - The maximum X coordinate
 * @param maxY - The maximum Y coordinate
 * @param maxZ - The maximum Z coordinate
 * @returns The updated Box3
 */
export function set(out: Box3, minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): Box3 {
    out[0] = minX;
    out[1] = minY;
    out[2] = minZ;
    out[3] = maxX;
    out[4] = maxY;
    out[5] = maxZ;
    return out;
}

/**
 * Sets the min and max values of a Box3 from Vec3 vectors
 * @param out - The output Box3
 * @param min - The minimum corner
 * @param max - The maximum corner
 * @returns The updated Box3
 */
export function setFromVectors(out: Box3, min: RVec3, max: RVec3): Box3 {
    out[0] = min[0];
    out[1] = min[1];
    out[2] = min[2];
    out[3] = max[0];
    out[4] = max[1];
    out[5] = max[2];
    return out;
}

/**
 * Extracts the minimum corner of a Box3
 * @param out - The output Vec3 for the minimum corner
 * @param box - The input Box3
 * @returns The minimum corner
 */
export function min(out: Vec3, box: RBox3): Vec3 {
    out[0] = box[0];
    out[1] = box[1];
    out[2] = box[2];
    return out;
}

/**
 * Extracts the maximum corner of a Box3
 * @param out - The output Vec3 for the maximum corner
 * @param box - The input Box3
 * @returns The maximum corner
 */
export function max(out: Vec3, box: RBox3): Vec3 {
    out[0] = box[3];
    out[1] = box[4];
    out[2] = box[5];
    return out;
}

/**
 * Set a Box3 to empty (min to positive infinity, max to negative infinity)
 * @param out - The Box3 to make empty
 * @returns The emptied Box3
 */
export function empty(out: Box3): Box3 {
    out[0] = Number.POSITIVE_INFINITY;
    out[1] = Number.POSITIVE_INFINITY;
    out[2] = Number.POSITIVE_INFINITY;
    out[3] = Number.NEGATIVE_INFINITY;
    out[4] = Number.NEGATIVE_INFINITY;
    out[5] = Number.NEGATIVE_INFINITY;
    return out;
}

/**
 * Returns whether or not the boxes have exactly the same elements in the same position (when compared with ===)
 * @param a - The first box
 * @param b - The second box
 * @returns True if the boxes are equal, false otherwise
 */
export function exactEquals(a: RBox3, b: RBox3): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
}

/**
 * Returns whether or not the boxes have approximately the same elements in the same position
 * @param a - The first box
 * @param b - The second box
 * @returns True if the boxes are equal, false otherwise
 */
export function equals(a: RBox3, b: RBox3): boolean {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];
    const b3 = b[3];
    const b4 = b[4];
    const b5 = b[5];
    return (
        Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
        Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
        Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
        Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5))
    );
}

/**
 * Sets the box from a center point and size
 * @param out - The output Box3
 * @param center - The center point
 * @param size - The size of the box
 * @returns The updated Box3
 */
export function setFromCenterAndSize(out: Box3, center: RVec3, size: RVec3): Box3 {
    const hx = size[0] * 0.5;
    const hy = size[1] * 0.5;
    const hz = size[2] * 0.5;
    out[0] = center[0] - hx;
    out[1] = center[1] - hy;
    out[2] = center[2] - hz;
    out[3] = center[0] + hx;
    out[4] = center[1] + hy;
    out[5] = center[2] + hz;
    return out;
}

/**
 * Expands a Box3 to include a point
 * @param out - The output Box3
 * @param box - The input Box3
 * @param point - The point to include
 * @returns The expanded Box3
 */
export function expandByPoint(out: Box3, box: RBox3, point: RVec3): Box3 {
    out[0] = Math.min(box[0], point[0]);
    out[1] = Math.min(box[1], point[1]);
    out[2] = Math.min(box[2], point[2]);
    out[3] = Math.max(box[3], point[0]);
    out[4] = Math.max(box[4], point[1]);
    out[5] = Math.max(box[5], point[2]);
    return out;
}

/**
 * Widens a Box3 by a vector on both sides
 * Subtracts the vector from min and adds it to max
 * @param out - The output Box3
 * @param box - The input Box3
 * @param vector - The vector to expand by
 * @returns The expanded Box3
 */
export function expandByExtents(out: Box3, box: RBox3, vector: RVec3): Box3 {
    out[0] = box[0] - vector[0];
    out[1] = box[1] - vector[1];
    out[2] = box[2] - vector[2];
    out[3] = box[3] + vector[0];
    out[4] = box[4] + vector[1];
    out[5] = box[5] + vector[2];
    return out;
}

/**
 * Expands a Box3 uniformly by a scalar margin on all sides
 * Subtracts the margin from min and adds it to max on each axis
 * @param out - The output Box3
 * @param box - The input Box3
 * @param margin - The uniform margin to expand by
 * @returns The expanded Box3
 */
export function expandByMargin(out: Box3, box: RBox3, margin: number): Box3 {
    out[0] = box[0] - margin;
    out[1] = box[1] - margin;
    out[2] = box[2] - margin;
    out[3] = box[3] + margin;
    out[4] = box[4] + margin;
    out[5] = box[5] + margin;
    return out;
}

/**
 * Computes the union of two bounding boxes
 * Returns a Box3 that encompasses both input boxes
 * @param out - The output Box3
 * @param boxA - The first Box3
 * @param boxB - The second Box3
 * @returns The union Box3
 */
export function union(out: Box3, boxA: RBox3, boxB: RBox3): Box3 {
    out[0] = Math.min(boxA[0], boxB[0]);
    out[1] = Math.min(boxA[1], boxB[1]);
    out[2] = Math.min(boxA[2], boxB[2]);
    out[3] = Math.max(boxA[3], boxB[3]);
    out[4] = Math.max(boxA[4], boxB[4]);
    out[5] = Math.max(boxA[5], boxB[5]);
    return out;
}

/**
 * Calculate the center point of a bounding box
 * @param out - The output Vec3 for the center
 * @param box - The input Box3
 * @returns The center point
 */
export function center(out: Vec3, box: RBox3): Vec3 {
    out[0] = (box[0] + box[3]) * 0.5;
    out[1] = (box[1] + box[4]) * 0.5;
    out[2] = (box[2] + box[5]) * 0.5;
    return out;
}

/**
 * Calculate the extents (half-size) of a bounding box
 * @param out - The output Vec3 for the extents
 * @param box - The input Box3
 * @returns The extents (distance from center to each face)
 */
export function extents(out: Vec3, box: RBox3): Vec3 {
    out[0] = (box[3] - box[0]) * 0.5;
    out[1] = (box[4] - box[1]) * 0.5;
    out[2] = (box[5] - box[2]) * 0.5;
    return out;
}

/**
 * Calculate the size (dimensions) of a bounding box
 * @param out - The output Vec3 for the size
 * @param box - The input Box3
 * @returns The size (width, height, depth)
 */
export function size(out: Vec3, box: RBox3): Vec3 {
    out[0] = box[3] - box[0];
    out[1] = box[4] - box[1];
    out[2] = box[5] - box[2];
    return out;
}

/**
 * Calculate the surface area of a bounding box
 * @param box - The input Box3
 * @returns The surface area
 */
export function surfaceArea(box: RBox3): number {
    const width = box[3] - box[0];
    const height = box[4] - box[1];
    const depth = box[5] - box[2];
    return 2 * (width * height + width * depth + height * depth);
}

/**
 * Scale a bounding box by a vector, handling non-uniform and negative scaling
 * @param out - The output Box3
 * @param box - The input Box3
 * @param scale - The scale to apply (as a Vec3)
 * @returns The scaled Box3
 */
export function scale(out: Box3, box: RBox3, scale: RVec3): Box3 {
    const minX = box[0] * scale[0];
    const maxX = box[3] * scale[0];
    const minY = box[1] * scale[1];
    const maxY = box[4] * scale[1];
    const minZ = box[2] * scale[2];
    const maxZ = box[5] * scale[2];

    // handle negative scaling by ensuring min <= max for each axis
    out[0] = Math.min(minX, maxX);
    out[3] = Math.max(minX, maxX);
    out[1] = Math.min(minY, maxY);
    out[4] = Math.max(minY, maxY);
    out[2] = Math.min(minZ, maxZ);
    out[5] = Math.max(minZ, maxZ);

    return out;
}

/**
 * Transform a bounding box by a 4x4 matrix.
 * Uses Arvo's trick — transform the center, build new half-extents from
 * |M| · extents — which is ~4× fewer ops than transforming all 8 corners.
 * Reference: Jim Arvo, "Transforming Axis-Aligned Bounding Boxes",
 * Graphics Gems I (1990).
 * https://github.com/erich666/GraphicsGems/blob/master/gems/TransBox.c
 * Assumes mat is affine (no perspective), which is always true for AABB
 * transforms in practice.
 * Safe under aliasing (out and box may be the same array): all six box
 * components are read into locals before out is written.
 * @param out - The output Box3
 * @param box - The input Box3
 * @param mat - The 4x4 transformation matrix
 * @returns The transformed Box3
 */
export function transformMat4(out: Box3, box: RBox3, mat: RMat4): Box3 {
    const bMinX = box[0];
    const bMinY = box[1];
    const bMinZ = box[2];
    const bMaxX = box[3];
    const bMaxY = box[4];
    const bMaxZ = box[5];

    // empty input → empty output (preserve sentinel rather than producing
    // a bogus transformed box from negative extents)
    if (bMinX > bMaxX || bMinY > bMaxY || bMinZ > bMaxZ) {
        out[0] = Number.POSITIVE_INFINITY;
        out[1] = Number.POSITIVE_INFINITY;
        out[2] = Number.POSITIVE_INFINITY;
        out[3] = Number.NEGATIVE_INFINITY;
        out[4] = Number.NEGATIVE_INFINITY;
        out[5] = Number.NEGATIVE_INFINITY;
        return out;
    }

    const cx = (bMinX + bMaxX) * 0.5;
    const cy = (bMinY + bMaxY) * 0.5;
    const cz = (bMinZ + bMaxZ) * 0.5;
    const ex = (bMaxX - bMinX) * 0.5;
    const ey = (bMaxY - bMinY) * 0.5;
    const ez = (bMaxZ - bMinZ) * 0.5;

    const m0 = mat[0],
        m1 = mat[1],
        m2 = mat[2];
    const m4 = mat[4],
        m5 = mat[5],
        m6 = mat[6];
    const m8 = mat[8],
        m9 = mat[9],
        m10 = mat[10];

    const tcx = m0 * cx + m4 * cy + m8 * cz + mat[12];
    const tcy = m1 * cx + m5 * cy + m9 * cz + mat[13];
    const tcz = m2 * cx + m6 * cy + m10 * cz + mat[14];

    const tex = Math.abs(m0) * ex + Math.abs(m4) * ey + Math.abs(m8) * ez;
    const tey = Math.abs(m1) * ex + Math.abs(m5) * ey + Math.abs(m9) * ez;
    const tez = Math.abs(m2) * ex + Math.abs(m6) * ey + Math.abs(m10) * ez;

    out[0] = tcx - tex;
    out[1] = tcy - tey;
    out[2] = tcz - tez;
    out[3] = tcx + tex;
    out[4] = tcy + tey;
    out[5] = tcz + tez;

    return out;
}

/**
 * Test if a point is contained within the bounding box
 * @param box - The bounding box
 * @param point - The point to test
 * @returns true if the point is inside or on the boundary of the box
 */
export function containsPoint(box: RBox3, point: RVec3): boolean {
    return (
        point[0] >= box[0] &&
        point[0] <= box[3] &&
        point[1] >= box[1] &&
        point[1] <= box[4] &&
        point[2] >= box[2] &&
        point[2] <= box[5]
    );
}

/**
 * Test if one Box3 completely contains another Box3
 * @param container - The potentially containing Box3
 * @param contained - The Box3 that might be contained
 * @returns true if the container Box3 completely contains the contained Box3
 */
export function containsBox3(container: RBox3, contained: RBox3): boolean {
    return (
        contained[0] >= container[0] &&
        contained[3] <= container[3] &&
        contained[1] >= container[1] &&
        contained[4] <= container[4] &&
        contained[2] >= container[2] &&
        contained[5] <= container[5]
    );
}

/**
 * Check whether two bounding boxes intersect
 */
export function intersectsBox3(boxA: RBox3, boxB: RBox3): boolean {
    return (
        boxA[0] <= boxB[3] &&
        boxA[3] >= boxB[0] &&
        boxA[1] <= boxB[4] &&
        boxA[4] >= boxB[1] &&
        boxA[2] <= boxB[5] &&
        boxA[5] >= boxB[2]
    );
}

/**
 * Test whether an axis-aligned bounding box intersects a triangle, via the
 * separating-axis theorem over 13 axes: the 3 box face normals, the triangle
 * face normal, and the 9 box-axis × triangle-edge cross products.
 *
 * Fully inlined with local scalars — no scratch arrays or per-call allocations.
 * Axes are tested cheapest-first (box faces, i.e. the triangle-vs-box AABB
 * reject) so the common non-overlapping case exits before any edge or cross
 * product is computed. On each edge-cross axis two of the three vertices project
 * to the same value (the axis is perpendicular to that edge), so only two
 * projections are needed. An all-zero cross axis (edge parallel to a box axis)
 * collapses every projection and the radius to 0, passing automatically.
 */
export function intersectsTriangle3(box: RBox3, a: RVec3, b: RVec3, c: RVec3): boolean {
    // Empty box quick reject
    if (box[0] > box[3] || box[1] > box[4] || box[2] > box[5]) return false;

    // Box center and half-extents
    const cx = (box[0] + box[3]) * 0.5;
    const cy = (box[1] + box[4]) * 0.5;
    const cz = (box[2] + box[5]) * 0.5;
    const ex = box[3] - cx;
    const ey = box[4] - cy;
    const ez = box[5] - cz;

    // Triangle vertices relative to the box center
    const v0x = a[0] - cx;
    const v0y = a[1] - cy;
    const v0z = a[2] - cz;
    const v1x = b[0] - cx;
    const v1y = b[1] - cy;
    const v1z = b[2] - cz;
    const v2x = c[0] - cx;
    const v2y = c[1] - cy;
    const v2z = c[2] - cz;

    // 3 box face normals first: this is the triangle-AABB vs box reject and
    // knocks out most non-overlapping pairs before any further work.
    if (Math.min(v0x, v1x, v2x) > ex || Math.max(v0x, v1x, v2x) < -ex) return false;
    if (Math.min(v0y, v1y, v2y) > ey || Math.max(v0y, v1y, v2y) < -ey) return false;
    if (Math.min(v0z, v1z, v2z) > ez || Math.max(v0z, v1z, v2z) < -ez) return false;

    // Triangle edge vectors
    const f0x = v1x - v0x;
    const f0y = v1y - v0y;
    const f0z = v1z - v0z;
    const f1x = v2x - v1x;
    const f1y = v2y - v1y;
    const f1z = v2z - v1z;
    const f2x = v0x - v2x;
    const f2y = v0y - v2y;
    const f2z = v0z - v2z;

    let pa: number;
    let pb: number;
    let r: number;

    // Triangle face normal (all three vertices share one projection)
    const nx = f0y * f1z - f0z * f1y;
    const ny = f0z * f1x - f0x * f1z;
    const nz = f0x * f1y - f0y * f1x;
    const d = v0x * nx + v0y * ny + v0z * nz;
    r = ex * Math.abs(nx) + ey * Math.abs(ny) + ez * Math.abs(nz);
    if (d > r || d < -r) return false;

    // 9 axes: box axis × triangle edge. The axis is perpendicular to its edge,
    // so the two vertices on that edge project equally — only two projections
    // (pa, pb) differ.
    // box X (1,0,0) × edge => (0, -fz, fy)
    pa = v0z * f0y - v0y * f0z;
    pb = v2z * f0y - v2y * f0z;
    r = ey * Math.abs(f0z) + ez * Math.abs(f0y);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    pa = v0z * f1y - v0y * f1z;
    pb = v1z * f1y - v1y * f1z;
    r = ey * Math.abs(f1z) + ez * Math.abs(f1y);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    pa = v0z * f2y - v0y * f2z;
    pb = v1z * f2y - v1y * f2z;
    r = ey * Math.abs(f2z) + ez * Math.abs(f2y);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    // box Y (0,1,0) × edge => (fz, 0, -fx)
    pa = v0x * f0z - v0z * f0x;
    pb = v2x * f0z - v2z * f0x;
    r = ex * Math.abs(f0z) + ez * Math.abs(f0x);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    pa = v0x * f1z - v0z * f1x;
    pb = v1x * f1z - v1z * f1x;
    r = ex * Math.abs(f1z) + ez * Math.abs(f1x);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    pa = v0x * f2z - v0z * f2x;
    pb = v1x * f2z - v1z * f2x;
    r = ex * Math.abs(f2z) + ez * Math.abs(f2x);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    // box Z (0,0,1) × edge => (-fy, fx, 0)
    pa = v0y * f0x - v0x * f0y;
    pb = v2y * f0x - v2x * f0y;
    r = ex * Math.abs(f0y) + ey * Math.abs(f0x);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    pa = v0y * f1x - v0x * f1y;
    pb = v1y * f1x - v1x * f1y;
    r = ex * Math.abs(f1y) + ey * Math.abs(f1x);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    pa = v0y * f2x - v0x * f2y;
    pb = v1y * f2x - v1x * f2y;
    r = ex * Math.abs(f2y) + ey * Math.abs(f2x);
    if (Math.min(pa, pb) > r || Math.max(pa, pb) < -r) return false;

    return true;
}

/**
 * Test intersection between axis-aligned bounding box and a sphere.
 */
export function intersectsSphere(box: RBox3, sphere: RSphere): boolean {
    const { center, radius } = sphere;
    const cx = center[0];
    const cy = center[1];
    const cz = center[2];
    // distance from the sphere centre to the box along each axis (0 when inside)
    const dx = cx < box[0] ? box[0] - cx : cx > box[3] ? cx - box[3] : 0;
    const dy = cy < box[1] ? box[1] - cy : cy > box[4] ? cy - box[4] : 0;
    const dz = cz < box[2] ? box[2] - cz : cz > box[5] ? cz - box[5] : 0;
    return dx * dx + dy * dy + dz * dz <= radius * radius;
}

/**
 * Test intersection between axis-aligned bounding box and plane.
 */
export function intersectsPlane3(box: RBox3, plane: RPlane3): boolean {
    const { normal, constant } = plane;
    const nx = normal[0];
    const ny = normal[1];
    const nz = normal[2];

    // Signed distance from the box centre to the plane, and the box's projected
    // half-extent (radius) onto the normal. Branchless equivalent of picking the
    // near/far corners per axis: the box straddles the plane iff |s| <= r.
    // Everything is kept at 2x scale (centre*2, extent*2) so the per-axis 0.5
    // factors drop out; the |s| <= r test is unaffected.
    const s = nx * (box[0] + box[3]) + ny * (box[1] + box[4]) + nz * (box[2] + box[5]) + 2 * constant;
    const r = Math.abs(nx) * (box[3] - box[0]) + Math.abs(ny) * (box[4] - box[1]) + Math.abs(nz) * (box[5] - box[2]);
    return s <= r && s >= -r;
}
