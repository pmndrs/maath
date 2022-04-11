import { Matrix3, Matrix4 } from "three";

/**
 *
 * @param terms
 *
 * | a b |
 * | c d |
 *
 * @returns {number} determinant
 */
export function determinant2(...terms: number[]) {
  const [a, b, c, d] = terms;

  return a * d - b * c;
}

/**
 *
 * @param terms
 *
 * | a b c |
 * | d e f |
 * | g h i |
 *
 * @returns {number} determinant
 */
export function determinant3(...terms: number[]) {
  const [a, b, c, d, e, f, g, h, i] = terms;

  return a * e * i + b * f * g + c * d * h - c * e * g - b * d * i - a * f * h;
}

/**
 *
 * @param terms
 *
 * | a b c g |
 * | h i j k |
 * | l m n o |
 *
 * @returns {number} determinant
 */
export function determinant4(...terms: number[]) {
  const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o] = terms;

  // TODO
}

/**
 *
 * Get the determinant of matrix m without row r and col c
 *
 * @param {matrix} m Starter matrix
 * @param r row to remove
 * @param c col to remove
 *
 *     | a b c |
 * m = | d e f |
 *     | g h i |
 *
 * getMinor(m, 1, 1) would result in this determinant
 *
 * | a c |
 * | g i |
 *
 * @returns {number} determinant
 */
export function getMinor(matrix: Matrix4, r: number, c: number) {
  const _matrixTranspose = matrix.clone().transpose();

  const x = [];

  const l = _matrixTranspose.elements.length;
  const n = Math.sqrt(l);

  for (let i = 0; i < l; i++) {
    const element = _matrixTranspose.elements[i];

    const row = Math.floor(i / n);
    const col = i % n;

    if (row !== r - 1 && col !== c - 1) {
      x.push(element);
    }
  }

  return determinant3(...x);
}

/**
 *
 */
export function matrixSum3(m1: Matrix3, m2: Matrix3) {
  const sum = [];
  const m1Array = m1.toArray();
  const m2Array = m2.toArray();

  for (let i = 0; i < m1Array.length; i++) {
    sum[i] = m1Array[i] + m2Array[i];
  }

  return new Matrix3().fromArray(sum);
}
