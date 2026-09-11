/**
 * Incremental Convex Hull 3D implementation based on Three.js ConvexHull.
 *
 * This implements the QuickHull algorithm with an incremental approach that maintains
 * a valid hull at each step using a half-edge data structure (DCEL - Doubly Connected
 * Edge List) for O(1) face adjacency queries.
 *
 * The algorithm is based on John Lloyd's Java implementation and was ported to
 * JavaScript by Mauricio Poppe (quickhull3d), then incorporated into Three.js.
 *
 * References:
 * - Three.js ConvexHull: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/math/ConvexHull.js
 * - quickhull3d by Mauricio Poppe: https://github.com/maurizzzio/quickhull3d/
 * - Original Java by John Lloyd: http://www.cs.ubc.ca/~lloyd/java/quickhull3d.html
 * - Dirk Gregorius presentation: https://archive.org/details/GDC2014Gregorius
 *
 * Algorithm: QuickHull (incremental variant)
 * Time complexity: O(n log n) average, O(n²) worst case
 * Space complexity: O(n + f + e) where f=faces, e=edges (~3x more than basic)
 */

const EPSILON = 1e-12;
const VISIBLE = 0;
const DELETED = 1;

type VertexNode = {
    index: number;
    prev: VertexNode | null;
    next: VertexNode | null;
    face: Face | null;
};

type HalfEdge = {
    vertex: VertexNode;
    prev: HalfEdge | null;
    next: HalfEdge | null;
    twin: HalfEdge | null;
    face: Face;
};

type Face = {
    normal: [number, number, number];
    midpoint: [number, number, number];
    area: number;
    constant: number;
    outside: VertexNode | null;
    mark: number;
    edge: HalfEdge | null;
};

type VertexList = {
    head: VertexNode | null;
    tail: VertexNode | null;
};

type HullState = {
    points: readonly number[];
    tolerance: number;
    faces: Face[];
    newFaces: Face[];
    assigned: VertexList;
    unassigned: VertexList;
    vertices: VertexNode[];
};

/**
 * Computes the convex hull of a set of 3D points using an incremental QuickHull algorithm.
 *
 * @param points An array of numbers representing the 3D points (x1, y1, z1, x2, y2, z2, ...)
 * @returns An array of indices representing the triangles of the convex hull (i1, j1, k1, i2, j2, k2, ...).
 */
export function quickhull3(points: readonly number[]): number[] {
    const n = points.length / 3;
    if (n < 4) return [];

    const state = createHullState(points, n);

    computeInitialHull(state);

    // Incrementally add vertices to hull
    let vertex = nextVertexToAdd(state);
    while (vertex !== null) {
        addVertexToHull(state, vertex);
        vertex = nextVertexToAdd(state);
    }

    reindexFaces(state);

    return getTriangleIndices(state);
}

// Hull state management

function createHullState(points: readonly number[], n: number): HullState {
    const vertices: VertexNode[] = [];
    for (let i = 0; i < n; i++) {
        vertices.push(createVertexNode(i));
    }

    return {
        points,
        tolerance: -1,
        faces: [],
        newFaces: [],
        assigned: createVertexList(),
        unassigned: createVertexList(),
        vertices,
    };
}

function getTriangleIndices(state: HullState): number[] {
    const result: number[] = [];
    for (const face of state.faces) {
        if (face.mark === VISIBLE && face.edge) {
            result.push(face.edge.vertex.index, face.edge.next!.vertex.index, face.edge.prev!.vertex.index);
        }
    }
    return result;
}

// Vertex node functions

function createVertexNode(index: number): VertexNode {
    return {
        index,
        prev: null,
        next: null,
        face: null,
    };
}

// Vertex list functions

function createVertexList(): VertexList {
    return {
        head: null,
        tail: null,
    };
}

function vertexListIsEmpty(list: VertexList): boolean {
    return list.head === null;
}

function vertexListClear(list: VertexList): void {
    list.head = null;
    list.tail = null;
}

function vertexListAppend(list: VertexList, vertex: VertexNode): void {
    if (list.head === null) {
        list.head = vertex;
    } else {
        list.tail!.next = vertex;
    }

    vertex.prev = list.tail;
    vertex.next = null;
    list.tail = vertex;
}

function vertexListAppendChain(list: VertexList, vertex: VertexNode): void {
    if (list.head === null) {
        list.head = vertex;
    } else {
        list.tail!.next = vertex;
    }

    vertex.prev = list.tail;

    // Find end of chain
    let current = vertex;
    while (current.next !== null) {
        current = current.next;
    }

    list.tail = current;
}

function vertexListInsertBefore(list: VertexList, target: VertexNode, vertex: VertexNode): void {
    vertex.prev = target.prev;
    vertex.next = target;

    if (vertex.prev === null) {
        list.head = vertex;
    } else {
        vertex.prev.next = vertex;
    }

    target.prev = vertex;
}

function vertexListRemove(list: VertexList, vertex: VertexNode): void {
    if (vertex.prev === null) {
        list.head = vertex.next;
    } else {
        vertex.prev.next = vertex.next;
    }

    if (vertex.next === null) {
        list.tail = vertex.prev;
    } else {
        vertex.next.prev = vertex.prev;
    }
}

function vertexListRemoveSubList(list: VertexList, a: VertexNode, b: VertexNode): void {
    if (a.prev === null) {
        list.head = b.next;
    } else {
        a.prev.next = b.next;
    }

    if (b.next === null) {
        list.tail = a.prev;
    } else {
        b.next.prev = a.prev;
    }
}

// Half-edge functions

function createHalfEdge(vertex: VertexNode, face: Face): HalfEdge {
    return {
        vertex,
        prev: null,
        next: null,
        twin: null,
        face,
    };
}

function halfEdgeHead(edge: HalfEdge): VertexNode {
    return edge.vertex;
}

function halfEdgeTail(edge: HalfEdge): VertexNode | null {
    return edge.prev ? edge.prev.vertex : null;
}

function halfEdgeSetTwin(edge: HalfEdge, twin: HalfEdge): void {
    edge.twin = twin;
    twin.twin = edge;
}

// Face functions

function createFace(): Face {
    return {
        normal: [0, 0, 0],
        midpoint: [0, 0, 0],
        area: 0,
        constant: 0,
        outside: null,
        mark: VISIBLE,
        edge: null,
    };
}

function faceCreate(a: VertexNode, b: VertexNode, c: VertexNode): Face {
    const face = createFace();

    const e0 = createHalfEdge(a, face);
    const e1 = createHalfEdge(b, face);
    const e2 = createHalfEdge(c, face);

    // Join edges in a cycle
    e0.next = e1;
    e0.prev = e2;
    e1.next = e2;
    e1.prev = e0;
    e2.next = e0;
    e2.prev = e1;

    face.edge = e0;

    return face;
}

function faceGetEdge(face: Face, i: number): HalfEdge | null {
    let edge = face.edge;
    if (!edge) return null;

    while (i > 0) {
        edge = edge.next!;
        i--;
    }

    while (i < 0) {
        edge = edge.prev!;
        i++;
    }

    return edge;
}

function faceCompute(face: Face, points: readonly number[]): void {
    const a = halfEdgeTail(face.edge!)!;
    const b = halfEdgeHead(face.edge!);
    const c = halfEdgeHead(face.edge!.next!);

    const aIdx = a.index * 3;
    const bIdx = b.index * 3;
    const cIdx = c.index * 3;

    const ax = points[aIdx],
        ay = points[aIdx + 1],
        az = points[aIdx + 2];
    const bx = points[bIdx],
        by = points[bIdx + 1],
        bz = points[bIdx + 2];
    const cx = points[cIdx],
        cy = points[cIdx + 1],
        cz = points[cIdx + 2];

    // Compute edges
    const e1x = bx - ax,
        e1y = by - ay,
        e1z = bz - az;
    const e2x = cx - ax,
        e2y = cy - ay,
        e2z = cz - az;

    // Cross product for normal
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    // Normalize
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > EPSILON) {
        face.normal[0] = nx / len;
        face.normal[1] = ny / len;
        face.normal[2] = nz / len;
    }

    // Compute midpoint
    face.midpoint[0] = (ax + bx + cx) / 3;
    face.midpoint[1] = (ay + by + cy) / 3;
    face.midpoint[2] = (az + bz + cz) / 3;

    // Area
    face.area = len / 2;

    // Plane constant
    face.constant = face.normal[0] * face.midpoint[0] + face.normal[1] * face.midpoint[1] + face.normal[2] * face.midpoint[2];
}

function faceDistanceToPoint(face: Face, points: readonly number[], vertexIndex: number): number {
    const idx = vertexIndex * 3;
    return face.normal[0] * points[idx] + face.normal[1] * points[idx + 1] + face.normal[2] * points[idx + 2] - face.constant;
}

// Hull computation functions

function computeExtremes(state: HullState): { min: VertexNode[]; max: VertexNode[] } {
    const minVertices: VertexNode[] = [];
    const maxVertices: VertexNode[] = [];
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    // Initialize with first vertex
    for (let i = 0; i < 3; i++) {
        minVertices[i] = state.vertices[0];
        maxVertices[i] = state.vertices[0];
        min[i] = state.points[i];
        max[i] = state.points[i];
    }

    // Find extremal points along each axis
    for (let i = 0; i < state.vertices.length; i++) {
        const vertex = state.vertices[i];
        const idx = vertex.index * 3;

        for (let j = 0; j < 3; j++) {
            const val = state.points[idx + j];
            if (val < min[j]) {
                min[j] = val;
                minVertices[j] = vertex;
            }
            if (val > max[j]) {
                max[j] = val;
                maxVertices[j] = vertex;
            }
        }
    }

    // Compute tolerance based on data range
    state.tolerance =
        3 *
        Number.EPSILON *
        (Math.max(Math.abs(min[0]), Math.abs(max[0])) +
            Math.max(Math.abs(min[1]), Math.abs(max[1])) +
            Math.max(Math.abs(min[2]), Math.abs(max[2])));

    return { min: minVertices, max: maxVertices };
}

function computeInitialHull(state: HullState): void {
    const extremes = computeExtremes(state);
    const min = extremes.min;
    const max = extremes.max;

    // 1. Find the two vertices with greatest 1D separation
    let maxDistance = 0;
    let index = 0;

    for (let i = 0; i < 3; i++) {
        const idx0 = min[i].index * 3;
        const idx1 = max[i].index * 3;
        const distance = state.points[idx0 + i] - state.points[idx1 + i];
        if (Math.abs(distance) > maxDistance) {
            maxDistance = Math.abs(distance);
            index = i;
        }
    }

    const v0 = min[index];
    const v1 = max[index];

    // 2. Find vertex farthest from line v0-v1
    let v2: VertexNode | null = null;
    maxDistance = 0;

    for (const vertex of state.vertices) {
        if (vertex !== v0 && vertex !== v1) {
            const dist = distanceToLineSquared(state.points, vertex.index, v0.index, v1.index);
            if (dist > maxDistance) {
                maxDistance = dist;
                v2 = vertex;
            }
        }
    }

    if (!v2) return;

    // 3. Find vertex farthest from plane v0-v1-v2
    let v3: VertexNode | null = null;
    maxDistance = -1;

    const normal: [number, number, number] = [0, 0, 0];
    const offset = computePlane(state.points, v0.index, v1.index, v2.index, normal);

    for (const vertex of state.vertices) {
        if (vertex !== v0 && vertex !== v1 && vertex !== v2) {
            const dist = Math.abs(distanceToPlane(state.points, vertex.index, normal, offset));
            if (dist > maxDistance) {
                maxDistance = dist;
                v3 = vertex;
            }
        }
    }

    if (!v3) return;

    // Create initial tetrahedron
    const faces: Face[] = [];

    if (distanceToPlane(state.points, v3.index, normal, offset) < 0) {
        // Normal points outward
        faces.push(faceCreate(v0, v1, v2), faceCreate(v3, v1, v0), faceCreate(v3, v2, v1), faceCreate(v3, v0, v2));

        // Set twin edges
        for (let i = 0; i < 3; i++) {
            const j = (i + 1) % 3;
            halfEdgeSetTwin(faceGetEdge(faces[i + 1], 2)!, faceGetEdge(faces[0], j)!);
            halfEdgeSetTwin(faceGetEdge(faces[i + 1], 1)!, faceGetEdge(faces[j + 1], 0)!);
        }
    } else {
        // Normal points inward
        faces.push(faceCreate(v0, v2, v1), faceCreate(v3, v0, v1), faceCreate(v3, v1, v2), faceCreate(v3, v2, v0));

        // Set twin edges
        for (let i = 0; i < 3; i++) {
            const j = (i + 1) % 3;
            halfEdgeSetTwin(faceGetEdge(faces[i + 1], 2)!, faceGetEdge(faces[0], (3 - i) % 3)!);
            halfEdgeSetTwin(faceGetEdge(faces[i + 1], 0)!, faceGetEdge(faces[j + 1], 1)!);
        }
    }

    // Add faces to hull
    for (const face of faces) {
        faceCompute(face, state.points);
        state.faces.push(face);
    }

    // Assign remaining vertices to faces
    for (const vertex of state.vertices) {
        if (vertex !== v0 && vertex !== v1 && vertex !== v2 && vertex !== v3) {
            maxDistance = state.tolerance;
            let maxFace: Face | null = null;

            for (const face of state.faces) {
                const distance = faceDistanceToPoint(face, state.points, vertex.index);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    maxFace = face;
                }
            }

            if (maxFace !== null) {
                addVertexToFace(state, vertex, maxFace);
            }
        }
    }
}

function addVertexToFace(state: HullState, vertex: VertexNode, face: Face): void {
    vertex.face = face;

    if (face.outside === null) {
        vertexListAppend(state.assigned, vertex);
    } else {
        vertexListInsertBefore(state.assigned, face.outside, vertex);
    }

    face.outside = vertex;
}

function removeVertexFromFace(state: HullState, vertex: VertexNode, face: Face): void {
    if (vertex === face.outside) {
        if (vertex.next !== null && vertex.next.face === face) {
            face.outside = vertex.next;
        } else {
            face.outside = null;
        }
    }

    vertexListRemove(state.assigned, vertex);
}

function removeAllVerticesFromFace(state: HullState, face: Face): VertexNode | null {
    if (face.outside !== null) {
        const start = face.outside;
        let end = face.outside;

        while (end.next !== null && end.next.face === face) {
            end = end.next;
        }

        vertexListRemoveSubList(state.assigned, start, end);

        start.prev = null;
        end.next = null;
        face.outside = null;

        return start;
    }

    return null;
}

function deleteFaceVertices(state: HullState, face: Face, absorbingFace?: Face): void {
    const faceVertices = removeAllVerticesFromFace(state, face);

    if (faceVertices !== null) {
        if (absorbingFace === undefined) {
            vertexListAppendChain(state.unassigned, faceVertices);
        } else {
            let vertex: VertexNode | null = faceVertices;

            while (vertex !== null) {
                const nextVertex: VertexNode | null = vertex.next;
                const distance = faceDistanceToPoint(absorbingFace, state.points, vertex.index);

                if (distance > state.tolerance) {
                    addVertexToFace(state, vertex, absorbingFace);
                } else {
                    vertexListAppend(state.unassigned, vertex);
                }

                vertex = nextVertex;
            }
        }
    }
}

function resolveUnassignedPoints(state: HullState, newFaces: Face[]): void {
    if (vertexListIsEmpty(state.unassigned)) return;

    let vertex: VertexNode | null = state.unassigned.head;

    while (vertex !== null) {
        const nextVertex: VertexNode | null = vertex.next;
        let maxDistance = state.tolerance;
        let maxFace: Face | null = null;

        for (const face of newFaces) {
            if (face.mark === VISIBLE) {
                const distance = faceDistanceToPoint(face, state.points, vertex.index);

                if (distance > maxDistance) {
                    maxDistance = distance;
                    maxFace = face;
                }

                if (maxDistance > 1000 * state.tolerance) break;
            }
        }

        if (maxFace !== null) {
            addVertexToFace(state, vertex, maxFace);
        }

        vertex = nextVertex;
    }
}

function nextVertexToAdd(state: HullState): VertexNode | null {
    if (vertexListIsEmpty(state.assigned)) return null;

    let eyeVertex: VertexNode | null = null;
    let maxDistance = 0;

    const eyeFace = state.assigned.head!.face!;
    let vertex: VertexNode | null = eyeFace.outside;

    while (vertex !== null && vertex.face === eyeFace) {
        const distance = faceDistanceToPoint(eyeFace, state.points, vertex.index);

        if (distance > maxDistance) {
            maxDistance = distance;
            eyeVertex = vertex;
        }

        vertex = vertex.next;
    }

    return eyeVertex;
}

function computeHorizon(state: HullState, eyePoint: number, crossEdge: HalfEdge | null, face: Face, horizon: HalfEdge[]): void {
    deleteFaceVertices(state, face);
    face.mark = DELETED;

    let edge: HalfEdge;

    if (crossEdge === null) {
        edge = faceGetEdge(face, 0)!;
    } else {
        edge = crossEdge.next!;
    }

    const startEdge = edge;

    do {
        const twinEdge = edge.twin!;
        const oppositeFace = twinEdge.face;

        if (oppositeFace.mark === VISIBLE) {
            if (faceDistanceToPoint(oppositeFace, state.points, eyePoint) > state.tolerance) {
                computeHorizon(state, eyePoint, twinEdge, oppositeFace, horizon);
            } else {
                horizon.push(edge);
            }
        }

        edge = edge.next!;
    } while (edge !== startEdge);
}

function addAdjoiningFace(state: HullState, eyeVertex: VertexNode, horizonEdge: HalfEdge): HalfEdge {
    const face = faceCreate(eyeVertex, halfEdgeTail(horizonEdge)!, halfEdgeHead(horizonEdge));
    faceCompute(face, state.points);

    state.faces.push(face);

    halfEdgeSetTwin(faceGetEdge(face, -1)!, horizonEdge.twin!);

    return faceGetEdge(face, 0)!;
}

function addNewFaces(state: HullState, eyeVertex: VertexNode, horizon: HalfEdge[]): void {
    state.newFaces = [];

    let firstSideEdge: HalfEdge | null = null;
    let previousSideEdge: HalfEdge | null = null;

    for (const horizonEdge of horizon) {
        const sideEdge = addAdjoiningFace(state, eyeVertex, horizonEdge);

        if (firstSideEdge === null) {
            firstSideEdge = sideEdge;
        } else {
            halfEdgeSetTwin(sideEdge.next!, previousSideEdge!);
        }

        state.newFaces.push(sideEdge.face);
        previousSideEdge = sideEdge;
    }

    halfEdgeSetTwin(firstSideEdge!.next!, previousSideEdge!);
}

function addVertexToHull(state: HullState, eyeVertex: VertexNode): void {
    const horizon: HalfEdge[] = [];

    vertexListClear(state.unassigned);

    removeVertexFromFace(state, eyeVertex, eyeVertex.face!);

    computeHorizon(state, eyeVertex.index, null, eyeVertex.face!, horizon);

    addNewFaces(state, eyeVertex, horizon);

    resolveUnassignedPoints(state, state.newFaces);
}

function reindexFaces(state: HullState): void {
    const activeFaces: Face[] = [];

    for (const face of state.faces) {
        if (face.mark === VISIBLE) {
            activeFaces.push(face);
        }
    }

    state.faces = activeFaces;
}

// Helper functions

function computePlane(
    points: readonly number[],
    v0: number,
    v1: number,
    v2: number,
    outNormal: [number, number, number],
): number {
    const p0x = points[v0 * 3];
    const p0y = points[v0 * 3 + 1];
    const p0z = points[v0 * 3 + 2];
    const p1x = points[v1 * 3];
    const p1y = points[v1 * 3 + 1];
    const p1z = points[v1 * 3 + 2];
    const p2x = points[v2 * 3];
    const p2y = points[v2 * 3 + 1];
    const p2z = points[v2 * 3 + 2];

    const e1x = p1x - p0x;
    const e1y = p1y - p0y;
    const e1z = p1z - p0z;
    const e2x = p2x - p0x;
    const e2y = p2y - p0y;
    const e2z = p2z - p0z;

    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len < EPSILON) {
        outNormal[0] = 0;
        outNormal[1] = 0;
        outNormal[2] = 1;
        return 0;
    }

    const invLen = 1 / len;
    outNormal[0] = nx * invLen;
    outNormal[1] = ny * invLen;
    outNormal[2] = nz * invLen;

    return -(outNormal[0] * p0x + outNormal[1] * p0y + outNormal[2] * p0z);
}

function distanceToPlane(
    points: readonly number[],
    idx: number,
    normal: readonly [number, number, number],
    offset: number,
): number {
    const x = points[idx * 3];
    const y = points[idx * 3 + 1];
    const z = points[idx * 3 + 2];
    return normal[0] * x + normal[1] * y + normal[2] * z + offset;
}

function distanceToLineSquared(points: readonly number[], idx: number, v0: number, v1: number): number {
    const px = points[idx * 3];
    const py = points[idx * 3 + 1];
    const pz = points[idx * 3 + 2];
    const ax = points[v0 * 3];
    const ay = points[v0 * 3 + 1];
    const az = points[v0 * 3 + 2];
    const bx = points[v1 * 3];
    const by = points[v1 * 3 + 1];
    const bz = points[v1 * 3 + 2];

    const apx = px - ax;
    const apy = py - ay;
    const apz = pz - az;

    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;

    const cx = apy * abz - apz * aby;
    const cy = apz * abx - apx * abz;
    const cz = apx * aby - apy * abx;

    const crossLenSq = cx * cx + cy * cy + cz * cz;
    const abLenSq = abx * abx + aby * aby + abz * abz;

    if (abLenSq < EPSILON) return apx * apx + apy * apy + apz * apz;

    return crossLenSq / abLenSq;
}
