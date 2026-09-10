import type { MutableArrayLike } from './arrays';
import type { Euler, EulerOrder, REuler } from './euler';
import type { RMat3 } from './mat3';
import * as mat3 from './mat3';
import type { RMat4 } from './mat4';
import { EPSILON } from './scalar';
import type { RVec3, Vec3 } from './vec3';
import * as vec3 from './vec3';
import * as vec4 from './vec4';

/** A quaternion that represents rotation */
export type Quat = [x: number, y: number, z: number, w: number];

/** A read-only quaternion */
export type RQuat = Readonly<Quat>;

/**
 * Creates a new identity quat
 *
 * @returns a new quaternion
 */
export function create(): Quat {
    return [0, 0, 0, 1];
}

/**
 * Sets the components of a quat from a buffer
 * @param out the receiving quaternion
 * @param buffer the source buffer
 * @param startIndex the starting index in the buffer
 * @returns out
 */
export function fromBuffer(out: Quat, buffer: ArrayLike<number>, startIndex: number): Quat {
    out[0] = buffer[startIndex];
    out[1] = buffer[startIndex + 1];
    out[2] = buffer[startIndex + 2];
    out[3] = buffer[startIndex + 3];
    return out;
}

/**
 * Writes the components of a quat to a buffer
 * @param outBuffer The output buffer
 * @param q The source quaternion
 * @param startIndex The starting index in the buffer
 * @returns The output buffer
 */
export function toBuffer(outBuffer: MutableArrayLike<number>, q: RQuat, startIndex: number): MutableArrayLike<number> {
    outBuffer[startIndex] = q[0];
    outBuffer[startIndex + 1] = q[1];
    outBuffer[startIndex + 2] = q[2];
    outBuffer[startIndex + 3] = q[3];
    return outBuffer;
}

/**
 * Set a quat to the identity quaternion
 *
 * @param out the receiving quaternion
 * @returns out
 */
export function identity(out: Quat): Quat {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
}

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param out the receiving quaternion
 * @param axis the axis around which to rotate
 * @param rad the angle in radians
 * @returns out
 **/
export function setAxisAngle(out: Quat, axis: RVec3, rad: number): Quat {
    rad *= 0.5;
    const s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
}

/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  out_axis  Vector receiving the axis of rotation
 * @param  q     Quaternion to be decomposed
 * @return     Angle, in radians, of the rotation
 */
export function getAxisAngle(out_axis: Vec3, q: RQuat): number {
    const rad = Math.acos(q[3]) * 2.0;
    const s = Math.sin(rad / 2.0);
    if (s > EPSILON) {
        out_axis[0] = q[0] / s;
        out_axis[1] = q[1] / s;
        out_axis[2] = q[2] / s;
    } else {
        // If s is zero, return any axis (no rotation - axis does not matter)
        out_axis[0] = 1;
        out_axis[1] = 0;
        out_axis[2] = 0;
    }
    return rad;
}

/**
 * Gets the angular distance between two unit quaternions
 *
 * @param  a     Origin unit quaternion
 * @param  b     Destination unit quaternion
 * @return     Angle, in radians, between the two quaternions
 */
export function getAngle(a: RQuat, b: RQuat): number {
    const dotproduct = dot(a, b);

    return Math.acos(2 * dotproduct * dotproduct - 1);
}

/**
 * Multiplies two quat's
 *
 * @param out the receiving quaternion
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function multiply(out: Quat, a: RQuat, b: RQuat): Quat {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
}

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param out quat receiving operation result
 * @param a quat to rotate
 * @param rad angle (in radians) to rotate
 * @returns out
 */
export function rotateX(out: Quat, a: RQuat, rad: number): Quat {
    rad *= 0.5;

    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bx = Math.sin(rad);
    const bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
}

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param out quat receiving operation result
 * @param a quat to rotate
 * @param rad angle (in radians) to rotate
 * @returns out
 */
export function rotateY(out: Quat, a: RQuat, rad: number): Quat {
    rad *= 0.5;

    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const by = Math.sin(rad);
    const bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
}

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param out quat receiving operation result
 * @param a quat to rotate
 * @param rad angle (in radians) to rotate
 * @returns out
 */
export function rotateZ(out: Quat, a: RQuat, rad: number): Quat {
    rad *= 0.5;

    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bz = Math.sin(rad);
    const bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
}

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param out the receiving quaternion
 * @param a quat to calculate W component of
 * @returns out
 */
export function calculateW(out: Quat, a: RQuat): Quat {
    const x = a[0];
    const y = a[1];
    const z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
}

/**
 * Calculate the exponential of a unit quaternion.
 *
 * @param out the receiving quaternion
 * @param a quat to calculate the exponential of
 * @returns out
 */
export function exp(out: Quat, a: RQuat): Quat {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];

    const r = Math.sqrt(x * x + y * y + z * z);
    const et = Math.exp(w);
    const s = r > 0 ? (et * Math.sin(r)) / r : 0;

    out[0] = x * s;
    out[1] = y * s;
    out[2] = z * s;
    out[3] = et * Math.cos(r);

    return out;
}

/**
 * Calculate the natural logarithm of a unit quaternion.
 *
 * @param out the receiving quaternion
 * @param a quat to calculate the exponential of
 * @returns out
 */
export function ln(out: Quat, a: RQuat): Quat {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];

    const r = Math.sqrt(x * x + y * y + z * z);
    const t = r > 0 ? Math.atan2(r, w) / r : 0;

    out[0] = x * t;
    out[1] = y * t;
    out[2] = z * t;
    out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);

    return out;
}

/**
 * Calculate the scalar power of a unit quaternion.
 *
 * @param out the receiving quaternion
 * @param a quat to calculate the exponential of
 * @param b amount to scale the quaternion by
 * @returns out
 */
export function pow(out: Quat, a: RQuat, b: number): Quat {
    ln(out, a);
    scale(out, out, b);
    exp(out, out);
    return out;
}

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param out the receiving quaternion
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function slerp(out: Quat, a: RQuat, b: RQuat, t: number): Quat {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    let bx = b[0];
    let by = b[1];
    let bz = b[2];
    let bw = b[3];

    let omega: number;
    let cosom: number;
    let sinom: number;
    let scale0: number;
    let scale1: number;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if (cosom < 0.0) {
        cosom = -cosom;
        bx = -bx;
        by = -by;
        bz = -bz;
        bw = -bw;
    }
    // calculate coefficients
    if (1.0 - cosom > EPSILON) {
        // standard case (slerp)
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {
        // "from" and "to" quaternions are very close
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;

    return out;
}

/**
 * Calculates the inverse of a quat
 *
 * @param out the receiving quaternion
 * @param a quat to calculate inverse of
 * @returns out
 */
export function invert(out: Quat, a: RQuat): Quat {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;

    if (dot === 0) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        return out;
    }

    const invDot = 1.0 / dot;
    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
}

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param out the receiving quaternion
 * @param a quat to calculate conjugate of
 * @returns out
 */
export function conjugate(out: Quat, a: RQuat): Quat {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
}

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param out the receiving quaternion
 * @param m rotation matrix
 * @returns out
 */
export function fromMat3(out: Quat, m: RMat3): Quat {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    const fTrace = m[0] + m[4] + m[8];
    let fRoot: number;

    if (fTrace > 0.0) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0); // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot; // 1/(4w)
        out[0] = (m[5] - m[7]) * fRoot;
        out[1] = (m[6] - m[2]) * fRoot;
        out[2] = (m[1] - m[3]) * fRoot;
    } else {
        // |w| <= 1/2
        let i = 0;
        if (m[4] > m[0]) i = 1;
        if (m[8] > m[i * 3 + i]) i = 2;
        const j = (i + 1) % 3;
        const k = (i + 2) % 3;

        fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
        out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
        out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }

    return out;
}

/**
 * Calculates a quaternion from a 4x4 rotation matrix
 * Extracts the 3x3 rotation part and calls fromMat3
 *
 * @param out the receiving quaternion
 * @param m rotation matrix
 * @returns out
 */
export function fromMat4(out: Quat, m: RMat4): Quat {
    const m3 = mat3.create();
    mat3.fromMat4(m3, m);
    return fromMat3(out, m3);
}

/**
 * Creates a quaternion from the given euler
 * @param out the receiving quaternion
 * @param euler the euler to create the quaternion from
 * @returns out
 */
export function fromEuler(out: Quat, euler: REuler): Quat {
    const x = euler[0];
    const y = euler[1];
    const z = euler[2];
    const order = euler[3] || 'xyz';

    const cos = Math.cos;
    const sin = Math.sin;

    const c1 = cos(x / 2);
    const c2 = cos(y / 2);
    const c3 = cos(z / 2);

    const s1 = sin(x / 2);
    const s2 = sin(y / 2);
    const s3 = sin(z / 2);

    switch (order) {
        case 'xyz':
            out[0] = s1 * c2 * c3 + c1 * s2 * s3;
            out[1] = c1 * s2 * c3 - s1 * c2 * s3;
            out[2] = c1 * c2 * s3 + s1 * s2 * c3;
            out[3] = c1 * c2 * c3 - s1 * s2 * s3;
            break;

        case 'yxz':
            out[0] = s1 * c2 * c3 + c1 * s2 * s3;
            out[1] = c1 * s2 * c3 - s1 * c2 * s3;
            out[2] = c1 * c2 * s3 - s1 * s2 * c3;
            out[3] = c1 * c2 * c3 + s1 * s2 * s3;
            break;

        case 'zxy':
            out[0] = s1 * c2 * c3 - c1 * s2 * s3;
            out[1] = c1 * s2 * c3 + s1 * c2 * s3;
            out[2] = c1 * c2 * s3 + s1 * s2 * c3;
            out[3] = c1 * c2 * c3 - s1 * s2 * s3;
            break;

        case 'zyx':
            out[0] = s1 * c2 * c3 - c1 * s2 * s3;
            out[1] = c1 * s2 * c3 + s1 * c2 * s3;
            out[2] = c1 * c2 * s3 - s1 * s2 * c3;
            out[3] = c1 * c2 * c3 + s1 * s2 * s3;
            break;

        case 'yzx':
            out[0] = s1 * c2 * c3 + c1 * s2 * s3;
            out[1] = c1 * s2 * c3 + s1 * c2 * s3;
            out[2] = c1 * c2 * s3 - s1 * s2 * c3;
            out[3] = c1 * c2 * c3 - s1 * s2 * s3;
            break;

        case 'xzy':
            out[0] = s1 * c2 * c3 - c1 * s2 * s3;
            out[1] = c1 * s2 * c3 - s1 * c2 * s3;
            out[2] = c1 * c2 * s3 + s1 * s2 * c3;
            out[3] = c1 * c2 * c3 + s1 * s2 * s3;
            break;

        default:
            console.warn(`fromEuler() encountered an unknown order: ${order}`);
    }

    return out;
}

const _fromDegrees_euler: Euler = [0, 0, 0, 'xyz'];

/**
 * Creates a quaternion from euler angles specified in degrees.
 * Shorthand for converting degrees to radians and then creating a quaternion from euler.
 *
 * @param out the receiving quaternion
 * @param x The x euler rotation in degrees
 * @param y The y euler rotation in degrees
 * @param z The z euler rotation in degrees
 * @param order The order of rotation
 * @returns out
 */
export function fromDegrees(out: Quat, x: number, y: number, z: number, order: EulerOrder): Quat {
    _fromDegrees_euler[0] = (x * Math.PI) / 180;
    _fromDegrees_euler[1] = (y * Math.PI) / 180;
    _fromDegrees_euler[2] = (z * Math.PI) / 180;
    _fromDegrees_euler[3] = order;

    return fromEuler(out, _fromDegrees_euler);
}

/**
 * Returns a string representation of a quaternion
 *
 * @param a vector to represent as a string
 * @returns string representation of the vector
 */
export function str(a: RQuat): string {
    return `quat(${a[0]}, ${a[1]}, ${a[2]}, ${a[3]})`;
}

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param a quaternion to clone
 * @returns a new quaternion
 */
export const clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param x X component
 * @param y Y component
 * @param z Z component
 * @param w W component
 * @returns a new quaternion
 */
export const fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param out the receiving quaternion
 * @param a the source quaternion
 * @returns out
 */
export const copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param out the receiving quaternion
 * @param x X component
 * @param y Y component
 * @param z Z component
 * @param w W component
 * @returns out
 */
export const set = vec4.set;

/**
 * Adds two quat's
 *
 * @param out the receiving quaternion
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export const add = vec4.add;

/**
 * Scales a quat by a scalar number
 *
 * @param out the receiving quaternion
 * @param a the quaternion to scale
 * @param b amount to scale the quaternion by
 * @returns out
 */
export const scale = vec4.scale;

/**
 * Calculates the dot product of two quat's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns dot product of a and b
 */
export const dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param out the receiving quaternion
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export const lerp = vec4.lerp;

/**
 * Calculates the length of a quat
 *
 * @param a quaternion to calculate length of
 * @returns length of a
 */
export const length = vec4.length;

/**
 * Alias for {@link length}
 */
export const len = length;

/**
 * Calculates the squared length of a quat
 *
 * @param a quaternion to calculate squared length of
 * @returns squared length of a
 */
export const squaredLength = vec4.squaredLength;

/**
 * Alias for {@link squaredLength}
 */
export const sqrLen = squaredLength;

/**
 * Alias for {@link multiply}
 */
export const mul = multiply;

/**
 * Normalize a quat
 *
 * @param out the receiving quaternion
 * @param a quaternion to normalize
 * @returns out
 */
export const normalize = vec4.normalize;

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param a The first quaternion.
 * @param b The second quaternion.
 * @returns True if the quaternions are equal, false otherwise.
 */
export const exactEquals = vec4.exactEquals;

/**
 * Returns whether or not the quaternions have approximately the same elements in the same position.
 *
 * @param a The first quaternion.
 * @param b The second quaternion.
 * @returns True if the quaternions are equal, false otherwise.
 */
export function equals(a: RQuat, b: RQuat): boolean {
    return Math.abs(vec4.dot(a, b)) >= 1 - EPSILON;
}

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param out the receiving quaternion.
 * @param a the initial vector
 * @param b the destination vector
 * @returns out
 */
export const rotationTo = /* @__PURE__ */ (() => {
    const tmpvec3 = vec3.create();
    const xUnitVec3 = vec3.fromValues(1, 0, 0);
    const yUnitVec3 = vec3.fromValues(0, 1, 0);

    return (out: Quat, a: RVec3, b: RVec3): Quat => {
        const dot = vec3.dot(a, b);

        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001) vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        }

        if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        }

        vec3.cross(tmpvec3, a, b);
        out[0] = tmpvec3[0];
        out[1] = tmpvec3[1];
        out[2] = tmpvec3[2];
        out[3] = 1 + dot;
        return normalize(out, out);
    };
})();

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param out the receiving quaternion
 * @param a the first operand
 * @param b the second operand
 * @param c the third operand
 * @param d the fourth operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export const sqlerp = /* @__PURE__ */ (() => {
    const temp1 = create();
    const temp2 = create();

    return (out: Quat, a: RQuat, b: RQuat, c: RQuat, d: RQuat, t: number): Quat => {
        slerp(temp1, a, d, t);
        slerp(temp2, b, c, t);
        slerp(out, temp1, temp2, 2 * t * (1 - t));

        return out;
    };
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param view  the vector representing the viewing direction
 * @param right the vector representing the local "right" direction
 * @param up    the vector representing the local "up" direction
 * @returns out
 */
export const setAxes = /* @__PURE__ */ (() => {
    const matr = mat3.create();

    return (out: Quat, view: RVec3, right: RVec3, up: RVec3): Quat => {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return normalize(out, fromMat3(out, matr));
    };
})();
