import { signedArea } from '../shapes/polygon2';

/*
 * Polygon triangulation (ear clipping)
 *
 * Triangulates a simple (non-self-intersecting) polygon into a fan of
 * triangles, emitting triangle indices into the input vertex array. No new
 * vertices are introduced.
 *
 * based on the algorithm from Joseph O'Rourke's "Computational Geometry in C").
 * Uses the standard high-bit ear-mark trick on the working index list to stay allocation-light.
 */

// The working index list packs an "is-ear" flag into the high bit of each entry;
// the low bits hold the actual vertex index.
const IDX_MASK = 0x0fffffff;
const EAR_FLAG = 0x80000000;

const nextIdx = (i: number, n: number): number => (i + 1 < n ? i + 1 : 0);
const prevIdx = (i: number, n: number): number => (i - 1 >= 0 ? i - 1 : n - 1);

/** Twice the signed area of triangle (a, b, c); positive when counter-clockwise. */
function area2(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
    return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
}

function collinear(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
    return area2(ax, ay, bx, by, cx, cy) === 0;
}

/** True if segments (a,b) and (c,d) properly cross (no collinear/endpoint contact). */
function intersectProp(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
    if (
        collinear(ax, ay, bx, by, cx, cy) ||
        collinear(ax, ay, bx, by, dx, dy) ||
        collinear(cx, cy, dx, dy, ax, ay) ||
        collinear(cx, cy, dx, dy, bx, by)
    ) {
        return false;
    }
    const l1 = area2(ax, ay, bx, by, cx, cy) < 0;
    const l2 = area2(ax, ay, bx, by, dx, dy) < 0;
    const l3 = area2(cx, cy, dx, dy, ax, ay) < 0;
    const l4 = area2(cx, cy, dx, dy, bx, by) < 0;
    return l1 !== l2 && l3 !== l4;
}

/** True if point c lies on the closed segment (a,b), assuming the three are collinear. */
function between(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
    if (!collinear(ax, ay, bx, by, cx, cy)) return false;
    if (ax !== bx) return (ax <= cx && cx <= bx) || (ax >= cx && cx >= bx);
    return (ay <= cy && cy <= by) || (ay >= cy && cy >= by);
}

/** True if segments (a,b) and (c,d) intersect, including collinear/endpoint contact. */
function intersectSeg(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
    if (intersectProp(ax, ay, bx, by, cx, cy, dx, dy)) return true;
    return (
        between(ax, ay, bx, by, cx, cy) ||
        between(ax, ay, bx, by, dx, dy) ||
        between(cx, cy, dx, dy, ax, ay) ||
        between(cx, cy, dx, dy, bx, by)
    );
}

/** X of the original vertex referenced by working slot `s`. */
const vX = (vertices: readonly number[], indices: readonly number[], s: number): number => vertices[(indices[s] & IDX_MASK) * 2];
/** Y of the original vertex referenced by working slot `s`. */
const vY = (vertices: readonly number[], indices: readonly number[], s: number): number =>
    vertices[(indices[s] & IDX_MASK) * 2 + 1];

/**
 * True if the segment between working slots `i` and `j` does not intersect any
 * polygon edge. `loose` uses proper-intersection only (tolerating collinear
 * contact), used as a fallback when no strict ear can be found.
 */
function diagonalie(
    i: number,
    j: number,
    n: number,
    vertices: readonly number[],
    indices: readonly number[],
    loose: boolean,
): boolean {
    const d0x = vX(vertices, indices, i);
    const d0y = vY(vertices, indices, i);
    const d1x = vX(vertices, indices, j);
    const d1y = vY(vertices, indices, j);

    for (let k = 0; k < n; k++) {
        const k1 = nextIdx(k, n);
        if (k === i || k1 === i || k === j || k1 === j) continue;

        const e0x = vX(vertices, indices, k);
        const e0y = vY(vertices, indices, k);
        const e1x = vX(vertices, indices, k1);
        const e1y = vY(vertices, indices, k1);

        // Ignore edges that share an endpoint with the diagonal.
        if (
            (d0x === e0x && d0y === e0y) ||
            (d1x === e0x && d1y === e0y) ||
            (d0x === e1x && d0y === e1y) ||
            (d1x === e1x && d1y === e1y)
        ) {
            continue;
        }

        const hit = loose
            ? intersectProp(d0x, d0y, d1x, d1y, e0x, e0y, e1x, e1y)
            : intersectSeg(d0x, d0y, d1x, d1y, e0x, e0y, e1x, e1y);
        if (hit) return false;
    }
    return true;
}

/** True if the diagonal from slot `i` to slot `j` stays inside the cone at vertex `i`. */
function inCone(
    i: number,
    j: number,
    n: number,
    vertices: readonly number[],
    indices: readonly number[],
    loose: boolean,
): boolean {
    const ax = vX(vertices, indices, i);
    const ay = vY(vertices, indices, i);
    const bx = vX(vertices, indices, j);
    const by = vY(vertices, indices, j);

    const ni = nextIdx(i, n);
    const pi = prevIdx(i, n);
    const nx = vX(vertices, indices, ni);
    const ny = vY(vertices, indices, ni);
    const px = vX(vertices, indices, pi);
    const py = vY(vertices, indices, pi);

    // Convex cone vertex: prev is left-on of (cone -> next).
    if (area2(px, py, ax, ay, nx, ny) <= 0) {
        const c1 = area2(ax, ay, bx, by, px, py); // (cone, test, prev)
        const c2 = area2(bx, by, ax, ay, nx, ny); // (test, cone, next)
        return loose ? c1 <= 0 && c2 <= 0 : c1 < 0 && c2 < 0;
    }
    // Reflex cone vertex.
    return !(area2(ax, ay, bx, by, nx, ny) <= 0 && area2(bx, by, ax, ay, px, py) <= 0);
}

function diagonal(
    i: number,
    j: number,
    n: number,
    vertices: readonly number[],
    indices: readonly number[],
    loose: boolean,
): boolean {
    return inCone(i, j, n, vertices, indices, loose) && diagonalie(i, j, n, vertices, indices, loose);
}

/**
 * Triangulates a simple polygon by ear clipping, writing triangle indices into
 * `out` as `[i0, i1, i2, i3, i4, i5, ...]`, where each index refers to a vertex
 * of the input polygon. Either winding is accepted (normalised internally).
 *
 * `out` must have room for at least `3 * (n - 2)` indices. A complete
 * triangulation returns exactly `n - 2` triangles; a smaller count indicates
 * the polygon could not be fully triangulated (e.g. degenerate input).
 *
 * @param out output array of triangle indices
 * @param vertices polygon vertices as a flat array `[x0, y0, x1, y1, ...]`
 * @param n number of vertices to read from `vertices`
 * @returns the number of triangles written
 */
export function triangulatePolygon2(out: number[], vertices: readonly number[], n: number): number {
    if (n < 3) return 0;

    // Order the working list so the resolved polygon winds clockwise, which is
    // what this ear-clipping formulation expects. The stored values are original
    // vertex indices, so emitted triangles refer back to the caller's vertices
    // regardless of input winding.
    const ccw = signedArea(vertices, n) >= 0;
    const indices = new Array<number>(n);
    for (let i = 0; i < n; i++) indices[i] = ccw ? n - 1 - i : i;

    let ntris = 0;
    let dst = 0;

    // Mark removable ears.
    for (let i = 0; i < n; i++) {
        const i1 = nextIdx(i, n);
        if (diagonal(i, nextIdx(i1, n), n, vertices, indices, false)) indices[i1] |= EAR_FLAG;
    }

    let nv = n;
    while (nv > 3) {
        let minLen = -1;
        let mini = -1;

        // Clip the shortest available ear for well-shaped triangles.
        for (let i = 0; i < nv; i++) {
            const i1 = nextIdx(i, nv);
            if (indices[i1] & EAR_FLAG) {
                const p0 = indices[i] & IDX_MASK;
                const p2 = indices[nextIdx(i1, nv)] & IDX_MASK;
                const dx = vertices[p2 * 2] - vertices[p0 * 2];
                const dy = vertices[p2 * 2 + 1] - vertices[p0 * 2 + 1];
                const len = dx * dx + dy * dy;
                if (minLen < 0 || len < minLen) {
                    minLen = len;
                    mini = i;
                }
            }
        }

        if (mini === -1) {
            // No strict ear: retry with the loose diagonal test.
            for (let i = 0; i < nv; i++) {
                const i1 = nextIdx(i, nv);
                const i2 = nextIdx(i1, nv);
                if (diagonal(i, i2, nv, vertices, indices, true)) {
                    const p0 = indices[i] & IDX_MASK;
                    const p2 = indices[nextIdx(i2, nv)] & IDX_MASK;
                    const dx = vertices[p2 * 2] - vertices[p0 * 2];
                    const dy = vertices[p2 * 2 + 1] - vertices[p0 * 2 + 1];
                    const len = dx * dx + dy * dy;
                    if (minLen < 0 || len < minLen) {
                        minLen = len;
                        mini = i;
                    }
                }
            }
            if (mini === -1) return ntris; // give up on degenerate input
        }

        const i = mini;
        let i1 = nextIdx(i, nv);
        const i2 = nextIdx(i1, nv);

        out[dst++] = indices[i] & IDX_MASK;
        out[dst++] = indices[i1] & IDX_MASK;
        out[dst++] = indices[i2] & IDX_MASK;
        ntris++;

        // Remove the clipped vertex (slot i1) and re-evaluate its neighbours.
        nv--;
        for (let k = i1; k < nv; k++) indices[k] = indices[k + 1];
        if (i1 >= nv) i1 = 0;
        const iPrev = prevIdx(i1, nv);

        if (diagonal(prevIdx(iPrev, nv), i1, nv, vertices, indices, false)) indices[iPrev] |= EAR_FLAG;
        else indices[iPrev] &= IDX_MASK;

        if (diagonal(iPrev, nextIdx(i1, nv), nv, vertices, indices, false)) indices[i1] |= EAR_FLAG;
        else indices[i1] &= IDX_MASK;
    }

    // The final remaining triangle.
    out[dst++] = indices[0] & IDX_MASK;
    out[dst++] = indices[1] & IDX_MASK;
    out[dst++] = indices[2] & IDX_MASK;
    ntris++;

    return ntris;
}
