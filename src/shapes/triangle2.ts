import type { RVec2, Vec2 } from '../core/vec2';
import type { Box2 } from './box2';

/**
 * Returns the signed area of the triangle (a, b, c). The result is positive when
 * the vertices wind counter-clockwise, negative when they wind clockwise, and
 * zero when the three points are collinear.
 *
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @returns the signed area.
 */
export function signedArea(a: RVec2, b: RVec2, c: RVec2): number {
    return ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
}

/**
 * Returns the (non-negative) area of the triangle (a, b, c).
 *
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @returns the absolute area.
 */
export function area(a: RVec2, b: RVec2, c: RVec2): number {
    return Math.abs(signedArea(a, b, c));
}

/**
 * Computes the centroid of the triangle (a, b, c).
 *
 * @param out the output vector to store the result.
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @returns out.
 */
export function centroid(out: Vec2, a: RVec2, b: RVec2, c: RVec2): Vec2 {
    out[0] = (a[0] + b[0] + c[0]) / 3;
    out[1] = (a[1] + b[1] + c[1]) / 3;
    return out;
}

/**
 * Computes the axis-aligned bounding box of the triangle (a, b, c).
 *
 * @param out the output box to store the result.
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @returns out.
 */
export function bounds(out: Box2, a: RVec2, b: RVec2, c: RVec2): Box2 {
    out[0] = Math.min(a[0], b[0], c[0]);
    out[1] = Math.min(a[1], b[1], c[1]);
    out[2] = Math.max(a[0], b[0], c[0]);
    out[3] = Math.max(a[1], b[1], c[1]);
    return out;
}

/**
 * Tests whether a point lies inside the triangle (a, b, c). Works for either
 * winding order; points on an edge or vertex are considered inside.
 *
 * @param a the first vertex of the triangle.
 * @param b the second vertex of the triangle.
 * @param c the third vertex of the triangle.
 * @param point the point to test.
 * @returns true if the point is inside (or on the boundary of) the triangle.
 */
export function containsPoint(a: RVec2, b: RVec2, c: RVec2, point: RVec2): boolean {
    const px = point[0];
    const py = point[1];

    // Sign of the point relative to each directed edge. Inside iff the point is
    // on the same side of all three (allowing zero for the boundary).
    const d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
    const d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1]);
    const d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1]);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

    return !(hasNeg && hasPos);
}
