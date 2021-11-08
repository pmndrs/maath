import { Matrix4, Vector2 } from "three";
import { determinant3, getMinor } from "./matrix";
import type { Triangle } from "./ctypes";

/**
 *
 * @param point
 *
 * @param triangle
 *
 * @returns {boolean} true if the point is in the triangle
 *
 * TODO: Find explainer
 */
export function isPointInTriangle(point: number[], triangle: Triangle) {
  const [ax, ay] = triangle[0];
  const [bx, by] = triangle[1];
  const [cx, cy] = triangle[2];

  const [px, py] = point;

  // TODO Sub with static calc
  const matrix = new Matrix4();

  // prettier-ignore
  matrix.set(
    ax, ay, ax * ax + ay * ay, 1,
    bx, by, bx * bx + by * by, 1,
    cx, cy, cx * cx + cy * cy, 1,
    px, py, px * px + py * py, 1
  )

  return matrix.determinant() <= 0;
}

export function triangleDeterminant(triangle: Triangle) {
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
export function arePointsCollinear(points: Triangle) {
  return triangleDeterminant(points) === 0;
}

// TODO This is the same principle as the prev function, find a way to make it have sense
export function isTriangleClockwise(triangle: Triangle) {
  return triangleDeterminant(triangle) < 0;
}

/**
 
The circumcircle is a circle touching all the vertices of a triangle or polygon.

             ┌───┐             
             │ B │             
             └───┘             
           .───●───.           
        ,─'   ╱ ╲   '─.        
      ,'     ╱   ╲     `.      
     ╱      ╱     ╲      ╲     
    ;      ╱       ╲      :    
    │     ╱         ╲     │    
    │    ╱           ╲    │    
    :   ╱             ╲   ;    
     ╲ ╱               ╲ ╱     
┌───┐ ●─────────────────● ┌───┐
│ A │  `.             ,'  │ C │
└───┘    '─.       ,─'    └───┘
            `─────'                         
 */

/**
 *
 * @param triangle
 *
 * @returns {number} circumcircle
 */

// https://math.stackexchange.com/a/1460096
export function getCircumcircle(triangle: Triangle) {
  const [ax, ay] = triangle[0];
  const [bx, by] = triangle[1];
  const [cx, cy] = triangle[2];

  if (arePointsCollinear(triangle)) return null; // points are collinear

  const m = new Matrix4();
  // prettier-ignore
  m.set(
    1,                  1,  1, 1,
    ax * ax + ay * ay, ax, ay, 1,
    bx * bx + by * by, bx, by, 1, 
    cx * cx + cy * cy, cx, cy, 1
  )

  const m11 = getMinor(m, 1, 1);
  const m13 = getMinor(m, 1, 3);
  const m12 = getMinor(m, 1, 2);
  const m14 = getMinor(m, 1, 4);

  const x0 = 0.5 * (m12 / m11);
  const y0 = 0.5 * (m13 / m11);

  const r2 = x0 * x0 + y0 * y0 + m14 / m11;

  return {
    x: Math.abs(x0) === 0 ? 0 : x0,
    y: Math.abs(y0) === 0 ? 0 : -y0,
    r: Math.sqrt(r2),
  };
}

// https://stackoverflow.com/questions/39984709/how-can-i-check-wether-a-point-is-inside-the-circumcircle-of-3-points
export function isPointInCircumcircle(point: number[], triangle: Triangle) {
  const [ax, ay] = Array.isArray(triangle[0]) ? triangle[0] : triangle[0].toArray();
  const [bx, by] = Array.isArray(triangle[1]) ? triangle[1] : triangle[1].toArray();
  const [cx, cy] = Array.isArray(triangle[2]) ? triangle[2] : triangle[2].toArray();

  const [px, py] = point;

  if (arePointsCollinear(triangle))
    throw new Error("Collinear points don't form a triangle");

  /**
          | ax-px, ay-py, (ax-px)² + (ay-py)² |
    det = | bx-px, by-py, (bx-px)² + (by-py)² |
          | cx-px, cy-py, (cx-px)² + (cy-py)² |
  */
  const x1mpx = ax - px;
  const aympy = ay - py;

  const bxmpx = bx - px;
  const bympy = by - py;

  const cxmpx = cx - px;
  const cympy = cy - py;

  // prettier-ignore
  const d = determinant3(
    x1mpx, aympy, x1mpx * x1mpx + aympy * aympy,
    bxmpx, bympy, bxmpx * bxmpx + bympy * bympy,
    cxmpx, cympy, cxmpx * cxmpx + cympy * cympy,
  )

  // if d is 0, the point is on C
  if (d === 0) {
    return true;
  }

  return !isTriangleClockwise(triangle) ? d > 0 : d < 0;
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
export function doThreePointsMakeARight(points: Triangle | Vector2[]) {
  const [p1, p2, p3] = points.map((p) => {
    if (Array.isArray(p)) {
      return new Vector2(...p);
    }

    return p;
  });

  if (arePointsCollinear(points)) return false;

  // @ts-ignore
  const p2p1 = mv1.subVectors(p2, p1);
  // @ts-ignore
  const p3p1 = mv2.subVectors(p3, p1);

  const cross = p3p1.cross(p2p1);

  return cross > 0;
}
