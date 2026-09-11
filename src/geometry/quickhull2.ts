const EPSILON = 1e-10;

/**
 * Computes the convex hull of a set of 2D points using the QuickHull algorithm.
 * The hull is returned as an array of indices in counter-clockwise order.
 *
 * Implementation of pseudocode from: https://en.wikipedia.org/wiki/Quickhull
 *
 * @param points flat array of 2D points: [x0, y0, x1, y1, ...]
 * @returns indices of hull vertices in ccw order
 */
export function quickhull2(points: readonly number[]): number[] {
    const n = Math.floor(points.length / 2);
    if (n < 3) return Array.from({ length: n }, (_, i) => i);

    // find left and right most points
    let leftIdx = 0;
    let rightIdx = 0;
    let minX = points[0];
    let maxX = points[0];

    for (let i = 1; i < n; i++) {
        const x = points[i * 2];
        if (x < minX) {
            minX = x;
            leftIdx = i;
        }
        if (x > maxX) {
            maxX = x;
            rightIdx = i;
        }
    }

    if (Math.abs(maxX - minX) < EPSILON) return [leftIdx];

    // convex Hull starts with A and B
    const hull: number[] = [];

    // partition points into S1 and S2
    // S1 = points on the right side of oriented line from A to B
    // S2 = points on the right side of oriented line from B to A
    const s1: number[] = [];
    const s2: number[] = [];

    for (let i = 0; i < n; i++) {
        if (i === leftIdx || i === rightIdx) continue;

        const side = crossProduct(points, leftIdx, rightIdx, i);

        // positive = left side of A→B = right side of B→A
        // negative = right side of A→B = left side of B→A
        if (side > EPSILON) {
            s2.push(i); // left of A→B is right of B→A
        } else if (side < -EPSILON) {
            s1.push(i); // right of A→B
        }
    }

    // build hull: start with leftmost, process upper hull, add rightmost, process lower hull
    hull.push(leftIdx);
    findHull(points, s1, leftIdx, rightIdx, hull);
    hull.push(rightIdx);
    findHull(points, s2, rightIdx, leftIdx, hull);

    return hull;
}

/**
 * Finds points on convex hull from set Sk that are on the right side of oriented line from P to Q.
 * Points are inserted into hull array at the end (before the final endpoint).
 */
function findHull(points: readonly number[], sk: readonly number[], p: number, q: number, hull: number[]): void {
    if (sk.length === 0) return;

    // find farthest point C from segment PQ
    let maxIdx = -1;
    let maxDist = -1;

    for (const idx of sk) {
        const dist = Math.abs(crossProduct(points, p, q, idx));
        if (dist > maxDist) {
            maxDist = dist;
            maxIdx = idx;
        }
    }

    if (maxIdx === -1) return;

    // partition remaining points into S1 and S2
    // S1 = points on right side of oriented line from P to C
    // S2 = points on right side of oriented line from C to Q
    // S0 = points inside triangle PCQ (discarded)
    const s1: number[] = [];
    const s2: number[] = [];

    for (const idx of sk) {
        if (idx === maxIdx) continue;

        const sidePC = crossProduct(points, p, maxIdx, idx);
        const sideCQ = crossProduct(points, maxIdx, q, idx);

        // point is on right of P→C if cross product is negative
        if (sidePC < -EPSILON) {
            s1.push(idx);
        }
        // point is on right of C→Q if cross product is negative
        else if (sideCQ < -EPSILON) {
            s2.push(idx);
        }
        // else: point is inside triangle PCQ, discard it
    }

    // recursively process the two subsets
    findHull(points, s1, p, maxIdx, hull);
    hull.push(maxIdx); // Add point C to hull between P and Q
    findHull(points, s2, maxIdx, q, hull);
}

/**
 * Cross product to determine orientation.
 * Returns (p2 - p1) × (p3 - p1)
 * > 0: p3 is on the left of line p1→p2 (counter-clockwise)
 * < 0: p3 is on the right of line p1→p2 (clockwise)
 * = 0: collinear
 */
function crossProduct(points: readonly number[], p1: number, p2: number, p3: number): number {
    const x1 = points[p1 * 2];
    const y1 = points[p1 * 2 + 1];
    const x2 = points[p2 * 2];
    const y2 = points[p2 * 2 + 1];
    const x3 = points[p3 * 2];
    const y3 = points[p3 * 2 + 1];

    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
}
