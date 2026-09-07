import * as g from 'gpucat';
import { d } from 'gpucat';
import { quat } from 'math';
import { ridged, simplex2d } from 'math/noise';
import { createPanel } from './common/dash';
import { palette, time } from './common/rainbow';
import { createRenderer } from './common/renderer';

// A big voxel landscape whose mountains come from math's ridged fBm (ridged
// folds each octave into sharp crests). It's turned into a mesh by a tiny
// "culled mesher" - it emits a quad only for a solid voxel face whose neighbour
// is empty, so the interior of the block is never drawn. Being one block type,
// the whole surface is just a vessel for the rainbow material, coloured by
// elevation and lit by the face normals.

const GX = 110;
const GY = 44;
const GZ = 110;
const VOXEL = 0.08;
const BASE = 6; // minimum terrain height
const H_FREQ = 0.03; // terrain horizontal frequency

// the six cube faces: outward normal, neighbour offset, and 4 corner offsets
const FACES = [
    {
        n: [1, 0, 0],
        d: [1, 0, 0],
        c: [
            [1, 0, 0],
            [1, 1, 0],
            [1, 1, 1],
            [1, 0, 1],
        ],
    },
    {
        n: [-1, 0, 0],
        d: [-1, 0, 0],
        c: [
            [0, 0, 1],
            [0, 1, 1],
            [0, 1, 0],
            [0, 0, 0],
        ],
    },
    {
        n: [0, 1, 0],
        d: [0, 1, 0],
        c: [
            [0, 1, 1],
            [1, 1, 1],
            [1, 1, 0],
            [0, 1, 0],
        ],
    },
    {
        n: [0, -1, 0],
        d: [0, -1, 0],
        c: [
            [0, 0, 0],
            [1, 0, 0],
            [1, 0, 1],
            [0, 0, 1],
        ],
    },
    {
        n: [0, 0, 1],
        d: [0, 0, 1],
        c: [
            [1, 0, 1],
            [1, 1, 1],
            [0, 1, 1],
            [0, 0, 1],
        ],
    },
    {
        n: [0, 0, -1],
        d: [0, 0, -1],
        c: [
            [0, 0, 0],
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0],
        ],
    },
] as const;

const idx = (x: number, y: number, z: number) => (x * GY + y) * GZ + z;

/* voxel field: a ridged-fBm heightfield, solid below the surface */

function buildSolid(seed: number, height: number, detail: number): Uint8Array {
    const hgen = simplex2d.create(seed);
    const solid = new Uint8Array(GX * GY * GZ);

    for (let x = 0; x < GX; x++) {
        for (let z = 0; z < GZ; z++) {
            const r = ridged((f) => simplex2d.sample(hgen, x * H_FREQ * detail * f, z * H_FREQ * detail * f), 4, 2, 0.5);
            const h = BASE + height * r;
            for (let y = 0; y < GY && y < h; y++) {
                solid[idx(x, y, z)] = 1;
            }
        }
    }
    return solid;
}

const solidAt = (solid: Uint8Array, x: number, y: number, z: number) =>
    x >= 0 && x < GX && y >= 0 && y < GY && z >= 0 && z < GZ && solid[idx(x, y, z)] === 1;

/* culled mesher: one quad per exposed solid face */

function mesh(solid: Uint8Array): { positions: Float32Array; normals: Float32Array; indices: Uint32Array } {
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    const ox = (GX / 2) * VOXEL;
    const oy = (GY / 2) * VOXEL;
    const oz = (GZ / 2) * VOXEL;

    for (let x = 0; x < GX; x++) {
        for (let y = 0; y < GY; y++) {
            for (let z = 0; z < GZ; z++) {
                if (solid[idx(x, y, z)] !== 1) continue;
                for (const face of FACES) {
                    if (solidAt(solid, x + face.d[0], y + face.d[1], z + face.d[2])) continue; // hidden face
                    const base = positions.length / 3;
                    for (const corner of face.c) {
                        positions.push((x + corner[0]) * VOXEL - ox, (y + corner[1]) * VOXEL - oy, (z + corner[2]) * VOXEL - oz);
                        normals.push(face.n[0], face.n[1], face.n[2]);
                    }
                    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
                }
            }
        }
    }
    return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices) };
}

/* renderer */

const renderer = await createRenderer({ antialias: true });

const canvas = renderer.domElement as HTMLCanvasElement;
document.body.appendChild(canvas);
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new g.Scene();

const camera = new g.PerspectiveCamera(Math.PI / 4, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position[0] = 7;
camera.position[1] = 6;
camera.position[2] = 11;
scene.add(camera);

const controls = new g.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

/* rainbow-lit material (shared; the geometry is rebuilt on change) */

function makeMaterial(): g.Material {
    const pos = g.attribute('position', d.vec3f);
    const nrm = g.attribute('normal', d.vec3f);
    const world = g.mul(g.modelWorldMatrix, g.vec4(pos, g.f32(1)));
    const clip = g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, world));
    const vNormal = g.varying(g.normalize(g.mul(g.modelNormalMatrix, nrm)), 'v_n');
    const vHeight = g.varying(pos.y, 'v_h'); // model-space height -> stable colour bands while spinning
    const lightDirection = g.vec3(0.35, 1.0, 0.5).normalize();
    const diffuse = g.Var('diffuse', vNormal.dot(lightDirection).max(g.f32(0)));
    const shade = g.Var('shade', g.f32(0.4).add(diffuse.mul(g.f32(0.62))));
    // colour by elevation (topographic rainbow bands)
    const base = g.Var('base', palette(g.add(vHeight.mul(g.f32(0.6)), g.f32(0.5))));
    return new g.Material({ vertex: clip, fragment: g.vec4(base.mul(shade), g.f32(1)) });
}
const material = makeMaterial();

let chunk: g.Mesh | null = null;

function rebuild() {
    const solid = buildSolid(settings.seed, settings.height, settings.detail);
    const m = mesh(solid);
    const geometry = new g.Geometry();
    geometry.setBuffer('position', g.createVertexBuffer(d.vec3f, m.positions));
    geometry.setBuffer('normal', g.createVertexBuffer(d.vec3f, m.normals));
    geometry.setIndex(g.createIndexBuffer(m.indices));
    if (chunk) {
        scene.remove(chunk);
        chunk.geometry.dispose();
    }
    chunk = new g.Mesh(geometry, material);
    scene.add(chunk);
    scene.updateWorldMatrix();
    faceCount = m.indices.length / 6;
}

/* ui */

const settings = { seed: 1337, height: 24, detail: 1, spin: true };
let faceCount = 0;

const panel = createPanel('ridged noise voxel terrain');
panel.add(settings, 'height', { min: 8, max: 34, step: 0.1, label: 'Mountains' }).onChange(rebuild);
panel.add(settings, 'detail', { min: 0.5, max: 2, step: 0.01, label: 'Detail' }).onChange(rebuild);
panel.add(settings, 'spin', { label: 'Auto-spin' });
panel.button('↻ Reshuffle', () => {
    settings.seed = (Math.imul(settings.seed, 1664525) + 1013904223) >>> 0;
    rebuild();
});
panel.monitor(() => faceCount, { label: 'faces' });

rebuild();

/* render loop */

const scenePass = g.pass(scene, camera);
const outputNode = g.fxaa(scenePass.getTextureNode());
const renderPipeline = new g.RenderPipeline(renderer, outputNode);

let spinAngle = 0;
let lastT = performance.now();

function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    time.value = now / 1000;

    if (settings.spin && chunk) {
        spinAngle += dt * 0.2;
        quat.setAxisAngle(chunk.quaternion, [0, 1, 0], spinAngle);
    }

    controls.update();
    scene.updateWorldMatrix();
    renderPipeline.render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
