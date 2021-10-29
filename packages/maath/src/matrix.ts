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

  // TOOD
}

const m = new Matrix3();
/**
 *
 * @param matrix Starter matrix
 * @param c1 row to remove
 * @param c2 col to remove
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
 * @returns
 */
export function getMinor(matrix: Matrix4, c1: number, c2: number) {
  const _matrixTranspose = matrix.clone().transpose();

  const x = [];

  const l = _matrixTranspose.elements.length;
  const n = Math.sqrt(l);

  for (let i = 0; i < l; i++) {
    const element = _matrixTranspose.elements[i];

    const row = Math.floor(i / n);
    const col = i % n;

    if (row !== c1 - 1 && col !== c2 - 1) {
      x.push(element);
    }
  }

  // @ts-expect-error what's this??
  m.set(...x);

  return m.determinant();
}
