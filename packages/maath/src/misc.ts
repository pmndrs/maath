import { Matrix3, Plane, Vector2, Vector3 } from "three";
import { doThreePointsMakeARight } from "./triangle";
import type { TypedArray } from "./ctypes";
import { matrixSum3 } from "./matrix";

/**
 * Clamps a value between a range.
 */
export function clamp([min, max]: [number, number], value: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Converts degrees to radians.
 */
export function degToRad(degrees: number) {
  return (degrees / 180) * Math.PI;
}

/**
 * Converts radians to degrees.
 */
export function radToDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

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
    if (typeof (a as Vector3).z !== "undefined") {
      if (a.y === b.y) {
        return (a as Vector3).z - (b as Vector3).z;
      }
    }

    return a.y - b.y;
  }

  return a.x - b.x;
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
  let points = _points.sort(lexicographic);

  // put p1 and p2 in a list lUpper with p1 as the first point
  const lUpper = [points[0], points[1]];

  // for i <- 3 to n
  for (let i = 2; i < points.length; i++) {
    lUpper.push(points[i]);

    // while lUpper contains more than 2 points and the last three points in lUpper do not make a right turn
    while (
      lUpper.length > 2 &&
      doThreePointsMakeARight([...lUpper.slice(-3)])
    ) {
      // delete the middle of the last three points from lUpper
      lUpper.splice(lUpper.length - 2, 1);
    }
    4;
  }

  // put pn and pn-1 in a list lLower with pn as the first point
  const lLower = [points[points.length - 1], points[points.length - 2]];

  // for (i <- n - 2 downto 1)
  for (let i = points.length - 3; i >= 0; i--) {
    // append pi to lLower
    lLower.push(points[i]);

    // while lLower contains more than 2 points and the last three points in lLower do not make a right turn
    while (
      lLower.length > 2 &&
      doThreePointsMakeARight([...lLower.slice(-3)])
    ) {
      // delete the middle of the last three points from lLower
      lLower.splice(lLower.length - 2, 1);
    }
  }

  // remove the first and last point from lLower to avoid duplication of the points where the upper and lower hull meet
  lLower.splice(0, 1);
  lLower.splice(lLower.length - 1, 1);

  // prettier-ignore
  const c = [
    ...lUpper,
    ...lLower,
  ]

  return c;
}

export function remap(
  x: number,
  [low1, high1]: number[],
  [low2, high2]: number[]
) {
  return low2 + ((x - low1) * (high2 - low2)) / (high1 - low1);
}

/**
 * 
 * https://www.desmos.com/calculator/vsnmlaljdu
 * 
 * Ease-in-out, goes to -Infinite before 0 and Infinite after 1 
 * 
 * @param t 
 * @returns 
 */
export function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 *
 * Returns the result of linearly interpolating between input A and input B by input T.
 *
 * @param v0
 * @param v1
 * @param t
 * @returns
 */
export function lerp(v0: number, v1: number, t: number) {
  return v0 * (1 - t) + v1 * t;
}

/**
 *
 * Returns the linear parameter that produces the interpolant specified by input T within the range of input A to input B.
 *
 * @param v0
 * @param v1
 * @param t
 * @returns
 */
export function inverseLerp(v0: number, v1: number, t: number) {
  return (t - v0) / (v1 - v0);
}

/**
 *
 */

export function normalize(x: number, y: number, z: number) {
  const m = Math.sqrt(x * x + y * y + z * z);

  return [x / m, y / m, z / m];
}

/**
 *
 */
export function pointOnCubeToPointOnSphere(x: number, y: number, z: number) {
  const x2 = x * x;
  const y2 = y * y;
  const z2 = z * z;

  const nx = x * Math.sqrt(1 - (y2 + z2) / 2 + (y2 * z2) / 3);
  const ny = y * Math.sqrt(1 - (z2 + x2) / 2 + (z2 * x2) / 3);
  const nz = z * Math.sqrt(1 - (x2 + y2) / 2 + (x2 * y2) / 3);

  return [nx, ny, nz];
}

// https://math.stackexchange.com/questions/180418/calculate-rotation-matrix-to-align-vector-a-to-vector-b-in-3d
/**
 * Give two unit vectors a and b, returns the transformation matrix that rotates a onto b.
 * 
 * */
export function rotateVectorOnVector(a: Vector3, b: Vector3): Matrix3 {
  const v = new Vector3().crossVectors(a, b);
  const c = a.dot(b);

  const i = new Matrix3().identity();
  //  skew-symmetric cross-product matrix of 𝑣 https://en.wikipedia.org/wiki/Skew-symmetric_matrix
  // prettier-ignore
  const vx = new Matrix3().set(
    0, -v.z, v.y,
    v.z, 0, -v.x,
    -v.y, v.x, 0
  );

  const vxsquared = new Matrix3()
    .multiplyMatrices(vx, vx)
    .multiplyScalar(1 / (1 + c));

  const final = matrixSum3(matrixSum3(i, vx), vxsquared);

  return final;
}

// calculate latitude and longitude (in radians) from point on unit sphere
export function pointToCoordinate(x: number, y: number, z: number) {
  const lat = Math.asin(y);
  const lon = Math.atan2(x, -z);

  return [lat, lon];
}

// calculate point on unit sphere given latitude and logitude in radians
export function coordinateToPoint(lat: number, lon: number) {
  const y = Math.sin(lat);
  const r = Math.cos(lat);
  const x = Math.sin(lon) * r;
  const z = -Math.cos(lon) * r;

  return [x, y, z];
}

/**
 * Given a plane and a segment, return the intersection point if it exists or null it doesn't.
 */
export function planeSegmentIntersection(
  plane: Plane,
  segment: Vector3[]
): null | Vector3 {
  const [a, b] = segment;
  const matrix = rotateVectorOnVector(plane.normal, new Vector3(0, 1, 0));

  const t = inverseLerp(
    a.clone().applyMatrix3(matrix).y,
    b.clone().applyMatrix3(matrix).y,
    0
  );

  return new Vector3().lerpVectors(a, b, t);
}

/**
 * Given a plane and a point, return the distance.
 */
export function pointToPlaneDistance(p: Vector3, plane: Plane): number {
  const d = plane.normal.dot(p);

  // TODO

  return d;
}

export function test() {
  return null
}