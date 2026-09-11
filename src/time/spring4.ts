import type { RVec4, Vec4 } from '../core';
import { coef, coefficients, type Spring } from './spring-core';

// A Vec4 spring. See `spring` (scalar) for the model. `damp` is `update` pinned
// to dampingRatio = 1.

/** Creates a Vec4 spring at `value` (copied), at rest. */
export const create = (value: RVec4 = [0, 0, 0, 0]): Spring<Vec4> => ({
    value: [value[0], value[1], value[2], value[3]],
    velocity: [0, 0, 0, 0],
});

/**
 * Springs `state.value` toward `target`, mutating `state` in place. Returns it.
 * @param dampingRatio 1 = critically damped (no overshoot), <1 bouncy, >1 sluggish
 */
export function update(
    state: Spring<Vec4>,
    target: RVec4,
    smoothTime: number,
    dampingRatio: number,
    delta: number,
): Spring<Vec4> {
    coefficients(smoothTime, dampingRatio, delta);
    const val = state.value;
    const vel = state.velocity;
    for (let i = 0; i < 4; i++) {
        const d = val[i] - target[i];
        const v = vel[i];
        val[i] = target[i] + coef.pp * d + coef.pv * v;
        vel[i] = coef.vp * d + coef.vv * v;
    }
    return state;
}

/** Critically-damped Vec4 spring (dampingRatio = 1). See {@link update}. */
export function damp(state: Spring<Vec4>, target: RVec4, smoothTime: number, delta: number): Spring<Vec4> {
    return update(state, target, smoothTime, 1, delta);
}
