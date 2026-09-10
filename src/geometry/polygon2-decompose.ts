import { isReflexVertex, reverse, signedArea } from '../shapes/polygon2';

/*
 * Convex decomposition
 *
 * Splits a simple (non-self-intersecting) polygon into convex sub-polygons.
 * Polygons use the flat `[x0, y0, x1, y1, ...]` representation from math/shapes
 * (polygon2), with an explicit vertex count `n`.
 *
 * Ported to the flat representation from poly-decomp-es
 * (https://github.com/pmndrs/poly-decomp-es), MIT licensed, which itself is
 * based on Mark Bayazit's algorithm. Each returned sub-polygon is a fresh flat
 * `[x0, y0, ...]` array, wound counter-clockwise.
 */

const _decompIsect: [number, number] = [0, 0];

/**
 * Twice the signed area of the triangle (a, b, c); positive when
 * counter-clockwise. This is the inlined, coordinate-form counterpart of
 * `triangle2.signedArea` — kept local (and undivided) to avoid Vec2 allocations
 * in the hot decomposition loops, where only the sign and relative magnitude
 * matter.
 */
function triArea(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
    return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
}

/** True if vertex `i` is reflex; delegates to the shared polygon2 primitive. */
function isReflex(poly: readonly number[], i: number): boolean {
    return isReflexVertex(poly, poly.length >> 1, i);
}

function sqDist(ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
}

/** Intersection point of the two infinite lines (p1,p2) and (q1,q2); writes [0,0] if parallel. */
function lineIntersection(
    out: [number, number],
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    q1x: number,
    q1y: number,
    q2x: number,
    q2y: number,
): [number, number] {
    const a1 = p2y - p1y;
    const b1 = p1x - p2x;
    const c1 = a1 * p1x + b1 * p1y;
    const a2 = q2y - q1y;
    const b2 = q1x - q2x;
    const c2 = a2 * q1x + b2 * q1y;
    const det = a1 * b2 - a2 * b1;
    if (det !== 0) {
        out[0] = (b2 * c1 - b1 * c2) / det;
        out[1] = (a1 * c2 - a2 * c1) / det;
    } else {
        out[0] = 0;
        out[1] = 0;
    }
    return out;
}

/**
 * True if the closed segments (p1,p2) and (q1,q2) intersect. Inlined,
 * coordinate-form counterpart of `segment2.intersects`, kept local to avoid
 * Vec2 allocations in the visibility loops. Division-free: instead of computing
 * the parameters `u = numU/denom` and `v = numV/denom`, it normalises the sign
 * of `denom` and range-checks the numerators, which avoids two divisions per
 * call in the hot visibility loop.
 */
function segmentsIntersect(
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    q1x: number,
    q1y: number,
    q2x: number,
    q2y: number,
): boolean {
    const rx = p2x - p1x;
    const ry = p2y - p1y;
    const ex = q2x - q1x;
    const ey = q2y - q1y;

    let denom = rx * ey - ry * ex;
    if (denom === 0) return false; // parallel or collinear

    const wx = q1x - p1x;
    const wy = q1y - p1y;
    let numU = wx * ey - wy * ex; // u = numU / denom
    let numV = wx * ry - wy * rx; // v = numV / denom

    // Make denom positive so the [0,1] range test is a plain comparison.
    if (denom < 0) {
        denom = -denom;
        numU = -numU;
        numV = -numV;
    }

    return numU >= 0 && numU <= denom && numV >= 0 && numV <= denom;
}

/** Appends vertices `from..to-1` of `src` onto `dst` (both flat arrays). */
function appendRange(dst: number[], src: readonly number[], from: number, to: number): void {
    for (let k = from; k < to; k++) {
        dst.push(src[k * 2], src[k * 2 + 1]);
    }
}

/** Copies vertices `i..j` (cyclic) of `poly` into a new flat polygon. */
function polygonCopy(poly: readonly number[], i: number, j: number): number[] {
    const s = poly.length >> 1;
    const out: number[] = [];
    if (i < j) {
        for (let k = i; k <= j; k++) out.push(poly[k * 2], poly[k * 2 + 1]);
    } else {
        for (let k = 0; k <= j; k++) out.push(poly[k * 2], poly[k * 2 + 1]);
        for (let k = i; k < s; k++) out.push(poly[k * 2], poly[k * 2 + 1]);
    }
    return out;
}

/** Writes a CCW copy of the first `n` vertices of `vertices` into `out`, reversing if needed. */
function toCCW(out: number[], vertices: readonly number[], n: number): number[] {
    for (let k = 0; k < n * 2; k++) out[k] = vertices[k];
    if (signedArea(out, n) < 0) reverse(out, out, n);
    return out;
}

const QUICK_DECOMP_MAX_LEVEL = 100;

/** True if vertices `a` and `b` can see each other without any edge blocking (segment test). */
function canSeeSegment(poly: readonly number[], a: number, b: number): boolean {
    const s = poly.length >> 1;
    const ax = poly[a * 2];
    const ay = poly[a * 2 + 1];
    const bx = poly[b * 2];
    const by = poly[b * 2 + 1];

    for (let i = 0; i < s; i++) {
        const i1 = i + 1 === s ? 0 : i + 1;
        if (i === a || i === b || i1 === a || i1 === b) continue;
        if (segmentsIntersect(ax, ay, bx, by, poly[i * 2], poly[i * 2 + 1], poly[i1 * 2], poly[i1 * 2 + 1])) {
            return false;
        }
    }
    return true;
}

/**
 * Decomposes a simple polygon into convex sub-polygons using Bayazit's fast
 * approximate algorithm. Fast (~O(n²)) but may use more pieces than the
 * minimum; may introduce new (Steiner) vertices. Input winding is normalised
 * internally, so either winding is accepted.
 *
 * Implemented iteratively with an explicit worklist of sub-polygons rather than
 * recursion.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns an array of convex sub-polygons, each a flat `[x0, y0, ...]` array (CCW)
 */
export function decomposePolygon2Quick(vertices: readonly number[], n: number): number[][] {
    if (n < 3) return [];

    const out: number[][] = [];
    // Sub-polygons still to decompose, each paired with its depth in `levels`
    // (a runaway guard for pathological input). Both stacks stay in lockstep.
    const stack: number[][] = [toCCW([], vertices, n)];
    const levels: number[] = [0];

    while (stack.length > 0) {
        const poly = stack.pop() as number[];
        const level = levels.pop() as number;
        const s = poly.length >> 1;

        if (s < 3) continue;
        if (level > QUICK_DECOMP_MAX_LEVEL) {
            out.push(poly);
            continue;
        }

        // Find the first reflex vertex and split there; a poly with none is convex.
        let handled = false;
        for (let i = 0; i < s; i++) {
            if (!isReflexVertex(poly, s, i)) continue;

            const ip = i === 0 ? s - 1 : i - 1;
            const iN = i + 1 === s ? 0 : i + 1;
            const iPrevX = poly[ip * 2];
            const iPrevY = poly[ip * 2 + 1];
            const iCurX = poly[i * 2];
            const iCurY = poly[i * 2 + 1];
            const iNextX = poly[iN * 2];
            const iNextY = poly[iN * 2 + 1];

            let lowerDist = Number.MAX_VALUE;
            let upperDist = Number.MAX_VALUE;
            let lowerIntX = 0;
            let lowerIntY = 0;
            let upperIntX = 0;
            let upperIntY = 0;
            let lowerIndex = 0;
            let upperIndex = 0;

            for (let j = 0; j < s; j++) {
                const jx = poly[j * 2];
                const jy = poly[j * 2 + 1];

                // Lower: edge (j-1, j) crossing the ray from i-1 through i. Read the
                // (j-1) neighbour only once the cheaper j-side test has passed.
                if (triArea(iPrevX, iPrevY, iCurX, iCurY, jx, jy) > 0) {
                    const jm = j === 0 ? s - 1 : j - 1;
                    const jmx = poly[jm * 2];
                    const jmy = poly[jm * 2 + 1];
                    if (triArea(iPrevX, iPrevY, iCurX, iCurY, jmx, jmy) <= 0) {
                        lineIntersection(_decompIsect, iPrevX, iPrevY, iCurX, iCurY, jx, jy, jmx, jmy);
                        const px = _decompIsect[0];
                        const py = _decompIsect[1];
                        if (triArea(iNextX, iNextY, iCurX, iCurY, px, py) < 0) {
                            const d = sqDist(iCurX, iCurY, px, py);
                            if (d < lowerDist) {
                                lowerDist = d;
                                lowerIntX = px;
                                lowerIntY = py;
                                lowerIndex = j;
                            }
                        }
                    }
                }

                // Upper: edge (j, j+1) crossing the ray from i+1 through i. Read the
                // (j+1) neighbour only once the cheaper j-side test has passed.
                if (triArea(iNextX, iNextY, iCurX, iCurY, jx, jy) <= 0) {
                    const jp = j + 1 === s ? 0 : j + 1;
                    const jpx = poly[jp * 2];
                    const jpy = poly[jp * 2 + 1];
                    if (triArea(iNextX, iNextY, iCurX, iCurY, jpx, jpy) > 0) {
                        lineIntersection(_decompIsect, iNextX, iNextY, iCurX, iCurY, jx, jy, jpx, jpy);
                        const px = _decompIsect[0];
                        const py = _decompIsect[1];
                        if (triArea(iPrevX, iPrevY, iCurX, iCurY, px, py) > 0) {
                            const d = sqDist(iCurX, iCurY, px, py);
                            if (d < upperDist) {
                                upperDist = d;
                                upperIntX = px;
                                upperIntY = py;
                                upperIndex = j;
                            }
                        }
                    }
                }
            }

            const lowerPoly: number[] = [];
            const upperPoly: number[] = [];

            if (lowerIndex === (upperIndex + 1) % s) {
                // No vertex to connect to: add a Steiner point between the two intersections.
                const px = (lowerIntX + upperIntX) / 2;
                const py = (lowerIntY + upperIntY) / 2;

                if (i < upperIndex) {
                    appendRange(lowerPoly, poly, i, upperIndex + 1);
                    lowerPoly.push(px, py);
                    upperPoly.push(px, py);
                    if (lowerIndex !== 0) appendRange(upperPoly, poly, lowerIndex, s);
                    appendRange(upperPoly, poly, 0, i + 1);
                } else {
                    if (i !== 0) appendRange(lowerPoly, poly, i, s);
                    appendRange(lowerPoly, poly, 0, upperIndex + 1);
                    lowerPoly.push(px, py);
                    upperPoly.push(px, py);
                    appendRange(upperPoly, poly, lowerIndex, i + 1);
                }
            } else {
                // Connect to the closest visible vertex within the cone.
                if (lowerIndex > upperIndex) upperIndex += s;

                // Degenerate split: drop this sub-polygon.
                if (upperIndex < lowerIndex) {
                    handled = true;
                    break;
                }

                let closestDist = Number.MAX_VALUE;
                let closestIndex = 0;
                for (let j = lowerIndex; j <= upperIndex; j++) {
                    const jj = j >= s ? j - s : j;
                    const jx = poly[jj * 2];
                    const jy = poly[jj * 2 + 1];
                    if (
                        triArea(iPrevX, iPrevY, iCurX, iCurY, jx, jy) >= 0 &&
                        triArea(iNextX, iNextY, iCurX, iCurY, jx, jy) <= 0
                    ) {
                        const d = sqDist(iCurX, iCurY, jx, jy);
                        if (d < closestDist && canSeeSegment(poly, i, jj)) {
                            closestDist = d;
                            closestIndex = jj;
                        }
                    }
                }

                if (i < closestIndex) {
                    appendRange(lowerPoly, poly, i, closestIndex + 1);
                    if (closestIndex !== 0) appendRange(upperPoly, poly, closestIndex, s);
                    appendRange(upperPoly, poly, 0, i + 1);
                } else {
                    if (i !== 0) appendRange(lowerPoly, poly, i, s);
                    appendRange(lowerPoly, poly, 0, closestIndex + 1);
                    appendRange(upperPoly, poly, closestIndex, i + 1);
                }
            }

            // Queue both sub-polygons, smaller first: push the larger, then the
            // smaller, so the smaller is popped and processed next.
            if (lowerPoly.length < upperPoly.length) {
                stack.push(upperPoly, lowerPoly);
            } else {
                stack.push(lowerPoly, upperPoly);
            }
            levels.push(level + 1, level + 1);
            handled = true;
            break;
        }

        if (!handled) out.push(poly);
    }

    return out;
}

/** True if vertices `a` and `b` can see each other (visibility test, used by the quality decomposition). */
function canSeeVisibility(poly: readonly number[], a: number, b: number): boolean {
    const s = poly.length >> 1;
    const ax = poly[a * 2];
    const ay = poly[a * 2 + 1];
    const bx = poly[b * 2];
    const by = poly[b * 2 + 1];

    const an = a + 1 === s ? 0 : a + 1;
    const ap = a === 0 ? s - 1 : a - 1;
    // Reject `b` if it lies outside the cone at vertex `a`.
    if (
        triArea(poly[an * 2], poly[an * 2 + 1], ax, ay, bx, by) >= 0 &&
        triArea(poly[ap * 2], poly[ap * 2 + 1], ax, ay, bx, by) <= 0
    ) {
        return false;
    }

    const dist = sqDist(ax, ay, bx, by);
    for (let i = 0; i < s; i++) {
        const i1 = i + 1 === s ? 0 : i + 1;
        if (i1 === a || i === a) continue;

        const e0x = poly[i * 2];
        const e0y = poly[i * 2 + 1];
        const e1x = poly[i1 * 2];
        const e1y = poly[i1 * 2 + 1];

        if (triArea(ax, ay, bx, by, e1x, e1y) >= 0 && triArea(ax, ay, bx, by, e0x, e0y) <= 0) {
            lineIntersection(_decompIsect, ax, ay, bx, by, e0x, e0y, e1x, e1y);
            if (sqDist(ax, ay, _decompIsect[0], _decompIsect[1]) < dist) {
                return false;
            }
        }
    }

    return true;
}

/** Finds the minimal set of cut edges (as [ax, ay, bx, by]) that convex-partition the polygon. */
function getCutEdges(poly: readonly number[]): number[][] {
    const s = poly.length >> 1;
    let min: number[][] = [];
    let nDiags = Number.MAX_VALUE;

    for (let i = 0; i < s; i++) {
        if (!isReflex(poly, i)) continue;
        for (let j = 0; j < s; j++) {
            if (!canSeeVisibility(poly, i, j)) continue;

            const tmp1 = getCutEdges(polygonCopy(poly, i, j));
            const tmp2 = getCutEdges(polygonCopy(poly, j, i));
            for (let k = 0; k < tmp2.length; k++) tmp1.push(tmp2[k]);

            if (tmp1.length < nDiags) {
                min = tmp1;
                nDiags = tmp1.length;
                min.push([poly[i * 2], poly[i * 2 + 1], poly[j * 2], poly[j * 2 + 1]]);
            }
        }
    }

    return min;
}

/** Index of the vertex in `poly` with the exact coordinates (x, y), or -1. */
function indexOfVertex(poly: readonly number[], x: number, y: number): number {
    const s = poly.length >> 1;
    for (let k = 0; k < s; k++) {
        if (poly[k * 2] === x && poly[k * 2 + 1] === y) return k;
    }
    return -1;
}

/** Splits `poly` along all `cutEdges`, returning the resulting pieces. */
function sliceByEdges(poly: number[], cutEdges: number[][]): number[][] {
    if (cutEdges.length === 0) return [poly];

    const polys: number[][] = [poly];
    for (let e = 0; e < cutEdges.length; e++) {
        const edge = cutEdges[e];
        for (let p = 0; p < polys.length; p++) {
            const sub = polys[p];
            const i = indexOfVertex(sub, edge[0], edge[1]);
            const j = indexOfVertex(sub, edge[2], edge[3]);
            if (i !== -1 && j !== -1) {
                polys.splice(p, 1);
                polys.push(polygonCopy(sub, i, j), polygonCopy(sub, j, i));
                break;
            }
        }
    }

    return polys;
}

/**
 * Decomposes a simple polygon into the (near-)minimum number of convex
 * sub-polygons. Produces fewer pieces than {@link decomposePolygon2Quick} but
 * is much slower (~O(n⁴)) — use only for small polygons. Input winding is
 * normalised internally, so either winding is accepted.
 *
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns an array of convex sub-polygons, each a flat `[x0, y0, ...]` array (CCW)
 */
export function decomposePolygon2Quality(vertices: readonly number[], n: number): number[][] {
    if (n < 3) return [];
    const poly = toCCW([], vertices, n);
    const edges = getCutEdges(poly);
    if (edges.length > 0) return sliceByEdges(poly, edges);
    return [poly];
}
