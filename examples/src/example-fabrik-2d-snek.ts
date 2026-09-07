import * as g from 'gpucat';
import { d } from 'gpucat';
import type { Vec2 } from 'math';
import { fabrik2 } from 'math/ik';
import { rainbowRGB, time } from './common/rainbow';
import { createRenderer } from './common/renderer';

// A snake built on ONE HALF of the FABRIK solver.
//
// An IK solve wants the base pinned and the effector pulled onto a target, so it runs both passes
// until they agree. A snake wants the opposite: the head goes exactly where you point, and the body
// is whatever trails behind. That is precisely `fabrik2.forward` - the pass that snaps the effector
// to the target and drags every bone after it - run once per frame, with no backward pass and no
// base pin at all. The joint limits do the rest: each segment may only bend so far from the one
// ahead, so the body reads as a spine rather than a chain of beads.
//
// Eat a pellet and the tail grows with `fabrik2.addBoneAtBase`, at the base end, because with only
// the forward pass the base is the tail.

// keep SEGMENT_LENGTH below twice TAIL_RADIUS, or the thin end of the body reads as loose beads
const SEGMENT_LENGTH = 0.16;
const START_SEGMENTS = 18;
const GROWTH_PER_PELLET = 5;
const BEND_LIMIT = Math.PI / 7; // how far one segment may turn from the one ahead
const HEAD_RADIUS = 0.32;
const TAIL_RADIUS = 0.1;
const HEAD_SPEED = 6; // how fast the head closes on the pointer
const PELLET_RADIUS = 0.16;

/* chain */

const snake = fabrik2.createChain2();
fabrik2.addBone(snake, [0, -START_SEGMENTS * SEGMENT_LENGTH], [0, -START_SEGMENTS * SEGMENT_LENGTH + SEGMENT_LENGTH]);
for (let i = 1; i < START_SEGMENTS; i++) {
    fabrik2.addConsecutiveBone(
        snake,
        [0, 1],
        SEGMENT_LENGTH,
        fabrik2.setLocalJoint(fabrik2.createJoint2(), BEND_LIMIT, BEND_LIMIT),
    );
}

// the head chases the pointer rather than snapping to it, so the snake has some weight
const head: Vec2 = [0, 0];
const target: Vec2 = [0, 0];

/** Radius of segment `i`, tapering from head to tail. */
function radiusAt(i: number, count: number): number {
    const t = count > 1 ? i / (count - 1) : 1;
    return TAIL_RADIUS + (HEAD_RADIUS - TAIL_RADIUS) * t;
}

/* renderer */

const renderer = await createRenderer({ antialias: true });

const canvas = renderer.domElement as HTMLCanvasElement;
document.body.appendChild(canvas);
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
canvas.style.touchAction = 'none';

const scene = new g.Scene();

const FOV = Math.PI / 4;
const camera = new g.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position[2] = 6;
scene.add(camera);

function unproject(clientX: number, clientY: number): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    const halfH = camera.position[2] * Math.tan(FOV / 2);
    const halfW = halfH * (rect.width / rect.height);
    return [ndcX * halfW, ndcY * halfH];
}

/** Half-extents of the visible plane at z = 0, for keeping pellets on screen. */
function viewportExtent(): [number, number] {
    const halfH = camera.position[2] * Math.tan(FOV / 2);
    return [halfH * (window.innerWidth / window.innerHeight), halfH];
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

/* pointer */

let pointerDown = false;
let everMoved = false; // until the pointer takes over, the snake wanders on its own

function moveTo(clientX: number, clientY: number) {
    everMoved = true;
    const [x, y] = unproject(clientX, clientY);
    target[0] = x;
    target[1] = y;
}

canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && !pointerDown) return;
    moveTo(e.clientX, e.clientY);
});
canvas.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    moveTo(e.clientX, e.clientY);
});
const release = () => {
    pointerDown = false;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

/* pellet */

const pellet: Vec2 = [1.5, 1];

function placePellet() {
    const [ex, ey] = viewportExtent();
    pellet[0] = (Math.random() * 2 - 1) * (ex - 0.5);
    pellet[1] = (Math.random() * 2 - 1) * (ey - 0.5);
}

/* body: instanced spheres, one per joint of the chain */

// generous headroom so growth never reallocates the GPU buffer
const MAX_SEGMENTS = 400;

// per-sphere vec4 = (x, y, z, radius), rewritten each frame
const bodyData = new Float32Array(MAX_SEGMENTS * 4);
const bodyBuffer = new g.GpuBuffer(d.array(d.vec4f), { data: bodyData, usage: 'storage' });
const bodyInstance = g.index(g.storage(bodyBuffer), g.instanceIndex);

const sphere = g.createSphereGeometry(1, 20, 14);
const position = g.attribute('position', d.vec3f);
const normal = g.attribute('normal', d.vec3f);

const bodyWorld = g.add(g.mul(position, bodyInstance.w), bodyInstance.xyz);
const bodyClip = g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, g.vec4(bodyWorld, g.f32(1))));

const bodyNormal = g.varying(g.normalize(normal), 'v_n');
const bodyWorldVarying = g.varying(bodyWorld, 'v_w');

const lightDirection = g.vec3(0.4, 0.8, 0.6).normalize();
const diffuse = g.Var('diffuse', bodyNormal.dot(lightDirection).max(g.f32(0)));
const lit = g.Var('lit', g.f32(0.45).add(diffuse.mul(g.f32(0.6))));

const bodyMaterial = new g.Material({
    vertex: bodyClip,
    fragment: g.vec4(rainbowRGB(bodyWorldVarying, 2.5).mul(lit), g.f32(1)),
});

const body = new g.Mesh(sphere, bodyMaterial);
scene.add(body);

/* pellet mesh */

const pelletData = new Float32Array(4);
const pelletBuffer = new g.GpuBuffer(d.array(d.vec4f), { data: pelletData, usage: 'storage' });
const pelletInstance = g.index(g.storage(pelletBuffer), g.instanceIndex);

const pelletWorld = g.add(g.mul(position, pelletInstance.w), pelletInstance.xyz);
const pelletClip = g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, g.vec4(pelletWorld, g.f32(1))));
const pelletNormal = g.varying(g.normalize(normal), 'p_n');
const pelletDiffuse = g.Var('pdiffuse', pelletNormal.dot(lightDirection).max(g.f32(0)));
const pelletLit = g.Var('plit', g.f32(0.55).add(pelletDiffuse.mul(g.f32(0.5))));

const pelletMaterial = new g.Material({
    vertex: pelletClip,
    fragment: g.vec4(g.vec3(1, 1, 1).mul(pelletLit), g.f32(1)),
});

const pelletMesh = new g.Mesh(g.createSphereGeometry(1, 16, 12), pelletMaterial);
pelletMesh.count = 1;
scene.add(pelletMesh);

/* eyes: two dark spheres carried on the head, turned with the head bone */

const eyeData = new Float32Array(2 * 4);
const eyeBuffer = new g.GpuBuffer(d.array(d.vec4f), { data: eyeData, usage: 'storage' });
const eyeInstance = g.index(g.storage(eyeBuffer), g.instanceIndex);

const eyeWorld = g.add(g.mul(position, eyeInstance.w), eyeInstance.xyz);
const eyeMaterial = new g.Material({
    vertex: g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, g.vec4(eyeWorld, g.f32(1)))),
    fragment: g.vec4(0.05, 0.05, 0.08, 1),
});

const eyes = new g.Mesh(g.createSphereGeometry(1, 12, 8), eyeMaterial);
eyes.count = 2;
scene.add(eyes);

const EYE_RADIUS = 0.075;
const EYE_FORWARD = 0.1; // along the head bone
const EYE_SIDE = 0.14; // across it

/* hint */

const hint = document.createElement('div');
hint.className = 'mc-info';
hint.style.left = '16px';
hint.style.bottom = '16px';
hint.textContent = 'move the pointer to lead the snake — eat the white pellet to grow';
document.body.appendChild(hint);

const counter = document.createElement('div');
counter.className = 'mc-info';
counter.style.right = '16px';
counter.style.bottom = '16px';
document.body.appendChild(counter);

/* render */

scene.updateWorldMatrix();
camera.updateViewMatrix();

const scenePass = g.pass(scene, camera);
const outputNode = g.fxaa(scenePass.getTextureNode());
const renderPipeline = new g.RenderPipeline(renderer, outputNode);

let last = -1;

function frame(tms: number) {
    const t = tms / 1000;
    time.value = t;
    if (last < 0) last = t;
    const dt = Math.min(t - last, 0.05);
    last = t;

    // idle: wander on a lissajous until the pointer takes over
    if (!everMoved) {
        const [ex, ey] = viewportExtent();
        target[0] = Math.cos(t * 0.7) * ex * 0.6;
        target[1] = Math.sin(t * 1.1) * ey * 0.6;
    }

    // ease the head toward the target so the snake carries some momentum
    const ease = 1 - Math.exp(-HEAD_SPEED * dt);
    head[0] += (target[0] - head[0]) * ease;
    head[1] += (target[1] - head[1]) * ease;

    // THE WHOLE SOLVE: one forward pass. the head lands exactly on `head`, and every segment
    // behind it is pulled into line within its bend limit. no backward pass, no pinned base.
    fabrik2.forward(snake, head);

    // eat
    const dx = snake.bones[snake.bones.length - 1].end[0] - pellet[0];
    const dy = snake.bones[snake.bones.length - 1].end[1] - pellet[1];
    if (dx * dx + dy * dy < (HEAD_RADIUS + PELLET_RADIUS) ** 2) {
        for (let i = 0; i < GROWTH_PER_PELLET && snake.bones.length < MAX_SEGMENTS - 1; i++) {
            // grow at the base, which with a forward-only chain is the tail
            fabrik2.addBoneAtBase(
                snake,
                [0, 1],
                SEGMENT_LENGTH,
                fabrik2.setLocalJoint(fabrik2.createJoint2(), BEND_LIMIT, BEND_LIMIT),
            );
        }
        placePellet();
    }

    // a sphere at every joint: each bone's start, plus the head at the last bone's end
    const bones = snake.bones;
    const count = bones.length + 1;

    for (let i = 0; i < bones.length; i++) {
        bodyData[i * 4] = bones[i].start[0];
        bodyData[i * 4 + 1] = bones[i].start[1];
        bodyData[i * 4 + 2] = 0;
        bodyData[i * 4 + 3] = radiusAt(i, count);
    }

    const headBone = bones[bones.length - 1];
    bodyData[bones.length * 4] = headBone.end[0];
    bodyData[bones.length * 4 + 1] = headBone.end[1];
    bodyData[bones.length * 4 + 2] = 0;
    bodyData[bones.length * 4 + 3] = HEAD_RADIUS;

    body.count = count;
    bodyBuffer.needsUpdate = true;

    // getBoneAngle gives the head bone's heading, so the eyes ride on it
    const headAngle = fabrik2.getBoneAngle(snake, bones.length - 1);
    const forwardX = Math.cos(headAngle);
    const forwardY = Math.sin(headAngle);

    for (let i = 0; i < 2; i++) {
        const side = i === 0 ? EYE_SIDE : -EYE_SIDE;
        eyeData[i * 4] = headBone.end[0] + forwardX * EYE_FORWARD - forwardY * side;
        eyeData[i * 4 + 1] = headBone.end[1] + forwardY * EYE_FORWARD + forwardX * side;
        // in front of the head sphere, toward the camera, so they always read
        eyeData[i * 4 + 2] = HEAD_RADIUS * 0.75;
        eyeData[i * 4 + 3] = EYE_RADIUS;
    }
    eyeBuffer.needsUpdate = true;

    pelletData[0] = pellet[0];
    pelletData[1] = pellet[1];
    pelletData[2] = 0;
    pelletData[3] = PELLET_RADIUS * (1 + Math.sin(t * 4) * 0.12);
    pelletBuffer.needsUpdate = true;

    counter.textContent = `${bones.length} segments`;

    scene.updateWorldMatrix();
    camera.updateViewMatrix();
    renderPipeline.render();
    requestAnimationFrame(frame);
}

placePellet();
requestAnimationFrame(frame);
