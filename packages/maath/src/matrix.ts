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
