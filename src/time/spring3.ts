import type { RVec3, Vec3 } from '../core';
import { coef, coefficients, type Spring } from './spring-core';

// A Vec3 spring. See `spring` (scalar) for the model. `damp` is `update` pinned
// to dampingRatio = 1.

/** Creates a Vec3 spring at `value` (copied), at rest. */
export const create = (value: RVec3 = [0, 0, 0]): Spring<Vec3> => ({
    value: [value[0], value[1], value[2]],
    velocity: [0, 0, 0],
});

/**
 * Springs `state.value` toward `target`, mutating `state` in place. Returns it.
 * @param dampingRatio 1 = critically damped (no overshoot), <1 bouncy, >1 sluggish
 */
export function update(
    state: Spring<Vec3>,
    target: RVec3,
    smoothTime: number,
    dampingRatio: number,
    delta: number,
): Spring<Vec3> {
    coefficients(smoothTime, dampingRatio, delta);
    const val = state.value;
    const vel = state.velocity;
    for (let i = 0; i < 3; i++) {
        const d = val[i] - target[i];
        const v = vel[i];
        val[i] = target[i] + coef.pp * d + coef.pv * v;
        vel[i] = coef.vp * d + coef.vv * v;
    }
    return state;
}

/** Critically-damped Vec3 spring (dampingRatio = 1). See {@link update}. */
export function damp(state: Spring<Vec3>, target: RVec3, smoothTime: number, delta: number): Spring<Vec3> {
    return update(state, target, smoothTime, 1, delta);
}
