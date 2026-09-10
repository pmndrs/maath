import { EPSILON } from './scalar';
import type { RVec2 } from './vec2';

/** A 2D affine transform matrix */
export type Mat2d = [e1: number, e2: number, e3: number, e4: number, e5: number, e6: number];

/** A read-only 2x3 matrix */
export type RMat2d = Readonly<Mat2d>;

/**
 * Creates a new identity mat2d
 *
 * @returns a new 2x3 matrix
 */
export function create(): Mat2d {
    return [1, 0, 0, 1, 0, 0];
}

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param a matrix to clone
 * @returns a new 2x3 matrix
 */
export function clone(a: RMat2d): Mat2d {
    return [a[0], a[1], a[2], a[3], a[4], a[5]];
}

/**
 * Copy the values from one mat2d to another
 *
 * @param out the receiving matrix
 * @param a the source matrix
 * @returns out
 */
export function copy(out: Mat2d, a: RMat2d): Mat2d {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
}

/**
 * Set a mat2d to the identity matrix
 *
 * @param out the receiving matrix
 * @returns out
 */
export function identity(out: Mat2d): Mat2d {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Create a new mat2d with the given values
 *
 * @param a Component A (index 0)
 * @param b Component B (index 1)
 * @param c Component C (index 2)
 * @param d Component D (index 3)
 * @param tx Component TX (index 4)
 * @param ty Component TY (index 5)
 * @returns A new mat2d
 */
export function fromValues(a: number, b: number, c: number, d: number, tx: number, ty: number): Mat2d {
    return [a, b, c, d, tx, ty];
}

/**
 * Set the components of a mat2d to the given values
 *
 * @param out the receiving matrix
 * @param a Component A (index 0)
 * @param b Component B (index 1)
 * @param c Component C (index 2)
 * @param d Component D (index 3)
 * @param tx Component TX (index 4)
 * @param ty Component TY (index 5)
 * @returns out
 */
export function set(out: Mat2d, a: number, b: number, c: number, d: number, tx: number, ty: number): Mat2d {
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
}

/**
 * Inverts a mat2d
 *
 * @param out the receiving matrix
 * @param a the source matrix
 * @returns out, or null if source matrix is not invertible
 */
export function invert(out: Mat2d, a: RMat2d): Mat2d | null {
    const aa = a[0];
    const ab = a[1];
    const ac = a[2];
    const ad = a[3];
    const atx = a[4];
    const aty = a[5];

    let det = aa * ad - ab * ac;
    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
}

/**
 * Calculates the determinant of a mat2d
 *
 * @param a the source matrix
 * @returns determinant of a
 */
export function determinant(a: RMat2d): number {
    return a[0] * a[3] - a[1] * a[2];
}

/**
 * Multiplies two mat2d's
 *
 * @param out the receiving matrix
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function multiply(out: Mat2d, a: RMat2d, b: RMat2d): Mat2d {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];
    const b3 = b[3];
    const b4 = b[4];
    const b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
}

/**
 * Rotates a mat2d by the given angle
 *
 * @param out the receiving matrix
 * @param a the matrix to rotate
 * @param rad the angle to rotate the matrix by
 * @returns out
 */
export function rotate(out: Mat2d, a: RMat2d, rad: number): Mat2d {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    out[0] = a0 * c + a2 * s;
    out[1] = a1 * c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    out[4] = a4;
    out[5] = a5;
    return out;
}

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param out the receiving matrix
 * @param a the matrix to translate
 * @param v the vec2 to scale the matrix by
 * @returns out
 **/
export function scale(out: Mat2d, a: RMat2d, v: RVec2): Mat2d {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];
    const v0 = v[0];
    const v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
}

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param out the receiving matrix
 * @param a the matrix to translate
 * @param v the vec2 to translate the matrix by
 * @returns out
 **/
export function translate(out: Mat2d, a: RMat2d, v: RVec2): Mat2d {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];
    const v0 = v[0];
    const v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param out mat2d receiving operation result
 * @param rad the angle to rotate the matrix by
 * @returns out
 */
export function fromRotation(out: Mat2d, rad: number): Mat2d {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param out mat2d receiving operation result
 * @param v Scaling vector
 * @returns out
 */
export function fromScaling(out: Mat2d, v: RVec2): Mat2d {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param out mat2d receiving operation result
 * @param v Translation vector
 * @returns out
 */
export function fromTranslation(out: Mat2d, v: RVec2): Mat2d {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = v[0];
    out[5] = v[1];
    return out;
}

/**
 * Returns a string representation of a mat2d
 *
 * @param a matrix to represent as a string
 * @returns string representation of the matrix
 */
export function str(a: RMat2d): string {
    return `mat2d(${a[0]}, ${a[1]}, ${a[2]}, ${a[3]}, ${a[4]}, ${a[5]})`;
}

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param a the matrix to calculate Frobenius norm of
 * @returns Frobenius norm
 */
export function frob(a: RMat2d): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + 1);
}

/**
 * Adds two mat2d's
 *
 * @param out the receiving matrix
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function add(out: Mat2d, a: RMat2d, b: RMat2d): Mat2d {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param out the receiving matrix
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function subtract(out: Mat2d, a: RMat2d, b: RMat2d): Mat2d {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param out the receiving matrix
 * @param a the matrix to scale
 * @param b amount to scale the matrix's elements by
 * @returns out
 */
export function multiplyScalar(out: Mat2d, a: RMat2d, b: number): Mat2d {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    return out;
}

/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param scale the amount to scale b's elements by before adding
 * @returns out
 */
export function multiplyScalarAndAdd(out: Mat2d, a: RMat2d, b: RMat2d, scale: number): Mat2d {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    out[3] = a[3] + b[3] * scale;
    out[4] = a[4] + b[4] * scale;
    out[5] = a[5] + b[5] * scale;
    return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param a The first matrix.
 * @param b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function exactEquals(a: RMat2d, b: RMat2d): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param a The first matrix.
 * @param b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function equals(a: RMat2d, b: RMat2d): boolean {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];
    const b3 = b[3];
    const b4 = b[4];
    const b5 = b[5];
    return (
        Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
        Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
        Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
        Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5))
    );
}

/**
 * Alias for {@link mat2d.multiply}
 */
export const mul = multiply;

/**
 * Alias for {@link mat2d.subtract}
 */
export const sub = subtract;
