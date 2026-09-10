import * as scalar from './scalar';
import { wrapAngle } from './angle';
import type { RVec2, Vec2 } from './vec2';

/**
 * A point in polar coordinates [r, theta]
 *   r     - radial distance from the origin (>= 0)
 *   theta - angle from the +X axis, counter-clockwise (radians, range (-pi, pi])
 *
 * This is the standard 2D convention: Vec2 is (x, y) and theta = atan2(y, x).
 * It is deliberately NOT the ground-plane slice of [[spherical]] (which is
 * Y-up, with an XZ ground plane and azimuth measured from +Z); for that
 * horizontal projection use spherical.fromVec2 / spherical.toVec2 instead.
 */
export type Polar = [r: number, theta: number];

/** A read-only polar coordinate */
export type RPolar = Readonly<Polar>;

/**
 * Creates a new polar coordinate at r=1, theta=0
 *
 * @returns a new Polar
 */
export function create(): Polar {
    return [1, 0];
}

/**
 * Creates a new Polar initialized with the given values
 *
 * @param r radial distance
 * @param theta angle from +X, counter-clockwise (radians)
 * @returns a new Polar
 */
export function fromValues(r: number, theta: number): Polar {
    return [r, theta];
}

/**
 * Creates a new Polar initialized with values from an existing one
 *
 * @param a the source Polar
 * @returns a new Polar
 */
export function clone(a: RPolar): Polar {
    return [a[0], a[1]];
}

/**
 * Copies values from one Polar to another
 *
 * @param out the receiving Polar
 * @param a the source Polar
 * @returns out
 */
export function copy(out: Polar, a: RPolar): Polar {
    out[0] = a[0];
    out[1] = a[1];
    return out;
}

/**
 * Sets the components of a Polar
 *
 * @param out the receiving Polar
 * @param r radial distance
 * @param theta angle from +X, counter-clockwise (radians)
 * @returns out
 */
export function set(out: Polar, r: number, theta: number): Polar {
    out[0] = r;
    out[1] = theta;
    return out;
}

/**
 * Sets r=1, preserving the angle. No-op on the angle if r is already zero.
 *
 * @param out the receiving Polar
 * @param a the source Polar
 * @returns out
 */
export function normalize(out: Polar, a: RPolar): Polar {
    out[0] = 1;
    out[1] = a[1];
    return out;
}

/**
 * Scales the radial distance r by a scalar
 *
 * @param out the receiving Polar
 * @param a the source Polar
 * @param s scalar to multiply r by
 * @returns out
 */
export function scale(out: Polar, a: RPolar, s: number): Polar {
    out[0] = a[0] * s;
    out[1] = a[1];
    return out;
}

/**
 * Rotates a Polar by an angle (in radians), wrapping theta into (-pi, pi].
 *
 * @param out the receiving Polar
 * @param a the source Polar
 * @param rad the angle to add to theta
 * @returns out
 */
export function rotate(out: Polar, a: RPolar, rad: number): Polar {
    out[0] = a[0];
    out[1] = wrapAngle(a[1] + rad);
    return out;
}

/**
 * Linearly interpolates between two Polar coordinates, taking the shortest
 * angular path for theta.
 *
 * @param out the receiving Polar
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation factor in [0, 1]
 * @returns out
 */
export function lerp(out: Polar, a: RPolar, b: RPolar, t: number): Polar {
    out[0] = scalar.lerp(a[0], b[0], t);
    out[1] = a[1] + wrapAngle(b[1] - a[1]) * t;
    return out;
}

/**
 * Sets a Polar from Cartesian Vec2 coordinates:
 *   r     = sqrt(x^2 + y^2)
 *   theta = atan2(y, x)
 *
 * @param out the receiving Polar
 * @param v the source Vec2
 * @returns out
 */
export function setFromVec2(out: Polar, v: RVec2): Polar {
    const x = v[0];
    const y = v[1];
    out[0] = Math.sqrt(x * x + y * y);
    out[1] = out[0] === 0 ? 0 : Math.atan2(y, x);
    return out;
}

/** @alias setFromVec2 */
export const fromVec2 = setFromVec2;

/**
 * Converts polar coordinates to a Cartesian Vec2:
 *   x = r * cos(theta)
 *   y = r * sin(theta)
 *
 * @param out the receiving Vec2
 * @param a the source Polar
 * @returns out
 */
export function toVec2(out: Vec2, a: RPolar): Vec2 {
    const r = a[0];
    const theta = a[1];
    out[0] = r * Math.cos(theta);
    out[1] = r * Math.sin(theta);
    return out;
}

/**
 * Returns the smallest angle (in radians) between two polar directions,
 * ignoring r. Range [0, pi].
 *
 * @param a the first Polar
 * @param b the second Polar
 * @returns angle in radians in [0, pi]
 */
export function angleTo(a: RPolar, b: RPolar): number {
    return Math.abs(wrapAngle(b[1] - a[1]));
}

/**
 * Returns the straight-line (chord) distance between two polar coordinates,
 * via the law of cosines.
 *
 * @param a the first Polar
 * @param b the second Polar
 * @returns the Euclidean distance between the two points
 */
export function distance(a: RPolar, b: RPolar): number {
    const ra = a[0];
    const rb = b[0];
    const d = ra * ra + rb * rb - 2 * ra * rb * Math.cos(b[1] - a[1]);
    return Math.sqrt(Math.max(0, d));
}

/**
 * Returns true if two Polar coordinates are approximately equal,
 * within an absolute/relative tolerance of EPSILON.
 *
 * @param a the first Polar
 * @param b the second Polar
 * @returns true if approximately equal
 */
export function equals(a: RPolar, b: RPolar): boolean {
    return scalar.equals(a[0], b[0]) && scalar.equals(a[1], b[1]);
}

/**
 * Returns true if two Polar coordinates are exactly equal (===).
 *
 * @param a the first Polar
 * @param b the second Polar
 * @returns true if exactly equal
 */
export function exactEquals(a: RPolar, b: RPolar): boolean {
    return a[0] === b[0] && a[1] === b[1];
}

/**
 * Returns a string representation of a Polar
 *
 * @param a the source Polar
 * @returns string representation
 */
export function str(a: RPolar): string {
    return `Polar(${a[0]}, ${a[1]})`;
}
