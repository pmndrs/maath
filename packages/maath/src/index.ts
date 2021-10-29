import { MathUtils, Vector2, Vector3 } from "three";

import type { TypedArray } from "./types";

export * from './random'
export * from './buffer-utils'

// adapted from https://gist.github.com/stephanbogner/a5f50548a06bec723dcb0991dcbb0856 by https://twitter.com/st_phan
export function fibonacciOnSphere(
  buffer: TypedArray,
  { radius = 1 }
) {
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

// buffer utils


export function lerpBuffers(
  bufferA: TypedArray,
  bufferB: TypedArray,
  final: TypedArray,
  t: number
) {
  for (let i = 0; i < bufferA.length; i++) {
    final[i] = MathUtils.lerp(bufferA[i], bufferB[i], t);
  }
}

// TODO Fix these types
// timing
// @ts-ignore
export const rsqw = (t, delta = 0.01, a = 1, f = 1 / (2 * Math.PI)) =>
  (a / Math.atan(1 / delta)) * Math.atan(Math.sin(2 * Math.PI * t * f) / delta);

// bits
// @ts-ignore
export function vectorEquals(a, b, eps = Number.EPSILON) {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.z - b.z) < eps
  );
}


type MyVector2 = number[] // fun fact, I think three's types aren't updated, vectors SHOULD be iterable in latest

/**
 * Uses triangle area determinant to check if 3 points are collinear.
 * If they are, they can't make a triangle, so the determinant for the area will be 0!
 * 
 * Fun fact, you can use this same determinant to check the order of the points in the triangle
 */
export function collinear(points: MyVector2[]) {
  /**
    1/2 * | x1 - x2     x2 - x3 |
          | y1 - y2     y2 - y3 |
  */
  const [[x1, y1], [x2, y2], [x3, y3]] = points

  const a = x1 - x2
  const b = x2 - x3
  const c = y1 - y2
  const d = y2 - y3

  const det = a * d - b * c

  const areaOfTriangle = det * 0.5

  return areaOfTriangle === 0
}

// From https://algorithmtutor.com/Computational-Geometry/Determining-if-two-consecutive-segments-turn-left-or-right/
const mv1 = new Vector2()
const mv2 = new Vector2()

/**
 
     ╱      ╲     
    ╱        ╲    
   ▕          ▏   
                  
 right      left  

 */
export function doThreePointsMakeARight(points: MyVector2[]) {
  const [p1, p2, p3] = points

  if (collinear(points)) return false

  // @ts-ignore 
  const p2p1 = mv1.subVectors(p2, p1)
  // @ts-ignore 
  const p3p1 = mv2.subVectors(p3, p1)

  const cross = p3p1.cross(p2p1)

  if (cross > 0) return true
}
