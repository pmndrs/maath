import type { RVec3, Vec3 } from '../core/vec3';
import type { Box3 } from './box3';

/**
 * Computes the axis-aligned bounding box of a triangle defined by three vertices.
 * @param out the output box to store the result.
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @returns the output box containing the axis-aligned bounding box of the triangle.
 */
export function bounds(out: Box3, a: RVec3, b: RVec3, c: RVec3): Box3 {
    out[0] = Math.min(a[0], b[0], c[0]);
    out[1] = Math.min(a[1], b[1], c[1]);
    out[2] = Math.min(a[2], b[2], c[2]);

    out[3] = Math.max(a[0], b[0], c[0]);
    out[4] = Math.max(a[1], b[1], c[1]);
    out[5] = Math.max(a[2], b[2], c[2]);

    return out;
}

/**
 * Computes the normal vector of a triangle defined by three vertices.
 * @param out the output vector to store the result.
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @returns the output vector containing the normal of the triangle.
 */
export function normal(out: Vec3, a: RVec3, b: RVec3, c: RVec3): Vec3 {
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const abz = b[2] - a[2];

    const acx = c[0] - a[0];
    const acy = c[1] - a[1];
    const acz = c[2] - a[2];

    out[0] = aby * acz - abz * acy;
    out[1] = abz * acx - abx * acz;
    out[2] = abx * acy - aby * acx;

    const length = Math.sqrt(out[0] * out[0] + out[1] * out[1] + out[2] * out[2]);

    if (length > 0) {
        out[0] /= length;
        out[1] /= length;
        out[2] /= length;
    }

    return out;
}

/**
 * Computes the centroid of a triangle defined by three vertices.
 * @param out the output vector to store the result.
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @returns the output vector containing the centroid of the triangle.
 */
export function centroid(out: Vec3, a: RVec3, b: RVec3, c: RVec3): Vec3 {
    out[0] = (a[0] + b[0] + c[0]) / 3;
    out[1] = (a[1] + b[1] + c[1]) / 3;
    out[2] = (a[2] + b[2] + c[2]) / 3;

    return out;
}
