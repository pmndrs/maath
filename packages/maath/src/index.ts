import { MathUtils } from "three";

import type { TypedArray } from "./types";

export * from './random'
export * from './buffer-utils'

// adapted from https://gist.github.com/stephanbogner/a5f50548a06bec723dcb0991dcbb0856 by https://twitter.com/st_phan
export function fibonacciOnSphere(
  buffer: TypedArray,
  { radius = 1 }
) {
  const samples = buffer.length / 3;

  const offset = 2 / samples;
  const increment = Math.PI * (3 - 2.2360679775);

  for (let i = 0; i < buffer.length; i += 3) {
    let y = i * offset - 1 + offset / 2;
    const distance = Math.sqrt(1 - Math.pow(y, 2));

    const phi = (i % samples) * increment;

    let x = Math.cos(phi) * distance;
    let z = Math.sin(phi) * distance;

    buffer[i] = x * radius;
    buffer[i + 1] = y * radius;
    buffer[i + 2] = z * radius;
  }
}

// buffer utils


export function lerpBuffers(
  bufferA: TypedArray,
  bufferB: TypedArray,
  final: TypedArray,
  t: number
) {
  for (let i = 0; i < bufferA.length; i++) {
    final[i] = MathUtils.lerp(bufferA[i], bufferB[i], t);
  }
}

// TODO Fix these types
// timing
// @ts-ignore
export const rsqw = (t, delta = 0.01, a = 1, f = 1 / (2 * Math.PI)) =>
  (a / Math.atan(1 / delta)) * Math.atan(Math.sin(2 * Math.PI * t * f) / delta);

// bits
// @ts-ignore
export function vectorEquals(a, b, eps = Number.EPSILON) {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.z - b.z) < eps
  );
}
