import type { RVec2, Vec2 } from '../core/vec2';
import type { Box2 } from './box2';

/**
 * A 2D polygon is represented as a flat array of vertex coordinates laid out as
 * `[x0, y0, x1, y1, ...]`, together with an explicit vertex count `n`.
 *
 * The count is passed separately (rather than derived from `verts.length`) so a
 * single scratch buffer can be reused across polygons of different sizes: only
 * the first `n` vertices are read, and any trailing slots are ignored. Vertices
 * are assumed to be ordered (clockwise or counter-clockwise) around the polygon.
 */

/**
 * Returns the signed area of the polygon using the shoelace formula.
 * The result is positive when the vertices wind counter-clockwise and negative
 * when they wind clockwise, so the sign can be used to determine winding order.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns the signed area
 */
export function signedArea(vertices: readonly number[], n: number): number {
    let area = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = vertices[i * 2];
        const yi = vertices[i * 2 + 1];
        const xj = vertices[j * 2];
        const yj = vertices[j * 2 + 1];
        area += xj * yi - xi * yj;
    }
    return area / 2;
}

/**
 * Returns the (non-negative) area of the polygon.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns the absolute area
 */
export function area(vertices: readonly number[], n: number): number {
    return Math.abs(signedArea(vertices, n));
}

/**
 * Tests whether a point lies inside the polygon. Works for both convex and
 * concave polygons. Points exactly on an edge or vertex are considered inside.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @param point the point to test
 * @returns true if the point is inside (or on the boundary of) the polygon
 */
export function containsPoint(vertices: readonly number[], n: number, point: RVec2): boolean {
    let inside = false;
    const x = point[0];
    const y = point[1];

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = vertices[i * 2];
        const yi = vertices[i * 2 + 1];
        const xj = vertices[j * 2];
        const yj = vertices[j * 2 + 1];

        // Signed area of the triangle (j, i, point): zero when the point lies on
        // the edge, sign tells which side it is on.
        const where = (yi - yj) * (x - xi) - (xi - xj) * (y - yi);

        if (yj < yi) {
            // Upward edge: count a crossing when the point's y is within [yj, yi).
            if (y >= yj && y < yi) {
                if (where === 0) return true; // on edge
                if (where > 0) {
                    if (y === yj) {
                        // Ray passes exactly through vertex j; only toggle when the
                        // previous vertex is below, to avoid double-counting.
                        if (y > vertices[(j === 0 ? n - 1 : j - 1) * 2 + 1]) inside = !inside;
                    } else {
                        inside = !inside;
                    }
                }
            }
        } else if (yi < yj) {
            // Downward edge: count a crossing when the point's y is within (yi, yj].
            if (y > yi && y <= yj) {
                if (where === 0) return true; // on edge
                if (where < 0) {
                    if (y === yj) {
                        if (y < vertices[(j === 0 ? n - 1 : j - 1) * 2 + 1]) inside = !inside;
                    } else {
                        inside = !inside;
                    }
                }
            }
        } else if (y === yi && ((x >= xj && x <= xi) || (x >= xi && x <= xj))) {
            // Point lies on a horizontal edge.
            return true;
        }
    }

    return inside;
}

/**
 * Computes the area-weighted centroid (center of mass) of the polygon.
 * For a degenerate (zero-area) polygon this falls back to the average of the
 * vertices.
 *
 * @param out the vector to store the centroid
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns out
 */
export function centroid(out: Vec2, vertices: readonly number[], n: number): Vec2 {
    let cx = 0;
    let cy = 0;
    let a2 = 0; // twice the signed area

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = vertices[i * 2];
        const yi = vertices[i * 2 + 1];
        const xj = vertices[j * 2];
        const yj = vertices[j * 2 + 1];
        const cross = xj * yi - xi * yj;
        a2 += cross;
        cx += (xj + xi) * cross;
        cy += (yj + yi) * cross;
    }

    if (a2 === 0) {
        // Degenerate polygon (collinear vertices): use the vertex average.
        let sx = 0;
        let sy = 0;
        for (let i = 0; i < n; i++) {
            sx += vertices[i * 2];
            sy += vertices[i * 2 + 1];
        }
        out[0] = sx / n;
        out[1] = sy / n;
        return out;
    }

    const inv = 1 / (3 * a2);
    out[0] = cx * inv;
    out[1] = cy * inv;
    return out;
}

/**
 * Returns the perimeter (sum of edge lengths) of the polygon.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns the perimeter
 */
export function perimeter(vertices: readonly number[], n: number): number {
    let total = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const dx = vertices[i * 2] - vertices[j * 2];
        const dy = vertices[i * 2 + 1] - vertices[j * 2 + 1];
        total += Math.sqrt(dx * dx + dy * dy);
    }
    return total;
}

/**
 * Returns the winding order of the polygon from the sign of its signed area:
 * `1` for counter-clockwise, `-1` for clockwise, and `0` for a degenerate
 * (zero-area) polygon.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns 1 (CCW), -1 (CW), or 0 (degenerate)
 */
export function winding(vertices: readonly number[], n: number): number {
    const a = signedArea(vertices, n);
    if (a > 0) return 1;
    if (a < 0) return -1;
    return 0;
}

/**
 * Tests whether the polygon is convex. Works for both winding orders. Assumes a
 * simple (non-self-intersecting) polygon; collinear vertices are allowed.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns true if the polygon is convex
 */
export function isConvex(vertices: readonly number[], n: number): boolean {
    if (n < 3) return false;

    let sign = 0;
    for (let i = 0; i < n; i++) {
        const p = ((i - 1 + n) % n) * 2;
        const c = i * 2;
        const q = ((i + 1) % n) * 2;

        // Cross product of the incoming and outgoing edges at vertex i.
        const ax = vertices[c] - vertices[p];
        const ay = vertices[c + 1] - vertices[p + 1];
        const bx = vertices[q] - vertices[c];
        const by = vertices[q + 1] - vertices[c + 1];
        const cross = ax * by - ay * bx;

        if (cross !== 0) {
            const s = cross > 0 ? 1 : -1;
            if (sign === 0) sign = s;
            else if (s !== sign) return false;
        }
    }

    return true;
}

/**
 * Tests whether vertex `i` is a reflex (concave) vertex of the polygon — the
 * interior angle at that vertex exceeds 180°. Assumes the polygon is wound
 * counter-clockwise and that `0 <= i < n`.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @param i index of the vertex to test
 * @returns true if vertex `i` is reflex
 */
export function isReflexVertex(vertices: readonly number[], n: number, i: number): boolean {
    const p = ((i - 1 + n) % n) * 2;
    const c = i * 2;
    const q = ((i + 1) % n) * 2;

    // Cross product of the incoming and outgoing edges; negative = right turn = reflex (CCW).
    const ax = vertices[c] - vertices[p];
    const ay = vertices[c + 1] - vertices[p + 1];
    const bx = vertices[q] - vertices[c];
    const by = vertices[q + 1] - vertices[c + 1];
    return ax * by - ay * bx < 0;
}

/**
 * Reverses the winding order of the polygon, writing the result into `out`.
 * `out` may be the same array as `vertices` to reverse in place.
 *
 * @param out the array to write the reversed polygon into
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns out
 */
export function reverse(out: number[], vertices: readonly number[], n: number): number[] {
    for (let lo = 0, hi = n - 1; lo < hi; lo++, hi--) {
        const x = vertices[lo * 2];
        const y = vertices[lo * 2 + 1];
        out[lo * 2] = vertices[hi * 2];
        out[lo * 2 + 1] = vertices[hi * 2 + 1];
        out[hi * 2] = x;
        out[hi * 2 + 1] = y;
    }
    // Copy the untouched middle vertex when writing to a different buffer.
    if (out !== vertices && n % 2 === 1) {
        const mid = (n >> 1) * 2;
        out[mid] = vertices[mid];
        out[mid + 1] = vertices[mid + 1];
    }
    return out;
}

/**
 * Writes the axis-aligned bounding box of the polygon into `out` as a Box2
 * `[minX, minY, maxX, maxY]`.
 *
 * @param out the box to store the result
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns out
 */
export function bounds(out: Box2, vertices: readonly number[], n: number): Box2 {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < n; i++) {
        const x = vertices[i * 2];
        const y = vertices[i * 2 + 1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    out[0] = minX;
    out[1] = minY;
    out[2] = maxX;
    out[3] = maxY;
    return out;
}

/**
 * Finds the point on the polygon's boundary closest to `point` and writes it to
 * `out`. `point` may lie inside, outside, or on the polygon; the result is
 * always on an edge.
 *
 * @param out the vector to store the closest point
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @param point the query point
 * @returns out
 */
export function closestPoint(out: Vec2, vertices: readonly number[], n: number, point: RVec2): Vec2 {
    const px = point[0];
    const py = point[1];
    let bestDistSq = Number.POSITIVE_INFINITY;
    let bestX = px;
    let bestY = py;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const ax = vertices[j * 2];
        const ay = vertices[j * 2 + 1];
        const abx = vertices[i * 2] - ax;
        const aby = vertices[i * 2 + 1] - ay;

        // Project the point onto edge (a -> b), clamped to the segment.
        const d = abx * abx + aby * aby;
        let t = d > 0 ? ((px - ax) * abx + (py - ay) * aby) / d : 0;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;

        const cx = ax + t * abx;
        const cy = ay + t * aby;
        const dx = px - cx;
        const dy = py - cy;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
            bestDistSq = distSq;
            bestX = cx;
            bestY = cy;
        }
    }

    out[0] = bestX;
    out[1] = bestY;
    return out;
}

/**
 * Returns the distance from `point` to the polygon's boundary, signed so that
 * points inside the polygon get a negative distance and points outside get a
 * positive one.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @param point the query point
 * @returns the signed distance (negative inside, positive outside)
 */
export function signedDistance(vertices: readonly number[], n: number, point: RVec2): number {
    const px = point[0];
    const py = point[1];
    let bestDistSq = Number.POSITIVE_INFINITY;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const ax = vertices[j * 2];
        const ay = vertices[j * 2 + 1];
        const abx = vertices[i * 2] - ax;
        const aby = vertices[i * 2 + 1] - ay;

        const d = abx * abx + aby * aby;
        let t = d > 0 ? ((px - ax) * abx + (py - ay) * aby) / d : 0;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;

        const dx = px - (ax + t * abx);
        const dy = py - (ay + t * aby);
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) bestDistSq = distSq;
    }

    const dist = Math.sqrt(bestDistSq);
    return containsPoint(vertices, n, point) ? -dist : dist;
}

const _projA: [number, number] = [0, 0];
const _projB: [number, number] = [0, 0];

/** Projects a polygon onto the axis (nx, ny), storing [min, max] in `out`. */
function projectOntoAxis(out: [number, number], nx: number, ny: number, vertices: readonly number[], n: number): void {
    let min = nx * vertices[0] + ny * vertices[1];
    let max = min;
    for (let i = 1; i < n; i++) {
        const d = nx * vertices[i * 2] + ny * vertices[i * 2 + 1];
        if (d < min) min = d;
        else if (d > max) max = d;
    }
    out[0] = min;
    out[1] = max;
}

/** Returns true if the two polygons are separated along any edge normal of A. */
function separatedByEdgesOf(verticesA: readonly number[], numA: number, verticesB: readonly number[], numB: number): boolean {
    for (let i = 0, j = numA - 1; i < numA; j = i++) {
        // Normal of edge (a -> b); orientation does not matter for separation.
        const nx = verticesA[i * 2 + 1] - verticesA[j * 2 + 1];
        const ny = -(verticesA[i * 2] - verticesA[j * 2]);

        projectOntoAxis(_projA, nx, ny, verticesA, numA);
        projectOntoAxis(_projB, nx, ny, verticesB, numB);

        if (_projA[0] > _projB[1] || _projB[0] > _projA[1]) return true;
    }
    return false;
}

/**
 * Tests whether two convex polygons overlap, using the separating axis theorem.
 * Both polygons must be convex; results are undefined for concave input.
 * Polygons that touch along an edge or vertex are considered overlapping.
 *
 * @param verticesA vertices of the first polygon `[x0, y0, x1, y1, ...]`
 * @param numA number of vertices in the first polygon
 * @param verticesB vertices of the second polygon `[x0, y0, x1, y1, ...]`
 * @param numB number of vertices in the second polygon
 * @returns true if the polygons overlap
 */
export function overlapConvex(verticesA: readonly number[], numA: number, verticesB: readonly number[], numB: number): boolean {
    if (separatedByEdgesOf(verticesA, numA, verticesB, numB)) return false;
    if (separatedByEdgesOf(verticesB, numB, verticesA, numA)) return false;
    return true;
}

/**
 * Tests whether the segment `a`-`b` intersects the polygon, i.e. it has an
 * endpoint inside the polygon or crosses one of its edges. Works for convex and
 * concave polygons.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @param a start of the segment
 * @param b end of the segment
 * @returns true if the segment intersects the polygon
 */
export function intersectsSegment(vertices: readonly number[], n: number, a: RVec2, b: RVec2): boolean {
    if (containsPoint(vertices, n, a) || containsPoint(vertices, n, b)) return true;

    const ax = a[0];
    const ay = a[1];
    const abx = b[0] - ax;
    const aby = b[1] - ay;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const cx = vertices[j * 2];
        const cy = vertices[j * 2 + 1];
        const dx = vertices[i * 2];
        const dy = vertices[i * 2 + 1];

        // Proper segment intersection via perp products (sign-of-area test).
        const a1 = abx * (dy - ay) - aby * (dx - ax); // (b-a) x (d-a)
        const a2 = abx * (cy - ay) - aby * (cx - ax); // (b-a) x (c-a)
        if (a1 * a2 < 0) {
            const cdx = dx - cx;
            const cdy = dy - cy;
            const a3 = cdx * (ay - cy) - cdy * (ax - cx); // (d-c) x (a-c)
            const a4 = a3 + a2 - a1;
            if (a3 * a4 < 0) return true;
        }
    }

    return false;
}
