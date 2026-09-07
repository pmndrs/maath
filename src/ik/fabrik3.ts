import { type Mat3, mat3, type Quat, quat, type Vec3, vec3 } from '../core';

// FABRIK (Forward And Backward Reaching Inverse Kinematics) for 3D chains.
//
// Two passes, each preserving every bone length exactly: `forward` drags the chain onto the target
// from the effector back, `backward` pushes it out from a pinned base. Both are exported, because
// `forward` alone with no base pin is a follower - a rope or tentacle whose head leads and whose
// body trails - and that wants one pass per frame rather than a converged solve.
//
// The constraint model follows Caliko, the reference implementation accompanying Aristidou &
// Lasenby (2011), "FABRIK: A fast, iterative solver for the Inverse Kinematics problem".

/**
 * How a joint may rotate relative to the bone before it.
 *
 * A {@link JointType.BALL} joint with a `rotor` of PI is unconstrained, which is the default, so
 * there is no separate "no constraint" type.
 */
export enum JointType {
    /** Rotates freely within a cone of `rotor` radians about the previous bone's direction. */
    BALL = 0,
    /** Rotates only in the plane perpendicular to `rotationAxis`, which is in world space. */
    GLOBAL_HINGE = 1,
    /**
     * Rotates only in the plane perpendicular to `rotationAxis`, which is fixed in the previous
     * bone's frame.
     *
     * That frame comes from {@link mat3.fromDirection}, so local **+Z** is the previous bone's own
     * direction and local +X and +Y are perpendicular to it. (`fabrik2` uses +Y for the same idea,
     * so a rig ported from 2D needs its axes rotated.) The frame's roll about the bone is arbitrary
     * and flips near world -Z, so a hinge whose parent swings through there will pop - hinge about a
     * `GLOBAL_HINGE` axis you rebuild from your own frame if the parent turns freely.
     */
    LOCAL_HINGE = 2,
}

/**
 * How the first bone in a chain is constrained.
 *
 * The first bone has no bone before it to be constrained against, so it is constrained against a
 * direction held on the chain instead. `GLOBAL_` types read that direction as world space;
 * `LOCAL_` types read it relative to the bone this chain is connected to, and so only mean
 * anything for a chain in a {@link Structure3}, where {@link solveStructure} resolves them.
 *
 * A `LOCAL_` direction is read in the host bone's frame from {@link mat3.fromDirection}, where
 * **+Z** is the host bone's own direction. (`fabrik2`'s equivalent uses +Y.) That frame's roll is
 * arbitrary and flips near world -Z, so a host bone that swings through there makes the constraint
 * pop.
 */
export enum BaseboneConstraintType {
    /** The first bone may point anywhere. */
    NONE = 0,
    /** Confined to a cone of `baseboneRotor` radians about a world-space direction. */
    GLOBAL_ROTOR = 1,
    /** Confined to a cone of `baseboneRotor` radians about a direction relative to the host bone. */
    LOCAL_ROTOR = 2,
    /** Confined to the plane perpendicular to a world-space hinge axis. */
    GLOBAL_HINGE = 3,
    /** Confined to the plane perpendicular to a hinge axis relative to the host bone. */
    LOCAL_HINGE = 4,
}

/** Which end of a host bone a connected chain hangs off. */
export enum BoneConnectionPoint {
    /** The host bone's start - the joint it shares with the bone before it. */
    START = 0,
    /** The host bone's end. */
    END = 1,
}

/**
 * A joint's rotational limits.
 *
 * Which fields apply depends on `type`: `rotor` for {@link JointType.BALL}, and `rotationAxis`,
 * `referenceAxis`, `clockwise` and `anticlockwise` for the two hinge types. All angles are in
 * radians, and a limit of PI means unconstrained.
 */
export type Joint3 = {
    /** Which of the fields below apply. */
    type: JointType;
    /** Ball: the half-angle of the cone about the previous bone's direction, in [0, PI]. */
    rotor: number;
    /** Hinge: how far the bone may swing clockwise of `referenceAxis`, in [0, PI]. */
    clockwise: number;
    /** Hinge: how far the bone may swing anticlockwise of `referenceAxis`, in [0, PI]. */
    anticlockwise: number;
    /** Hinge: the axis the bone rotates about. Unit length. */
    rotationAxis: Vec3;
    /** Hinge: the zero direction the clockwise and anticlockwise limits are measured from. Unit length, perpendicular to `rotationAxis`. */
    referenceAxis: Vec3;
};

/** A single bone: two points, the fixed distance between them, and how it may rotate. */
export type Bone3 = {
    /** The joint shared with the previous bone; on the first bone, the base. */
    start: Vec3;
    /** The joint shared with the next bone; on the last bone, the end effector. */
    end: Vec3;
    /** The rest distance between `start` and `end`, preserved by every solve. */
    length: number;
    /** How far this bone may rotate away from the bone before it. */
    joint: Joint3;
};

/**
 * A chain of bones, from the base (index 0) to the end effector (the last bone's `end`).
 *
 * Allocate one with {@link createChain3}, fill it with {@link addBone} or
 * {@link addConsecutiveBone}, then solve it every frame.
 *
 * `bones[0].joint` is unused - the first bone is governed by the chain's basebone fields instead,
 * so a joint's fields never change meaning with its index.
 */
export type Chain3 = {
    /**
     * The bones, base first and end effector last.
     *
     * Neighbours share a point - bone `i`'s end is bone `i + 1`'s start - and the solver keeps it
     * that way, so moving one moves the other.
     */
    bones: Bone3[];
    /** The sum of every bone length - the chain's reach. Maintained by {@link addBone}. */
    length: number;
    /** Where the base of the chain is pinned when `fixedBase` is set. */
    base: Vec3;
    /** Whether `backward` pins the base to `base`. Clear it to let the whole chain drift. Forced on for a chain connected in a structure. */
    fixedBase: boolean;
    /** How the first bone is held; see {@link BaseboneConstraintType}. */
    baseboneConstraintType: BaseboneConstraintType;
    /** The cone axis or hinge axis, in the space named by `baseboneConstraintType`. Unit length. */
    baseboneAxis: Vec3;
    /** The hinge reference axis, in the space named by `baseboneConstraintType`. Unit length. */
    baseboneReferenceAxis: Vec3;
    /** `baseboneAxis` in world space. Equal to it for `GLOBAL_` types; resolved by {@link solveStructure} for `LOCAL_` ones. */
    baseboneWorldAxis: Vec3;
    /** `baseboneReferenceAxis` in world space. */
    baseboneWorldReferenceAxis: Vec3;
    /** The half-angle of the basebone cone, in [0, PI]. */
    baseboneRotor: number;
    /** The basebone hinge's clockwise limit, in [0, PI]. */
    baseboneClockwise: number;
    /** The basebone hinge's anticlockwise limit, in [0, PI]. */
    baseboneAnticlockwise: number;
    /** The target this chain solves for inside a {@link Structure3} when `useEmbeddedTarget` is set. */
    embeddedTarget: Vec3;
    /**
     * Whether this chain solves for its own `embeddedTarget` instead of the target passed to
     * {@link solveStructure}. Ignored outside a {@link Structure3}.
     */
    useEmbeddedTarget: boolean;
    /** The most iterations {@link solve} will run. */
    maxIterations: number;
    /** {@link solve} stops as soon as the effector is this close to the target. */
    solveDistanceThreshold: number;
    /**
     * How still an iteration must be before {@link solve} treats the chain as stuck.
     *
     * Only consulted on an iteration that fails to beat the best distance so far, and compared
     * against the previous iteration rather than the best - so a solve that is slowly getting worse
     * runs its full budget. That is deliberate: FABRIK often worsens before it improves, and every
     * stricter rule tried here bought fewer iterations at a disproportionate cost in final pose.
     */
    minIterationChange: number;
    /** The distance from the effector to the target after the last {@link solve}. */
    solveDistance: number;
    /** Scratch holding the best pose {@link solve} has seen, six numbers per bone. Grown by {@link addBone}. */
    bestSolution: number[];
};

/** A chain's attachment to a bone in another chain of the same structure. */
export type Connection = {
    /** The index of the host chain in `structure.chains`, or -1 for a chain that hangs off nothing. */
    hostChain: number;
    /** The index of the host bone within that chain. */
    hostBone: number;
    /** Which end of the host bone this chain's base is pinned to. */
    point: BoneConnectionPoint;
};

/** A set of chains, each optionally hanging off a bone of another. */
export type Structure3 = {
    /** Solved in insertion order, so a connected chain always sees its host already posed. */
    chains: Chain3[];
    /** Parallel to `chains`. */
    connections: Connection[];
};

// the most iterations a solve runs before giving up on reaching the target
const DEFAULT_MAX_ITERATIONS = 20;

// how close the effector must get before a solve stops early. in world units, so scale it with the
// scene - the default suits a chain a few units long
const DEFAULT_SOLVE_DISTANCE_THRESHOLD = 0.01;

// how little an iteration may improve the solve distance before it counts as stalled. a constrained
// chain can reach a pose no further iteration improves on while still short of the threshold;
// without this it would burn every remaining iteration going nowhere. two orders of magnitude below
// the distance threshold, so a solve still closing in on the target is never mistaken for a stalled
// one
const DEFAULT_MIN_ITERATION_CHANGE = 1e-4;

// below this squared length a vector carries no usable direction - 1e-12 in length terms, well above
// a normalize's noise floor and well below anything meaningful. every test against it also checks
// for NaN, so a value poisoned upstream takes the same fallback instead of spreading down the chain
const DEGENERATE_SQUARED_LENGTH = 1e-24;

/**
 * Normalizes `axis` into `out`, leaving `out` untouched if `axis` has no direction to give.
 *
 * A zero axis cannot be normalized, and storing one turns every constraint that reads it into NaN.
 * `out` always starts as a valid unit vector, so keeping it is the safe fallback.
 */
function setUnitAxis(out: Vec3, axis: Vec3): Vec3 {
    if (!hasDirection(vec3.squaredLength(axis))) return out;
    return vec3.normalize(out, axis);
}

/**
 * Whether a squared length is a usable magnitude: a real number, and not effectively zero.
 *
 * NaN counts as unusable. A value poisoned upstream then takes the same fallback as a zero-length
 * one, instead of spreading down the chain and leaving it stuck.
 */
function hasDirection(squaredLength: number): boolean {
    if (Number.isNaN(squaredLength)) return false;
    return squaredLength >= DEGENERATE_SQUARED_LENGTH;
}

/** Creates an unconstrained joint. */
export function createJoint3(): Joint3 {
    return {
        type: JointType.BALL,
        rotor: Math.PI,
        clockwise: Math.PI,
        anticlockwise: Math.PI,
        rotationAxis: [0, 0, 1],
        referenceAxis: [1, 0, 0],
    };
}

/** Creates an empty chain with a fixed base at the origin and no basebone constraint. */
export function createChain3(): Chain3 {
    return {
        bones: [],
        length: 0,
        base: [0, 0, 0],
        fixedBase: true,
        baseboneConstraintType: BaseboneConstraintType.NONE,
        baseboneAxis: [0, 1, 0],
        baseboneReferenceAxis: [1, 0, 0],
        baseboneWorldAxis: [0, 1, 0],
        baseboneWorldReferenceAxis: [1, 0, 0],
        baseboneRotor: Math.PI,
        baseboneClockwise: Math.PI,
        baseboneAnticlockwise: Math.PI,
        embeddedTarget: [0, 0, 0],
        useEmbeddedTarget: false,
        maxIterations: DEFAULT_MAX_ITERATIONS,
        solveDistanceThreshold: DEFAULT_SOLVE_DISTANCE_THRESHOLD,
        minIterationChange: DEFAULT_MIN_ITERATION_CHANGE,
        solveDistance: Number.POSITIVE_INFINITY,
        bestSolution: [],
    };
}

/**
 * Appends a bone spanning `start` to `end`, copying both.
 *
 * The bone's length is taken from the distance between them. When this is the first bone the
 * chain's base is moved to `start`.
 *
 * @param chain the chain to append to
 * @param start the bone's start point
 * @param end the bone's end point
 * @param joint the bone's joint; a fresh unconstrained joint if omitted
 * @returns the appended bone
 */
export function addBone(chain: Chain3, start: Vec3, end: Vec3, joint: Joint3 = createJoint3()): Bone3 {
    const bone: Bone3 = {
        start: [start[0], start[1], start[2]],
        end: [end[0], end[1], end[2]],
        length: vec3.distance(start, end),
        joint,
    };

    if (chain.bones.length === 0) {
        chain.base[0] = start[0];
        chain.base[1] = start[1];
        chain.base[2] = start[2];
    }

    chain.bones.push(bone);
    chain.length += bone.length;

    // six numbers of best-pose scratch per bone, so `solve` never allocates
    chain.bestSolution.push(0, 0, 0, 0, 0, 0);

    return bone;
}

/**
 * Appends a bone starting where the chain currently ends, running `length` along `direction`.
 *
 * @param chain the chain to append to, which must already have at least one bone
 * @param direction the direction to extend in, assumed to be unit length
 * @param length the length of the new bone
 * @param joint the bone's joint; a fresh unconstrained joint if omitted
 * @returns the appended bone
 */
export function addConsecutiveBone(chain: Chain3, direction: Vec3, length: number, joint: Joint3 = createJoint3()): Bone3 {
    const previous = chain.bones[chain.bones.length - 1];

    _addConsecutive_end[0] = previous.end[0] + direction[0] * length;
    _addConsecutive_end[1] = previous.end[1] + direction[1] * length;
    _addConsecutive_end[2] = previous.end[2] + direction[2] * length;

    return addBone(chain, previous.end, _addConsecutive_end, joint);
}

const _addConsecutive_end: Vec3 = [0, 0, 0];

/**
 * Prepends a bone at the base end, extending the chain backward.
 *
 * This is what a follower grows with: driven by {@link forward} alone the base end is the tail.
 *
 * `joint` becomes the joint of the bone that was previously first, because that is the junction the
 * new bone creates. The new first bone's own joint is unused, as always.
 *
 * @param chain the chain to prepend to, which must already have at least one bone
 * @param direction the direction the new bone points, from its own start toward the existing chain. Assumed to be unit length
 * @param length the length of the new bone
 * @param joint the joint for the junction this creates; a fresh unconstrained joint if omitted
 * @returns the prepended bone
 */
export function addBoneAtBase(chain: Chain3, direction: Vec3, length: number, joint: Joint3 = createJoint3()): Bone3 {
    const first = chain.bones[0];

    // the bone that was first now sits at index 1, so it is the one whose joint governs the new
    // junction. its old joint was the unused basebone slot
    first.joint = joint;

    const bone: Bone3 = {
        start: [
            first.start[0] - direction[0] * length,
            first.start[1] - direction[1] * length,
            first.start[2] - direction[2] * length,
        ],
        end: [first.start[0], first.start[1], first.start[2]],
        length,
        joint: createJoint3(),
    };

    chain.bones.unshift(bone);
    chain.length += length;

    chain.base[0] = bone.start[0];
    chain.base[1] = bone.start[1];
    chain.base[2] = bone.start[2];

    chain.bestSolution.push(0, 0, 0, 0, 0, 0);

    return bone;
}

/**
 * Sets a ball-joint constraint: the bone may rotate within a cone of `rotor` radians about the
 * direction of the bone before it.
 *
 * @param joint the joint to configure
 * @param rotor the half-angle of the cone in radians, clamped to [0, PI]
 * @returns the joint
 */
export function setBallJoint(joint: Joint3, rotor: number): Joint3 {
    joint.type = JointType.BALL;
    joint.rotor = clampAngle(rotor);
    return joint;
}

/**
 * Sets a hinge constraint: the bone may only rotate in the plane perpendicular to `rotationAxis`,
 * and within `clockwise` / `anticlockwise` radians of `referenceAxis` in that plane.
 *
 * `referenceAxis` is projected onto the hinge plane and normalized, so it need only be roughly
 * perpendicular. Pass PI for both limits for a hinge that spins freely.
 *
 * @param joint the joint to configure
 * @param type either {@link JointType.GLOBAL_HINGE} (axes in world space) or {@link JointType.LOCAL_HINGE} (axes relative to the previous bone)
 * @param rotationAxis the hinge axis, assumed to be unit length
 * @param clockwise the clockwise limit in radians, clamped to [0, PI]
 * @param anticlockwise the anticlockwise limit in radians, clamped to [0, PI]
 * @param referenceAxis the zero direction the limits are measured from
 * @returns the joint
 */
export function setHingeJoint(
    joint: Joint3,
    type: JointType.GLOBAL_HINGE | JointType.LOCAL_HINGE,
    rotationAxis: Vec3,
    clockwise: number,
    anticlockwise: number,
    referenceAxis: Vec3,
): Joint3 {
    joint.type = type;
    joint.clockwise = clampAngle(clockwise);
    joint.anticlockwise = clampAngle(anticlockwise);

    setUnitAxis(joint.rotationAxis, rotationAxis);
    orthonormalize(joint.referenceAxis, referenceAxis, joint.rotationAxis);

    return joint;
}

/**
 * Confines the first bone to a cone of `rotor` radians about `axis`.
 *
 * @param chain the chain to configure
 * @param type either {@link BaseboneConstraintType.GLOBAL_ROTOR} or {@link BaseboneConstraintType.LOCAL_ROTOR}
 * @param axis the cone axis, assumed to be unit length
 * @param rotor the half-angle of the cone in radians, clamped to [0, PI]
 * @returns the chain
 */
export function setBaseboneRotorConstraint(
    chain: Chain3,
    type: BaseboneConstraintType.GLOBAL_ROTOR | BaseboneConstraintType.LOCAL_ROTOR,
    axis: Vec3,
    rotor: number,
): Chain3 {
    chain.baseboneConstraintType = type;
    chain.baseboneRotor = clampAngle(rotor);

    setUnitAxis(chain.baseboneAxis, axis);
    vec3.copy(chain.baseboneWorldAxis, chain.baseboneAxis);

    return chain;
}

/**
 * Confines the first bone to the plane perpendicular to `rotationAxis`, within `clockwise` /
 * `anticlockwise` radians of `referenceAxis`.
 *
 * @param chain the chain to configure
 * @param type either {@link BaseboneConstraintType.GLOBAL_HINGE} or {@link BaseboneConstraintType.LOCAL_HINGE}
 * @param rotationAxis the hinge axis, assumed to be unit length
 * @param clockwise the clockwise limit in radians, clamped to [0, PI]
 * @param anticlockwise the anticlockwise limit in radians, clamped to [0, PI]
 * @param referenceAxis the zero direction the limits are measured from
 * @returns the chain
 */
export function setBaseboneHingeConstraint(
    chain: Chain3,
    type: BaseboneConstraintType.GLOBAL_HINGE | BaseboneConstraintType.LOCAL_HINGE,
    rotationAxis: Vec3,
    clockwise: number,
    anticlockwise: number,
    referenceAxis: Vec3,
): Chain3 {
    chain.baseboneConstraintType = type;
    chain.baseboneClockwise = clampAngle(clockwise);
    chain.baseboneAnticlockwise = clampAngle(anticlockwise);

    setUnitAxis(chain.baseboneAxis, rotationAxis);
    orthonormalize(chain.baseboneReferenceAxis, referenceAxis, chain.baseboneAxis);

    vec3.copy(chain.baseboneWorldAxis, chain.baseboneAxis);
    vec3.copy(chain.baseboneWorldReferenceAxis, chain.baseboneReferenceAxis);

    return chain;
}

/**
 * Moves the chain's pinned base, without moving the bones.
 *
 * The next {@link backward} or {@link solve} pulls the chain to it.
 */
export function setBaseLocation(chain: Chain3, base: Vec3): Chain3 {
    chain.base[0] = base[0];
    chain.base[1] = base[1];
    chain.base[2] = base[2];
    return chain;
}

/**
 * Lays the chain out straight from its base along `direction`, discarding the current pose.
 *
 * A dead-straight chain is the worst starting pose for {@link solve} - see the note there. Bend
 * `direction` slightly between bones instead if the chain will be solved cold.
 */
export function straighten(chain: Chain3, direction: Vec3): Chain3 {
    const bones = chain.bones;

    let x = chain.base[0];
    let y = chain.base[1];
    let z = chain.base[2];

    for (let i = 0; i < bones.length; i++) {
        const bone = bones[i];

        bone.start[0] = x;
        bone.start[1] = y;
        bone.start[2] = z;

        x += direction[0] * bone.length;
        y += direction[1] * bone.length;
        z += direction[2] * bone.length;

        bone.end[0] = x;
        bone.end[1] = y;
        bone.end[2] = z;
    }

    return chain;
}

/**
 * Writes the end effector's position - the last bone's end - into `out`.
 *
 * A chain with no bones has its base as its effector, matching {@link solve}, which treats an empty
 * chain as a supported state rather than an error.
 */
export function getEffector(out: Vec3, chain: Chain3): Vec3 {
    const count = chain.bones.length;
    return vec3.copy(out, count === 0 ? chain.base : chain.bones[count - 1].end);
}

/** Writes the unit direction of bone `index`, from its start toward its end, into `out`. */
export function getBoneDirection(out: Vec3, chain: Chain3, index: number): Vec3 {
    const bone = chain.bones[index];
    vec3.subtract(out, bone.end, bone.start);
    return normalizeOr(out, UP);
}

/**
 * Writes the rotation taking `up` onto the direction of bone `index` into `out`.
 *
 * Use it to orient a mesh along a bone, passing whichever axis the mesh is modelled along - `up`
 * is `[0, 1, 0]` for a cylinder or capsule built along Y. The roll about the bone is arbitrary.
 */
export function getBoneRotation(out: Quat, chain: Chain3, index: number, up: Vec3): Quat {
    getBoneDirection(_boneRotation_direction, chain, index);
    return quat.rotationTo(out, up, _boneRotation_direction);
}

const _boneRotation_direction: Vec3 = [0, 0, 0];

/** Whether `target` is within reach of the chain's base, so a solve can place the effector exactly on it. */
export function isReachable(chain: Chain3, target: Vec3): boolean {
    return vec3.squaredDistance(chain.base, target) <= chain.length * chain.length;
}

/**
 * The forward pass: snaps the end effector onto `target` and drags the rest of the chain after it.
 *
 * A non-finite target leaves the chain untouched rather than poisoning it.
 *
 * The base is not pinned, so the whole chain moves. Run alone once per frame this is a follower
 * rather than a solver - a rope or tentacle whose head leads. Pair it with {@link backward}, or use
 * {@link solve}, to keep the base put.
 *
 * @param chain the chain to move, mutated in place
 * @param target where the end effector should go
 * @returns the chain
 */
export function forward(chain: Chain3, target: Vec3): Chain3 {
    const bones = chain.bones;
    const count = bones.length;

    if (count === 0) return chain;

    // a non-finite target would be written straight into the effector and spread down the chain
    if (!Number.isFinite(target[0]) || !Number.isFinite(target[1]) || !Number.isFinite(target[2])) return chain;

    // snap the effector onto the target; the rest of the pass follows from it
    const effector = bones[count - 1];
    effector.end[0] = target[0];
    effector.end[1] = target[1];
    effector.end[2] = target[2];

    // the outer-to-inner direction of the bone one step further out, which is what a joint on this
    // bone is constrained against on this pass. undefined for the effector itself.
    let hasReference = false;

    for (let i = count - 1; i >= 0; i--) {
        const bone = bones[i];
        const start = bone.start;
        const end = bone.end;

        // this bone's outer-to-inner direction
        let dx = start[0] - end[0];
        let dy = start[1] - end[1];
        let dz = start[2] - end[2];

        const squaredLength = dx * dx + dy * dy + dz * dz;

        if (!hasDirection(squaredLength)) {
            // the two ends coincide, so there is no direction to preserve. carry on along the bone
            // further out, or straight up if this is the effector
            dx = hasReference ? _pass_reference[0] : UP[0];
            dy = hasReference ? _pass_reference[1] : UP[1];
            dz = hasReference ? _pass_reference[2] : UP[2];
        } else {
            const inverseLength = 1 / Math.sqrt(squaredLength);
            dx *= inverseLength;
            dy *= inverseLength;
            dz *= inverseLength;
        }

        constrainForward(chain, i, dx, dy, dz, hasReference);
        dx = _pass_direction[0];
        dy = _pass_direction[1];
        dz = _pass_direction[2];

        const x = end[0] + dx * bone.length;
        const y = end[1] + dy * bone.length;
        const z = end[2] + dz * bone.length;

        start[0] = x;
        start[1] = y;
        start[2] = z;

        // the previous bone shares this point
        if (i > 0) {
            const previousEnd = bones[i - 1].end;
            previousEnd[0] = x;
            previousEnd[1] = y;
            previousEnd[2] = z;
        }

        _pass_reference[0] = dx;
        _pass_reference[1] = dy;
        _pass_reference[2] = dz;
        hasReference = true;
    }

    return chain;
}

/**
 * The backward pass: pins the base and pushes each bone outward from it.
 *
 * Basebone constraints and hinge reference-axis limits are applied here only - the forward pass
 * skips the latter, because clamping on both degrades the solution.
 *
 * @param chain the chain to move, mutated in place
 * @param base where the base should go, used only when `chain.fixedBase` is set
 * @returns the chain
 */
export function backward(chain: Chain3, base: Vec3): Chain3 {
    const bones = chain.bones;
    const count = bones.length;

    if (count === 0) return chain;
    if (!Number.isFinite(base[0]) || !Number.isFinite(base[1]) || !Number.isFinite(base[2])) return chain;

    if (chain.fixedBase) {
        const start = bones[0].start;
        start[0] = base[0];
        start[1] = base[1];
        start[2] = base[2];
    }

    let hasReference = false;

    for (let i = 0; i < count; i++) {
        const bone = bones[i];
        const start = bone.start;
        const end = bone.end;

        // this bone's inner-to-outer direction
        let dx = end[0] - start[0];
        let dy = end[1] - start[1];
        let dz = end[2] - start[2];

        const squaredLength = dx * dx + dy * dy + dz * dz;

        if (!hasDirection(squaredLength)) {
            dx = hasReference ? _pass_reference[0] : UP[0];
            dy = hasReference ? _pass_reference[1] : UP[1];
            dz = hasReference ? _pass_reference[2] : UP[2];
        } else {
            const inverseLength = 1 / Math.sqrt(squaredLength);
            dx *= inverseLength;
            dy *= inverseLength;
            dz *= inverseLength;
        }

        constrainBackward(chain, i, dx, dy, dz, hasReference);
        dx = _pass_direction[0];
        dy = _pass_direction[1];
        dz = _pass_direction[2];

        // when the base is free, the first bone swings about its end rather than its start
        if (i === 0 && !chain.fixedBase) {
            start[0] = end[0] - dx * bone.length;
            start[1] = end[1] - dy * bone.length;
            start[2] = end[2] - dz * bone.length;
        }

        const x = start[0] + dx * bone.length;
        const y = start[1] + dy * bone.length;
        const z = start[2] + dz * bone.length;

        end[0] = x;
        end[1] = y;
        end[2] = z;

        if (i < count - 1) {
            const nextStart = bones[i + 1].start;
            nextStart[0] = x;
            nextStart[1] = y;
            nextStart[2] = z;
        }

        _pass_reference[0] = dx;
        _pass_reference[1] = dy;
        _pass_reference[2] = dz;
        hasReference = true;
    }

    return chain;
}

/**
 * One full FABRIK iteration - {@link forward} then {@link backward}. Often enough on its own for an
 * unconstrained chain reaching a nearby target; use {@link solve} to iterate to a tolerance.
 *
 * @param chain the chain to move, mutated in place
 * @param target where the end effector should go
 * @returns the distance from the effector to `target` afterwards
 */
export function iterate(chain: Chain3, target: Vec3): number {
    if (chain.bones.length === 0) return Number.POSITIVE_INFINITY;

    forward(chain, target);
    backward(chain, chain.base);

    return vec3.distance(chain.bones[chain.bones.length - 1].end, target);
}

/**
 * Solves the chain for `target`, iterating until it is close enough, stops improving, or runs out
 * of attempts.
 *
 * A constrained chain does not converge monotonically, so the best pose seen is kept and restored.
 *
 * A dead-straight chain is the worst case to solve cold: every direction lies on one line, leaving
 * nothing sideways to bend it with. Give it a slight bend if the first solve matters.
 *
 * @param chain the chain to solve, mutated in place
 * @param target where the end effector should go
 * @returns the distance from the effector to `target`, also stored as `chain.solveDistance`
 */
export function solve(chain: Chain3, target: Vec3): number {
    const count = chain.bones.length;

    if (count === 0) {
        chain.solveDistance = Number.POSITIVE_INFINITY;
        return chain.solveDistance;
    }

    // in case bones were pushed onto the chain directly rather than through addBone
    if (chain.bestSolution.length < count * 6) {
        chain.bestSolution.length = count * 6;
        chain.bestSolution.fill(0);
    }

    let best = Number.POSITIVE_INFINITY;
    let previous = Number.POSITIVE_INFINITY;

    for (let i = 0; i < chain.maxIterations; i++) {
        const distance = iterate(chain, target);

        if (distance < best) {
            best = distance;
            saveSolution(chain);

            if (distance <= chain.solveDistanceThreshold) break;
        } else if (Math.abs(distance - previous) < chain.minIterationChange) {
            // ground to a halt - more iterations will not improve on what we already have
            break;
        }

        previous = distance;
    }

    if (best !== Number.POSITIVE_INFINITY) {
        restoreSolution(chain);
    }

    chain.solveDistance = best;

    return best;
}

/** Creates an empty structure. */
export function createStructure3(): Structure3 {
    return { chains: [], connections: [] };
}

/**
 * Adds a chain that hangs off nothing, solving directly for the structure's target.
 *
 * @returns the index of the added chain
 */
export function addChain(structure: Structure3, chain: Chain3): number {
    structure.chains.push(chain);
    structure.connections.push({ hostChain: -1, hostBone: 0, point: BoneConnectionPoint.END });
    return structure.chains.length - 1;
}

/**
 * Adds a chain whose base is pinned to one end of a bone in a chain already in the structure.
 *
 * Add the host first: {@link solveStructure} walks chains in insertion order, so a chain always
 * sees its host already posed.
 *
 * @param structure the structure to add to
 * @param chain the chain to add
 * @param hostChain the index of the chain to hang off
 * @param hostBone the index of the bone within that chain
 * @param point which end of the host bone to attach to
 * @returns the index of the added chain
 */
export function connectChain(
    structure: Structure3,
    chain: Chain3,
    hostChain: number,
    hostBone: number,
    point: BoneConnectionPoint,
): number {
    structure.chains.push(chain);
    structure.connections.push({ hostChain, hostBone, point });
    return structure.chains.length - 1;
}

/**
 * Solves every chain in the structure.
 *
 * A connected chain has its base moved onto its host bone's connection point and any `LOCAL_`
 * basebone constraint resolved through the host bone's frame first. A chain with
 * `useEmbeddedTarget` set solves for its own `embeddedTarget` instead - how a walker's legs each
 * reach their own foothold.
 *
 * @param structure the structure to solve, mutated in place
 * @param target the target for every chain that does not use an embedded target
 */
export function solveStructure(structure: Structure3, target: Vec3): void {
    const chains = structure.chains;

    for (let i = 0; i < chains.length; i++) {
        const chain = chains[i];
        const connection = structure.connections[i];

        if (connection.hostChain >= 0) {
            const host = chains[connection.hostChain];
            const hostBone = host.bones[connection.hostBone];

            setBaseLocation(chain, connection.point === BoneConnectionPoint.START ? hostBone.start : hostBone.end);

            // being connected IS what fixes this chain's base - a connected chain with a free base
            // would drift away from the host it is supposed to hang off, so the flag is not the
            // caller's to clear here
            chain.fixedBase = true;

            const type = chain.baseboneConstraintType;

            if (type === BaseboneConstraintType.LOCAL_ROTOR || type === BaseboneConstraintType.LOCAL_HINGE) {
                // the constraint is expressed in the host bone's frame, so rotate it into the world
                getBoneDirection(_structure_direction, host, connection.hostBone);
                mat3.fromDirection(_structure_basis, _structure_direction);

                vec3.transformMat3(chain.baseboneWorldAxis, chain.baseboneAxis, _structure_basis);
                vec3.normalize(chain.baseboneWorldAxis, chain.baseboneWorldAxis);

                if (type === BaseboneConstraintType.LOCAL_HINGE) {
                    vec3.transformMat3(chain.baseboneWorldReferenceAxis, chain.baseboneReferenceAxis, _structure_basis);
                    orthonormalize(chain.baseboneWorldReferenceAxis, chain.baseboneWorldReferenceAxis, chain.baseboneWorldAxis);
                }
            }
        }

        solve(chain, chain.useEmbeddedTarget ? chain.embeddedTarget : target);
    }
}

const _structure_direction: Vec3 = [0, 0, 0];
const _structure_basis: Mat3 = /* @__PURE__ */ mat3.create();

/* internals */

const UP: Vec3 = [0, 1, 0];

// the direction the current pass is constraining against - the previous bone's, whichever way the
// pass is walking - and the constrained result handed back from `constrain*`
const _pass_reference: Vec3 = [0, 0, 0];
const _pass_direction: Vec3 = [0, 0, 0];
const _constrain_axis: Vec3 = [0, 0, 0];
const _constrain_reference: Vec3 = [0, 0, 0];
const _constrain_basis: Mat3 = /* @__PURE__ */ mat3.create();

function clampAngle(radians: number): number {
    return radians < 0 ? 0 : radians > Math.PI ? Math.PI : radians;
}

/** Writes the component of `a` perpendicular to the unit vector `axis`, normalized. */
function orthonormalize(out: Vec3, a: Vec3, axis: Vec3): Vec3 {
    vec3.projectOnPlane(out, a, axis);

    if (!hasDirection(vec3.squaredLength(out))) {
        // `a` is parallel to `axis`, so it names no direction in the plane - any will do
        return vec3.perpendicular(out, axis);
    }

    return vec3.normalize(out, out);
}

/** Normalizes `out` in place, falling back to `fallback` when it has no length. */
function normalizeOr(out: Vec3, fallback: Vec3): Vec3 {
    if (!hasDirection(vec3.squaredLength(out))) {
        return vec3.copy(out, fallback);
    }
    return vec3.normalize(out, out);
}

/**
 * Flattens a direction into a hinge's plane.
 *
 * A direction parallel to the hinge axis projects to nothing and has no in-plane direction to keep;
 * Caliko and its ports normalize the projection unguarded and produce NaN here. Fall back to the
 * hinge's reference axis, which lies in the plane by construction.
 */
function projectOntoHinge(out: Vec3, x: number, y: number, z: number, axis: Vec3, referenceAxis: Vec3): Vec3 {
    const d = x * axis[0] + y * axis[1] + z * axis[2];

    out[0] = x - axis[0] * d;
    out[1] = y - axis[1] * d;
    out[2] = z - axis[2] * d;

    if (!hasDirection(vec3.squaredLength(out))) {
        return vec3.copy(out, referenceAxis);
    }

    return vec3.normalize(out, out);
}

/** Rotates the unit vector `a` about the unit vector `axis` by `radians` (Rodrigues). */
function rotateAboutAxis(out: Vec3, a: Vec3, axis: Vec3, radians: number): Vec3 {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const kx = axis[0];
    const ky = axis[1];
    const kz = axis[2];

    const c = Math.cos(radians);
    const s = Math.sin(radians);
    const d = (kx * ax + ky * ay + kz * az) * (1 - c);

    out[0] = ax * c + (ky * az - kz * ay) * s + kx * d;
    out[1] = ay * c + (kz * ax - kx * az) * s + ky * d;
    out[2] = az * c + (kx * ay - ky * ax) * s + kz * d;

    return out;
}

/** Flattens into the hinge plane, then clamps the swing about the reference axis. Writes `_pass_direction`. */
function constrainHinge(
    x: number,
    y: number,
    z: number,
    axis: Vec3,
    referenceAxis: Vec3,
    clockwise: number,
    anticlockwise: number,
): void {
    projectOntoHinge(_pass_direction, x, y, z, axis, referenceAxis);

    if (clockwise >= Math.PI && anticlockwise >= Math.PI) return;

    // anticlockwise about the hinge axis is positive
    const signed = vec3.signedAngle(referenceAxis, _pass_direction, axis);

    if (signed > anticlockwise) {
        rotateAboutAxis(_pass_direction, referenceAxis, axis, anticlockwise);
    } else if (signed < -clockwise) {
        rotateAboutAxis(_pass_direction, referenceAxis, axis, -clockwise);
    }
}

/** Resolves a local hinge's axes into world space through the frame of bone `index - 1`. */
function resolveLocalHinge(chain: Chain3, index: number, joint: Joint3): void {
    getBoneDirection(_constrain_axis, chain, index - 1);
    mat3.fromDirection(_constrain_basis, _constrain_axis);

    vec3.transformMat3(_constrain_axis, joint.rotationAxis, _constrain_basis);
    vec3.normalize(_constrain_axis, _constrain_axis);

    vec3.transformMat3(_constrain_reference, joint.referenceAxis, _constrain_basis);
    orthonormalize(_constrain_reference, _constrain_reference, _constrain_axis);
}

/**
 * Constrains a bone's outer-to-inner direction during the forward pass.
 *
 * Two joints limit it: this bone's own hinge confines it to a plane, and the rotor bounding its bend
 * away from the bone further out belongs to the joint between them - the next bone's, not this one's.
 *
 * Hinge reference-axis limits are left to the backward pass; clamping on both lands on worse poses.
 *
 * Writes the result into `_pass_direction`, which starts out holding the unconstrained direction,
 * so a branch that does not apply can simply return.
 */
function constrainForward(chain: Chain3, index: number, x: number, y: number, z: number, hasReference: boolean): void {
    // start from the unconstrained direction; each branch below narrows it if it applies
    _pass_direction[0] = x;
    _pass_direction[1] = y;
    _pass_direction[2] = z;

    // first: whatever confines this bone's own orientation, neighbours aside
    if (index === 0) {
        const type = chain.baseboneConstraintType;

        if (type === BaseboneConstraintType.GLOBAL_HINGE || type === BaseboneConstraintType.LOCAL_HINGE) {
            projectOntoHinge(_pass_direction, x, y, z, chain.baseboneWorldAxis, chain.baseboneWorldReferenceAxis);
            return;
        }

        // a basebone rotor is measured against the base's own axis, which this pass knows nothing
        // about - the backward pass applies it
    } else {
        const joint = chain.bones[index].joint;

        if (joint.type === JointType.GLOBAL_HINGE) {
            projectOntoHinge(_pass_direction, x, y, z, joint.rotationAxis, joint.referenceAxis);
            return;
        }

        if (joint.type === JointType.LOCAL_HINGE) {
            resolveLocalHinge(chain, index, joint);
            projectOntoHinge(_pass_direction, x, y, z, _constrain_axis, _constrain_reference);
            return;
        }
    }

    // the rotor shared with the bone one step further out. the end effector has no such bone
    if (!hasReference) return;

    const outer = chain.bones[index + 1].joint;

    if (outer.type !== JointType.BALL || outer.rotor >= Math.PI) return;

    _pass_direction[0] = x;
    _pass_direction[1] = y;
    _pass_direction[2] = z;
    vec3.rotateTowards(_pass_direction, _pass_reference, _pass_direction, outer.rotor);
}

/**
 * Constrains a bone's inner-to-outer direction during the backward pass.
 *
 * Writes the result into `_pass_direction`, which starts out holding the unconstrained direction,
 * so a branch that does not apply can simply return.
 */
function constrainBackward(chain: Chain3, index: number, x: number, y: number, z: number, hasReference: boolean): void {
    // start from the unconstrained direction; each branch below narrows it if it applies
    _pass_direction[0] = x;
    _pass_direction[1] = y;
    _pass_direction[2] = z;

    if (index === 0) {
        switch (chain.baseboneConstraintType) {
            case BaseboneConstraintType.GLOBAL_ROTOR:
            case BaseboneConstraintType.LOCAL_ROTOR: {
                if (chain.baseboneRotor >= Math.PI) return;
                vec3.rotateTowards(_pass_direction, chain.baseboneWorldAxis, _pass_direction, chain.baseboneRotor);
                return;
            }
            case BaseboneConstraintType.GLOBAL_HINGE:
            case BaseboneConstraintType.LOCAL_HINGE: {
                constrainHinge(
                    x,
                    y,
                    z,
                    chain.baseboneWorldAxis,
                    chain.baseboneWorldReferenceAxis,
                    chain.baseboneClockwise,
                    chain.baseboneAnticlockwise,
                );
                return;
            }
            default:
                return;
        }
    }

    const joint = chain.bones[index].joint;

    switch (joint.type) {
        case JointType.BALL: {
            if (!hasReference || joint.rotor >= Math.PI) return;
            vec3.rotateTowards(_pass_direction, _pass_reference, _pass_direction, joint.rotor);
            return;
        }
        case JointType.GLOBAL_HINGE: {
            constrainHinge(x, y, z, joint.rotationAxis, joint.referenceAxis, joint.clockwise, joint.anticlockwise);
            return;
        }
        case JointType.LOCAL_HINGE: {
            resolveLocalHinge(chain, index, joint);
            constrainHinge(x, y, z, _constrain_axis, _constrain_reference, joint.clockwise, joint.anticlockwise);
            return;
        }
        default:
            return;
    }
}

function saveSolution(chain: Chain3): void {
    const bones = chain.bones;
    const solution = chain.bestSolution;

    for (let i = 0; i < bones.length; i++) {
        const bone = bones[i];
        const offset = i * 6;

        solution[offset] = bone.start[0];
        solution[offset + 1] = bone.start[1];
        solution[offset + 2] = bone.start[2];
        solution[offset + 3] = bone.end[0];
        solution[offset + 4] = bone.end[1];
        solution[offset + 5] = bone.end[2];
    }
}

function restoreSolution(chain: Chain3): void {
    const bones = chain.bones;
    const solution = chain.bestSolution;

    for (let i = 0; i < bones.length; i++) {
        const bone = bones[i];
        const offset = i * 6;

        bone.start[0] = solution[offset];
        bone.start[1] = solution[offset + 1];
        bone.start[2] = solution[offset + 2];
        bone.end[0] = solution[offset + 3];
        bone.end[1] = solution[offset + 4];
        bone.end[2] = solution[offset + 5];
    }
}
