import { describe, expect, it } from 'vitest';
import { type Mat3, mat3, type Vec3, vec3 } from '../../../src';
import { fabrik3 } from '../../../src/ik';

/** A chain of `count` unit bones running straight up from the origin. */
const chainOf = (count: number, joint?: () => fabrik3.Joint3): fabrik3.Chain3 => {
    const chain = fabrik3.createChain3();
    fabrik3.addBone(chain, [0, 0, 0], [0, 1, 0]);
    for (let i = 1; i < count; i++) {
        fabrik3.addConsecutiveBone(chain, [0, 1, 0], 1, joint?.());
    }
    return chain;
};

/** A spread of unit directions, deterministic and not axis-aligned. */
const directionAt = (i: number): Vec3 => {
    const theta = i * 0.7919;
    const z = ((i % 13) / 12) * 2 - 1;
    const r = Math.sqrt(1 - z * z);
    return [r * Math.cos(theta), r * Math.sin(theta), z];
};

const direction = (chain: fabrik3.Chain3, index: number): Vec3 => {
    const out: Vec3 = [0, 0, 0];
    return fabrik3.getBoneDirection(out, chain, index);
};

/** Every bone finite, at its rest length, and sharing a point with its neighbour. */
const expectIntact = (chain: fabrik3.Chain3) => {
    for (let i = 0; i < chain.bones.length; i++) {
        const bone = chain.bones[i];

        expect(bone.start.every(Number.isFinite)).toBe(true);
        expect(bone.end.every(Number.isFinite)).toBe(true);
        expect(vec3.distance(bone.start, bone.end)).toBeCloseTo(bone.length, 9);

        if (i > 0) {
            expect(vec3.distance(chain.bones[i - 1].end, bone.start)).toBeLessThan(1e-12);
        }
    }
};

describe('fabrik3', () => {
    describe('addBone', () => {
        it('measures the bone length from the two points', () => {
            const chain = fabrik3.createChain3();
            const bone = fabrik3.addBone(chain, [0, 0, 0], [3, 4, 0]);
            expect(bone.length).toBeCloseTo(5);
            expect(chain.length).toBeCloseTo(5);
        });

        it('copies the points rather than aliasing the caller', () => {
            const chain = fabrik3.createChain3();
            const start: Vec3 = [0, 0, 0];
            const bone = fabrik3.addBone(chain, start, [0, 1, 0]);
            start[0] = 99;
            expect(bone.start[0]).toBe(0);
        });

        it('moves the base to the first bone start', () => {
            const chain = fabrik3.createChain3();
            fabrik3.addBone(chain, [1, 2, 3], [1, 3, 3]);
            expect(chain.base).toEqual([1, 2, 3]);
        });

        it('accumulates the chain reach', () => {
            const chain = chainOf(5);
            expect(chain.length).toBeCloseTo(5);
        });
    });

    describe('solve', () => {
        it('places the effector on a reachable target', () => {
            for (const count of [2, 3, 5, 10]) {
                for (let i = 0; i < 20; i++) {
                    const chain = chainOf(count);
                    const d = directionAt(i);
                    const reach = chain.length * 0.6;
                    const target: Vec3 = [d[0] * reach, d[1] * reach, d[2] * reach];

                    expect(fabrik3.solve(chain, target)).toBeLessThanOrEqual(chain.solveDistanceThreshold);
                    expectIntact(chain);
                }
            }
        });

        it('preserves every bone length', () => {
            const chain = chainOf(6);
            for (let i = 0; i < 20; i++) {
                const d = directionAt(i * 3);
                fabrik3.solve(chain, [d[0] * 4, d[1] * 4, d[2] * 4]);
                expectIntact(chain);
            }
        });

        it('keeps the base pinned', () => {
            const chain = chainOf(5);
            fabrik3.setBaseLocation(chain, [1, 2, 3]);
            fabrik3.solve(chain, [5, 5, 5]);
            expect(vec3.distance(chain.bones[0].start, [1, 2, 3])).toBeLessThan(1e-12);
        });

        it('lets the whole chain drift when the base is not fixed', () => {
            const chain = chainOf(4);
            chain.fixedBase = false;
            const target: Vec3 = [3, 1, 0];
            fabrik3.solve(chain, target);
            expectIntact(chain);
            expect(vec3.distance(chain.bones[3].end, target)).toBeLessThan(chain.solveDistanceThreshold);
        });

        it('straightens toward an unreachable target and reports the shortfall', () => {
            for (const count of [2, 4, 7]) {
                const chain = chainOf(count);
                const d = directionAt(count * 5);
                const distance = chain.length * 3;
                const target: Vec3 = [d[0] * distance, d[1] * distance, d[2] * distance];

                expect(fabrik3.solve(chain, target)).toBeCloseTo(distance - chain.length, 6);
                expectIntact(chain);

                // every bone points straight at the target
                for (let i = 0; i < count; i++) {
                    expect(vec3.angle(direction(chain, i), d)).toBeLessThan(1e-4);
                }
            }
        });

        it('does not degrade when re-solving an already solved chain', () => {
            const chain = chainOf(6);
            const target: Vec3 = [2, 2, 1];
            const first = fabrik3.solve(chain, target);
            expect(fabrik3.solve(chain, target)).toBeLessThanOrEqual(first + 1e-9);
        });

        it('reports infinity for a chain with no bones', () => {
            expect(fabrik3.solve(fabrik3.createChain3(), [1, 1, 1])).toBe(Number.POSITIVE_INFINITY);
        });

        it('tracks the last solve distance on the chain', () => {
            const chain = chainOf(4);
            const distance = fabrik3.solve(chain, [1, 1, 0]);
            expect(chain.solveDistance).toBe(distance);
        });
    });

    describe('forward', () => {
        it('puts the effector exactly on the target, base be damned', () => {
            for (const count of [3, 8, 30]) {
                const chain = chainOf(count);
                for (let i = 0; i < 30; i++) {
                    const d = directionAt(i);
                    const target: Vec3 = [d[0] * 4, d[1] * 4, d[2] * 4];

                    fabrik3.forward(chain, target);

                    expect(vec3.distance(chain.bones[count - 1].end, target)).toBeLessThan(1e-12);
                    expectIntact(chain);
                }
            }
        });

        it('honours ball rotors on its own, which is what a follower relies on', () => {
            const rotor = Math.PI / 6;
            const chain = chainOf(20, () => fabrik3.setBallJoint(fabrik3.createJoint3(), rotor));

            for (let i = 0; i < 40; i++) {
                const d = directionAt(i * 2);
                fabrik3.forward(chain, [d[0] * 5, d[1] * 5, d[2] * 5]);
                expectIntact(chain);

                for (let bone = 1; bone < chain.bones.length; bone++) {
                    expect(vec3.angle(direction(chain, bone - 1), direction(chain, bone))).toBeLessThanOrEqual(rotor + 1e-6);
                }
            }
        });
    });

    describe('ball joints', () => {
        it('keeps consecutive bones within the rotor under a full solve', () => {
            for (const rotor of [Math.PI / 12, Math.PI / 6, Math.PI / 3]) {
                const chain = chainOf(8, () => fabrik3.setBallJoint(fabrik3.createJoint3(), rotor));

                for (let i = 0; i < 20; i++) {
                    const d = directionAt(i * 5);
                    fabrik3.solve(chain, [d[0] * 4, d[1] * 4, d[2] * 4]);
                    expectIntact(chain);

                    for (let bone = 1; bone < chain.bones.length; bone++) {
                        expect(vec3.angle(direction(chain, bone - 1), direction(chain, bone))).toBeLessThanOrEqual(rotor + 1e-6);
                    }
                }
            }
        });

        it('clamps a rotor outside [0, PI]', () => {
            const joint = fabrik3.setBallJoint(fabrik3.createJoint3(), -1);
            expect(joint.rotor).toBe(0);
            expect(fabrik3.setBallJoint(joint, 10).rotor).toBe(Math.PI);
        });
    });

    describe('hinge joints', () => {
        const axis: Vec3 = [0, 0, 1];
        const reference: Vec3 = [0, 1, 0];

        it('confines bones to the hinge plane and within its limits', () => {
            const clockwise = 0.4;
            const anticlockwise = 0.7;
            const chain = chainOf(6, () =>
                fabrik3.setHingeJoint(
                    fabrik3.createJoint3(),
                    fabrik3.JointType.GLOBAL_HINGE,
                    axis,
                    clockwise,
                    anticlockwise,
                    reference,
                ),
            );

            for (let i = 0; i < 25; i++) {
                const d = directionAt(i * 7);
                fabrik3.solve(chain, [d[0] * 3, d[1] * 3, d[2] * 3]);
                expectIntact(chain);

                for (let bone = 1; bone < chain.bones.length; bone++) {
                    const boneDirection = direction(chain, bone);

                    expect(Math.abs(vec3.dot(boneDirection, axis))).toBeLessThan(1e-6);

                    const signed = vec3.signedAngle(reference, boneDirection, axis);
                    expect(signed).toBeGreaterThanOrEqual(-clockwise - 1e-6);
                    expect(signed).toBeLessThanOrEqual(anticlockwise + 1e-6);
                }
            }
        });

        it('orthonormalizes a reference axis that is not perpendicular to the hinge', () => {
            const joint = fabrik3.setHingeJoint(fabrik3.createJoint3(), fabrik3.JointType.GLOBAL_HINGE, axis, 1, 1, [0, 1, 5]);
            expect(vec3.dot(joint.referenceAxis, joint.rotationAxis)).toBeCloseTo(0);
            expect(vec3.length(joint.referenceAxis)).toBeCloseTo(1);
        });

        it('survives a bone pointing straight down its own hinge axis', () => {
            // the projection onto the hinge plane vanishes here, so there is no in-plane direction
            // to normalize and the solver must fall back to the reference axis
            const chain = fabrik3.createChain3();
            fabrik3.addBone(chain, [0, 0, 0], [0, 1, 0]);
            fabrik3.addConsecutiveBone(
                chain,
                [0, 1, 0],
                1,
                fabrik3.setHingeJoint(
                    fabrik3.createJoint3(),
                    fabrik3.JointType.GLOBAL_HINGE,
                    [0, 1, 0],
                    Math.PI,
                    Math.PI,
                    [1, 0, 0],
                ),
            );

            fabrik3.solve(chain, [0, 2, 0]);
            expectIntact(chain);
        });

        it('solves a local hinge without losing chain integrity', () => {
            const chain = chainOf(5, () =>
                fabrik3.setHingeJoint(fabrik3.createJoint3(), fabrik3.JointType.LOCAL_HINGE, [1, 0, 0], 0.5, 0.5, [0, 0, 1]),
            );

            for (let i = 0; i < 25; i++) {
                const d = directionAt(i * 11);
                fabrik3.solve(chain, [d[0] * 3, d[1] * 3, d[2] * 3]);
                expectIntact(chain);
            }
        });
    });

    describe('basebone constraints', () => {
        it('holds the first bone inside a global rotor cone', () => {
            const axis: Vec3 = [0, 1, 0];
            const rotor = Math.PI / 8;

            for (let i = 0; i < 20; i++) {
                const chain = chainOf(5);
                fabrik3.setBaseboneRotorConstraint(chain, fabrik3.BaseboneConstraintType.GLOBAL_ROTOR, axis, rotor);

                const d = directionAt(i * 3);
                fabrik3.solve(chain, [d[0] * 4, d[1] * 4, d[2] * 4]);
                expectIntact(chain);

                expect(vec3.angle(direction(chain, 0), axis)).toBeLessThanOrEqual(rotor + 1e-6);
            }
        });

        it('holds the first bone in a global hinge plane and within its limits', () => {
            const axis: Vec3 = [0, 0, 1];
            const reference: Vec3 = [0, 1, 0];
            const clockwise = 0.3;
            const anticlockwise = 0.6;

            for (let i = 0; i < 20; i++) {
                const chain = chainOf(5);
                fabrik3.setBaseboneHingeConstraint(
                    chain,
                    fabrik3.BaseboneConstraintType.GLOBAL_HINGE,
                    axis,
                    clockwise,
                    anticlockwise,
                    reference,
                );

                const d = directionAt(i * 5);
                fabrik3.solve(chain, [d[0] * 4, d[1] * 4, d[2] * 4]);
                expectIntact(chain);

                const first = direction(chain, 0);
                expect(Math.abs(vec3.dot(first, axis))).toBeLessThan(1e-6);

                const signed = vec3.signedAngle(reference, first, axis);
                expect(signed).toBeGreaterThanOrEqual(-clockwise - 1e-6);
                expect(signed).toBeLessThanOrEqual(anticlockwise + 1e-6);
            }
        });
    });

    describe('degenerate input', () => {
        it('handles a target sitting on the base', () => {
            const chain = chainOf(4);
            fabrik3.solve(chain, [0, 0, 0]);
            expectIntact(chain);
        });

        it('handles a zero-length bone', () => {
            const chain = fabrik3.createChain3();
            fabrik3.addBone(chain, [0, 0, 0], [0, 0, 0]);
            fabrik3.addBone(chain, [0, 0, 0], [0, 1, 0]);
            fabrik3.solve(chain, [1, 1, 1]);
            expectIntact(chain);
        });

        it('handles a single-bone chain', () => {
            const chain = chainOf(1);
            // a lone fixed-base bone reaches only what sits at exactly its own length
            expect(fabrik3.solve(chain, [0.6, 0.8, 0])).toBeLessThanOrEqual(chain.solveDistanceThreshold);
            expectIntact(chain);
        });
    });

    describe('helpers', () => {
        it('reports the base as the effector of a chain with no bones', () => {
            // solve treats an empty chain as supported, so the accessor should not throw
            const chain = fabrik3.createChain3();
            fabrik3.setBaseLocation(chain, [1, 2, 3]);

            const out: Vec3 = [0, 0, 0];
            fabrik3.getEffector(out, chain);
            expect(out).toEqual([1, 2, 3]);
        });

        it('reports reachability against the chain length', () => {
            const chain = chainOf(3);
            expect(fabrik3.isReachable(chain, [0, 2, 0])).toBe(true);
            expect(fabrik3.isReachable(chain, [0, 9, 0])).toBe(false);
        });

        it('straightens along a direction', () => {
            const chain = chainOf(3);
            fabrik3.straighten(chain, [1, 0, 0]);
            expect(chain.bones[2].end[0]).toBeCloseTo(3);
            expectIntact(chain);
        });

        it('writes the effector position', () => {
            const chain = chainOf(3);
            const out: Vec3 = [0, 0, 0];
            fabrik3.getEffector(out, chain);
            expect(out[1]).toBeCloseTo(3);
        });

        it('rotates a mesh axis onto a bone', () => {
            const chain = chainOf(2);
            fabrik3.straighten(chain, [1, 0, 0]);

            const rotation = [0, 0, 0, 1] as [number, number, number, number];
            fabrik3.getBoneRotation(rotation, chain, 0, [0, 1, 0]);

            const rotated: Vec3 = [0, 0, 0];
            vec3.transformQuat(rotated, [0, 1, 0], rotation);
            expect(vec3.distance(rotated, [1, 0, 0])).toBeCloseTo(0);
        });
    });

    describe('structures', () => {
        it('keeps a connected chain pinned to its host even if fixedBase was cleared', () => {
            // being connected is what fixes the base, because a free base would just drift off the host
            const structure = fabrik3.createStructure3();
            const host = chainOf(2);
            fabrik3.addChain(structure, host);

            const limb = fabrik3.createChain3();
            fabrik3.addBone(limb, [0, 0, 0], [1, 0, 0]);
            fabrik3.addConsecutiveBone(limb, [1, 0, 0], 1);
            limb.fixedBase = false;
            fabrik3.connectChain(structure, limb, 0, 1, fabrik3.BoneConnectionPoint.END);

            for (let i = 0; i < 30; i++) {
                const d = directionAt(i);
                fabrik3.solveStructure(structure, [d[0] * 2, d[1] * 2, d[2] * 2]);
            }

            expect(vec3.distance(limb.bones[0].start, host.bones[1].end)).toBeLessThan(1e-9);
        });

        it('pins a connected chain to its host bone connection point', () => {
            const structure = fabrik3.createStructure3();
            const spine = chainOf(3);
            fabrik3.addChain(structure, spine);

            const atStart = fabrik3.createChain3();
            fabrik3.addBone(atStart, [0, 0, 0], [1, 0, 0]);
            fabrik3.addConsecutiveBone(atStart, [1, 0, 0], 1);
            fabrik3.connectChain(structure, atStart, 0, 1, fabrik3.BoneConnectionPoint.START);

            const atEnd = fabrik3.createChain3();
            fabrik3.addBone(atEnd, [0, 0, 0], [1, 0, 0]);
            fabrik3.addConsecutiveBone(atEnd, [1, 0, 0], 1);
            fabrik3.connectChain(structure, atEnd, 0, 1, fabrik3.BoneConnectionPoint.END);

            for (let i = 0; i < 15; i++) {
                const d = directionAt(i);
                fabrik3.solveStructure(structure, [d[0] * 2, d[1] * 2, d[2] * 2]);

                expectIntact(spine);
                expectIntact(atStart);
                expectIntact(atEnd);

                expect(vec3.distance(atStart.bones[0].start, spine.bones[1].start)).toBeLessThan(1e-9);
                expect(vec3.distance(atEnd.bones[0].start, spine.bones[1].end)).toBeLessThan(1e-9);
            }
        });

        it('solves a chain for its embedded target rather than the structure target', () => {
            const structure = fabrik3.createStructure3();
            const spine = chainOf(2);
            fabrik3.addChain(structure, spine);

            const limb = fabrik3.createChain3();
            fabrik3.addBone(limb, [0, 0, 0], [1, 0, 0]);
            fabrik3.addConsecutiveBone(limb, [1, 0, 0], 1);
            limb.useEmbeddedTarget = true;
            vec3.set(limb.embeddedTarget, 2, 2, 0);
            fabrik3.connectChain(structure, limb, 0, 0, fabrik3.BoneConnectionPoint.END);

            fabrik3.solveStructure(structure, [0, 2, 0]);

            expectIntact(limb);
            // the limb reached for its own target, not the structure's
            expect(vec3.distance(limb.bones[1].end, [2, 2, 0])).toBeLessThan(vec3.distance(limb.bones[1].end, [0, 2, 0]));
        });

        it('resolves a local rotor basebone against the host bone frame', () => {
            const structure = fabrik3.createStructure3();
            const spine = chainOf(2);
            fabrik3.addChain(structure, spine);

            const limb = fabrik3.createChain3();
            fabrik3.addBone(limb, [0, 0, 0], [1, 0, 0]);
            fabrik3.addConsecutiveBone(limb, [1, 0, 0], 1);
            fabrik3.setBaseboneRotorConstraint(limb, fabrik3.BaseboneConstraintType.LOCAL_ROTOR, [0, 0, 1], Math.PI / 4);
            fabrik3.connectChain(structure, limb, 0, 0, fabrik3.BoneConnectionPoint.END);

            for (let i = 0; i < 15; i++) {
                const d = directionAt(i * 4);
                fabrik3.solveStructure(structure, [d[0] * 2, d[1] * 2, d[2] * 2]);

                expectIntact(limb);
                // the world axis is rebuilt from the host bone each solve, so it stays a unit vector
                expect(vec3.length(limb.baseboneWorldAxis)).toBeCloseTo(1);
                expect(vec3.angle(direction(limb, 0), limb.baseboneWorldAxis)).toBeLessThanOrEqual(Math.PI / 4 + 1e-6);
            }
        });
    });

    describe('addBoneAtBase', () => {
        it('extends the chain backward and moves the base', () => {
            const chain = chainOf(3);
            const bone = fabrik3.addBoneAtBase(chain, [0, 1, 0], 2);

            expect(chain.bones.length).toBe(4);
            expect(chain.bones[0]).toBe(bone);
            expect(chain.length).toBeCloseTo(5);
            expect(bone.end).toEqual([0, 0, 0]);
            expect(vec3.distance(bone.start, [0, -2, 0])).toBeCloseTo(0);
            expect(vec3.distance(chain.base, [0, -2, 0])).toBeCloseTo(0);
            expectIntact(chain);
        });

        it('hands the joint to the bone the new one now joins onto', () => {
            const chain = chainOf(2);
            const joint = fabrik3.setBallJoint(fabrik3.createJoint3(), 0.5);
            fabrik3.addBoneAtBase(chain, [0, 1, 0], 1, joint);

            // the joint governs the junction, so it belongs to what is now bone 1
            expect(chain.bones[1].joint).toBe(joint);
        });

        it('keeps solving correctly after growing', () => {
            const chain = chainOf(2, () => fabrik3.setBallJoint(fabrik3.createJoint3(), Math.PI / 4));

            for (let i = 0; i < 12; i++) {
                fabrik3.addBoneAtBase(chain, [0, 1, 0], 1, fabrik3.setBallJoint(fabrik3.createJoint3(), Math.PI / 4));

                const d = directionAt(i);
                fabrik3.forward(chain, [d[0] * 3, d[1] * 3, d[2] * 3]);
                expectIntact(chain);

                for (let bone = 1; bone < chain.bones.length; bone++) {
                    expect(vec3.angle(direction(chain, bone - 1), direction(chain, bone))).toBeLessThanOrEqual(
                        Math.PI / 4 + 1e-6,
                    );
                }
            }
        });

        it('grows the best-solution scratch so solve stays allocation-free', () => {
            const chain = chainOf(2);
            fabrik3.addBoneAtBase(chain, [0, 1, 0], 1);
            expect(chain.bestSolution.length).toBe(chain.bones.length * 6);
            fabrik3.solve(chain, [1, 1, 0]);
            expectIntact(chain);
        });
    });

    describe('local hinge frame', () => {
        // A LOCAL_HINGE reads its axes in the frame of the bone before it, and that frame puts the
        // PARENT'S OWN DIRECTION on local +Z. That makes local +X an axis the child can actually
        // swing about and local +Z the "straight on" reference - the configuration a real elbow
        // wants. These pin the convention down, because changing it would silently turn every local
        // hinge into something else.
        const HINGE_AXIS: Vec3 = [1, 0, 0];
        const STRAIGHT: Vec3 = [0, 0, 1];
        const BEND = (Math.PI * 5) / 6;

        const basis: Mat3 = mat3.create();

        /**
         * The same basis the solver builds, implemented independently here (Frisvad) so the test
         * cross-checks the convention rather than reusing the solver's own code.
         */
        const basisFromDirection = (out: Mat3, d: Vec3): Mat3 => {
            const [x, y, z] = d;
            if (z < -0.9999999) {
                out[0] = 0;
                out[1] = -1;
                out[2] = 0;
                out[3] = -1;
                out[4] = 0;
                out[5] = 0;
            } else {
                const a = 1 / (1 + z);
                const b = -x * y * a;
                out[0] = 1 - x * x * a;
                out[1] = b;
                out[2] = -x;
                out[3] = b;
                out[4] = 1 - y * y * a;
                out[5] = -y;
            }
            out[6] = x;
            out[7] = y;
            out[8] = z;
            return out;
        };

        /** The child bone's swing away from straight, measured about the resolved world hinge axis. */
        const bendAt = (chain: fabrik3.Chain3, index: number): number => {
            const parent = direction(chain, index - 1);
            basisFromDirection(basis, parent);

            const axis: Vec3 = [0, 0, 0];
            vec3.transformMat3(axis, HINGE_AXIS, basis);
            vec3.normalize(axis, axis);

            const reference: Vec3 = [0, 0, 0];
            vec3.transformMat3(reference, STRAIGHT, basis);

            return vec3.signedAngle(reference, direction(chain, index), axis);
        };

        it('puts the parent bone direction on local +Z', () => {
            const chain = chainOf(2);
            fabrik3.straighten(chain, [0.6, 0.8, 0]);

            const parent = direction(chain, 0);
            basisFromDirection(basis, parent);

            const localZ: Vec3 = [0, 0, 0];
            vec3.transformMat3(localZ, [0, 0, 1], basis);

            expect(vec3.distance(localZ, parent)).toBeCloseTo(0);
        });

        it('measures a local hinge from straight, and holds a one-way limit', () => {
            const chain = chainOf(3);
            // an elbow: swings up to BEND one way, and never past straight the other
            fabrik3.setHingeJoint(chain.bones[1].joint, fabrik3.JointType.LOCAL_HINGE, HINGE_AXIS, BEND, 0, STRAIGHT);
            fabrik3.setHingeJoint(chain.bones[2].joint, fabrik3.JointType.LOCAL_HINGE, HINGE_AXIS, BEND, 0, STRAIGHT);

            for (let i = 0; i < 30; i++) {
                const d = directionAt(i * 3);
                fabrik3.solve(chain, [d[0] * 2, d[1] * 2, d[2] * 2]);
                expectIntact(chain);

                for (const bone of [1, 2]) {
                    const bend = bendAt(chain, bone);
                    // clockwise is negative, so the joint lives in [-BEND, 0] - never past straight
                    expect(bend).toBeLessThanOrEqual(1e-6);
                    expect(bend).toBeGreaterThanOrEqual(-BEND - 1e-6);
                }
            }
        });

        it('a rotation axis of local +Z pins the child perpendicular to its parent', () => {
            // the degenerate configuration the elbow above is careful to avoid: naming the parent's
            // own direction as the hinge axis leaves the child no choice but a right angle
            const chain = chainOf(2);
            fabrik3.setHingeJoint(chain.bones[1].joint, fabrik3.JointType.LOCAL_HINGE, [0, 0, 1], Math.PI, Math.PI, [1, 0, 0]);

            fabrik3.solve(chain, [1, 1.8, 0]);
            expectIntact(chain);

            expect(vec3.dot(direction(chain, 0), direction(chain, 1))).toBeCloseTo(0);
        });
    });

    describe('robustness', () => {
        it('leaves the chain untouched for a non-finite target, rather than poisoning it', () => {
            const chain = chainOf(3);
            fabrik3.solve(chain, [1, 1, 0]);
            const before = chain.bones.map((bone) => [...bone.end]);

            for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
                fabrik3.solve(chain, [bad, 0, 0]);
                expectIntact(chain);
            }

            // and the pose is exactly the one it had before the bad targets arrived
            for (let i = 0; i < chain.bones.length; i++) {
                expect(vec3.distance(chain.bones[i].end, before[i] as Vec3)).toBeCloseTo(0);
            }
        });

        it('recovers if a pose is somehow poisoned from outside', () => {
            // a NaN written straight into the bones, as a bad physics frame upstream might. the
            // degenerate guards are written `!(x >= limit)` precisely so NaN takes the fallback.
            const chain = chainOf(4);
            chain.bones[1].end[0] = Number.NaN;
            chain.bones[2].start[0] = Number.NaN;

            for (let i = 0; i < 3; i++) fabrik3.solve(chain, [1, 2, 0]);

            expectIntact(chain);
        });

        it('ignores a directionless constraint axis instead of storing NaN', () => {
            const chain = chainOf(3);
            fabrik3.setBaseboneRotorConstraint(chain, fabrik3.BaseboneConstraintType.GLOBAL_ROTOR, [0, 0, 0], 0.5);

            // the axis it already had is kept, so it is still a unit vector
            expect(vec3.length(chain.baseboneAxis)).toBeCloseTo(1);

            fabrik3.solve(chain, [1, 1, 0]);
            expectIntact(chain);
        });

        it('ignores a directionless hinge axis instead of storing NaN', () => {
            const joint = fabrik3.setHingeJoint(
                fabrik3.createJoint3(),
                fabrik3.JointType.GLOBAL_HINGE,
                [0, 0, 0],
                1,
                1,
                [0, 0, 0],
            );
            expect(vec3.length(joint.rotationAxis)).toBeCloseTo(1);
            expect(vec3.length(joint.referenceAxis)).toBeCloseTo(1);
        });
    });
});
