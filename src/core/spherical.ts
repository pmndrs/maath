import { wrapAngle } from './angle';
import * as scalar from './scalar';
import type { RVec2, Vec2 } from './vec2';
import type { RVec3, Vec3 } from './vec3';

/**
 * A point in spherical coordinates [r, theta, phi] (Three.js / OpenGL convention)
 *  r     - radial distance from the origin
 *  theta - azimuthal angle in the XZ plane from the +Z axis (radians, range [-π, π])
 *  phi   - polar angle from the +Y axis (radians, range [0, π])
 */
export type Spherical = [r: number, theta: number, phi: number];

/** A read-only spherical coordinate */
export type RSpherical = Readonly<Spherical>;

/**
 * Creates a new spherical coordinate at r=1, theta=0, phi=0
 *
 * @returns a new Spherical
 */
export function create(): Spherical {
    return [1, 0, 0];
}

/**
 * Creates a new Spherical initialized with the given values
 *
 * @param r radial distance
 * @param theta azimuthal angle in the XZ plane from +Z (radians)
 * @param phi polar angle from +Y axis (radians)
 * @returns a new Spherical
 */
export function fromValues(r: number, theta: number, phi: number): Spherical {
    return [r, theta, phi];
}

/**
 * Creates a new Spherical initialized with values from an existing one
 *
 * @param a the source Spherical
 * @returns a new Spherical
 */
export function clone(a: RSpherical): Spherical {
    return [a[0], a[1], a[2]];
}

/**
 * Copies values from one Spherical to another
 *
 * @param out the receiving Spherical
 * @param a the source Spherical
 * @returns out
 */
export function copy(out: Spherical, a: RSpherical): Spherical {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
}

/**
 * Sets the components of a Spherical
 *
 * @param out the receiving Spherical
 * @param r radial distance
 * @param theta azimuthal angle in the XZ plane from +Z (radians)
 * @param phi polar angle from +Y axis (radians)
 * @returns out
 */
export function set(out: Spherical, r: number, theta: number, phi: number): Spherical {
    out[0] = r;
    out[1] = theta;
    out[2] = phi;
    return out;
}

/**
 * Sets r=1, preserving the angles. No-op if r is already zero.
 *
 * @param out the receiving Spherical
 * @param a the source Spherical
 * @returns out
 */
export function normalize(out: Spherical, a: RSpherical): Spherical {
    out[0] = 1;
    out[1] = a[1];
    out[2] = a[2];
    return out;
}

/**
 * Scales the radial distance r by a scalar
 *
 * @param out the receiving Spherical
 * @param a the source Spherical
 * @param s scalar to multiply r by
 * @returns out
 */
export function scale(out: Spherical, a: RSpherical, s: number): Spherical {
    out[0] = a[0] * s;
    out[1] = a[1];
    out[2] = a[2];
    return out;
}

/**
 * Linearly interpolates between two Spherical coordinates taking the shortest
 * angular path for theta and phi.
 *
 * @param out the receiving Spherical
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation factor in [0, 1]
 * @returns out
 */
export function lerp(out: Spherical, a: RSpherical, b: RSpherical, t: number): Spherical {
    out[0] = scalar.lerp(a[0], b[0], t);
    out[1] = a[1] + wrapAngle(b[1] - a[1]) * t;
    out[2] = a[2] + wrapAngle(b[2] - a[2]) * t;
    return out;
}

/**
 * Sets a Spherical from Cartesian Vec3 coordinates (Three.js / OpenGL convention):
 *   r     = sqrt(x² + y² + z²)
 *   theta = atan2(x, z)   (azimuthal angle in XZ plane from +Z)
 *   phi   = acos(y / r)   (polar angle from +Y)
 *
 * @param out the receiving Spherical
 * @param v the source Vec3
 * @returns out
 */
export function setFromVec3(out: Spherical, v: RVec3): Spherical {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const r = Math.sqrt(x * x + y * y + z * z);
    out[0] = r;
    out[1] = r === 0 ? 0 : Math.atan2(x, z);
    out[2] = r === 0 ? 0 : Math.acos(Math.max(-1, Math.min(1, y / r)));
    return out;
}

/** @alias setFromVec3 */
export const fromVec3 = setFromVec3;

/**
 * Clamps phi to the range [EPSILON, π - EPSILON] to avoid coordinate
 * singularities at the poles (gimbal lock / division by zero).
 * r and theta are left unchanged.
 *
 * @param out the receiving Spherical
 * @param a the source Spherical
 * @returns out
 */
export function makeSafe(out: Spherical, a: RSpherical): Spherical {
    const EPS = scalar.EPSILON;
    out[0] = a[0];
    out[1] = a[1];
    out[2] = Math.max(EPS, Math.min(Math.PI - EPS, a[2]));
    return out;
}

/**
 * Converts spherical coordinates to a Cartesian Vec3 (Three.js / OpenGL convention):
 *   x = r * sin(phi) * sin(theta)
 *   y = r * cos(phi)
 *   z = r * sin(phi) * cos(theta)
 *
 * @param out the receiving Vec3
 * @param a the source Spherical
 * @returns out
 */
export function toVec3(out: Vec3, a: RSpherical): Vec3 {
    const r = a[0];
    const theta = a[1];
    const phi = a[2];
    const rSinPhi = r * Math.sin(phi);
    out[0] = rSinPhi * Math.sin(theta);
    out[1] = r * Math.cos(phi);
    out[2] = rSinPhi * Math.cos(theta);
    return out;
}

/**
 * Converts a Vec2 (x, z) in the horizontal XZ plane to spherical coordinates.
 * The point is treated as lying on the equator (phi = π/2, y = 0).
 *
 * @param out the receiving Spherical
 * @param v the source Vec2 interpreted as (x, z)
 * @returns out
 */
export function fromVec2(out: Spherical, v: RVec2): Spherical {
    const x = v[0];
    const z = v[1];
    const r = Math.sqrt(x * x + z * z);
    out[0] = r;
    out[1] = r === 0 ? 0 : Math.atan2(x, z);
    out[2] = Math.PI / 2;
    return out;
}

/**
 * Projects spherical coordinates onto the XZ plane, returning a Vec2 (x, z).
 * Equivalent to taking the horizontal footprint of the 3D point.
 *
 * @param out the receiving Vec2
 * @param a the source Spherical
 * @returns out
 */
export function toVec2(out: Vec2, a: RSpherical): Vec2 {
    const r = a[0];
    const theta = a[1];
    const phi = a[2];
    const rSinPhi = r * Math.sin(phi);
    out[0] = rSinPhi * Math.sin(theta);
    out[1] = rSinPhi * Math.cos(theta);
    return out;
}

/**
 * Returns true if two Spherical coordinates are approximately equal,
 * within an absolute/relative tolerance of EPSILON.
 *
 * @param a the first Spherical
 * @param b the second Spherical
 * @returns true if approximately equal
 */
export function equals(a: RSpherical, b: RSpherical): boolean {
    return scalar.equals(a[0], b[0]) && scalar.equals(a[1], b[1]) && scalar.equals(a[2], b[2]);
}

/**
 * Returns true if two Spherical coordinates are exactly equal (===).
 *
 * @param a the first Spherical
 * @param b the second Spherical
 * @returns true if exactly equal
 */
export function exactEquals(a: RSpherical, b: RSpherical): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Returns a string representation of a Spherical
 *
 * @param a the source Spherical
 * @returns string representation
 */
export function str(a: RSpherical): string {
    return `Spherical(${a[0]}, ${a[1]}, ${a[2]})`;
}

/**
 * Returns the great-circle angle (in radians) between two spherical coordinates,
 * ignoring r. Equivalent to the central angle between the two directions on a
 * unit sphere.
 *
 * Uses the numerically stable haversine formula.
 *
 * @param a the first Spherical
 * @param b the second Spherical
 * @returns angle in radians in [0, π]
 */
export function angleTo(a: RSpherical, b: RSpherical): number {
    const phiA = a[2];
    const phiB = b[2];
    const dTheta = b[1] - a[1];
    // hav(c) = hav(phiB - phiA) + sin(phiA) * sin(phiB) * hav(dTheta)
    const sHalfPhi = Math.sin((phiB - phiA) / 2);
    const sHalfTheta = Math.sin(dTheta / 2);
    const hav = sHalfPhi * sHalfPhi + Math.sin(phiA) * Math.sin(phiB) * sHalfTheta * sHalfTheta;
    return 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, hav))));
}
