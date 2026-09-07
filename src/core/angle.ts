const TAU = Math.PI * 2;

export const DEGREES_TO_RADIANS = Math.PI / 180;

export const RADIANS_TO_DEGREES = 180 / Math.PI;

/**
 * Converts Degrees To Radians
 *
 * @param a Angle in Degrees
 */
export function degreesToRadians(degrees: number): number {
    return degrees * DEGREES_TO_RADIANS;
}

/**
 * Converts Radians To Degrees
 *
 * @param a Angle in Radians
 */
export function radiansToDegrees(radians: number): number {
    return radians * RADIANS_TO_DEGREES;
}

/**
 * Wraps an angle (in radians) into the range (-π, π].
 *
 * @param a the angle to wrap
 * @returns the angle wrapped into (-π, π]
 */
export function wrapAngle(a: number): number {
    return a - TAU * Math.floor((a + Math.PI) / TAU);
}

/**
 * Calculates the shortest signed difference between two angles (in radians).
 *
 * @param current the current angle
 * @param target the target angle
 * @returns the shortest signed difference in (-π, π]
 */
export function deltaAngle(current: number, target: number): number {
    const diff = target - current;
    const delta = diff - TAU * Math.floor(diff / TAU);
    return delta > Math.PI ? delta - TAU : delta;
}
