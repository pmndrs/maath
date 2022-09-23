import {
  Vector2,
  Vector3,
  Vector4,
  Euler,
  Color,
  Quaternion,
  ColorRepresentation,
} from "three";
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

let a: boolean, b: boolean, c: boolean, d: boolean;

/**
 * Vector2D Damp
 */
const v2d = /*@__PURE__*/ new Vector2();
export function damp2(
  current: Vector2,
  target: number | [x: number, y: number] | Vector2,
  smoothTime: number,
  delta: number,
  maxSpeed: number,
  easing?: (t: number) => number,
  eps?: number
) {
  if (typeof target === "number") v2d.setScalar(target);
  else if (Array.isArray(target)) v2d.set(target[0], target[1]);
  else v2d.copy(target);
  a = damp(current, "x", v2d.x, smoothTime, delta, maxSpeed, easing, eps);
  b = damp(current, "y", v2d.y, smoothTime, delta, maxSpeed, easing, eps);
  return a || b;
}

/**
 * Vector3D Damp
 */
const v3d = /*@__PURE__*/ new Vector3();
export function damp3(
  current: Vector3,
  target: number | [x: number, y: number, z: number] | Vector3,
  smoothTime: number,
  delta: number,
  maxSpeed: number,
  easing?: (t: number) => number,
  eps?: number
) {
  if (typeof target === "number") v3d.setScalar(target);
  else if (Array.isArray(target)) v3d.set(target[0], target[1], target[2]);
  else v3d.copy(target);
  a = damp(current, "x", v3d.x, smoothTime, delta, maxSpeed, easing, eps);
  b = damp(current, "y", v3d.y, smoothTime, delta, maxSpeed, easing, eps);
  c = damp(current, "z", v3d.z, smoothTime, delta, maxSpeed, easing, eps);
  return a || b || c;
}

/**
 * Vector4D Damp
 */
const v4d = /*@__PURE__*/ new Vector4();
export function damp4(
  current: Vector4,
  target: number | [x: number, y: number, z: number, w: number] | Vector4,
  smoothTime: number,
  delta: number,
  maxSpeed: number,
  easing?: (t: number) => number,
  eps?: number
) {
  if (typeof target === "number") v4d.setScalar(target);
  else if (Array.isArray(target))
    v4d.set(target[0], target[1], target[2], target[3]);
  else v4d.copy(target);
  a = damp(current, "x", v3d.x, smoothTime, delta, maxSpeed, easing, eps);
  b = damp(current, "y", v3d.y, smoothTime, delta, maxSpeed, easing, eps);
  c = damp(current, "z", v3d.z, smoothTime, delta, maxSpeed, easing, eps);
  return a || b || c;
}

/**
 * Euler Damp
 */
const rot = /*@__PURE__*/ new Euler();
export function dampE(
  current: Euler,
  target: [x: number, y: number, z: number, order?: string] | Euler,
  smoothTime: number,
  delta: number,
  maxSpeed: number,
  easing?: (t: number) => number,
  eps?: number
) {
  if (Array.isArray(target))
    rot.set(target[0], target[1], target[2], target[3]);
  else rot.copy(target);
  a = dampAngle(current, "x", rot.x, smoothTime, delta, maxSpeed, easing, eps);
  b = dampAngle(current, "y", rot.y, smoothTime, delta, maxSpeed, easing, eps);
  c = dampAngle(current, "z", rot.z, smoothTime, delta, maxSpeed, easing, eps);
  return a || b || c;
}

/**
 * Color Damp
 */
const col = /*@__PURE__*/ new Color();
export function dampC(
  current: Color,
  target: ColorRepresentation,
  smoothTime: number,
  delta: number,
  maxSpeed: number,
  easing?: (t: number) => number,
  eps?: number
) {
  col.set(target);
  a = damp(current, "r", col.r, smoothTime, delta, maxSpeed, easing, eps);
  b = damp(current, "g", col.g, smoothTime, delta, maxSpeed, easing, eps);
  c = damp(current, "b", col.b, smoothTime, delta, maxSpeed, easing, eps);
  return a || b || c;
}

/**
 * Quaternion Damp
 * https://gist.github.com/maxattack/4c7b4de00f5c1b95a33b
 */
const qt = /*@__PURE__*/ new Quaternion();
const v4result = /*@__PURE__*/ new Vector4();
const v4velocity = /*@__PURE__*/ new Vector4();
const v4error = /*@__PURE__*/ new Vector4();
export function dampQ(
  current: Quaternion,
  target: [x: number, y: number, z: number, w: number] | Quaternion,
  smoothTime: number,
  delta: number,
  maxSpeed: number,
  easing?: (t: number) => number,
  eps?: number
) {
  const cur = current as Quaternion & { __damp: { [key: string]: number } };
  if (Array.isArray(target)) qt.set(target[0], target[1], target[2], target[3]);
  else qt.copy(target);

  const multi = current.dot(qt) > 0 ? 1 : -1;
  qt.x *= multi;
  qt.y *= multi;
  qt.z *= multi;
  qt.w *= multi;

  a = damp(current, "x", qt.x, smoothTime, delta, maxSpeed, easing, eps);
  b = damp(current, "y", qt.y, smoothTime, delta, maxSpeed, easing, eps);
  c = damp(current, "z", qt.z, smoothTime, delta, maxSpeed, easing, eps);
  d = damp(current, "w", qt.w, smoothTime, delta, maxSpeed, easing, eps);

  // smooth damp (nlerp approx)
  v4result.set(current.x, current.y, current.z, current.w).normalize();
  v4velocity.set(
    cur.__damp.velocity_x,
    cur.__damp.velocity_y,
    cur.__damp.velocity_z,
    cur.__damp.velocity_w
  );

  // ensure deriv is tangent
  v4error
    .copy(v4result)
    .multiplyScalar(v4velocity.dot(v4result) / v4result.dot(v4result));
  cur.__damp.velocity_x -= v4error.x;
  cur.__damp.velocity_y -= v4error.y;
  cur.__damp.velocity_z -= v4error.z;
  cur.__damp.velocity_w -= v4error.w;

  current.set(v4result.x, v4result.y, v4result.z, v4result.w);
  return a || b || c || d;
}
