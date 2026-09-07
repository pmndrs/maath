import { bench, group } from '@pmndrs/labs';
import type { Vec2 } from '../../src/core/vec2';
import * as fabrik2 from '../../src/ik/fabrik2';

// FABRIK inverse kinematics in 2D — a chain re-solved every frame, which is how
// a tail, rope or jointed arm is driven. Covers the shapes the solver actually
// runs in: a single forward pass (a follower, no base pin), a full converging
// solve, and solves with joint limits, where the per-joint wedge clamp is the
// work that dominates.
//
// A note on what these numbers include: the benches import from `src/`, where `import { vec2 } from
// '../core'` is a barrel re-export and every call through it goes via a namespace getter. That shows
// up as roughly a third of a profile here. The published build does not have it - rollup's
// `preserveModules` flattens the barrel into direct named imports, which you can see in
// `dist/ik/fabrik2.js` - so these timings are a pessimistic bound on what a consumer pays.

const BONES = 10;
const BONE_LENGTH = 1;

function makeChain(joint?: () => fabrik2.Joint2): fabrik2.Chain2 {
    const chain = fabrik2.createChain2();
    fabrik2.addBone(chain, [0, 0], [0, BONE_LENGTH]);
    for (let i = 1; i < BONES; i++) {
        // a hair off straight; a dead-straight chain is the solver's worst start
        fabrik2.addConsecutiveBone(chain, [0.035, 0.999], BONE_LENGTH, joint?.());
    }
    return chain;
}

// a target sweeping around inside the chain's reach, so each call starts from
// the previous pose exactly as a per-frame solve does
const target: Vec2 = [0, 0];

// an integer step rather than an accumulating float: a module-level `let`
// holding a double is boxed into a fresh HeapNumber on every write, which would
// show up as ~16 bytes/iter of allocation and hide the solver's own zero
let step = 0;

function advanceTarget(): Vec2 {
    step = (step + 1) % 100000;
    const phase = step * 0.05;
    const radius = BONES * BONE_LENGTH * 0.6;
    target[0] = Math.cos(phase) * radius;
    target[1] = Math.sin(phase * 0.7) * radius;
    return target;
}

group('fabrik2', () => {
    const follower = makeChain();
    bench('forward pass only, 10 bones', () => {
        fabrik2.forward(follower, advanceTarget());
    });

    const free = makeChain();
    bench('solve, 10 bones, unconstrained', () => {
        fabrik2.solve(free, advanceTarget());
    });

    const local = makeChain(() => fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.44, 0.44));
    bench('solve, 10 bones, local wedges', () => {
        fabrik2.solve(local, advanceTarget());
    });

    const asymmetric = makeChain(() => fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.1, 0.8));
    bench('solve, 10 bones, asymmetric wedges', () => {
        fabrik2.solve(asymmetric, advanceTarget());
    });

    const global = makeChain(() => fabrik2.setGlobalJoint(fabrik2.createJoint2(), [0, 1], 0.7, 0.7));
    bench('solve, 10 bones, world-space wedges', () => {
        fabrik2.solve(global, advanceTarget());
    });

    const long = (() => {
        const chain = fabrik2.createChain2();
        fabrik2.addBone(chain, [0, 0], [0, 0.25]);
        for (let i = 1; i < 60; i++) {
            fabrik2.addConsecutiveBone(chain, [0.035, 0.999], 0.25, fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.35, 0.35));
        }
        return chain;
    })();
    bench('forward pass only, 60 bones', () => {
        fabrik2.forward(long, advanceTarget());
    });
});

group('fabrik2 structure', () => {
    // a trunk with two branches, the shape a jointed prop or a plant takes
    const structure = fabrik2.createStructure2();

    const trunk = fabrik2.createChain2();
    fabrik2.addBone(trunk, [0, -2], [0, -1.2]);
    for (let i = 1; i < 3; i++) {
        fabrik2.addConsecutiveBone(trunk, [0.035, 0.999], 0.8, fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.26, 0.26));
    }
    fabrik2.setBaseboneConstraint(trunk, fabrik2.BaseboneConstraintType.GLOBAL_ABSOLUTE, [0, 1], 0.26, 0.26);
    fabrik2.addChain(structure, trunk);

    for (const side of [-1, 1]) {
        const branch = fabrik2.createChain2();
        fabrik2.addBone(branch, [0, 0], [side * 0.55, 0]);
        for (let i = 1; i < 3; i++) {
            fabrik2.addConsecutiveBone(branch, [side, 0], 0.55, fabrik2.setLocalJoint(fabrik2.createJoint2(), 1.05, 1.05));
        }
        fabrik2.setBaseboneConstraint(branch, fabrik2.BaseboneConstraintType.LOCAL_ABSOLUTE, [side, 0], 0.5, 0.5);
        fabrik2.connectChain(structure, branch, 0, side < 0 ? 0 : 1, fabrik2.BoneConnectionPoint.END);
    }

    bench('solve, trunk + 2 branches', () => {
        fabrik2.solveStructure(structure, advanceTarget());
    });
});
