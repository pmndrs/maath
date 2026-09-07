import * as g from 'gpucat';
import { d } from 'gpucat';
import { triangulatePolygon2 } from 'math/geometry';
import { createPanel } from './common/dash';
import { rainbowLineColor, rainbowRGB, time } from './common/rainbow';
import { createRenderer } from './common/renderer';

// Draw a shape by dragging, release to watch it triangulate. The freehand
// outline is a simple (possibly concave) polygon, and on release math's ear
// clipping (triangulatePolygon2) fans it into triangles — no new vertices, just
// indices into the drawn points. Each triangle is filled an on-palette hue, the
// shared edges drawn in white, the outline glows the flowing rainbow, and an
// instanced rainbow dot marks every vertex.

/* tuning */

const MIN_POINT_DIST = 0.14; // min world gap between recorded path points (freehand simplify)
const Z_FILL = 0;
const Z_EDGES = 0.02;
const Z_BOUNDARY = 0.04;
const Z_DOTS = 0.06;
const DOT_RADIUS = 0.028; // world-space radius of the vertex dots
const MAX_VERTS = 4096; // instance-buffer capacity for the vertex dots

/* renderer */

const renderer = await createRenderer({ antialias: true });

const canvas = renderer.domElement as HTMLCanvasElement;
document.body.appendChild(canvas);
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
canvas.style.touchAction = 'none';
canvas.style.cursor = 'crosshair';

const scene = new g.Scene();

// orthographic camera looking straight down -Z at the drawing plane: no
// foreshortening (a flat 2D surface), and screen<->world is an exact linear map.
// The visible world spans a fixed vertical half-extent; width follows the aspect.
const VIEW_HALF_H = 2.6;
const camera = new g.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position[2] = 6;
scene.add(camera);

function updateFrustum(): void {
    const halfW = VIEW_HALF_H * (window.innerWidth / window.innerHeight);
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = VIEW_HALF_H;
    camera.bottom = -VIEW_HALF_H;
    camera.updateProjectionMatrix();
}
updateFrustum();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateFrustum();
});

// screen -> world on the z=0 plane (camera is axis-aligned ortho, so this is exact)
function unproject(clientX: number, clientY: number, out: [number, number]): void {
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    out[0] = ndcX * VIEW_HALF_H * (rect.width / rect.height);
    out[1] = ndcY * VIEW_HALF_H;
}

/* materials (shared across rebuilds) */

// per-vertex coloured, unlit fill — each triangle bakes its own hue in.
const fillPos = g.attribute('position', d.vec3f);
const fillCol = g.attribute('color', d.vec3f);
const fillClip = g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, g.mul(g.modelWorldMatrix, g.vec4(fillPos, g.f32(1)))));
const fillMaterial = new g.Material({
    vertex: fillClip,
    fragment: g.vec4(g.varying(fillCol, 'v_fill'), g.f32(1)),
    cullMode: 'none',
});

const edgeMaterial = new g.LineMaterial({ color: g.vec4f(1, 1, 1, 0.8), lineWidth: 6, transparent: true });
const boundaryMaterial = new g.LineMaterial({ color: rainbowLineColor(1, 3), lineWidth: 6 });

/* live objects, rebuilt on each release */

let fillMesh: g.Mesh | null = null;
let edgeLines: g.LineSegments | null = null;

// the drawn outline (open while drawing, closed once triangulated). Preallocated
// generously so `update` never reallocates mid-drag.
const boundaryGeometry = new g.LineGeometry(new Float32Array([0, 0, 0, 0, 0, 0]), false, 4096);
const boundaryLine = new g.Line(boundaryGeometry, boundaryMaterial);
boundaryLine.position[2] = Z_BOUNDARY;
boundaryLine.visible = false;
scene.add(boundaryLine);

/* vertex dots — one instanced sphere per polygon vertex, coloured by the flowing
   rainbow (sampled at each dot's world position). The instance buffer is
   preallocated once; each release just rewrites offsets and sets `count`. */

const dotGeometry = g.createSphereGeometry(DOT_RADIUS, 12, 8);
const dotOffsets = new Float32Array(MAX_VERTS * 3);
const dotOffsetBuffer = g.createVertexBuffer(d.vec3f, dotOffsets);

const dotLocal = g.attribute('position', d.vec3f);
const dotOffset = g.attribute(dotOffsetBuffer, { stride: 12, offset: 0, instanced: true });
const dotWorld = g.mul(g.modelWorldMatrix, g.vec4(g.add(dotLocal, dotOffset), g.f32(1)));
const dotClip = g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, dotWorld));
const dotVWorld = g.varying(dotWorld.xyz, 'v_dotworld');
const dotMaterial = new g.Material({ vertex: dotClip, fragment: g.vec4(rainbowRGB(dotVWorld, 3), g.f32(1)) });

const dotMesh = new g.Mesh(dotGeometry, dotMaterial);
dotMesh.position[2] = Z_DOTS;
dotMesh.count = 0;
dotMesh.visible = false;
scene.add(dotMesh);

function clearPieces(): void {
    if (fillMesh) {
        scene.remove(fillMesh);
        fillMesh.geometry.dispose();
        fillMesh = null;
    }
    if (edgeLines) {
        scene.remove(edgeLines);
        edgeLines.geometry.dispose();
        edgeLines = null;
    }
    dotMesh.count = 0;
    dotMesh.visible = false;
}

/** Places one rainbow dot instance at each polygon vertex. */
function showVertexDots(polygon: number[], n: number): void {
    const count = Math.min(n, MAX_VERTS);
    for (let k = 0; k < count; k++) {
        dotOffsets[k * 3] = polygon[k * 2];
        dotOffsets[k * 3 + 1] = polygon[k * 2 + 1];
        dotOffsets[k * 3 + 2] = 0;
    }
    dotOffsetBuffer.needsUpdate = true;
    dotMesh.count = count;
    dotMesh.visible = true;
}

// brand rainbow palette stops (sRGB), matching common/rainbow's palette():
// pink -> yellow -> blue -> purple -> (wrap to pink).
const PALETTE: [number, number, number][] = [
    [1.0, 0.243, 0.647],
    [1.0, 0.824, 0.247],
    [0.247, 0.655, 1.0],
    [0.541, 0.169, 0.886],
];

/** Samples the looping brand palette at `t` cycles (mirrors the rainbow shader). */
function rainbowPalette(t: number): [number, number, number] {
    const x = (((t % 1) + 1) % 1) * 4;
    const i = Math.floor(x);
    const f = x - i;
    const a = PALETTE[i % 4];
    const b = PALETTE[(i + 1) % 4];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** On-palette hue per triangle, spread across the rainbow so triangles stay distinct but in-family. */
function triColor(i: number, count: number): [number, number, number] {
    return rainbowPalette((i + 0.5) / Math.max(count, 1));
}

/* readout / stats */

const readout = document.createElement('div');
readout.className = 'mc-info';
readout.style.left = '16px';
readout.style.bottom = '16px';
document.body.appendChild(readout);

let stats = { vertices: 0, triangles: 0, ms: 0 };

function updateReadout(): void {
    readout.innerHTML =
        `ear clipping · ${stats.vertices} verts → ${stats.triangles} triangles · ${stats.ms.toFixed(2)}ms` +
        `<br><span class="mc-dim">drag to draw a shape, release to triangulate</span>`;
}

/* build the visuals for a triangulated polygon */

const triIndices: number[] = []; // reused scratch for triangulatePolygon2 output

function showTriangulation(polygon: number[]): void {
    clearPieces();
    const n = polygon.length / 2;
    if (n < 3) return;

    const t0 = performance.now();
    // triangulatePolygon2 writes flat [i0, i1, i2, ...] indices into the input polygon
    triIndices.length = 0;
    const ntris = triangulatePolygon2(triIndices, polygon, n);
    const ms = performance.now() - t0;

    // fills: each triangle gets its own 3 (un-shared) vertices so it can be a flat hue
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    // edges: every triangle edge as a segment pair (shared diagonals drawn twice, fine)
    const segments: number[] = [];

    for (let t = 0; t < ntris; t++) {
        const [r, gr, b] = triColor(t, ntris);
        const base = positions.length / 3;
        for (let k = 0; k < 3; k++) {
            const vi = triIndices[t * 3 + k];
            positions.push(polygon[vi * 2], polygon[vi * 2 + 1], 0);
            colors.push(r, gr, b);
            indices.push(base + k);
        }
        // outline all three edges of the triangle
        for (let k = 0; k < 3; k++) {
            const a = triIndices[t * 3 + k];
            const c = triIndices[t * 3 + ((k + 1) % 3)];
            segments.push(polygon[a * 2], polygon[a * 2 + 1], Z_EDGES, polygon[c * 2], polygon[c * 2 + 1], Z_EDGES);
        }
    }

    if (indices.length) {
        const geo = new g.Geometry();
        geo.setBuffer('position', g.createVertexBuffer(d.vec3f, new Float32Array(positions)));
        geo.setBuffer('color', g.createVertexBuffer(d.vec3f, new Float32Array(colors)));
        geo.setIndex(g.createIndexBuffer(new Uint32Array(indices)));
        fillMesh = new g.Mesh(geo, fillMaterial);
        fillMesh.position[2] = Z_FILL;
        scene.add(fillMesh);
    }

    if (segments.length >= 6) {
        const geo = new g.LineSegmentsGeometry(new Float32Array(segments), segments.length / 3);
        edgeLines = new g.LineSegments(geo, edgeMaterial);
        scene.add(edgeLines);
    }

    // closed rainbow boundary = the original outline
    const loop = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
        loop[k * 3] = polygon[k * 2];
        loop[k * 3 + 1] = polygon[k * 2 + 1];
    }
    boundaryGeometry.update(loop, true);
    boundaryLine.visible = true;

    showVertexDots(polygon, n);

    stats = { vertices: n, triangles: ntris, ms };
    updateReadout();
}

/* pointer: drag to draw */

let drawing = false;
const path: number[] = []; // flat [x0, y0, ...] world-space path
const tmp: [number, number] = [0, 0];

function addPoint(clientX: number, clientY: number): void {
    unproject(clientX, clientY, tmp);
    const n = path.length / 2;
    if (n > 0) {
        const dx = tmp[0] - path[(n - 1) * 2];
        const dy = tmp[1] - path[(n - 1) * 2 + 1];
        if (dx * dx + dy * dy < MIN_POINT_DIST * MIN_POINT_DIST) return;
    }
    path.push(tmp[0], tmp[1]);
}

// show the in-progress open outline as a plain rainbow polyline
function updateLivePath(): void {
    const n = path.length / 2;
    if (n < 2) {
        boundaryLine.visible = false;
        return;
    }
    const pts = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
        pts[k * 3] = path[k * 2];
        pts[k * 3 + 1] = path[k * 2 + 1];
    }
    boundaryGeometry.update(pts, false);
    boundaryLine.visible = true;
}

canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    path.length = 0;
    clearPieces();
    boundaryLine.visible = false;
    addPoint(e.clientX, e.clientY);
});

canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    addPoint(e.clientX, e.clientY);
    updateLivePath();
});

function finishDrawing(): void {
    if (!drawing) return;
    drawing = false;
    if (path.length / 2 >= 3) {
        showTriangulation(path.slice());
    } else {
        boundaryLine.visible = false;
    }
}

canvas.addEventListener('pointerup', finishDrawing);
canvas.addEventListener('pointercancel', finishDrawing);

/* ui */

const panel = createPanel('polygon2 triangulation');
panel.button('Clear', () => {
    path.length = 0;
    clearPieces();
    boundaryLine.visible = false;
    stats = { vertices: 0, triangles: 0, ms: 0 };
    updateReadout();
});
panel.monitor(() => stats.triangles, { label: 'triangles' });

/* a concave star to greet the user (and to screenshot) */

function seedStar(): void {
    const points = 5;
    const outer = 2.1;
    const inner = 0.9;
    path.length = 0;
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
        path.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    showTriangulation(path.slice());
}
seedStar();

/* render loop (only for the flowing rainbow boundary) */

const scenePass = g.pass(scene, camera);
const outputNode = g.fxaa(scenePass.getTextureNode());
const renderPipeline = new g.RenderPipeline(renderer, outputNode);

function frame(tms: number) {
    time.value = tms / 1000;
    scene.updateWorldMatrix();
    camera.updateViewMatrix();
    renderPipeline.render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
