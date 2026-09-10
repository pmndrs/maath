import type { Quat } from '../core/quat';
import type { Vec2 } from '../core/vec2';
import type { Vec3 } from '../core/vec3';
import type { Vec4 } from '../core/vec4';

/** A function that returns a random number in the range [0, 1). */
export type RandomGenerator = () => number;

/**
 * Returns a random float in the range [min, max).
 * @param random the random generator to use
 * @param min the minimum value (inclusive)
 * @param max the maximum value (exclusive)
 */
export function float(random: RandomGenerator, min: number, max: number): number {
    return random() * (max - min) + min;
}

/**
 * Returns a random integer in the range [min, max] (inclusive).
 * @param random the random generator to use
 * @param min the minimum value (inclusive)
 * @param max the maximum value (inclusive)
 */
export function int(random: RandomGenerator, min: number, max: number): number {
    return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Returns a random boolean.
 * @param random the random generator to use
 * @param chance the probability of returning true, in the range [0, 1]. Defaults to 0.5.
 */
export function bool(random: RandomGenerator, chance = 0.5): boolean {
    return random() < chance;
}

/**
 * Returns a random sign, either 1 or -1.
 * @param random the random generator to use
 * @param plusChance the probability of returning 1, in the range [0, 1]. Defaults to 0.5.
 */
export function sign(random: RandomGenerator, plusChance = 0.5): number {
    return random() < plusChance ? 1 : -1;
}

/**
 * Returns a random item from an array.
 * @param random the random generator to use
 * @param items the array to choose from
 * @throws if the array is empty
 */
export function choice<T>(random: RandomGenerator, items: readonly T[]): T {
    if (items.length === 0) {
        throw new Error('cannot choose from an empty array');
    }
    return items[Math.floor(random() * items.length) % items.length];
}

/**
 * Writes a random unit-length Vec2 into out.
 * @param out the receiving vector
 * @param random the random generator to use
 * @returns out
 */
export function vec2(out: Vec2, random: RandomGenerator): Vec2 {
    const r = random() * 2.0 * Math.PI;
    out[0] = Math.cos(r);
    out[1] = Math.sin(r);
    return out;
}

/**
 * Writes a random unit-length Vec3 into out.
 * @param out the receiving vector
 * @param random the random generator to use
 * @returns out
 */
export function vec3(out: Vec3, random: RandomGenerator): Vec3 {
    const r = random() * 2.0 * Math.PI;
    const z = random() * 2.0 - 1.0;
    const zScale = Math.sqrt(1.0 - z * z);

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z;
    return out;
}

/**
 * Writes a random unit-length Vec4 into out.
 * @param out the receiving vector
 * @param random the random generator to use
 * @returns out
 */
export function vec4(out: Vec4, random: RandomGenerator): Vec4 {
    // Marsaglia, George. Choosing a Point from the Surface of a
    // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
    // http://projecteuclid.org/euclid.aoms/1177692644;
    let rand = random();
    const v1 = rand * 2 - 1;
    const v2 = (4 * random() - 2) * Math.sqrt(rand * -rand + rand);
    const s1 = v1 * v1 + v2 * v2;

    rand = random();
    const v3 = rand * 2 - 1;
    const v4 = (4 * random() - 2) * Math.sqrt(rand * -rand + rand);
    const s2 = v3 * v3 + v4 * v4;

    const d = Math.sqrt((1 - s1) / s2);
    out[0] = v1;
    out[1] = v2;
    out[2] = v3 * d;
    out[3] = v4 * d;
    return out;
}

/**
 * Writes a random unit quaternion into out.
 * @param out the receiving quaternion
 * @param random the random generator to use
 * @returns out
 */
export function quat(out: Quat, random: RandomGenerator): Quat {
    // Implementation of http://planning.cs.uiuc.edu/node198.html
    const u1 = random();
    const u2 = random();
    const u3 = random();

    const sqrt1MinusU1 = Math.sqrt(1 - u1);
    const sqrtU1 = Math.sqrt(u1);

    out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
    out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
    out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
    out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
    return out;
}
