import { bench, group } from '@pmndrs/labs';
import type { Vec3 } from '../../src/core/vec3';
import * as fabrik3 from '../../src/ik/fabrik3';

// FABRIK inverse kinematics — an IK chain re-solved every frame, which is how a
// limb, tentacle or robot arm is driven. Covers the three shapes the solver
// actually runs in: a single forward pass (a follower, no base pin), a full
// converging solve, and a solve with joint constraints, where the per-joint
// rotor/hinge work dominates.
//
// A note on what these numbers include: the benches import from `src/`, where `import { vec2 } from
// '../core'` is a barrel re-export and every call through it goes via a namespace getter. That shows
// up as roughly a third of a profile here. The published build does not have it - rollup's
// `preserveModules` flattens the barrel into direct named imports, which you can see in
// `dist/ik/fabrik2.js` - so these timings are a pessimistic bound on what a consumer pays.

const BONES = 10;
const BONE_LENGTH = 1;

function makeChain(joint?: () => fabrik3.Joint3): fabrik3.Chain3 {
    const chain = fabrik3.createChain3();
    fabrik3.addBone(chain, [0, 0, 0], [0, BONE_LENGTH, 0]);
    for (let i = 1; i < BONES; i++) {
        fabrik3.addConsecutiveBone(chain, [0, 1, 0], BONE_LENGTH, joint?.());
    }
    return chain;
}

// a target sweeping around inside the chain's reach, so each call starts from
// the previous pose exactly as a per-frame solve does
const target: Vec3 = [0, 0, 0];

// an integer step rather than an accumulating float: a module-level `let` holding a
// double is boxed into a fresh HeapNumber on every write, which would show up as
// ~16 bytes/iter of allocation in the heap column and hide the solver's own zero
let step = 0;

function advanceTarget(): Vec3 {
    step = (step + 1) % 100000;
    const phase = step * 0.05;
    const radius = BONES * BONE_LENGTH * 0.6;
    target[0] = Math.cos(phase) * radius;
    target[1] = Math.sin(phase * 0.7) * radius;
    target[2] = Math.sin(phase) * radius * 0.5;
    return target;
}

group('fabrik3', () => {
    const follower = makeChain();
    bench('forward pass only, 10 bones', () => {
        fabrik3.forward(follower, advanceTarget());
    });

    const free = makeChain();
    bench('solve, 10 bones, unconstrained', () => {
        fabrik3.solve(free, advanceTarget());
    });

    const ball = makeChain(() => fabrik3.setBallJoint(fabrik3.createJoint3(), Math.PI / 6));
    bench('solve, 10 bones, ball rotors', () => {
        fabrik3.solve(ball, advanceTarget());
    });

    const hinge = makeChain(() =>
        fabrik3.setHingeJoint(fabrik3.createJoint3(), fabrik3.JointType.GLOBAL_HINGE, [0, 0, 1], 0.6, 0.6, [0, 1, 0]),
    );
    bench('solve, 10 bones, global hinges', () => {
        fabrik3.solve(hinge, advanceTarget());
    });

    const local = makeChain(() =>
        fabrik3.setHingeJoint(fabrik3.createJoint3(), fabrik3.JointType.LOCAL_HINGE, [1, 0, 0], 0.6, 0.6, [0, 0, 1]),
    );
    bench('solve, 10 bones, local hinges', () => {
        fabrik3.solve(local, advanceTarget());
    });
});

group('fabrik3 structure', () => {
    // a body with six legs, each reaching for its own foothold — the shape a
    // walker's rig takes
    const structure = fabrik3.createStructure3();

    const body = fabrik3.createChain3();
    fabrik3.addBone(body, [0, 0, 0], [0, 1, 0]);
    fabrik3.addConsecutiveBone(body, [0, 1, 0], 1);
    fabrik3.addChain(structure, body);

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const out: Vec3 = [Math.cos(angle), 0, Math.sin(angle)];

        const leg = fabrik3.createChain3();
        fabrik3.addBone(leg, [0, 0, 0], out);
        fabrik3.addConsecutiveBone(leg, out, 1, fabrik3.setBallJoint(fabrik3.createJoint3(), Math.PI / 4));
        fabrik3.setBaseboneRotorConstraint(leg, fabrik3.BaseboneConstraintType.LOCAL_ROTOR, out, Math.PI / 3);

        leg.useEmbeddedTarget = true;
        leg.embeddedTarget[0] = out[0] * 1.8;
        leg.embeddedTarget[1] = -0.5;
        leg.embeddedTarget[2] = out[2] * 1.8;

        fabrik3.connectChain(structure, leg, 0, i % 2, fabrik3.BoneConnectionPoint.END);
    }

    bench('solve, body + 6 constrained legs', () => {
        fabrik3.solveStructure(structure, advanceTarget());
    });
});
