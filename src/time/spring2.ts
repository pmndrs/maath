import type { RVec2, Vec2 } from '../core';
import { coef, coefficients, type Spring } from './spring-core';

// A Vec2 spring. See `spring` (scalar) for the model; the same four coefficients
// are applied to each component. `damp` is `update` pinned to dampingRatio = 1.

/** Creates a Vec2 spring at `value` (copied), at rest. */
export const create = (value: RVec2 = [0, 0]): Spring<Vec2> => ({ value: [value[0], value[1]], velocity: [0, 0] });

/**
 * Springs `state.value` toward `target`, mutating `state` in place. Returns it.
 * @param dampingRatio 1 = critically damped (no overshoot), <1 bouncy, >1 sluggish
 */
export function update(
    state: Spring<Vec2>,
    target: RVec2,
    smoothTime: number,
    dampingRatio: number,
    delta: number,
): Spring<Vec2> {
    coefficients(smoothTime, dampingRatio, delta);
    const val = state.value;
    const vel = state.velocity;
    let d = val[0] - target[0];
    let v = vel[0];
    val[0] = target[0] + coef.pp * d + coef.pv * v;
    vel[0] = coef.vp * d + coef.vv * v;
    d = val[1] - target[1];
    v = vel[1];
    val[1] = target[1] + coef.pp * d + coef.pv * v;
    vel[1] = coef.vp * d + coef.vv * v;
    return state;
}

/** Critically-damped Vec2 spring (dampingRatio = 1). See {@link update}. */
export function damp(state: Spring<Vec2>, target: RVec2, smoothTime: number, delta: number): Spring<Vec2> {
    return update(state, target, smoothTime, 1, delta);
}
