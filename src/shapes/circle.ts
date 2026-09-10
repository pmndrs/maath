import type { RVec2, Vec2 } from '../core/vec2';

/** A circle in 2D space */
export type Circle = { center: Vec2; radius: number };

/** A read-only circle in 2D space */
export type RCircle = { readonly center: RVec2; readonly radius: number };

export function create(): Circle {
    return { center: [0, 0], radius: 0 };
}
