import type { RVec2, Vec2 } from '../core/vec2';

/**
 * Calculates the closest point on a line segment to a given point
 * @param out Output parameter for the closest point
 * @param point The point
 * @param a First endpoint of the segment
 * @param b Second endpoint of the segment
 */
export function closestPoint(out: Vec2, point: RVec2, a: RVec2, b: RVec2): Vec2 {
    const pqx = b[0] - a[0];
    const pqz = b[1] - a[1];
    const dx = point[0] - a[0];
    const dz = point[1] - a[1];

    const d = pqx * pqx + pqz * pqz;
    let t = pqx * dx + pqz * dz;
    if (d > 0) t /= d;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    out[0] = a[0] + t * pqx;
    out[1] = a[1] + t * pqz;

    return out;
}

/**
 * Tests whether the two closed segments a-b and c-d intersect. Collinear
 * (overlapping) segments are treated as non-intersecting; touching at an
 * endpoint counts as an intersection.
 *
 * @param a first endpoint of the first segment
 * @param b second endpoint of the first segment
 * @param c first endpoint of the second segment
 * @param d second endpoint of the second segment
 * @returns true if the segments intersect
 */
export function intersects(a: RVec2, b: RVec2, c: RVec2, d: RVec2): boolean {
    const rx = b[0] - a[0];
    const ry = b[1] - a[1];
    const ex = d[0] - c[0];
    const ey = d[1] - c[1];

    const denom = rx * ey - ry * ex;
    if (denom === 0) return false; // parallel or collinear

    const wx = c[0] - a[0];
    const wy = c[1] - a[1];
    const u = (wx * ey - wy * ex) / denom; // parameter along a-b
    const v = (wx * ry - wy * rx) / denom; // parameter along c-d

    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}

/**
 * Computes the intersection point of the two closed segments a-b and c-d,
 * writing it to `out`. Returns `out` when the segments intersect, or `null`
 * when they do not (including parallel/collinear segments).
 *
 * @param out output parameter for the intersection point
 * @param a first endpoint of the first segment
 * @param b second endpoint of the first segment
 * @param c first endpoint of the second segment
 * @param d second endpoint of the second segment
 * @returns out if the segments intersect, otherwise null
 */
export function intersection(out: Vec2, a: RVec2, b: RVec2, c: RVec2, d: RVec2): Vec2 | null {
    const rx = b[0] - a[0];
    const ry = b[1] - a[1];
    const ex = d[0] - c[0];
    const ey = d[1] - c[1];

    const denom = rx * ey - ry * ex;
    if (denom === 0) return null;

    const wx = c[0] - a[0];
    const wy = c[1] - a[1];
    const u = (wx * ey - wy * ex) / denom;
    const v = (wx * ry - wy * rx) / denom;

    if (u < 0 || u > 1 || v < 0 || v > 1) return null;

    out[0] = a[0] + u * rx;
    out[1] = a[1] + u * ry;
    return out;
}
