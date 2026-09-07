import * as g from 'gpucat';
import { d } from 'gpucat';
import { type Vec3, vec3 } from 'math';
import { fabrik3 } from 'math/ik';
import { createPanel } from './common/dash';
import { time } from './common/rainbow';
import { createRenderer } from './common/renderer';

// A gallery of 3D IK setups solved with math's FABRIK solver, following the scenarios in Caliko's
// own demo app - Caliko being the reference implementation that accompanies Aristidou & Lasenby's
// FABRIK paper, and the thing math/ik's constraint model is modelled on.
//
// Pick a scenario in the panel. Every one solves the same way, with fabrik3.solveStructure against
// the orbiting white target. The only thing that changes is how the joints are constrained.
//
//   Unconstrained            free ball joints - the chain reaches, but any which way
//   Ball joint rotors        each bone held within a cone of the one before it
//   Freely rotating hinges   bones flattened into a plane, free to spin within it
//   Hinges with limits       the same, but also bounded either side of a reference direction
//   Local hinges             hinge axes read in the PREVIOUS bone's frame, so they travel with it
//   Connected chains         a second chain hanging off a bone of the first (a Structure3)
//   Embedded targets         ...where that second chain reaches for a target of its own
//
// The last two are the structure solver: chains connected to a host bone, whose base is carried by
// whatever the host is doing and whose basebone constraint is resolved into the host's frame.
//
// Bones are drawn as cylinders oriented straight from the solver by fabrik3.getBoneRotation, which
// returns the rotation taking a mesh's own axis (+Y, the axis gpucat's cylinder is built along)
// onto the bone. That one call is the entire marshalling step between solver and renderer.

const UP: Vec3 = [0, 1, 0];
const X_AXIS: Vec3 = [1, 0, 0];
const Y_AXIS: Vec3 = [0, 1, 0];
const Z_AXIS: Vec3 = [0, 0, 1];

// the fan has to sit inside its own reach: a chain based CHAIN_RADIUS out from the middle needs
// BONES_PER_CHAIN * BONE_LENGTH to cover CHAIN_RADIUS plus the target's orbit, or the far chains
// spend the whole demo stretched out and short of the target
const BONE_LENGTH = 0.55;
const BONES_PER_CHAIN = 8;
const CHAIN_RADIUS = 1;

/* scenarios */

type Scenario = {
    name: string;
    hint: string;
    build(): fabrik3.Structure3;
    /** moves any embedded targets on; returns the ones to draw */
    embeddedTargets?(structure: fabrik3.Structure3, t: number): fabrik3.Chain3[];
};

/** The starting direction for a chain `index` of `count`, fanned around the Y axis. */
function fanDirection(index: number, count: number): Vec3 {
    const angle = (index / count) * Math.PI * 2;
    return [Math.cos(angle), 0, Math.sin(angle)];
}

/**
 * Three chains fanned outward, each bone built by `joint`.
 *
 * Caliko's 3D demos are all shaped like this - a ring of chains so you can see a constraint acting
 * from several directions at once.
 */
function fannedChains(
    count: number,
    joint: (chainIndex: number, boneIndex: number) => fabrik3.Joint3 | undefined,
): fabrik3.Structure3 {
    const structure = fabrik3.createStructure3();

    for (let c = 0; c < count; c++) {
        const outward = fanDirection(c, count);
        const chain = fabrik3.createChain3();

        const start: Vec3 = [outward[0] * CHAIN_RADIUS, -1, outward[2] * CHAIN_RADIUS];
        fabrik3.addBone(chain, start, [start[0], start[1] + BONE_LENGTH, start[2]]);

        // a hair off straight - a dead-straight chain is the solver's worst starting pose
        const bend: Vec3 = [0.0349, 0.9994, 0];

        for (let b = 1; b < BONES_PER_CHAIN; b++) {
            fabrik3.addConsecutiveBone(chain, bend, BONE_LENGTH, joint(c, b));
        }

        fabrik3.addChain(structure, chain);
    }

    return structure;
}

const SCENARIOS: Scenario[] = [
    {
        name: 'Unconstrained',
        hint: 'free ball joints — the chains reach the target, but the pose is whatever the maths lands on',
        build: () => fannedChains(3, () => undefined),
    },
    {
        name: 'Ball joint rotors',
        hint: 'each bone confined to a 45° cone about the bone before it — the chains curve instead of kinking',
        build: () => fannedChains(3, () => fabrik3.setBallJoint(fabrik3.createJoint3(), Math.PI / 4)),
    },
    {
        name: 'Freely rotating hinges',
        hint: 'every bone flattened into its hinge plane — each chain is stuck in a 2D slice of the world',
        build: () =>
            fannedChains(3, (chainIndex) => {
                // one plane per chain, so you can see the flattening from three angles at once
                const axis = chainIndex === 0 ? X_AXIS : chainIndex === 1 ? Y_AXIS : Z_AXIS;
                const reference = chainIndex === 1 ? X_AXIS : Y_AXIS;
                return fabrik3.setHingeJoint(
                    fabrik3.createJoint3(),
                    fabrik3.JointType.GLOBAL_HINGE,
                    axis,
                    Math.PI,
                    Math.PI,
                    reference,
                );
            }),
    },
    {
        name: 'Hinges with limits',
        hint: 'the same hinges, now bounded 90° clockwise and 45° anticlockwise of a reference direction',
        build: () =>
            fannedChains(3, (chainIndex) => {
                const axis = chainIndex === 0 ? X_AXIS : chainIndex === 1 ? Y_AXIS : Z_AXIS;
                const reference = chainIndex === 1 ? X_AXIS : Y_AXIS;
                return fabrik3.setHingeJoint(
                    fabrik3.createJoint3(),
                    fabrik3.JointType.GLOBAL_HINGE,
                    axis,
                    Math.PI / 2,
                    Math.PI / 4,
                    reference,
                );
            }),
    },
    {
        name: 'Local hinges',
        hint: "hinge axes read in the previous bone's frame, so each plane travels with the bone before it",
        build: () =>
            fannedChains(3, (_chainIndex, boneIndex) => {
                // alternate hinged and free bones, as Caliko's demo 7 does, so the hinge is legible
                if (boneIndex % 2 !== 0) return undefined;
                // local +Z is the PREVIOUS bone's own direction, so +X is an axis the next bone can
                // actually swing about and +Z is "straight on" for the limits to be measured from
                return fabrik3.setHingeJoint(
                    fabrik3.createJoint3(),
                    fabrik3.JointType.LOCAL_HINGE,
                    X_AXIS,
                    Math.PI / 2,
                    Math.PI / 2,
                    Z_AXIS,
                );
            }),
    },
    {
        name: 'Connected chains',
        hint: 'a second chain hanging off bone 3 of the first — its base is carried wherever the host bone goes',
        build: () => {
            const structure = fabrik3.createStructure3();

            const host = fabrik3.createChain3();
            fabrik3.addBone(host, [0, -1.5, 0], [0, -1.5 + BONE_LENGTH, 0]);
            for (let i = 1; i < 8; i++) {
                fabrik3.addConsecutiveBone(host, [0.0349, 0.9994, 0], BONE_LENGTH);
            }
            fabrik3.addChain(structure, host);

            const branch = fabrik3.createChain3();
            fabrik3.addBone(branch, [0, 0, 0], [BONE_LENGTH, 0, 0]);
            for (let i = 1; i < 4; i++) {
                fabrik3.addConsecutiveBone(
                    branch,
                    X_AXIS,
                    BONE_LENGTH,
                    fabrik3.setBallJoint(fabrik3.createJoint3(), Math.PI / 3),
                );
            }
            // a freely rotating global hinge about Y for the basebone, as Caliko's demo does
            fabrik3.setBaseboneHingeConstraint(
                branch,
                fabrik3.BaseboneConstraintType.GLOBAL_HINGE,
                Y_AXIS,
                Math.PI,
                Math.PI,
                X_AXIS,
            );

            fabrik3.connectChain(structure, branch, 0, 3, fabrik3.BoneConnectionPoint.START);

            return structure;
        },
    },
    {
        name: 'Embedded targets',
        hint: 'the connected chain reaches for its OWN orbiting target (yellow) while the host chases the white one',
        build: () => {
            const structure = fabrik3.createStructure3();

            const host = fabrik3.createChain3();
            fabrik3.addBone(host, [0, -1.5, 0], [0, -1.5 + BONE_LENGTH, 0]);
            for (let i = 1; i < 8; i++) {
                fabrik3.addConsecutiveBone(host, [0.0349, 0.9994, 0], BONE_LENGTH);
            }
            fabrik3.addChain(structure, host);

            const branch = fabrik3.createChain3();
            fabrik3.addBone(branch, [0, 0, 0], [BONE_LENGTH, 0, 0]);
            for (let i = 1; i < 4; i++) {
                fabrik3.addConsecutiveBone(branch, X_AXIS, BONE_LENGTH);
            }
            fabrik3.setBaseboneHingeConstraint(
                branch,
                fabrik3.BaseboneConstraintType.GLOBAL_HINGE,
                Y_AXIS,
                Math.PI / 2,
                Math.PI / 4,
                X_AXIS,
            );

            // this chain ignores the structure target and solves for its own
            branch.useEmbeddedTarget = true;
            vec3.set(branch.embeddedTarget, 1.5, 0, 1.5);

            fabrik3.connectChain(structure, branch, 0, 3, fabrik3.BoneConnectionPoint.START);

            return structure;
        },
        embeddedTargets(structure, t) {
            const branch = structure.chains[1];
            vec3.set(branch.embeddedTarget, Math.cos(t * 0.9) * 1.6, Math.sin(t * 0.5) * 1.2, Math.sin(t * 0.9) * 1.6);
            return [branch];
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

const camera = new g.PerspectiveCamera(Math.PI / 4, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position[0] = 4.6;
camera.position[1] = 3.2;
camera.position[2] = 6.4;
scene.add(camera);

const controls = new g.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

/* materials - one solid colour per chain, plus a dark one for the joints */

const position = g.attribute('position', d.vec3f);
const normal = g.attribute('normal', d.vec3f);

const world = g.mul(g.modelWorldMatrix, g.vec4(position, g.f32(1)));
const clip = g.mul(g.cameraProjectionMatrix, g.mul(g.cameraViewMatrix, world));
const worldNormal = g.varying(g.normalize(g.mul(g.modelNormalMatrix, normal)), 'v_n');

const lightDirection = g.vec3(0.5, 1.0, 0.7).normalize();
const diffuse = g.Var('diffuse', worldNormal.dot(lightDirection).max(g.f32(0)));
const shade = g.Var('shade', g.f32(0.42).add(diffuse.mul(g.f32(0.7))));

function solidMaterial(r: number, gr: number, b: number): g.Material {
    return new g.Material({ vertex: clip, fragment: g.vec4(g.vec3(r, gr, b).mul(shade), g.f32(1)) });
}

// pink / yellow / blue, matching the palette the other examples flow through
const CHAIN_MATERIALS = [solidMaterial(1.0, 0.243, 0.647), solidMaterial(1.0, 0.824, 0.247), solidMaterial(0.247, 0.655, 1.0)];
const BRANCH_MATERIAL = solidMaterial(0.541, 0.169, 0.886);
const JOINT_MATERIAL = solidMaterial(0.13, 0.14, 0.18);

const boneGeometry = g.createCylinderGeometry(1, 1, 1, 16);
const jointGeometry = g.createSphereGeometry(1, 16, 12);

const BONE_RADIUS = 0.07;
const JOINT_RADIUS = 0.1;

/* the structure currently on screen, and the meshes drawn for it */

type ChainMeshes = { chain: fabrik3.Chain3; bones: g.Mesh[]; joints: g.Mesh[] };

let scenario = SCENARIOS[0];
let structure = scenario.build();
let chainMeshes: ChainMeshes[] = [];

function buildMeshes(): void {
    for (const entry of chainMeshes) {
        for (const mesh of entry.bones) scene.remove(mesh);
        for (const mesh of entry.joints) scene.remove(mesh);
    }
    chainMeshes = [];

    for (let c = 0; c < structure.chains.length; c++) {
        const chain = structure.chains[c];
        // a connected chain gets its own colour so the structure reads as two pieces
        const material = structure.connections[c].hostChain >= 0 ? BRANCH_MATERIAL : CHAIN_MATERIALS[c % CHAIN_MATERIALS.length];

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
            mesh.position[2] = (bone.start[2] + bone.end[2]) * 0.5;

            // the whole orientation, in one call, straight into the mesh's quaternion
            fabrik3.getBoneRotation(mesh.quaternion, entry.chain, i, UP);

            const joint = entry.joints[i];
            joint.position[0] = bone.start[0];
            joint.position[1] = bone.start[1];
            joint.position[2] = bone.start[2];
        }
    }
}

/* targets */

const targetGeometry = g.createSphereGeometry(0.13, 20, 14);
const targetMesh = new g.Mesh(targetGeometry, new g.Material({ vertex: clip, fragment: g.vec4f(1, 1, 1, 1) }));
scene.add(targetMesh);

const embeddedMesh = new g.Mesh(targetGeometry, new g.Material({ vertex: clip, fragment: g.vec4f(1, 0.85, 0.2, 1) }));
scene.add(embeddedMesh);

/* ui */

const names: Record<string, number> = {};
for (let i = 0; i < SCENARIOS.length; i++) names[SCENARIOS[i].name] = i;

const settings = { scenario: 0, speed: 1, reach: 1.5, height: 1 };

const hint = document.createElement('div');
hint.className = 'mc-info';
hint.style.left = '16px';
hint.style.bottom = '16px';
hint.style.maxWidth = 'min(720px, calc(100vw - 32px))';
document.body.appendChild(hint);

function selectScenario(index: number): void {
    scenario = SCENARIOS[index];
    structure = scenario.build();
    buildMeshes();
    hint.textContent = `${scenario.name} — ${scenario.hint}`;
}

const panel = createPanel('fabrik 3d');
panel.add(settings, 'scenario', { options: names, label: 'Scenario' }).onChange((value) => selectScenario(value));
panel.add(settings, 'speed', { min: 0, max: 3, step: 0.01, label: 'Speed' });
panel.add(settings, 'reach', { min: 0.5, max: 4, step: 0.01, label: 'Orbit radius' });
panel.add(settings, 'height', { min: -1, max: 3, step: 0.01, label: 'Target height' });
panel.monitor(() => structure.chains.map((chain) => chain.solveDistance.toFixed(2)).join('  '), { label: 'Shortfall' });

selectScenario(settings.scenario);

/* render */

const scenePass = g.pass(scene, camera);
const outputNode = g.fxaa(scenePass.getTextureNode());
const renderPipeline = new g.RenderPipeline(renderer, outputNode);

const target: Vec3 = [0, 0, 0];

let clock = 0;
let lastT = performance.now();

function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    clock += dt * settings.speed;
    time.value = now / 1000;

    target[0] = Math.cos(clock * 0.6) * settings.reach;
    target[1] = settings.height + Math.sin(clock * 1.3) * 0.8;
    target[2] = Math.sin(clock * 0.9) * settings.reach;

    targetMesh.position[0] = target[0];
    targetMesh.position[1] = target[1];
    targetMesh.position[2] = target[2];

    const embedded = scenario.embeddedTargets?.(structure, clock);
    embeddedMesh.visible = embedded !== undefined;
    if (embedded !== undefined) {
        embeddedMesh.position[0] = embedded[0].embeddedTarget[0];
        embeddedMesh.position[1] = embedded[0].embeddedTarget[1];
        embeddedMesh.position[2] = embedded[0].embeddedTarget[2];
    }

    // one call solves every chain, walking them in order so a connected chain always sees its
    // host already posed
    fabrik3.solveStructure(structure, target);

    updateMeshes();

    controls.update();
    scene.updateWorldMatrix();
    renderPipeline.render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
