import { deltaAngle } from "./misc";

/**
 * Rounded square wave easing
 */
export const rsqw = (t: number, delta = 0.01, a = 1, f = 1 / (2 * Math.PI)) =>
  (a / Math.atan(1 / delta)) * Math.atan(Math.sin(2 * Math.PI * t * f) / delta);

/**
 * Exponential easing
 */
export const exp = (t: number) =>
  1 / (1 + t + 0.48 * t * t + 0.235 * t * t * t);

/**
 * Damp, based on Game Programming Gems 4 Chapter 1.10
 */
export function damp(
  current: { [key: string]: any },
  prop: string,
  target: number,
  smoothTime = 0.25,
  delta = 0.01,
  maxSpeed = Infinity,
  easing = exp,
  eps = 0.001
) {
  const vel = "velocity_" + prop;
  if (current.__damp === undefined) current.__damp = {};
  if (current.__damp[vel] === undefined) current.__damp[vel] = 0;

  if (Math.abs(current[prop] - target) <= eps) {
    current[prop] = target;
    return false;
  }

  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const t = easing(omega * delta);
  let change = current[prop] - target;
  const originalTo = target;
  // Clamp maximum maxSpeed
  const maxChange = maxSpeed * smoothTime;
  change = Math.min(Math.max(change, -maxChange), maxChange);
  target = current[prop] - change;
  const temp = (current.__damp[vel] + omega * change) * delta;
  current.__damp[vel] = (current.__damp[vel] - omega * temp) * t;
  let output = target + (change + temp) * t;
  // Prevent overshooting
  if (originalTo - current[prop] > 0.0 === output > originalTo) {
    output = originalTo;
    current.__damp[vel] = (output - originalTo) / delta;
  }
  current[prop] = output;
  return true;
}

/**
 * DampAngle, based on Game Programming Gems 4 Chapter 1.10
 */
export function dampAngle(
  current: { [key: string]: any },
  prop: string,
  target: number,
  smoothTime?: number,
  delta?: number,
  maxSpeed?: number,
  easing?: (t: number) => number,
  eps?: number
) {
  return damp(
    current,
    prop,
    current[prop] + deltaAngle(current[prop], target),
    smoothTime,
    delta,
    maxSpeed,
    easing,
    eps
  );
}
