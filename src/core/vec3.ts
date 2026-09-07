import type { MutableArrayLike } from './arrays';
import type { Mat3 } from './mat3';
import type { Mat4 } from './mat4';
import type { Quat } from './quat';
import * as scalar from './scalar';

/** A 3D vector */
export type Vec3 = [x: number, y: number, z: number];

/**
 * Creates a new, empty vec3
 *
 * @returns a new 3D vector
 */
export function create(): Vec3 {
    return [0, 0, 0];
}

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param a vector to clone
 * @returns a new 3D vector
 */
export function clone(a: Vec3): Vec3 {
    return [a[0], a[1], a[2]];
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param x X component
 * @param y Y component
 * @param z Z component
 * @returns a new 3D vector
 */
export function fromValues(x: number, y: number, z: number): Vec3 {
    return [x, y, z];
}

/**
 * Calculates the length of a vec3
 *
 * @param a vector to calculate length of
 * @returns length of a
 */
export function length(a: Vec3): number {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Copy the values from one vec3 to another
 *
 * @param out the receiving vector
 * @param a the source vector
 * @returns out
 */
export function copy(out: Vec3, a: Vec3): Vec3 {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
}

/**
 * Set the components of a vec3 to the given values
 *
 * @param out the receiving vector
 * @param x X component
 * @param y Y component
 * @param z Z component
 * @returns out
 */
export function set(out: Vec3, x: number, y: number, z: number): Vec3 {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
}

/**
 * Sets all components of a vec3 to the given scalar value
 *
 * @param out the receiving vector
 * @param s scalar value to set
 * @returns out
 */
export function setScalar(out: Vec3, s: number): Vec3 {
    out[0] = s;
    out[1] = s;
    out[2] = s;
    return out;
}

/**
 * Sets the components of a vec3 from a buffer
 * @param out the receiving vector
 * @param buffer the source buffer
 * @param startIndex the starting index in the buffer
 * @returns out
 */
export function fromBuffer(out: Vec3, buffer: ArrayLike<number>, startIndex: number): Vec3 {
    out[0] = buffer[startIndex];
    out[1] = buffer[startIndex + 1];
    out[2] = buffer[startIndex + 2];
    return out;
}

/**
 * Writes the components of a vec3 to a buffer
 * @param outBuffer The output buffer
 * @param vec The source vector
 * @param startIndex The starting index in the buffer
 * @returns The output buffer
 */
export function toBuffer(outBuffer: MutableArrayLike<number>, vec: Vec3, startIndex: number): MutableArrayLike<number> {
    outBuffer[startIndex] = vec[0];
    outBuffer[startIndex + 1] = vec[1];
    outBuffer[startIndex + 2] = vec[2];
    return outBuffer;
}

/**
 * Adds two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function add(out: Vec3, a: Vec3, b: Vec3): Vec3 {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
}

/**
 * Adds a scalar value to all components of a vec3
 *
 * @param out the receiving vector
 * @param a the source vector
 * @param b the scalar value to add
 * @returns out
 */
export function addScalar(out: Vec3, a: Vec3, b: number): Vec3 {
    out[0] = a[0] + b;
    out[1] = a[1] + b;
    out[2] = a[2] + b;
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
export function subtract(out: Vec3, a: Vec3, b: Vec3): Vec3 {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
}

/**
 * Subtracts a scalar value from all components of a vec3
 *
 * @param out the receiving vector
 * @param a the source vector
 * @param b the scalar value to subtract
 * @returns out
 */
export function subtractScalar(out: Vec3, a: Vec3, b: number): Vec3 {
    out[0] = a[0] - b;
    out[1] = a[1] - b;
    out[2] = a[2] - b;
    return out;
}
/**
 * Multiplies two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function multiply(out: Vec3, a: Vec3, b: Vec3): Vec3 {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
}

/**
 * Divides two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function divide(out: Vec3, a: Vec3, b: Vec3): Vec3 {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
}

/**
 * Math.ceil the components of a vec3
 *
 * @param out the receiving vector
 * @param a vector to ceil
 * @returns out
 */
export function ceil(out: Vec3, a: Vec3): Vec3 {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    return out;
}

/**
 * Math.floor the components of a vec3
 *
 * @param out the receiving vector
 * @param a vector to floor
 * @returns out
 */
export function floor(out: Vec3, a: Vec3): Vec3 {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    return out;
}

/**
 * Returns the minimum of two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function min(out: Vec3, a: Vec3, b: Vec3): Vec3 {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
}

/**
 * Returns the maximum of two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function max(out: Vec3, a: Vec3, b: Vec3): Vec3 {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
}

/**
 * symmetric round the components of a vec3
 *
 * @param out the receiving vector
 * @param a vector to round
 * @returns out
 */
export function round(out: Vec3, a: Vec3): Vec3 {
    out[0] = scalar.round(a[0]);
    out[1] = scalar.round(a[1]);
    out[2] = scalar.round(a[2]);
    return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param out the receiving vector
 * @param a the vector to scale
 * @param b amount to scale the vector by
 * @returns out
 */
export function scale(out: Vec3, a: Vec3, b: number): Vec3 {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
}

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param scale the amount to scale b by before adding
 * @returns out
 */
export function scaleAndAdd(out: Vec3, a: Vec3, b: Vec3, scale: number): Vec3 {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    return out;
}

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns distance between a and b
 */
export function distance(a: Vec3, b: Vec3): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns squared distance between a and b
 */
export function squaredDistance(a: Vec3, b: Vec3): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];
    return x * x + y * y + z * z;
}

/**
 * Calculates the squared length of a vec3
 *
 * @param a vector to calculate squared length of
 * @returns squared length of a
 */
export function squaredLength(a: Vec3): number {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    return x * x + y * y + z * z;
}

/**
 * Negates the components of a vec3
 *
 * @param out the receiving vector
 * @param a vector to negate
 * @returns out
 */
export function negate(out: Vec3, a: Vec3): Vec3 {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
}

/**
 * Returns the inverse of the components of a vec3
 *
 * @param out the receiving vector
 * @param a vector to invert
 * @returns out
 */
export function inverse(out: Vec3, a: Vec3): Vec3 {
    out[0] = 1.0 / a[0];
    out[1] = 1.0 / a[1];
    out[2] = 1.0 / a[2];
    return out;
}

/**
 * Normalize a vec3
 *
 * @param out the receiving vector
 * @param a vector to normalize
 * @returns out
 */
export function normalize(out: Vec3, a: Vec3): Vec3 {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns dot product of a and b
 */
export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function cross(out: Vec3, a: Vec3, b: Vec3): Vec3 {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
}

/**
 * Calculates a normalized perpendicular vector to the given vector.
 * Useful for finding an arbitrary orthogonal basis vector.
 *
 * The zero vector has no unique perpendicular - every direction qualifies - so it returns the X
 * axis rather than NaN.
 *
 * @param out the receiving vector
 * @param a the source vector
 * @returns the out vector
 */
export function perpendicular(out: Vec3, a: Vec3): Vec3 {
    if (Math.abs(a[0]) > Math.abs(a[1])) {
        const len = Math.sqrt(a[0] * a[0] + a[2] * a[2]);
        const invLen = 1.0 / len;
        out[0] = a[2] * invLen;
        out[1] = 0;
        out[2] = -a[0] * invLen;
    } else {
        const len = Math.sqrt(a[1] * a[1] + a[2] * a[2]);

        if (len === 0) {
            // the zero vector, the only input that reaches here with no length. every direction is
            // perpendicular to it, so return one rather than dividing by zero into NaN
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            return out;
        }

        const invLen = 1.0 / len;
        out[0] = 0;
        out[1] = a[2] * invLen;
        out[2] = -a[1] * invLen;
    }
    return out;
}

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
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
export function lagrange(out: Vec3, a: Vec3, b: Vec3, c: Vec3, t: number): Vec3 {
    const c0 = 2 * (t - 1) * (t - 0.5);
    const c1 = -4 * (t - 1) * t;
    const c2 = 2 * (t - 0.5) * t;
    out[0] = c0 * a[0] + c1 * b[0] + c2 * c[0];
    out[1] = c0 * a[1] + c1 * b[1] + c2 * c[1];
    out[2] = c0 * a[2] + c1 * b[2] + c2 * c[2];
    return out;
}

/**
 * Performs a spherical linear interpolation between two vec3's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function slerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
    const angle = Math.acos(Math.min(Math.max(dot(a, b), -1), 1));
    const sinTotal = Math.sin(angle);

    const ratioA = Math.sin((1 - t) * angle) / sinTotal;
    const ratioB = Math.sin(t * angle) / sinTotal;
    out[0] = ratioA * a[0] + ratioB * b[0];
    out[1] = ratioA * a[1] + ratioB * b[1];
    out[2] = ratioA * a[2] + ratioB * b[2];

    return out;
}

/**
 * Performs a hermite interpolation with two control points
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param c the third operand
 * @param d the fourth operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function hermite(out: Vec3, a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3 {
    const factorTimes2 = t * t;
    const factor1 = factorTimes2 * (2 * t - 3) + 1;
    const factor2 = factorTimes2 * (t - 2) + t;
    const factor3 = factorTimes2 * (t - 1);
    const factor4 = factorTimes2 * (3 - 2 * t);

    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

    return out;
}

/**
 * Performs a bezier interpolation with two control points
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param c the third operand
 * @param d the fourth operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function bezier(out: Vec3, a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3 {
    const inverseFactor = 1 - t;
    const inverseFactorTimesTwo = inverseFactor * inverseFactor;
    const factorTimes2 = t * t;
    const factor1 = inverseFactorTimesTwo * inverseFactor;
    const factor2 = 3 * t * inverseFactorTimesTwo;
    const factor3 = 3 * factorTimes2 * inverseFactor;
    const factor4 = factorTimes2 * t;

    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

    return out;
}

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param m matrix to transform with
 * @returns out
 */
export function transformMat4(out: Vec3, a: Vec3, m: Mat4): Vec3 {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
}

/**
 * Transforms the vec3 with a mat3.
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param m the 3x3 matrix to transform with
 * @returns out
 */
export function transformMat3(out: Vec3, a: Vec3, m: Mat3): Vec3 {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
}

/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param out the receiving vector
 * @param a the vector to transform
 * @param q quaternion to transform with
 * @returns out
 */
export function transformQuat(out: Vec3, a: Vec3, q: Quat): Vec3 {
    // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const x = a[0];
    const y = a[1];
    const z = a[2];
    // var qvec = [qx, qy, qz];
    // var uv = vec3.cross([], qvec, a);
    let uvx = qy * z - qz * y;
    let uvy = qz * x - qx * z;
    let uvz = qx * y - qy * x;
    // var uuv = vec3.cross([], qvec, uv);
    let uuvx = qy * uvz - qz * uvy;
    let uuvy = qz * uvx - qx * uvz;
    let uuvz = qx * uvy - qy * uvx;
    // vec3.scale(uv, uv, 2 * w);
    const w2 = qw * 2;
    uvx *= w2;
    uvy *= w2;
    uvz *= w2;
    // vec3.scale(uuv, uuv, 2);
    uuvx *= 2;
    uuvy *= 2;
    uuvz *= 2;
    // return vec3.add(out, a, vec3.add(out, uv, uuv));
    out[0] = x + uvx + uuvx;
    out[1] = y + uvy + uuvy;
    out[2] = z + uvz + uuvz;
    return out;
}

/**
 * Rotate a 3D vector around the x-axis
 * @param out The receiving vec3
 * @param a The vec3 point to rotate
 * @param b The origin of the rotation
 * @param rad The angle of rotation in radians
 * @returns out
 */
export function rotateX(out: Vec3, a: Vec3, b: Vec3, rad: number): Vec3 {
    const p: number[] = [];
    const r: number[] = [];
    //Translate point to the origin
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];

    //perform rotation
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);

    //translate to correct position
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];

    return out;
}

/**
 * Rotate a 3D vector around the y-axis
 * @param out The receiving vec3
 * @param a The vec3 point to rotate
 * @param b The origin of the rotation
 * @param rad The angle of rotation in radians
 * @returns out
 */
export function rotateY(out: Vec3, a: Vec3, b: Vec3, rad: number): Vec3 {
    const p: number[] = [];
    const r: number[] = [];

    // translate point to the origin
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];

    // perform rotation
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);

    // translate to correct position
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];

    return out;
}

/**
 * Rotate a 3D vector around the z-axis
 * @param out The receiving vec3
 * @param a The vec3 point to rotate
 * @param b The origin of the rotation
 * @param rad The angle of rotation in radians
 * @returns out
 */
export function rotateZ(out: Vec3, a: Vec3, b: Vec3, rad: number): Vec3 {
    const p: number[] = [];
    const r: number[] = [];
    // translate point to the origin
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];

    // perform rotation
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];

    // translate to correct position
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];

    return out;
}

/**
 * Get the angle between two 3D vectors
 * @param a The first operand
 * @param b The second operand
 * @returns The angle in radians
 */
export function angle(a: Vec3, b: Vec3): number {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz));
    const cosine = mag && dot(a, b) / mag;
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
}

/**
 * Get the signed angle from `a` to `b` measured about `axis`, in the range (-PI, PI].
 *
 * Positive is counter-clockwise when `axis` points toward the viewer. Only the components of
 * `a` and `b` in the plane perpendicular to `axis` contribute, so they need not be
 * perpendicular to it. Returns 0 if either projects to the zero vector.
 *
 * Unlike {@link angle}, this distinguishes the two directions of rotation, which is what
 * hinge limits and turn directions need.
 *
 * @param a the first operand
 * @param b the second operand
 * @param axis the axis to measure the rotation about, assumed to be unit length
 * @returns the signed angle in radians
 */
export function signedAngle(a: Vec3, b: Vec3, axis: Vec3): number {
    const nx = axis[0];
    const ny = axis[1];
    const nz = axis[2];

    // drop the components along the axis - they carry no signed angle
    const ad = a[0] * nx + a[1] * ny + a[2] * nz;
    const ax = a[0] - nx * ad;
    const ay = a[1] - ny * ad;
    const az = a[2] - nz * ad;

    const bd = b[0] * nx + b[1] * ny + b[2] * nz;
    const bx = b[0] - nx * bd;
    const by = b[1] - ny * bd;
    const bz = b[2] - nz * bd;

    // (a x b) . axis is |a||b|sin(theta), a . b is |a||b|cos(theta)
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;

    return Math.atan2(cx * nx + cy * ny + cz * nz, ax * bx + ay * by + az * bz);
}

const _rotateTowards_axis: Vec3 = [0, 0, 0];

/**
 * Rotates the unit vector `from` toward the unit vector `to` by at most `maxAngle` radians.
 *
 * When the two are already within `maxAngle` this copies `to`, so the function doubles as a
 * cone clamp: the result is `to`, limited to lie within `maxAngle` of `from`. That is the form
 * a rotor joint limit and a per-frame turn rate both want.
 *
 * Both inputs are assumed to be unit length; the result is unit length. `maxAngle` is treated
 * as 0 if negative. When the inputs are exactly antiparallel the rotation plane is undefined
 * and an arbitrary perpendicular is used.
 *
 * @param out the receiving vector
 * @param from the unit vector to rotate away from
 * @param to the unit vector to rotate toward
 * @param maxAngle the maximum rotation, in radians
 * @returns out
 */
export function rotateTowards(out: Vec3, from: Vec3, to: Vec3, maxAngle: number): Vec3 {
    const fx = from[0];
    const fy = from[1];
    const fz = from[2];
    const tx = to[0];
    const ty = to[1];
    const tz = to[2];

    const cosine = Math.min(Math.max(fx * tx + fy * ty + fz * tz, -1), 1);

    const limit = maxAngle > 0 ? maxAngle : 0;

    if (Math.acos(cosine) <= limit) {
        out[0] = tx;
        out[1] = ty;
        out[2] = tz;
        return out;
    }

    // the rotation plane is spanned by the two vectors, so its normal is their cross product
    let axisX = fy * tz - fz * ty;
    let axisY = fz * tx - fx * tz;
    let axisZ = fx * ty - fy * tx;
    const axisLength = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ);

    if (axisLength < 1e-8) {
        // antiparallel: every plane containing `from` is equally valid, so pick one
        perpendicular(_rotateTowards_axis, from);
        axisX = _rotateTowards_axis[0];
        axisY = _rotateTowards_axis[1];
        axisZ = _rotateTowards_axis[2];
    } else {
        const inverseLength = 1 / axisLength;
        axisX *= inverseLength;
        axisY *= inverseLength;
        axisZ *= inverseLength;
    }

    // rodrigues rotation of `from` about `axis`
    const c = Math.cos(limit);
    const s = Math.sin(limit);
    const d = (axisX * fx + axisY * fy + axisZ * fz) * (1 - c);

    out[0] = fx * c + (axisY * fz - axisZ * fy) * s + axisX * d;
    out[1] = fy * c + (axisZ * fx - axisX * fz) * s + axisY * d;
    out[2] = fz * c + (axisX * fy - axisY * fx) * s + axisZ * d;

    return out;
}

/**
 * Set the components of a vec3 to zero
 *
 * @param out the receiving vector
 * @returns out
 */
export function zero(out: Vec3): Vec3 {
    out[0] = 0.0;
    out[1] = 0.0;
    out[2] = 0.0;
    return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param a vector to represent as a string
 * @returns string representation of the vector
 */
export function str(a: Vec3): string {
    return `vec3(${a[0]}, ${a[1]}, ${a[2]})`;
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param a The first vector.
 * @param b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function exactEquals(a: Vec3, b: Vec3): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param a The first vector.
 * @param b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function equals(a: Vec3, b: Vec3): boolean {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];
    return (
        Math.abs(a0 - b0) <= scalar.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= scalar.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= scalar.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2))
    );
}

/**
 * Returns whether or not the vector is finite
 * @param a vector to test
 * @returns whether or not the vector is finite
 */
export function finite(a: Vec3): boolean {
    return Number.isFinite(a[0]) && Number.isFinite(a[1]) && Number.isFinite(a[2]);
}

/**
 * Determines if a scale vector represents an inside-out transformation (reflection)
 * Returns true if an odd number of scale components are negative
 *
 * @param scale The scale vector to test
 * @returns true if the scale represents a reflection (odd number of negative components)
 */
export function isScaleInsideOut(scale: Vec3): boolean {
    // create a bitmask of which components are negative
    // each component that is < 0 contributes a bit (1, 2, or 4)
    const mask = (scale[0] < 0 ? 1 : 0) | (scale[1] < 0 ? 2 : 0) | (scale[2] < 0 ? 4 : 0);

    // count the number of set bits and return true if odd
    // popcount: count number of 1-bits in the mask
    let count = 0;
    let m = mask;
    while (m) {
        count += m & 1;
        m >>= 1;
    }
    return (count & 1) !== 0;
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
