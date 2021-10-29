import { MathUtils, Matrix3, Matrix4, Vector2 } from "three";
import { determinant, determinant2, determinant3, getMinor } from "./matrix";
import type { TypedArray } from "./types";

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

type MyVector2 = number[]; // fun fact, I think three's types aren't updated, vectors SHOULD be iterable in latest


export function isPointInTriangle(point: number[], triangle: MyVector2[]) {
  const [ax, ay] = triangle[0]
  const [bx, by] = triangle[1]
  const [cx, cy] = triangle[2]

  const [px, py] = point

  // TODO Sub with static calc
  const matrix = new Matrix4()

  // prettier-ignore
  matrix.set(
    ax, ay, ax * ax + ay * ay, 1,
    bx, by, bx * bx + by * by, 1,
    cx, cy, cx * cx + cy * cy, 1,
    px, py, px * px + py * py, 1
  )

  return matrix.determinant() > 0
}


export function triangleDeterminant(triangle: MyVector2[]) {
  const [x1, y1] = triangle[0];
  const [x2, y2] = triangle[1];
  const [x3, y3] = triangle[2];

  // prettier-ignore
  return determinant3(
    x1, y1, 1,
    x2, y2, 1,
    x3, y3, 1
  )
}

/**
 * Uses triangle area determinant to check if 3 points are collinear.
 * If they are, they can't make a triangle, so the determinant will be 0!
 *
 *      0     1     2
 * ─────■─────■─────■
 *
 *
 * Fun fact, you can use this same determinant to check the order of the points in the triangle
 *
 * NOTE: Should this use a buffer instead? NOTE: Should this use a buffer instead? [x0, y0, x1, y1, x2, y2]?
 *
 */
export function arePointsCollinear(points: MyVector2[]) {
  return triangleDeterminant(points) === 0
}


// TODO This is the same principle as the prev function, find a way to make it have sense
export function isTriangleClockwise(triangle: MyVector2[]) {
  return triangleDeterminant(triangle) < 0
}

// https://math.stackexchange.com/a/1460096
export function getCircumcircle(triangle: MyVector2[]) {
  const [ax, ay] = triangle[0]
  const [bx, by] = triangle[1]
  const [cx, cy] = triangle[2]

  if (arePointsCollinear(triangle)) return null // points are collinear

  const m = new Matrix4()
  // prettier-ignore
  m.set(
    1,                  1,  1, 1,
    ax * ax + ay * ay, ax, ay, 1,
    bx * bx + by * by, bx, by, 1, 
    cx * cx + cy * cy, cx, cy, 1
  )

  const m11 = getMinor(m, 1, 1)
  const m13 = getMinor(m, 1, 3)
  const m12 = getMinor(m, 1, 2)
  const m14 = getMinor(m, 1, 4)

  const x0 = 0.5 * (m12 / m11)
  const y0 = 0.5 * (m13 / m11)

  const r2 = x0 * x0 + y0 * y0 + m14 / m11

  return {
    x: x0,
    y: -y0,
    r: Math.sqrt(r2)
  }
}

// https://stackoverflow.com/questions/39984709/how-can-i-check-wether-a-point-is-inside-the-circumcircle-of-3-points
export function isPointInCircumcircle(point: number[], triangle: MyVector2[]) {
  const [ax, ay] = triangle[0]
  const [bx, by] = triangle[1]
  const [cx, cy] = triangle[2]

  const [px, py] = point

  /**
          | ax-px, ay-py, (ax-px)² + (ay-py)² |
    det = | bx-px, by-py, (bx-px)² + (by-py)² |
          | cx-px, cy-py, (cx-px)² + (cy-py)² |
  */
  const x1mpx = ax - px
  const aympy = ay - py

  const bxmpx = bx - px
  const bympy = by - py

  const cxmpx = cx - px
  const cympy = cy - py

  // prettier-ignore
  const d = determinant3(
    x1mpx, aympy, x1mpx * x1mpx + aympy * aympy,
    bxmpx, bympy, bxmpx * bxmpx + bympy * bympy,
    cxmpx, cympy, cxmpx * cxmpx + cympy * cympy,
  )

  // if d is 0, the point is on C
  if (d === 0) {
    return true
  }

  if (isTriangleClockwise(triangle)) {
    if (d > 0) {
      return true
    } else {
      return false
    }
  } else {
    if (d < 0) {
      return false
    } else {
      return true
    }
  }
}

// From https://algorithmtutor.com/Computational-Geometry/Determining-if-two-consecutive-segments-turn-left-or-right/
const mv1 = new Vector2();
const mv2 = new Vector2();

/**
 
     ╱      ╲     
    ╱        ╲    
   ▕          ▏   
                  
 right      left  

 * NOTE: Should this use a buffer instead? [x0, y0, x1, y1]?
 */
export function doThreePointsMakeARight(points: MyVector2[]) {
  const [p1, p2, p3] = points;

  if (arePointsCollinear(points)) return false;

  // @ts-ignore
  const p2p1 = mv1.subVectors(p2, p1);
  // @ts-ignore
  const p3p1 = mv2.subVectors(p3, p1);

  const cross = p3p1.cross(p2p1);

  if (cross > 0) return true;
}

