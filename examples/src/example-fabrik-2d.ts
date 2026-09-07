import * as g from 'gpucat';
import { d } from 'gpucat';
import { type Vec2, vec2 } from 'math';
import { fabrik2 } from 'math/ik';
import { createPanel } from './common/dash';
import { time } from './common/rainbow';
import { createRenderer } from './common/renderer';

// A gallery of 2D IK setups solved with math's FABRIK solver, following the scenarios in Caliko's
// own demo app - Caliko being the reference implementation that accompanies Aristidou & Lasenby's
// FABRIK paper.
//
// Move the pointer: it is the target. Every scenario runs the FULL solver - fabrik2.solveStructure,
// which is forward pass, backward pass, pinned base, iterated to a tolerance - unlike the snek
// example next door, which runs the forward pass alone and lets its base trail. What changes
// between scenarios is only how the joints are constrained.
//
//   Unconstrained          a pinned base and free joints
//   Constrained joints     each bone held within a wedge of the bone before it
//   Constrained basebone   ...and the first bone pinned to a wedge about a world direction
//   World-space joints     joints measured against a fixed world direction rather than the previous
//                          bone, so each bone keeps its absolute heading whatever the others do
//   Connected chains       three chains wired into a Structure2, branches carried by the trunk
//   Embedded targets       a row of chains, each reaching for a target of its own
//
// A 2D joint is a wedge rather than a cone: how far the bone may swing clockwise and anticlockwise
// of a baseline. The two limits are independent, which is what lets a joint bend one way and not
// the other.

const BONE_LENGTH = 0.62;

/* scenarios */

type Scenario = {
    name: string;
    hint: string;
    build(): fabrik2.Structure2;
    /** moves any embedded targets on; returns the chains carrying them, to draw */
    embeddedTargets?(structure: fabrik2.Structure2, t: number): fabrik2.Chain2[];
};

const UP: Vec2 = [0, 1];
const LEFT: Vec2 = [-1, 0];
const RIGHT: Vec2 = [1, 0];

/** A chain of `count` bones running up from `base`, each bone built by `joint`. */
function upwardChain(base: Vec2, count: number, joint?: () => fabrik2.Joint2, length = BONE_LENGTH): fabrik2.Chain2 {
    const chain = fabrik2.createChain2();

    fabrik2.addBone(chain, base, [base[0], base[1] + length]);

    // a hair off straight - a dead-straight chain is the solver's worst starting pose
    const bend: Vec2 = [0.0349, 0.9994];

    for (let i = 1; i < count; i++) {
        fabrik2.addConsecutiveBone(chain, bend, length, joint?.());
    }

    return chain;
}

function singleChain(chain: fabrik2.Chain2): fabrik2.Structure2 {
    const structure = fabrik2.createStructure2();
    fabrik2.addChain(structure, chain);
    return structure;
}

const SCENARIOS: Scenario[] = [
    {
        name: 'Unconstrained',
        hint: 'a pinned base and free joints — the chain reaches the pointer however it likes',
        build: () => singleChain(upwardChain([0, -2.5], 7)),
    },
    {
        name: 'Constrained joints',
        hint: 'every joint held within 25° either side of the bone before it — the chain has to curve',
        build: () => singleChain(upwardChain([0, -2.5], 7, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.44, 0.44))),
    },
    {
        name: 'Constrained basebone',
        hint: 'the same, but the first bone is also pinned within 15° of straight up, so the chain is rooted upright',
        build: () => {
            const chain = upwardChain([0, -2.5], 7, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.44, 0.44));
            fabrik2.setBaseboneConstraint(chain, fabrik2.BaseboneConstraintType.GLOBAL_ABSOLUTE, UP, 0.26, 0.26);
            return singleChain(chain);
        },
    },
    {
        name: 'World-space joints',
        hint: 'joints measured against a fixed world direction instead of the previous bone — every bone keeps its own heading',
        build: () => {
            // GLOBAL joints are absolute: this bone's heading is bounded, whatever the chain in
            // front of it does. LOCAL joints bound the bend between two bones instead.
            const chain = upwardChain([0, -2.5], 7, () => fabrik2.setGlobalJoint(fabrik2.createJoint2(), UP, 0.7, 0.7));
            fabrik2.setBaseboneConstraint(chain, fabrik2.BaseboneConstraintType.GLOBAL_ABSOLUTE, UP, 0.35, 0.35);
            return singleChain(chain);
        },
    },
    {
        name: 'Connected chains',
        hint: 'a trunk with two branches wired into a Structure2 — each branch base rides on a bone of the trunk',
        build: () => {
            // Caliko's 2D demo 6: a vertical trunk with a left and a right branch, both using
            // LOCAL_ABSOLUTE basebones, so each branch direction is read in its host bone's frame
            // and swings around with it
            const structure = fabrik2.createStructure2();

            const trunk = upwardChain([0, -2.8], 3, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.26, 0.26), 0.9);
            fabrik2.setBaseboneConstraint(trunk, fabrik2.BaseboneConstraintType.GLOBAL_ABSOLUTE, UP, 0.26, 0.26);
            fabrik2.addChain(structure, trunk);

            const left = fabrik2.createChain2();
            fabrik2.addBone(left, [0, 0], [-0.55, 0]);
            fabrik2.addConsecutiveBone(left, LEFT, 0.55, fabrik2.setLocalJoint(fabrik2.createJoint2(), 1.57, 1.57));
            fabrik2.addConsecutiveBone(left, LEFT, 0.55, fabrik2.setLocalJoint(fabrik2.createJoint2(), 1.57, 1.57));
            fabrik2.setBaseboneConstraint(left, fabrik2.BaseboneConstraintType.LOCAL_ABSOLUTE, LEFT, 0.26, 0.26);
            fabrik2.connectChain(structure, left, 0, 0, fabrik2.BoneConnectionPoint.END);

            const right = fabrik2.createChain2();
            fabrik2.addBone(right, [0, 0], [0.55, 0]);
            fabrik2.addConsecutiveBone(right, RIGHT, 0.55, fabrik2.setLocalJoint(fabrik2.createJoint2(), 1.05, 1.05));
            fabrik2.addConsecutiveBone(right, RIGHT, 0.55, fabrik2.setLocalJoint(fabrik2.createJoint2(), 1.57, 1.57));
            fabrik2.setBaseboneConstraint(right, fabrik2.BaseboneConstraintType.LOCAL_ABSOLUTE, RIGHT, 0.52, 0.52);
            fabrik2.connectChain(structure, right, 0, 1, fabrik2.BoneConnectionPoint.END);

            return structure;
        },
    },
    {
        name: 'Embedded targets',
        hint: 'five chains, each ignoring the pointer and reaching for a target of its own (yellow)',
        build: () => {
            const structure = fabrik2.createStructure2();

            for (let i = 0; i < 5; i++) {
                const x = (i - 2) * 1.8;
                const chain = upwardChain([x, -2.6], 5, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.52, 0.52));
                fabrik2.setBaseboneConstraint(chain, fabrik2.BaseboneConstraintType.GLOBAL_ABSOLUTE, UP, 0.44, 0.44);

                chain.useEmbeddedTarget = true;
                vec2.set(chain.embeddedTarget, x, 0);

                fabrik2.addChain(structure, chain);
            }

            return structure;
        },
        embeddedTargets(structure, t) {
            for (let i = 0; i < structure.chains.length; i++) {
                const chain = structure.chains[i];
                const x = (i - 2) * 1.8;
                // each chain's target runs its own little orbit, offset in phase from its neighbours
                vec2.set(chain.embeddedTarget, x + Math.cos(t * 1.1 + i) * 1.1, -0.4 + Math.sin(t * 0.8 + i * 0.7) * 1.5);
            }
            return structure.chains;
        },
    },
];

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
camera.position[2] = 11;
scene.add(camera);

function unproject(clientX: number, clientY: number): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    const halfH = camera.position[2] * Math.tan(FOV / 2);
    const halfW = halfH * (rect.width / rect.height);
    return [ndcX * halfW, ndcY * halfH];
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

/* pointer */

const target: Vec2 = [1.5, 1.5];
let pointerDown = false;
let everMoved = false; // until the pointer takes over, the target sweeps on its own

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

/* materials */

const position = g.attribute('position', d.vec3f);
const normal = g.attribute('normal', d.vec3f);

const world = g.mul(g.modelWorldMatrix, g.vec4(position, g.f32(1)));
const clip = g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, world));
const worldNormal = g.varying(g.normalize(g.mul(g.modelNormalMatrix, normal)), 'v_n');

const lightDirection = g.vec3(0.35, 0.6, 1.0).normalize();
const diffuse = g.Var('diffuse', worldNormal.dot(lightDirection).max(g.f32(0)));
const shade = g.Var('shade', g.f32(0.5).add(diffuse.mul(g.f32(0.6))));

function solidMaterial(r: number, gr: number, b: number): g.Material {
    return new g.Material({ vertex: clip, fragment: g.vec4(g.vec3(r, gr, b).mul(shade), g.f32(1)) });
}

// pink / yellow / blue / purple, matching the palette the other examples flow through
const CHAIN_MATERIALS = [
    solidMaterial(1.0, 0.243, 0.647),
    solidMaterial(1.0, 0.824, 0.247),
    solidMaterial(0.247, 0.655, 1.0),
    solidMaterial(0.541, 0.169, 0.886),
    solidMaterial(0.35, 0.85, 0.6),
];
const JOINT_MATERIAL = solidMaterial(0.13, 0.14, 0.18);

const boneGeometry = g.createCylinderGeometry(1, 1, 1, 14);
const jointGeometry = g.createSphereGeometry(1, 16, 12);

const BONE_RADIUS = 0.085;
const JOINT_RADIUS = 0.115;

/* the structure currently on screen, and the meshes drawn for it */

type ChainMeshes = { chain: fabrik2.Chain2; bones: g.Mesh[]; joints: g.Mesh[] };

let scenario = SCENARIOS[0];
let structure = scenario.build();
let chainMeshes: ChainMeshes[] = [];
let embeddedMeshes: g.Mesh[] = [];

const embeddedMaterial = new g.Material({ vertex: clip, fragment: g.vec4f(1, 0.85, 0.2, 1) });
const targetGeometry = g.createSphereGeometry(0.14, 18, 12);

function buildMeshes(): void {
    for (const entry of chainMeshes) {
        for (const mesh of entry.bones) scene.remove(mesh);
        for (const mesh of entry.joints) scene.remove(mesh);
    }
    for (const mesh of embeddedMeshes) scene.remove(mesh);

    chainMeshes = [];
    embeddedMeshes = [];

    for (let c = 0; c < structure.chains.length; c++) {
        const chain = structure.chains[c];
        const material = CHAIN_MATERIALS[c % CHAIN_MATERIALS.length];

        const bones: g.Mesh[] = [];
        const joints: g.Mesh[] = [];

        for (let b = 0; b < chain.bones.length; b++) {
            const bone = new g.Mesh(boneGeometry, material);
            bone.scale[0] = BONE_RADIUS;
            bone.scale[1] = chain.bones[b].length;
            bone.scale[2] = BONE_RADIUS;
            scene.add(bone);
            bones.push(bone);

            const joint = new g.Mesh(jointGeometry, JOINT_MATERIAL);
            joint.scale[0] = JOINT_RADIUS;
            joint.scale[1] = JOINT_RADIUS;
            joint.scale[2] = JOINT_RADIUS;
            scene.add(joint);
            joints.push(joint);
        }

        chainMeshes.push({ chain, bones, joints });

        if (chain.useEmbeddedTarget) {
            const mesh = new g.Mesh(targetGeometry, embeddedMaterial);
            scene.add(mesh);
            embeddedMeshes.push(mesh);
        }
    }
}

function updateMeshes(): void {
    for (const entry of chainMeshes) {
        for (let i = 0; i < entry.chain.bones.length; i++) {
            const bone = entry.chain.bones[i];
            const mesh = entry.bones[i];

            // the cylinder is centred on its own origin, so it sits at the bone's midpoint
            mesh.position[0] = (bone.start[0] + bone.end[0]) * 0.5;
            mesh.position[1] = (bone.start[1] + bone.end[1]) * 0.5;

            // in 2D the whole orientation is one angle about Z, straight off the bone. the cylinder
            // is built along +Y, so a bone pointing along +Y is angle zero
            const angle = fabrik2.getBoneAngle(entry.chain, i) - Math.PI / 2;
            mesh.quaternion[0] = 0;
            mesh.quaternion[1] = 0;
            mesh.quaternion[2] = Math.sin(angle * 0.5);
            mesh.quaternion[3] = Math.cos(angle * 0.5);

            const joint = entry.joints[i];
            joint.position[0] = bone.start[0];
            joint.position[1] = bone.start[1];
        }
    }
}

/* the pointer target */

const targetMesh = new g.Mesh(targetGeometry, new g.Material({ vertex: clip, fragment: g.vec4f(1, 1, 1, 1) }));
scene.add(targetMesh);

/* ui */

const names: Record<string, number> = {};
for (let i = 0; i < SCENARIOS.length; i++) names[SCENARIOS[i].name] = i;

const settings = { scenario: 0 };

const hint = document.createElement('div');
hint.className = 'mc-info';
hint.style.left = '16px';
hint.style.bottom = '16px';
hint.style.maxWidth = 'min(760px, calc(100vw - 32px))';
document.body.appendChild(hint);

function selectScenario(index: number): void {
    scenario = SCENARIOS[index];
    structure = scenario.build();
    buildMeshes();
    hint.textContent = `${scenario.name} — ${scenario.hint}`;
}

const panel = createPanel('fabrik 2d');
panel.add(settings, 'scenario', { options: names, label: 'Scenario' }).onChange((value) => selectScenario(value));
panel.monitor(() => structure.chains.map((chain) => chain.solveDistance.toFixed(2)).join('  '), { label: 'Shortfall' });

selectScenario(settings.scenario);

/* render */

const scenePass = g.pass(scene, camera);
const outputNode = g.fxaa(scenePass.getTextureNode());
const renderPipeline = new g.RenderPipeline(renderer, outputNode);

let clock = 0;
let lastT = performance.now();

function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    clock += dt;
    time.value = now / 1000;

    // idle: sweep the target until the pointer takes over
    if (!everMoved) {
        target[0] = Math.cos(clock * 0.7) * 3;
        target[1] = 1 + Math.sin(clock * 1.1) * 1.6;
    }

    targetMesh.position[0] = target[0];
    targetMesh.position[1] = target[1];

    const embedded = scenario.embeddedTargets?.(structure, clock);
    targetMesh.visible = embedded === undefined;

    if (embedded !== undefined) {
        for (let i = 0; i < embeddedMeshes.length; i++) {
            embeddedMeshes[i].position[0] = embedded[i].embeddedTarget[0];
            embeddedMeshes[i].position[1] = embedded[i].embeddedTarget[1];
        }
    }

    // the full solver: forward pass, backward pass, pinned base, iterated to a tolerance - and for
    // a structure, every chain in turn, so a connected chain always sees its host already posed
    fabrik2.solveStructure(structure, target);

    updateMeshes();

    scene.updateWorldMatrix();
    camera.updateViewMatrix();
    renderPipeline.render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
