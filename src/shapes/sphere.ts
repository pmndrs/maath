import type { RVec3, Vec3 } from '../core/vec3';

/** A sphere in 3D space */
export type Sphere = { center: Vec3; radius: number };

/** A read-only sphere in 3D space */
export type RSphere = { readonly center: RVec3; readonly radius: number };

/**
 * Creates a new sphere with a default center 0,0,0 and radius 1
 * @returns A new sphere.
 */
export function create(): Sphere {
    return { center: [0, 0, 0], radius: 1 };
}

/**
 * Returns true if a point lies inside (or on the surface of) the sphere.
 *
 * @param sphere the sphere
 * @param point the point to test
 * @returns true if the point is within the sphere's radius
 */
export function containsPoint(sphere: RSphere, point: RVec3): boolean {
    const dx = point[0] - sphere.center[0];
    const dy = point[1] - sphere.center[1];
    const dz = point[2] - sphere.center[2];
    return dx * dx + dy * dy + dz * dz <= sphere.radius * sphere.radius;
}
