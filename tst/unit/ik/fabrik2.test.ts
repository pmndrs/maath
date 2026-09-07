import { describe, expect, it } from 'vitest';
import { type Vec2, vec2 } from '../../../src';
import { fabrik2 } from '../../../src/ik';

/** A chain of `count` unit bones running straight up from the origin. */
const chainOf = (count: number, joint?: () => fabrik2.Joint2): fabrik2.Chain2 => {
    const chain = fabrik2.createChain2();
    fabrik2.addBone(chain, [0, 0], [0, 1]);
    for (let i = 1; i < count; i++) {
        fabrik2.addConsecutiveBone(chain, [0, 1], 1, joint?.());
    }
    return chain;
};

const directionAt = (i: number): Vec2 => {
    const theta = i * 0.7919;
    return [Math.cos(theta), Math.sin(theta)];
};

const direction = (chain: fabrik2.Chain2, index: number): Vec2 => {
    const out: Vec2 = [0, 0];
    return fabrik2.getBoneDirection(out, chain, index);
};

/** Every bone finite, at its rest length, and sharing a point with its neighbour. */
const expectIntact = (chain: fabrik2.Chain2) => {
    for (let i = 0; i < chain.bones.length; i++) {
        const bone = chain.bones[i];

        expect(bone.start.every(Number.isFinite)).toBe(true);
        expect(bone.end.every(Number.isFinite)).toBe(true);
        expect(vec2.distance(bone.start, bone.end)).toBeCloseTo(bone.length, 9);

        if (i > 0) {
            expect(vec2.distance(chain.bones[i - 1].end, bone.start)).toBeLessThan(1e-12);
        }
    }
};

describe('fabrik2', () => {
    describe('addBone', () => {
        it('measures the bone length from the two points', () => {
            const chain = fabrik2.createChain2();
            const bone = fabrik2.addBone(chain, [0, 0], [3, 4]);
            expect(bone.length).toBeCloseTo(5);
            expect(chain.length).toBeCloseTo(5);
        });

        it('copies the points rather than aliasing the caller', () => {
            const chain = fabrik2.createChain2();
            const start: Vec2 = [0, 0];
            const bone = fabrik2.addBone(chain, start, [0, 1]);
            start[0] = 99;
            expect(bone.start[0]).toBe(0);
        });

        it('moves the base to the first bone start', () => {
            const chain = fabrik2.createChain2();
            fabrik2.addBone(chain, [1, 2], [1, 3]);
            expect(chain.base).toEqual([1, 2]);
        });
    });

    describe('solve', () => {
        it('places the effector on a reachable target', () => {
            // one chain per size, driven from its previous pose as an app does - see the note on
            // solve about starting from a dead-straight chain
            for (const count of [3, 5, 10]) {
                const chain = chainOf(count);

                for (let i = 0; i < 20; i++) {
                    const d = directionAt(i);
                    const reach = chain.length * 0.6;

                    expect(fabrik2.solve(chain, [d[0] * reach, d[1] * reach])).toBeLessThanOrEqual(chain.solveDistanceThreshold);
                    expectIntact(chain);
                }
            }
        });

        it('is at its weakest folding a dead-straight chain onto its own axis', () => {
            // the documented cold-start limitation: on a straight chain every direction lies on one
            // line, so there is nothing sideways to bend it with. this target sits about 4 degrees
            // off the chain's own axis and well inside its reach, which is the worst combination.
            const chain = chainOf(5);
            const target: Vec2 = [-0.194918, 2.993661];

            const cold = fabrik2.solve(chain, target);
            expect(cold).toBeGreaterThan(chain.solveDistanceThreshold);

            // it still lands close - within 1% of the chain's length
            expect(cold).toBeLessThan(chain.length * 0.01);

            // and continuing from the pose it reached gets there, which is why driving the chain
            // frame to frame never runs into this
            expect(fabrik2.solve(chain, target)).toBeLessThanOrEqual(chain.solveDistanceThreshold);
        });

        it('keeps the base pinned', () => {
            const chain = chainOf(5);
            fabrik2.setBaseLocation(chain, [1, 2]);
            fabrik2.solve(chain, [4, 4]);
            expect(vec2.distance(chain.bones[0].start, [1, 2])).toBeLessThan(1e-12);
        });

        it('lets the whole chain drift when the base is not fixed', () => {
            const chain = chainOf(4);
            chain.fixedBase = false;
            const target: Vec2 = [3, 1];
            fabrik2.solve(chain, target);
            expectIntact(chain);
            expect(vec2.distance(chain.bones[3].end, target)).toBeLessThan(chain.solveDistanceThreshold);
        });

        it('straightens toward an unreachable target and reports the shortfall', () => {
            for (const count of [2, 4, 7]) {
                const chain = chainOf(count);
                const d = directionAt(count * 5);
                const distance = chain.length * 3;

                expect(fabrik2.solve(chain, [d[0] * distance, d[1] * distance])).toBeCloseTo(distance - chain.length, 6);
                expectIntact(chain);

                for (let i = 0; i < count; i++) {
                    expect(vec2.angle(direction(chain, i), d)).toBeLessThan(1e-4);
                }
            }
        });

        it('stays intact through a full sweep of the target around the base', () => {
            const chain = chainOf(5, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.3, 0.3));

            for (let i = 0; i < 360; i++) {
                const a = (i * Math.PI) / 180;
                fabrik2.solve(chain, [Math.cos(a) * 3, Math.sin(a) * 3]);
                expectIntact(chain);
            }
        });

        it('reports infinity for a chain with no bones', () => {
            expect(fabrik2.solve(fabrik2.createChain2(), [1, 1])).toBe(Number.POSITIVE_INFINITY);
        });
    });

    describe('forward', () => {
        it('puts the effector exactly on the target, base be damned', () => {
            for (const count of [3, 8, 40]) {
                const chain = chainOf(count);
                for (let i = 0; i < 30; i++) {
                    const d = directionAt(i);
                    const target: Vec2 = [d[0] * 4, d[1] * 4];

                    fabrik2.forward(chain, target);

                    expect(vec2.distance(chain.bones[count - 1].end, target)).toBeLessThan(1e-12);
                    expectIntact(chain);
                }
            }
        });

        it('honours joint limits on its own, which is what a follower relies on', () => {
            const clockwise = 0.3;
            const anticlockwise = 0.5;
            const chain = chainOf(40, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), clockwise, anticlockwise));

            for (let i = 0; i < 60; i++) {
                const d = directionAt(i);
                fabrik2.forward(chain, [d[0] * 6, d[1] * 6]);
                expectIntact(chain);

                for (let bone = 1; bone < chain.bones.length; bone++) {
                    // a wedge is not symmetric, so this also pins down that the forward pass does
                    // not silently mirror the two limits
                    const signed = vec2.signedAngle(direction(chain, bone - 1), direction(chain, bone));
                    expect(signed).toBeGreaterThanOrEqual(-clockwise - 1e-6);
                    expect(signed).toBeLessThanOrEqual(anticlockwise + 1e-6);
                }
            }
        });
    });

    describe('local joints', () => {
        it('keeps the bend between bones inside the wedge, including asymmetric ones', () => {
            for (const [clockwise, anticlockwise] of [
                [0.2, 0.2],
                [0.1, 0.8],
                [0, 0.6],
            ]) {
                const chain = chainOf(8, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), clockwise, anticlockwise));

                for (let i = 0; i < 20; i++) {
                    const d = directionAt(i * 5);
                    fabrik2.solve(chain, [d[0] * 4, d[1] * 4]);
                    expectIntact(chain);

                    for (let bone = 1; bone < chain.bones.length; bone++) {
                        const signed = vec2.signedAngle(direction(chain, bone - 1), direction(chain, bone));
                        expect(signed).toBeGreaterThanOrEqual(-clockwise - 1e-6);
                        expect(signed).toBeLessThanOrEqual(anticlockwise + 1e-6);
                    }
                }
            }
        });

        it('clamps limits outside [0, PI]', () => {
            const joint = fabrik2.setLocalJoint(fabrik2.createJoint2(), -1, 10);
            expect(joint.clockwise).toBe(0);
            expect(joint.anticlockwise).toBe(Math.PI);
        });
    });

    describe('global joints', () => {
        it('pins a bone absolute heading however the bones before it move', () => {
            const axis: Vec2 = [1, 0];
            const clockwise = 0.2;
            const anticlockwise = 0.4;
            const chain = chainOf(6, () => fabrik2.setGlobalJoint(fabrik2.createJoint2(), axis, clockwise, anticlockwise));

            for (let i = 0; i < 25; i++) {
                const d = directionAt(i * 7);
                fabrik2.solve(chain, [d[0] * 3, d[1] * 3]);
                expectIntact(chain);

                for (let bone = 1; bone < chain.bones.length; bone++) {
                    const signed = vec2.signedAngle(axis, direction(chain, bone));
                    expect(signed).toBeGreaterThanOrEqual(-clockwise - 1e-6);
                    expect(signed).toBeLessThanOrEqual(anticlockwise + 1e-6);
                }
            }
        });
    });

    describe('basebone constraints', () => {
        it('holds the first bone inside a global wedge', () => {
            const axis: Vec2 = [0, 1];
            const clockwise = 0.25;
            const anticlockwise = 0.5;

            for (let i = 0; i < 20; i++) {
                const chain = chainOf(5);
                fabrik2.setBaseboneConstraint(
                    chain,
                    fabrik2.BaseboneConstraintType.GLOBAL_ABSOLUTE,
                    axis,
                    clockwise,
                    anticlockwise,
                );

                const d = directionAt(i * 3);
                fabrik2.solve(chain, [d[0] * 4, d[1] * 4]);
                expectIntact(chain);

                const signed = vec2.signedAngle(axis, direction(chain, 0));
                expect(signed).toBeGreaterThanOrEqual(-clockwise - 1e-6);
                expect(signed).toBeLessThanOrEqual(anticlockwise + 1e-6);
            }
        });
    });

    describe('degenerate input', () => {
        it('handles a target sitting on the base', () => {
            const chain = chainOf(4);
            fabrik2.solve(chain, [0, 0]);
            expectIntact(chain);
        });

        it('handles a zero-length bone', () => {
            const chain = fabrik2.createChain2();
            fabrik2.addBone(chain, [0, 0], [0, 0]);
            fabrik2.addBone(chain, [0, 0], [0, 1]);
            fabrik2.solve(chain, [1, 1]);
            expectIntact(chain);
        });

        it('handles a single-bone chain', () => {
            const chain = chainOf(1);
            expect(fabrik2.solve(chain, [0.6, 0.8])).toBeLessThanOrEqual(chain.solveDistanceThreshold);
            expectIntact(chain);
        });
    });

    describe('helpers', () => {
        it('reports the base as the effector of a chain with no bones', () => {
            const chain = fabrik2.createChain2();
            fabrik2.setBaseLocation(chain, [1, 2]);

            const out: Vec2 = [0, 0];
            fabrik2.getEffector(out, chain);
            expect(out).toEqual([1, 2]);
        });

        it('reports reachability against the chain length', () => {
            const chain = chainOf(3);
            expect(fabrik2.isReachable(chain, [0, 2])).toBe(true);
            expect(fabrik2.isReachable(chain, [0, 9])).toBe(false);
        });

        it('reports a bone angle measured from +X', () => {
            const chain = chainOf(2);
            expect(fabrik2.getBoneAngle(chain, 0)).toBeCloseTo(Math.PI / 2);
            fabrik2.straighten(chain, [1, 0]);
            expect(fabrik2.getBoneAngle(chain, 0)).toBeCloseTo(0);
        });

        it('writes the effector position', () => {
            const chain = chainOf(3);
            const out: Vec2 = [0, 0];
            fabrik2.getEffector(out, chain);
            expect(out[1]).toBeCloseTo(3);
        });
    });

    describe('structures', () => {
        it('keeps a connected chain pinned to its host even if fixedBase was cleared', () => {
            const structure = fabrik2.createStructure2();
            const host = chainOf(2);
            fabrik2.addChain(structure, host);

            const limb = fabrik2.createChain2();
            fabrik2.addBone(limb, [0, 0], [1, 0]);
            fabrik2.addConsecutiveBone(limb, [1, 0], 1);
            limb.fixedBase = false;
            fabrik2.connectChain(structure, limb, 0, 1, fabrik2.BoneConnectionPoint.END);

            for (let i = 0; i < 30; i++) {
                const d = directionAt(i);
                fabrik2.solveStructure(structure, [d[0] * 2, d[1] * 2]);
            }

            expect(vec2.distance(limb.bones[0].start, host.bones[1].end)).toBeLessThan(1e-9);
        });

        it('pins a connected chain to its host bone connection point', () => {
            const structure = fabrik2.createStructure2();
            const spine = chainOf(3);
            fabrik2.addChain(structure, spine);

            const atStart = fabrik2.createChain2();
            fabrik2.addBone(atStart, [0, 0], [1, 0]);
            fabrik2.addConsecutiveBone(atStart, [1, 0], 1);
            fabrik2.connectChain(structure, atStart, 0, 1, fabrik2.BoneConnectionPoint.START);

            const atEnd = fabrik2.createChain2();
            fabrik2.addBone(atEnd, [0, 0], [1, 0]);
            fabrik2.addConsecutiveBone(atEnd, [1, 0], 1);
            fabrik2.connectChain(structure, atEnd, 0, 1, fabrik2.BoneConnectionPoint.END);

            for (let i = 0; i < 15; i++) {
                const d = directionAt(i);
                fabrik2.solveStructure(structure, [d[0] * 2, d[1] * 2]);

                expectIntact(spine);
                expectIntact(atStart);
                expectIntact(atEnd);

                expect(vec2.distance(atStart.bones[0].start, spine.bones[1].start)).toBeLessThan(1e-9);
                expect(vec2.distance(atEnd.bones[0].start, spine.bones[1].end)).toBeLessThan(1e-9);
            }
        });

        it('points a local-relative basebone along the host bone', () => {
            const structure = fabrik2.createStructure2();
            const spine = chainOf(2);
            fabrik2.addChain(structure, spine);

            const limb = fabrik2.createChain2();
            fabrik2.addBone(limb, [0, 0], [1, 0]);
            fabrik2.addConsecutiveBone(limb, [1, 0], 1);
            fabrik2.setBaseboneConstraint(limb, fabrik2.BaseboneConstraintType.LOCAL_RELATIVE, [1, 0], 0.2, 0.2);
            fabrik2.connectChain(structure, limb, 0, 0, fabrik2.BoneConnectionPoint.END);

            for (let i = 0; i < 15; i++) {
                const d = directionAt(i * 4);
                fabrik2.solveStructure(structure, [d[0] * 2, d[1] * 2]);

                expectIntact(limb);
                // the baseline is the host bone itself, so the limb tracks it within the wedge
                expect(vec2.distance(limb.baseboneWorldAxis, direction(spine, 0))).toBeCloseTo(0);
                expect(Math.abs(vec2.signedAngle(limb.baseboneWorldAxis, direction(limb, 0)))).toBeLessThanOrEqual(0.2 + 1e-6);
            }
        });

        it('turns a local-absolute basebone with the host bone frame', () => {
            const structure = fabrik2.createStructure2();
            const spine = chainOf(2);
            fabrik2.addChain(structure, spine);

            const limb = fabrik2.createChain2();
            fabrik2.addBone(limb, [0, 0], [1, 0]);
            fabrik2.addConsecutiveBone(limb, [1, 0], 1);
            fabrik2.setBaseboneConstraint(limb, fabrik2.BaseboneConstraintType.LOCAL_ABSOLUTE, [1, 0], 0.2, 0.2);
            fabrik2.connectChain(structure, limb, 0, 0, fabrik2.BoneConnectionPoint.END);

            fabrik2.solveStructure(structure, [0, 2]);
            expectIntact(limb);

            // the host bone points up, which is the frame's own zero, so the axis is unturned
            expect(vec2.distance(limb.baseboneWorldAxis, [1, 0])).toBeCloseTo(0);
            expect(vec2.length(limb.baseboneWorldAxis)).toBeCloseTo(1);
        });
    });

    describe('addBoneAtBase', () => {
        it('extends the chain backward and moves the base', () => {
            const chain = chainOf(3);
            const bone = fabrik2.addBoneAtBase(chain, [0, 1], 2);

            expect(chain.bones.length).toBe(4);
            expect(chain.bones[0]).toBe(bone);
            expect(chain.length).toBeCloseTo(5);
            expect(bone.end).toEqual([0, 0]);
            expect(vec2.distance(bone.start, [0, -2])).toBeCloseTo(0);
            expect(vec2.distance(chain.base, [0, -2])).toBeCloseTo(0);
            expectIntact(chain);
        });

        it('hands the joint to the bone the new one now joins onto', () => {
            const chain = chainOf(2);
            const joint = fabrik2.setLocalJoint(fabrik2.createJoint2(), 0.4, 0.4);
            fabrik2.addBoneAtBase(chain, [0, 1], 1, joint);

            expect(chain.bones[1].joint).toBe(joint);
        });

        it('keeps a growing follower inside its joint limits', () => {
            // this is the snake: forward pass only, growing at the tail
            const limit = 0.35;
            const chain = chainOf(2, () => fabrik2.setLocalJoint(fabrik2.createJoint2(), limit, limit));

            for (let i = 0; i < 30; i++) {
                fabrik2.addBoneAtBase(chain, [0, 1], 0.5, fabrik2.setLocalJoint(fabrik2.createJoint2(), limit, limit));

                const d = directionAt(i);
                fabrik2.forward(chain, [d[0] * 4, d[1] * 4]);
                expectIntact(chain);

                for (let bone = 1; bone < chain.bones.length; bone++) {
                    expect(Math.abs(vec2.signedAngle(direction(chain, bone - 1), direction(chain, bone)))).toBeLessThanOrEqual(
                        limit + 1e-6,
                    );
                }
            }
        });

        it('grows the best-solution scratch so solve stays allocation-free', () => {
            const chain = chainOf(2);
            fabrik2.addBoneAtBase(chain, [0, 1], 1);
            expect(chain.bestSolution.length).toBe(chain.bones.length * 4);
            fabrik2.solve(chain, [1, 1]);
            expectIntact(chain);
        });
    });

    describe('robustness', () => {
        it('leaves the chain untouched for a non-finite target, rather than poisoning it', () => {
            const chain = chainOf(3);
            fabrik2.solve(chain, [1, 1]);
            const before = chain.bones.map((bone) => [...bone.end]);

            for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
                fabrik2.solve(chain, [bad, 0]);
                expectIntact(chain);
            }

            for (let i = 0; i < chain.bones.length; i++) {
                expect(vec2.distance(chain.bones[i].end, before[i] as Vec2)).toBeCloseTo(0);
            }
        });

        it('recovers if a pose is somehow poisoned from outside', () => {
            const chain = chainOf(4);
            chain.bones[1].end[0] = Number.NaN;
            chain.bones[2].start[0] = Number.NaN;

            for (let i = 0; i < 3; i++) fabrik2.solve(chain, [1, 2]);

            expectIntact(chain);
        });

        it('ignores a directionless constraint axis instead of storing NaN', () => {
            const chain = chainOf(3);
            fabrik2.setBaseboneConstraint(chain, fabrik2.BaseboneConstraintType.GLOBAL_ABSOLUTE, [0, 0], 0.3, 0.3);
            expect(vec2.length(chain.baseboneAxis)).toBeCloseTo(1);

            fabrik2.solve(chain, [1, 1]);
            expectIntact(chain);
        });

        it('ignores a directionless global joint axis instead of storing NaN', () => {
            const joint = fabrik2.setGlobalJoint(fabrik2.createJoint2(), [0, 0], 0.4, 0.4);
            expect(vec2.length(joint.globalAxis)).toBeCloseTo(1);
        });
    });
});
