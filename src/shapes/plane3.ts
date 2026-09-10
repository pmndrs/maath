import type { RMat4 } from '../core/mat4';
import type { RVec3, Vec3 } from '../core/vec3';
import * as vec3 from '../core/vec3';
import type { RSphere } from './sphere';

/**
 * A plane in 3D space
 * normal - a unit length vector defining the normal of the plane.
 * constant - the signed distance from the origin to the plane.
 */
export type Plane3 = { normal: Vec3; constant: number };

/** A read-only plane in 3D space */
export type RPlane3 = { readonly normal: RVec3; readonly constant: number };

/**
 * Creates a new plane with normal (0, 1, 0) and constant 0
 * @returns A new plane
 */
export function create(): Plane3 {
    return { normal: [0, 1, 0], constant: 0 };
}

/**
 * Creates a plane from a normal and constant
 * @param out - The output plane
 * @param normal - The plane normal (should be unit length)
 * @param constant - The signed distance from origin
 * @returns The output plane
 */
export function fromNormalAndConstant(out: Plane3, normal: RVec3, constant: number): Plane3 {
    vec3.copy(out.normal, normal);
    out.constant = constant;
    return out;
}

/**
 * Creates a plane from a normal and a point on the plane
 * @param out - The output plane
 * @param normal - The plane normal (should be unit length)
 * @param point - A point on the plane
 * @returns The output plane
 */
export function fromNormalAndPoint(out: Plane3, normal: RVec3, point: RVec3): Plane3 {
    vec3.copy(out.normal, normal);
    out.constant = -vec3.dot(normal, point);
    return out;
}

/**
 * Creates a plane from three coplanar points
 * @param out - The output plane
 * @param a - First point
 * @param b - Second point
 * @param c - Third point
 * @returns The output plane
 */
export function fromCoplanarPoints(out: Plane3, a: RVec3, b: RVec3, c: RVec3): Plane3 {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];

    // edge vectors v1 = b - a, v2 = c - a
    const v1x = b[0] - ax;
    const v1y = b[1] - ay;
    const v1z = b[2] - az;
    const v2x = c[0] - ax;
    const v2y = c[1] - ay;
    const v2z = c[2] - az;

    // normal = normalize(v1 × v2) (matches vec3.normalize: zero-length stays zero)
    let nx = v1y * v2z - v1z * v2y;
    let ny = v1z * v2x - v1x * v2z;
    let nz = v1x * v2y - v1y * v2x;
    let len = nx * nx + ny * ny + nz * nz;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
    }
    nx *= len;
    ny *= len;
    nz *= len;

    out.normal[0] = nx;
    out.normal[1] = ny;
    out.normal[2] = nz;
    out.constant = -(nx * ax + ny * ay + nz * az);

    return out;
}

/**
 * Clones a plane
 * @param plane - The plane to clone
 * @returns A new plane
 */
export function clone(plane: RPlane3): Plane3 {
    return {
        normal: vec3.clone(plane.normal),
        constant: plane.constant,
    };
}

/**
 * Copies one plane to another
 * @param out - The output plane
 * @param plane - The source plane
 * @returns The output plane
 */
export function copy(out: Plane3, plane: RPlane3): Plane3 {
    vec3.copy(out.normal, plane.normal);
    out.constant = plane.constant;
    return out;
}

/**
 * Normalizes a plane (ensures the normal vector is unit length)
 * @param out - The output plane
 * @param plane - The input plane
 * @returns The normalized plane
 */
export function normalize(out: Plane3, plane: RPlane3): Plane3 {
    const invMagnitude = 1.0 / vec3.length(plane.normal);
    vec3.scale(out.normal, plane.normal, invMagnitude);
    out.constant = plane.constant * invMagnitude;
    return out;
}

/**
 * Negates a plane (flips the normal and constant)
 * @param out - The output plane
 * @param plane - The input plane
 * @returns The negated plane
 */
export function negate(out: Plane3, plane: RPlane3): Plane3 {
    vec3.negate(out.normal, plane.normal);
    out.constant = -plane.constant;
    return out;
}

/**
 * Offsets a plane by a distance along its normal
 * @param out - The output plane
 * @param plane - The input plane
 * @param distance - The distance to offset (positive = in direction of normal)
 * @returns The offset plane
 */
export function offset(out: Plane3, plane: RPlane3, distance: number): Plane3 {
    vec3.copy(out.normal, plane.normal);
    out.constant = plane.constant - distance;
    return out;
}

/**
 * Calculates the signed distance from a point to the plane
 * @param plane - The plane
 * @param point - The point
 * @returns The signed distance (positive = in direction of normal)
 */
export function distanceToPoint(plane: RPlane3, point: RVec3): number {
    return vec3.dot(plane.normal, point) + plane.constant;
}

/**
 * Projects a point onto the plane
 * @param out - The output point
 * @param plane - The plane
 * @param point - The point to project
 * @returns The projected point
 */
export function projectPoint(out: Vec3, plane: RPlane3, point: RVec3): Vec3 {
    const distance = distanceToPoint(plane, point);
    return vec3.scaleAndAdd(out, point, plane.normal, -distance);
}

/**
 * Transforms a plane by a 4x4 matrix
 * @param out - The output plane
 * @param plane - The plane to transform
 * @param matrix - The transformation matrix
 * @returns The transformed plane
 */
export function transform(out: Plane3, plane: RPlane3, matrix: RMat4): Plane3 {
    // Transform the normal by the inverse transpose of the matrix
    // For a proper implementation, you'd need mat4.invert and proper normal transformation
    // This is a simplified version (rotation-only normal transform). fully scalar, no allocations.
    const inx = plane.normal[0];
    const iny = plane.normal[1];
    const inz = plane.normal[2];

    // a point on the plane: normal * -constant
    const px = inx * -plane.constant;
    const py = iny * -plane.constant;
    const pz = inz * -plane.constant;

    // transform normal (rotation part only)
    let nx = matrix[0] * inx + matrix[4] * iny + matrix[8] * inz;
    let ny = matrix[1] * inx + matrix[5] * iny + matrix[9] * inz;
    let nz = matrix[2] * inx + matrix[6] * iny + matrix[10] * inz;

    // transform the point by the full matrix (matches vec3.transformMat4, incl. w divide)
    let w = matrix[3] * px + matrix[7] * py + matrix[11] * pz + matrix[15];
    w = w || 1.0;
    const tpx = (matrix[0] * px + matrix[4] * py + matrix[8] * pz + matrix[12]) / w;
    const tpy = (matrix[1] * px + matrix[5] * py + matrix[9] * pz + matrix[13]) / w;
    const tpz = (matrix[2] * px + matrix[6] * py + matrix[10] * pz + matrix[14]) / w;

    // normalize transformed normal (matches vec3.normalize)
    let len = nx * nx + ny * ny + nz * nz;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
    }
    nx *= len;
    ny *= len;
    nz *= len;

    out.normal[0] = nx;
    out.normal[1] = ny;
    out.normal[2] = nz;
    out.constant = -(nx * tpx + ny * tpy + nz * tpz);

    return out;
}

/**
 * Tests if a sphere intersects the plane
 * @param plane - The plane
 * @param sphere - The sphere
 * @returns True if they intersect
 */
export function intersectsSphere(plane: RPlane3, sphere: RSphere): boolean {
    const distance = Math.abs(distanceToPoint(plane, sphere.center));
    return distance <= sphere.radius;
}

/**
 * Tests if two planes are exactly equal
 * @param a - First plane
 * @param b - Second plane
 * @returns True if planes are exactly equal
 */
export function exactEquals(a: RPlane3, b: RPlane3): boolean {
    return vec3.exactEquals(a.normal, b.normal) && a.constant === b.constant;
}

/**
 * Finds the intersection point of three planes
 * @param out - The output point where the three planes intersect
 * @param p1 - First plane
 * @param p2 - Second plane
 * @param p3 - Third plane
 * @returns True if intersection exists, false if planes are degenerate or parallel
 */
export function intersect(out: Vec3, p1: RPlane3, p2: RPlane3, p3: RPlane3): boolean {
    // point = -(d1*(N2×N3) + d2*(N3×N1) + d3*(N1×N2)) / (N1·(N2×N3))
    // Cramer's rule: the three cross products are the columns of adj(M) and are reused
    // between the determinant and the numerator. fully scalar, zero allocations.
    const n1x = p1.normal[0];
    const n1y = p1.normal[1];
    const n1z = p1.normal[2];
    const n2x = p2.normal[0];
    const n2y = p2.normal[1];
    const n2z = p2.normal[2];
    const n3x = p3.normal[0];
    const n3y = p3.normal[1];
    const n3z = p3.normal[2];

    // N2 × N3
    const c1x = n2y * n3z - n2z * n3y;
    const c1y = n2z * n3x - n2x * n3z;
    const c1z = n2x * n3y - n2y * n3x;

    // denominator: N1 · (N2 × N3)
    const denom = n1x * c1x + n1y * c1y + n1z * c1z;

    // planes are parallel or degenerate (determinant is zero)
    if (Math.abs(denom) < 0.000001) {
        return false;
    }

    // N3 × N1
    const c2x = n3y * n1z - n3z * n1y;
    const c2y = n3z * n1x - n3x * n1z;
    const c2z = n3x * n1y - n3y * n1x;

    // N1 × N2
    const c3x = n1y * n2z - n1z * n2y;
    const c3y = n1z * n2x - n1x * n2z;
    const c3z = n1x * n2y - n1y * n2x;

    const d1 = p1.constant;
    const d2 = p2.constant;
    const d3 = p3.constant;
    const s = -1 / denom;

    out[0] = (d1 * c1x + d2 * c2x + d3 * c3x) * s;
    out[1] = (d1 * c1y + d2 * c2y + d3 * c3y) * s;
    out[2] = (d1 * c1z + d2 * c2z + d3 * c3z) * s;

    return true;
}

/**
 * Tests if two planes are equal
 * @param a - First plane
 * @param b - Second plane
 * @returns True if planes are equal
 */
export function equals(a: RPlane3, b: RPlane3): boolean {
    return vec3.equals(a.normal, b.normal) && Math.abs(a.constant - b.constant) < 0.000001;
}
