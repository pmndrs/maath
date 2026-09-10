import type { MutableArrayLike } from './arrays';
import type { RMat4 } from './mat4';
import type { RQuat } from './quat';
import * as scalar from './scalar';

/** A 4D vector */
export type Vec4 = [x: number, y: number, z: number, w: number];

/** A read-only 4D vector */
export type RVec4 = Readonly<Vec4>;

/**
 * Creates a new, empty vec4
 *
 * @returns a new 4D vector
 */
export function create(): Vec4 {
    return [0, 0, 0, 0];
}

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param a vector to clone
 * @returns a new 4D vector
 */
export function clone(a: RVec4): Vec4 {
    return [a[0], a[1], a[2], a[3]];
}

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param x X component
 * @param y Y component
 * @param z Z component
 * @param w W component
 * @returns a new 4D vector
 */
export function fromValues(x: number, y: number, z: number, w: number): Vec4 {
    return [x, y, z, w];
}

/**
 * Copy the values from one vec4 to another
 *
 * @param out the receiving vector
 * @param a the source vector
 * @returns out
 */
export function copy(out: Vec4, a: RVec4): Vec4 {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
}

/**
 * Set the components of a vec4 to the given values
 *
 * @param out the receiving vector
 * @param x X component
 * @param y Y component
 * @param z Z component
 * @param w W component
 * @returns out
 */
export function set(out: Vec4, x: number, y: number, z: number, w: number): Vec4 {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
}

/**
 * Sets the components of a vec4 from a buffer
 * @param out the receiving vector
 * @param buffer the source buffer
 * @param startIndex the starting index in the buffer
 * @returns out
 */
export function fromBuffer(out: Vec4, buffer: ArrayLike<number>, startIndex: number): Vec4 {
    out[0] = buffer[startIndex];
    out[1] = buffer[startIndex + 1];
    out[2] = buffer[startIndex + 2];
    out[3] = buffer[startIndex + 3];
    return out;
}

/**
 * Writes the components of a vec4 to a buffer
 * @param outBuffer The output buffer
 * @param vec The source vector
 * @param startIndex The starting index in the buffer
 * @returns The output buffer
 */
export function toBuffer(outBuffer: MutableArrayLike<number>, vec: RVec4, startIndex: number): MutableArrayLike<number> {
    outBuffer[startIndex] = vec[0];
    outBuffer[startIndex + 1] = vec[1];
    outBuffer[startIndex + 2] = vec[2];
    outBuffer[startIndex + 3] = vec[3];
    return outBuffer;
}

/**
 * Adds two vec4's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function add(out: Vec4, a: RVec4, b: RVec4): Vec4 {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function subtract(out: Vec4, a: RVec4, b: RVec4): Vec4 {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
}

/**
 * Multiplies two vec4's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function multiply(out: Vec4, a: RVec4, b: RVec4): Vec4 {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
}

/**
 * Divides two vec4's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function divide(out: Vec4, a: RVec4, b: RVec4): Vec4 {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
}

/**
 * Math.ceil the components of a vec4
 *
 * @param out the receiving vector
 * @param a vector to ceil
 * @returns out
 */
export function ceil(out: Vec4, a: RVec4): Vec4 {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    out[3] = Math.ceil(a[3]);
    return out;
}

/**
 * Math.floor the components of a vec4
 *
 * @param out the receiving vector
 * @param a vector to floor
 * @returns out
 */
export function floor(out: Vec4, a: RVec4): Vec4 {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    out[3] = Math.floor(a[3]);
    return out;
}

/**
 * Returns the minimum of two vec4's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function min(out: Vec4, a: RVec4, b: RVec4): Vec4 {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
}

/**
 * Returns the maximum of two vec4's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function max(out: Vec4, a: RVec4, b: RVec4): Vec4 {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
}

/**
 * symmetric round the components of a vec4
 *
 * @param out the receiving vector
 * @param a vector to round
 * @returns out
 */
export function round(out: Vec4, a: RVec4): Vec4 {
    out[0] = scalar.round(a[0]);
    out[1] = scalar.round(a[1]);
    out[2] = scalar.round(a[2]);
    out[3] = scalar.round(a[3]);
    return out;
}

/**
 * Scales a vec4 by a scalar number
 *
 * @param out the receiving vector
 * @param a the vector to scale
 * @param b amount to scale the vector by
 * @returns out
 */
export function scale(out: Vec4, a: RVec4, b: number): Vec4 {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
}

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param scale the amount to scale b by before adding
 * @returns out
 */
export function scaleAndAdd(out: Vec4, a: RVec4, b: RVec4, scale: number): Vec4 {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    out[3] = a[3] + b[3] * scale;
    return out;
}

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns distance between a and b
 */
export function distance(a: RVec4, b: RVec4): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];
    const w = b[3] - a[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns squared distance between a and b
 */
export function squaredDistance(a: RVec4, b: RVec4): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];
    const w = b[3] - a[3];
    return x * x + y * y + z * z + w * w;
}

/**
 * Calculates the length of a vec4
 *
 * @param a vector to calculate length of
 * @returns length of a
 */
export function length(a: RVec4): number {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared length of a vec4
 *
 * @param a vector to calculate squared length of
 * @returns squared length of a
 */
export function squaredLength(a: RVec4): number {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];
    return x * x + y * y + z * z + w * w;
}

/**
 * Negates the components of a vec4
 *
 * @param out the receiving vector
 * @param a vector to negate
 * @returns out
 */
export function negate(out: Vec4, a: RVec4): Vec4 {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
}

/**
 * Returns the inverse of the components of a vec4
 *
 * @param out the receiving vector
 * @param a vector to invert
 * @returns out
 */
export function inverse(out: Vec4, a: RVec4): Vec4 {
    out[0] = 1.0 / a[0];
    out[1] = 1.0 / a[1];
    out[2] = 1.0 / a[2];
    out[3] = 1.0 / a[3];
    return out;
}

/**
 * Normalize a vec4
 *
 * @param out the receiving vector
 * @param a vector to normalize
 * @returns out
 */
export function normalize(out: Vec4, a: RVec4): Vec4 {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];
    let len = x * x + y * y + z * z + w * w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
    }
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
    return out;
}

/**
 * Calculates the dot product of two vec4's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns dot product of a and b
 */
export function dot(a: RVec4, b: RVec4): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param out the receiving vector
 * @param u the first vector
 * @param v the second vector
 * @param w the third vector
 * @returns result
 */
export function cross(out: Vec4, u: RVec4, v: RVec4, w: RVec4): Vec4 {
    const A = v[0] * w[1] - v[1] * w[0];
    const B = v[0] * w[2] - v[2] * w[0];
    const C = v[0] * w[3] - v[3] * w[0];
    const D = v[1] * w[2] - v[2] * w[1];
    const E = v[1] * w[3] - v[3] * w[1];
    const F = v[2] * w[3] - v[3] * w[2];
    const G = u[0];
    const H = u[1];
    const I = u[2];
    const J = u[3];

    out[0] = H * F - I * E + J * D;
    out[1] = -(G * F) + I * C - J * B;
    out[2] = G * E - H * C + J * A;
    out[3] = -(G * D) + H * B - I * A;

    return out;
}

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function lerp(out: Vec4, a: RVec4, b: RVec4, t: number): Vec4 {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
}

/**
 * Quadratic interpolation through three vectors using Lagrange interpolation.
 * Passes through a at t=0, b at t=0.5, and c at t=1.
 *
 * @param out the receiving vector
 * @param a vector at t=0
 * @param b vector at t=0.5
 * @param c vector at t=1
 * @param t interpolation amount
 * @returns out
 */
export function lagrange(out: Vec4, a: RVec4, b: RVec4, c: RVec4, t: number): Vec4 {
    const c0 = 2 * (t - 1) * (t - 0.5);
    const c1 = -4 * (t - 1) * t;
    const c2 = 2 * (t - 0.5) * t;
    out[0] = c0 * a[0] + c1 * b[0] + c2 * c[0];
    out[1] = c0 * a[1] + c1 * b[1] + c2 * c[1];
    out[2] = c0 * a[2] + c1 * b[2] + c2 * c[2];
    out[3] = c0 * a[3] + c1 * b[3] + c2 * c[3];
    return out;
}

/**
 * Transforms the vec4 with a mat4.
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param m matrix to transform with
 * @returns out
 */
export function transformMat4(out: Vec4, a: RVec4, m: RMat4): Vec4 {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
}

/**
 * Transforms the vec4 with a quat
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param q quaternion to transform with
 * @returns out
 */
export function transformQuat(out: Vec4, a: RVec4, q: RQuat): Vec4 {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];

    // calculate quat * vec
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    out[3] = a[3];
    return out;
}

/**
 * Set the components of a vec4 to zero
 *
 * @param out the receiving vector
 * @returns out
 */
export function zero(out: Vec4): Vec4 {
    out[0] = 0.0;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param a vector to represent as a string
 * @returns string representation of the vector
 */
export function str(a: RVec4): string {
    return `vec4(${a[0]}, ${a[1]}, ${a[2]}, ${a[3]})`;
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param a The first vector.
 * @param b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function exactEquals(a: RVec4, b: RVec4): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param a The first vector.
 * @param b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function equals(a: RVec4, b: RVec4): boolean {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];
    const b3 = b[3];
    return (
        Math.abs(a0 - b0) <= scalar.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= scalar.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= scalar.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
        Math.abs(a3 - b3) <= scalar.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3))
    );
}

/**
 * Returns whether or not the vector is finite
 * @param a vector to test
 * @returns whether or not the vector is finite
 */
export function finite(a: RVec4): boolean {
    return Number.isFinite(a[0]) && Number.isFinite(a[1]) && Number.isFinite(a[2]) && Number.isFinite(a[3]);
}

/**
 * Alias for {@link subtract}
 */
export const sub = subtract;

/**
 * Alias for {@link multiply}
 */
export const mul = multiply;

/**
 * Alias for {@link divide}
 */
export const div = divide;

/**
 * Alias for {@link distance}
 */
export const dist = distance;

/**
 * Alias for {@link squaredDistance}
 */
export const sqrDist = squaredDistance;

/**
 * Alias for {@link length}
 */
export const len = length;

/**
 * Alias for {@link squaredLength}
 */
export const sqrLen = squaredLength;
