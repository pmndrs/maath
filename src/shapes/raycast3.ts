import type { RVec3 } from '../core/vec3';
import type { RBox3 } from './box3';

/**
 * Result of a ray-triangle intersection test
 * @see createIntersectsTriangleResult
 * @see intersectsTriangle
 */
export type IntersectsTriangleResult = {
    fraction: number;
    hit: boolean;
    frontFacing: boolean;
};

/**
 * Creates a new IntersectsTriangleResult with default values.
 * @returns A new IntersectsTriangleResult.
 */
export function createIntersectsTriangleResult(): IntersectsTriangleResult {
    return {
        fraction: 0,
        hit: false,
        frontFacing: false,
    };
}

/**
 * Ray-triangle intersection test.
 * Based on https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h
 *
 * @param out output object to store result (hit boolean, fraction, frontFacing)
 * @param origin ray origin
 * @param direction ray direction
 * @param length ray length
 * @param a first vertex of triangle
 * @param b second vertex of triangle
 * @param c third vertex of triangle
 * @param backfaceCulling if true, backfaces will not be considered hits
 */
export function intersectsTriangle(
    out: IntersectsTriangleResult,
    origin: RVec3,
    direction: RVec3,
    length: number,
    a: RVec3,
    b: RVec3,
    c: RVec3,
    backfaceCulling: boolean,
): void {
    // compute edge1 = b - a
    const e1x = b[0] - a[0];
    const e1y = b[1] - a[1];
    const e1z = b[2] - a[2];

    // compute edge2 = c - a
    const e2x = c[0] - a[0];
    const e2y = c[1] - a[1];
    const e2z = c[2] - a[2];

    // compute normal = edge1 × edge2
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    // determine front vs back facing
    const dx = direction[0];
    const dy = direction[1];
    const dz = direction[2];
    let DdN = dx * nx + dy * ny + dz * nz;
    let sign: number;

    if (DdN > 0) {
        // backface
        if (backfaceCulling) {
            out.hit = false;
            out.fraction = 0;
            out.frontFacing = false;
            return;
        }
        sign = 1;
    } else if (DdN < 0) {
        // frontface
        sign = -1;
        DdN = -DdN;
    } else {
        // ray is parallel to triangle
        out.hit = false;
        out.fraction = 0;
        out.frontFacing = false;
        return;
    }

    // compute diff = origin - a
    const diffx = origin[0] - a[0];
    const diffy = origin[1] - a[1];
    const diffz = origin[2] - a[2];

    // compute barycentric coordinate b1
    // DdQxE2 = sign * D · (diff × edge2)
    const diffCrossE2x = diffy * e2z - diffz * e2y;
    const diffCrossE2y = diffz * e2x - diffx * e2z;
    const diffCrossE2z = diffx * e2y - diffy * e2x;
    const DdQxE2 = sign * (dx * diffCrossE2x + dy * diffCrossE2y + dz * diffCrossE2z);

    if (DdQxE2 < 0) {
        out.hit = false;
        out.fraction = 0;
        out.frontFacing = false;
        return;
    }

    // compute barycentric coordinate b2
    // DdE1xQ = sign * D · (edge1 × diff)
    const e1CrossDiffx = e1y * diffz - e1z * diffy;
    const e1CrossDiffy = e1z * diffx - e1x * diffz;
    const e1CrossDiffz = e1x * diffy - e1y * diffx;
    const DdE1xQ = sign * (dx * e1CrossDiffx + dy * e1CrossDiffy + dz * e1CrossDiffz);

    if (DdE1xQ < 0) {
        out.hit = false;
        out.fraction = 0;
        out.frontFacing = false;
        return;
    }

    // check if b1 + b2 > 1
    if (DdQxE2 + DdE1xQ > DdN) {
        out.hit = false;
        out.fraction = 0;
        out.frontFacing = false;
        return;
    }

    // compute intersection distance
    const QdN = -sign * (diffx * nx + diffy * ny + diffz * nz);

    if (QdN < 0) {
        out.hit = false;
        out.fraction = 0;
        out.frontFacing = false;
        return;
    }

    const t = QdN / DdN;

    // check if intersection is within ray length
    if (t <= length) {
        out.hit = true;
        out.fraction = t / length;
        out.frontFacing = sign < 0;
    } else {
        out.hit = false;
        out.fraction = 0;
        out.frontFacing = false;
    }
}

/**
 * Test if a ray intersects an axis-aligned bounding box.
 * Uses slab-based algorithm that handles parallel rays correctly.
 *
 * @param origin ray origin
 * @param direction ray direction
 * @param length ray length
 * @param aabb AABB to test against
 * @returns true if ray intersects the AABB, false otherwise
 */
export function intersectsBox3(origin: RVec3, direction: RVec3, length: number, aabb: RBox3): boolean {
    let tmin = 0;
    let tmax = length;

    for (let i = 0; i < 3; i++) {
        const d = direction[i];

        if (Math.abs(d) < 1e-10) {
            // ray is parallel to slab: check if origin is within slab
            if (origin[i] < aabb[i] || origin[i] > aabb[i + 3]) {
                return false;
            }
        } else {
            // compute intersection times with slab
            const invD = 1 / d;
            let t0 = (aabb[i] - origin[i]) * invD;
            let t1 = (aabb[i + 3] - origin[i]) * invD;

            if (invD < 0) {
                const temp = t0;
                t0 = t1;
                t1 = temp;
            }

            tmin = Math.max(tmin, t0);
            tmax = Math.min(tmax, t1);

            if (tmax < tmin) {
                return false;
            }
        }
    }

    return true;
}
