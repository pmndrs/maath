import { Vector2, Vector3 } from "three";
import { doThreePointsMakeARight } from "./triangle";
import type { TypedArray } from "./ctypes";

// adapted from https://gist.github.com/stephanbogner/a5f50548a06bec723dcb0991dcbb0856 by https://twitter.com/st_phan
export function fibonacciOnSphere(buffer: TypedArray, { radius = 1 }) {
  const samples = buffer.length / 3;

  const offset = 2 / samples;
  const increment = Math.PI * (3 - 2.2360679775);

  for (let i = 0; i < buffer.length; i += 3) {
    let y = i * offset - 1 + offset / 2;
    const distance = Math.sqrt(1 - Math.pow(y, 2));

    const phi = (i % samples) * increment;

    let x = Math.cos(phi) * distance;
    let z = Math.sin(phi) * distance;

    buffer[i] = x * radius;
    buffer[i + 1] = y * radius;
    buffer[i + 2] = z * radius;
  }
}

// @ts-ignore
export function vectorEquals(a, b, eps = Number.EPSILON) {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.z - b.z) < eps
  );
}

/**
 * Sorts vectors in lexicographic order, works with both v2 and v3
 *
 *  Use as:
 *  const sorted = arrayOfVectors.sort(lexicographicOrder)
 */
// https://en.wikipedia.org/wiki/Lexicographic_order
export function lexicographic(a: Vector2 | Vector3, b: Vector2 | Vector3) {
  if (a.x === b.x) {
    // do a check to see if points is 3D,
    // in which case add y eq check and sort by z
    if (typeof (a as Vector3).z !== 'undefined') {
      if (a.y === b.y) {
        return (a as Vector3).z - (b as Vector3).z
      }
    }

    return a.y - b.y
  }

  return a.x - b.x
}

/**
 * Convex Hull
 * 
 * Returns an array of 2D Vectors representing the convex hull of a set of 2D Vectors
 */

/**
 * Calculate the convex hull of a set of points
 */
 export function convexHull(_points: Vector2[]) {

   let points = _points.sort(lexicographic)

  // put p1 and p2 in a list lUpper with p1 as the first point
  const lUpper = [points[0], points[1]]

  // for i <- 3 to n
  for (let i = 2; i < points.length; i++) {
    lUpper.push(points[i])

    // while lUpper contains more than 2 points and the last three points in lUpper do not make a right turn
    while (lUpper.length > 2 && doThreePointsMakeARight([...lUpper.slice(-3)])) {
      // delete the middle of the last three points from lUpper
      lUpper.splice(lUpper.length - 2, 1)
    }4
  }

  // put pn and pn-1 in a list lLower with pn as the first point
  const lLower = [points[points.length - 1], points[points.length - 2]]

  // for (i <- n - 2 downto 1)
  for (let i = points.length - 3; i >= 0; i--) {
    // append pi to lLower
    lLower.push(points[i])

    // while lLower contains more than 2 points and the last three points in lLower do not make a right turn
    while (lLower.length > 2 && doThreePointsMakeARight([...lLower.slice(-3)])) {
      // delete the middle of the last three points from lLower
      lLower.splice(lLower.length - 2, 1)
    }
  }

  // remove the first and last point from lLower to avoid duplication of the points where the upper and lower hull meet
  lLower.splice(0, 1)
  lLower.splice(lLower.length - 1, 1)

  // prettier-ignore
  const c = [
    ...lUpper,
    ...lLower,
  ]

  return c
}

export function remap(x: number, [low1, high1]: number[], [low2, high2]: number[]) {
  return low2 + (x - low1) * (high2 - low2) / (high1 - low1)
}

export function lerp(v0: number, v1: number, t: number) {
  return v0*(1-t)+v1*t
}