import type { MutableArrayLike } from './arrays';
import type { Mat2 } from './mat2';
import type { Mat2d } from './mat2d';
import type { Mat3 } from './mat3';
import type { Mat4 } from './mat4';
import * as scalar from './scalar';
import type { Vec3 } from './vec3';

/** A 2D vector */
export type Vec2 = [x: number, y: number];

/**
 * Creates a new, empty vec2
 *
 * @returns a new 2D vector
 */
export function create(): Vec2 {
    return [0, 0];
}

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param a vector to clone
 * @returns a new 2D vector
 */
export function clone(a: Vec2): Vec2 {
    return [a[0], a[1]];
}

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param x X component
 * @param y Y component
 * @returns a new 2D vector
 */
export function fromValues(x: number, y: number): Vec2 {
    return [x, y];
}

/**
 * Copy the values from one vec2 to another
 *
 * @param out the receiving vector
 * @param a the source vector
 * @returns out
 */
export function copy(out: Vec2, a: Vec2): Vec2 {
    out[0] = a[0];
    out[1] = a[1];
    return out;
}

/**
 * Set the components of a vec2 to the given values
 *
 * @param out the receiving vector
 * @param x X component
 * @param y Y component
 * @returns out
 */
export function set(out: Vec2, x: number, y: number): Vec2 {
    out[0] = x;
    out[1] = y;
    return out;
}

/**
 * Sets the components of a vec2 from a buffer
 * @param out the receiving vector
 * @param buffer the source buffer
 * @param startIndex the starting index in the buffer
 * @returns out
 */
export function fromBuffer(out: Vec2, buffer: ArrayLike<number>, startIndex: number): Vec2 {
    out[0] = buffer[startIndex];
    out[1] = buffer[startIndex + 1];
    return out;
}

/**
 * Writes the components of a vec2 to a buffer
 * @param outBuffer The output buffer
 * @param vec The source vector
 * @param startIndex The starting index in the buffer
 * @returns The output buffer
 */
export function toBuffer(outBuffer: MutableArrayLike<number>, vec: Vec2, startIndex: number): MutableArrayLike<number> {
    outBuffer[startIndex] = vec[0];
    outBuffer[startIndex + 1] = vec[1];
    return outBuffer;
}

/**
 * Adds two vec2's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function add(out: Vec2, a: Vec2, b: Vec2): Vec2 {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
}

/**
 * Adds a scalar value to all components of a vec2
 *
 * @param out the receiving vector
 * @param a the source vector
 * @param b the scalar value to add
 * @returns out
 */
export function addScalar(out: Vec2, a: Vec2, b: number): Vec2 {
    out[0] = a[0] + b;
    out[1] = a[1] + b;
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
export function subtract(out: Vec2, a: Vec2, b: Vec2): Vec2 {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
}

/**
 * Subtracts a scalar value from all components of a vec2
 *
 * @param out the receiving vector
 * @param a the source vector
 * @param b the scalar value to subtract
 * @returns out
 */
export function subtractScalar(out: Vec2, a: Vec2, b: number): Vec2 {
    out[0] = a[0] - b;
    out[1] = a[1] - b;
    return out;
}

/**
 * Multiplies two vec2's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function multiply(out: Vec2, a: Vec2, b: Vec2): Vec2 {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
}

/**
 * Divides two vec2's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function divide(out: Vec2, a: Vec2, b: Vec2): Vec2 {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
}

/**
 * Math.ceil the components of a vec2
 *
 * @param out the receiving vector
 * @param a vector to ceil
 * @returns out
 */
export function ceil(out: Vec2, a: Vec2): Vec2 {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    return out;
}

/**
 * Math.floor the components of a vec2
 *
 * @param out the receiving vector
 * @param a vector to floor
 * @returns out
 */
export function floor(out: Vec2, a: Vec2): Vec2 {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    return out;
}

/**
 * Returns the minimum of two vec2's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function min(out: Vec2, a: Vec2, b: Vec2): Vec2 {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
}

/**
 * Returns the maximum of two vec2's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function max(out: Vec2, a: Vec2, b: Vec2): Vec2 {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
}

/**
 * symmetric round the components of a vec2
 *
 * @param out the receiving vector
 * @param a vector to round
 * @returns out
 */
export function round(out: Vec2, a: Vec2): Vec2 {
    out[0] = scalar.round(a[0]);
    out[1] = scalar.round(a[1]);
    return out;
}

/**
 * Scales a vec2 by a scalar number
 *
 * @param out the receiving vector
 * @param a the vector to scale
 * @param b amount to scale the vector by
 * @returns out
 */
export function scale(out: Vec2, a: Vec2, b: number): Vec2 {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
}

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param scale the amount to scale b by before adding
 * @returns out
 */
export function scaleAndAdd(out: Vec2, a: Vec2, b: Vec2, scale: number): Vec2 {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    return out;
}

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns distance between a and b
 */
export function distance(a: Vec2, b: Vec2): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    return Math.sqrt(x * x + y * y);
}

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns squared distance between a and b
 */
export function squaredDistance(a: Vec2, b: Vec2): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    return x * x + y * y;
}

/**
 * Calculates the length of a vec2
 *
 * @param a vector to calculate length of
 * @returns length of a
 */
export function length(a: Vec2): number {
    const x = a[0];
    const y = a[1];
    return Math.sqrt(x * x + y * y);
}

/**
 * Calculates the squared length of a vec2
 *
 * @param a vector to calculate squared length of
 * @returns squared length of a
 */
export function squaredLength(a: Vec2): number {
    const x = a[0];
    const y = a[1];
    return x * x + y * y;
}

/**
 * Negates the components of a vec2
 *
 * @param out the receiving vector
 * @param a vector to negate
 * @returns out
 */
export function negate(out: Vec2, a: Vec2): Vec2 {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
}

/**
 * Returns the inverse of the components of a vec2
 *
 * @param out the receiving vector
 * @param a vector to invert
 * @returns out
 */
export function inverse(out: Vec2, a: Vec2): Vec2 {
    out[0] = 1.0 / a[0];
    out[1] = 1.0 / a[1];
    return out;
}

/**
 * Normalize a vec2
 *
 * @param out the receiving vector
 * @param a vector to normalize
 * @returns out
 */
export function normalize(out: Vec2, a: Vec2): Vec2 {
    const x = a[0];
    const y = a[1];
    let len = x * x + y * y;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    return out;
}

/**
 * Calculates the dot product of two vec2's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns dot product of a and b
 */
export function dot(a: Vec2, b: Vec2): number {
    return a[0] * b[0] + a[1] * b[1];
}

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function cross(out: Vec3, a: Vec2, b: Vec2): Vec3 {
    const z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
}

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function lerp(out: Vec2, a: Vec2, b: Vec2, t: number): Vec2 {
    const ax = a[0];
    const ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
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
export function lagrange(out: Vec2, a: Vec2, b: Vec2, c: Vec2, t: number): Vec2 {
    const c0 = 2 * (t - 1) * (t - 0.5);
    const c1 = -4 * (t - 1) * t;
    const c2 = 2 * (t - 0.5) * t;
    out[0] = c0 * a[0] + c1 * b[0] + c2 * c[0];
    out[1] = c0 * a[1] + c1 * b[1] + c2 * c[1];
    return out;
}

/**
 * Transforms the vec2 with a mat2
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param m matrix to transform with
 * @returns out
 */
export function transformMat2(out: Vec2, a: Vec2, m: Mat2): Vec2 {
    const x = a[0];
    const y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
}

/**
 * Transforms the vec2 with a mat2d
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param m matrix to transform with
 * @returns out
 */
export function transformMat2d(out: Vec2, a: Vec2, m: Mat2d): Vec2 {
    const x = a[0];
    const y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
}

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param m matrix to transform with
 * @returns out
 */
export function transformMat3(out: Vec2, a: Vec2, m: Mat3): Vec2 {
    const x = a[0];
    const y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
}

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param m matrix to transform with
 * @returns out
 */
export function transformMat4(out: Vec2, a: Vec2, m: Mat4): Vec2 {
    const x = a[0];
    const y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
}

/**
 * Rotate a 2D vector
 * @param out The receiving vec2
 * @param a The vec2 point to rotate
 * @param b The origin of the rotation
 * @param rad The angle of rotation in radians
 * @returns out
 */
export function rotate(out: Vec2, a: Vec2, b: Vec2, rad: number): Vec2 {
    //Translate point to the origin
    const p0 = a[0] - b[0];
    const p1 = a[1] - b[1];
    const sinC = Math.sin(rad);
    const cosC = Math.cos(rad);

    //perform rotation and translate to correct position
    out[0] = p0 * cosC - p1 * sinC + b[0];
    out[1] = p0 * sinC + p1 * cosC + b[1];

    return out;
}

/**
 * Get the angle between two 2D vectors
 * @param a The first operand
 * @param b The second operand
 * @returns The angle in radians
 */
export function angle(a: Vec2, b: Vec2): number {
    const x1 = a[0];
    const y1 = a[1];
    const x2 = b[0];
    const y2 = b[1];
    // mag is the product of the magnitudes of a and b
    const mag = Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2));
    // mag &&.. short circuits if mag == 0
    const cosine = mag && (x1 * x2 + y1 * y2) / mag;
    // Math.min(Math.max(cosine, -1), 1) clamps the cosine between -1 and 1
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
}

/**
 * Get the signed angle from `a` to `b`, in the range (-PI, PI].
 *
 * Positive is counter-clockwise. Returns 0 if either vector is zero length.
 *
 * Unlike {@link angle}, this distinguishes the two directions of rotation, which is what
 * joint limits and turn directions need.
 *
 * @param a the first operand
 * @param b the second operand
 * @returns the signed angle in radians
 */
export function signedAngle(a: Vec2, b: Vec2): number {
    const ax = a[0];
    const ay = a[1];
    const bx = b[0];
    const by = b[1];

    // the 2D cross product is |a||b|sin(theta), the dot product is |a||b|cos(theta)
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

/**
 * Set the components of a vec2 to zero
 *
 * @param out the receiving vector
 * @returns out
 */
export function zero(out: Vec2): Vec2 {
    out[0] = 0.0;
    out[1] = 0.0;
    return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param a vector to represent as a string
 * @returns string representation of the vector
 */
export function str(a: Vec2): string {
    return `vec2(${a[0]}, ${a[1]})`;
}

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param a The first vector.
 * @param b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function exactEquals(a: Vec2, b: Vec2): boolean {
    return a[0] === b[0] && a[1] === b[1];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param a The first vector.
 * @param b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function equals(a: Vec2, b: Vec2): boolean {
    const a0 = a[0];
    const a1 = a[1];
    const b0 = b[0];
    const b1 = b[1];
    return (
        Math.abs(a0 - b0) <= scalar.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= scalar.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1))
    );
}

/**
 * Returns whether or not the vector is finite
 * @param a vector to test
 * @returns whether or not the vector is finite
 */
export function finite(a: Vec2): boolean {
    return Number.isFinite(a[0]) && Number.isFinite(a[1]);
}

/**
 * Alias for {@link length}
 */
export const len = length;

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
 * Alias for {@link squaredLength}
 */
export const sqrLen = squaredLength;
