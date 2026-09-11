// Times scene updates and rendering. Use ?variant=<name> to select a single variant.
// Results are available in window.__results and the overlay.
import { BoxGeometry, Mesh, MeshNormalMaterial, PerspectiveCamera, WebGLRenderer } from 'three';
import type { Object3D } from 'three';
import {
    NODES,
    checksum,
    createExtended,
    createMathGraph,
    createMirror,
    createSceneGraph,
    prepareThreeManual,
    readTransforms,
    updateExtended,
    updateMath,
    updateMirror,
    updateMirrorViaObject3D,
    updateThree,
    updateThreeManual,
    type SceneGraph,
} from '../scene-graph';

const WARMUP = 60;
const FRAMES = 300;

const geometry = new BoxGeometry(0.3, 0.3, 0.3);
const material = new MeshNormalMaterial();
const makeNode = (): Object3D => new Mesh(geometry, material);

type Variant = { name: string; setup(s: SceneGraph): (t: number) => number };

const variants: Variant[] = [
    { name: 'three', setup: (s) => (t) => (updateThree(s, t), 0) },
    { name: 'three-manual', setup: (s) => (prepareThreeManual(s), (t) => (updateThreeManual(s, t), 0)) },
    {
        name: 'math-claimed',
        setup: (s) => {
            const g = createMathGraph(s);
            return (t) => (updateMath(s, g, t), 0);
        },
    },
    {
        name: 'mirror',
        setup: (s) => {
            const g = createMirror(s);
            return (t) => (updateMirror(s, g, t), 0);
        },
    },
    {
        name: 'extended',
        setup: (s) => {
            const a = createExtended(s);
            return (t) => (updateExtended(s, a, t), 0);
        },
    },
    {
        name: 'mirror-object3d',
        setup: (s) => {
            const g = createMirror(s);
            return (t) => (updateMirrorViaObject3D(s, g, t), 0);
        },
    },
    { name: 'three+read', setup: (s) => (t) => (updateThree(s, t), readTransforms(s)) },
    {
        name: 'mirror+read',
        setup: (s) => {
            const g = createMirror(s);
            return (t) => (updateMirror(s, g, t), readTransforms(s));
        },
    },
];

const out = document.getElementById('out') as HTMLDivElement;
const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 40);

function median(a: number[]): number {
    const s = a.slice().sort((x, y) => x - y);
    return s[s.length >> 1];
}

type Result = {
    variant: string;
    updateMs: number;
    renderMs: number;
    cpuMs: number;
    frameMs: number;
    checksum: number;
    read: number;
};
const results: Result[] = [];
(window as unknown as { __results: Result[] }).__results = results;

function raf(): Promise<number> {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

async function runVariant(v: Variant): Promise<Result> {
    const s = createSceneGraph(NODES, makeNode);
    // Variants update their own matrices so rendering must not repeat that work.
    s.scene.matrixWorldAutoUpdate = false;
    const step = v.setup(s);
    const updates: number[] = [];
    const renders: number[] = [];
    const frames: number[] = [];
    let t = 0;
    let read = 0;
    let last = await raf();
    for (let f = 0; f < WARMUP + FRAMES; f++) {
        t += 1 / 60;
        const t0 = performance.now();
        read = step(t);
        const t1 = performance.now();
        renderer.render(s.scene, camera);
        const t2 = performance.now();
        const now = await raf();
        if (f >= WARMUP) {
            updates.push(t1 - t0);
            renders.push(t2 - t1);
            frames.push(now - last);
        }
        last = now;
    }
    const r: Result = {
        variant: v.name,
        updateMs: median(updates),
        renderMs: median(renders),
        cpuMs: median(updates.map((u, i) => u + renders[i])),
        frameMs: median(frames),
        checksum: checksum(s),
        read,
    };
    results.push(r);
    s.scene.clear();
    return r;
}

function render(): void {
    const lines = results.map(
        (r) =>
            `${r.variant.padEnd(16)} update ${r.updateMs.toFixed(3).padStart(7)} ms   render ${r.renderMs.toFixed(3).padStart(7)} ms   cpu ${r.cpuMs.toFixed(3).padStart(7)} ms   frame ${r.frameMs.toFixed(2).padStart(6)} ms`,
    );
    out.textContent = `scene graph, ${NODES} meshes, medians over ${FRAMES} frames, isolated=${crossOriginIsolated}\n\n${lines.join('\n')}`;
}

async function main(): Promise<void> {
    const wanted = new URLSearchParams(location.search).get('variant');
    const selected = wanted ? variants.filter((v) => v.name === wanted) : variants;
    for (const v of selected) {
        out.textContent = `running ${v.name}…`;
        await runVariant(v);
        render();
    }
    out.textContent += '\n\ndone';
    console.log('RESULTS', JSON.stringify(results));
}

main();
