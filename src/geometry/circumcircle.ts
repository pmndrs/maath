import { EPSILON } from '../core/scalar';
import type { RVec2 } from '../core/vec2';
import type { Circle } from '../shapes/circle';

/**
 * Calculates the circumcircle of three points and stores the center in the output parameter.
 * @param out The circle to store the result in
 * @param triangle The triangle defined by three points
 * @returns
 */
export function circumcircle(out: Circle, a: RVec2, b: RVec2, c: RVec2): Circle {
    // work relative to `a` at the origin, which collapses the circumcenter formula
    const ax = a[0];
    const ay = a[1];
    const bx = b[0] - ax;
    const by = b[1] - ay;
    const cx = c[0] - ax;
    const cy = c[1] - ay;

    // cross product of the edge vectors (twice the signed triangle area)
    const cp = bx * cy - by * cx;

    if (Math.abs(cp) > EPSILON) {
        const bSq = bx * bx + by * by;
        const cSq = cx * cx + cy * cy;
        const d = 0.5 / cp;

        // circumcenter relative to `a`
        const ux = (cy * bSq - by * cSq) * d;
        const uy = (bx * cSq - cx * bSq) * d;

        out.center[0] = ux + ax;
        out.center[1] = uy + ay;
        out.radius = Math.sqrt(ux * ux + uy * uy);

        return out;
    }

    // degenerate (collinear) — no unique circumcircle
    out.center[0] = ax;
    out.center[1] = ay;
    out.radius = 0;

    return out;
}
