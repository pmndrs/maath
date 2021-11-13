/**
 *
 */
export type V2 = [x: number, y: number];

export function zero(): V2 {
  return [0, 0];
}

export function one(): V2 {
  return [1, 1];
}

export function add(a: V2, b: V2): V2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function addValue(a: V2, n: number): V2 {
  return [a[0] + n, a[1] + n];
}

export function sub(a: V2, b: V2): V2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function subValue(a: V2, n: number): V2 {
  return [a[0] - n, a[1] - n];
}

export function scale(a: V2, n: number): V2 {
  return [a[0] * n, a[1] * n]
}

export function dot(a: V2, b: V2): number {
  return a[0] * b[0] + a[1] * b[1];
}

/**
 * Calculate the squared length of a vector.
 * Use this when comparing two vectors instead of length, as it's more efficient (no sqrt)
 */
export function lengthSqr(a: V2): number {
  return a[0] * a[0] + a[1] * a[1];
}

/**
 * Calculate the length of a vector.
 * If you only need to compare lenghts, consider using the more efficient lengthSqr
 */
export function length(a: V2): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}

export function distance(a: V2, b: V2): number {
  return Math.sqrt(
    (a[0] - b[0]) * (a[0] - b[0]) + (a[0] - b[1]) * (a[0] - b[1])
  );
}
