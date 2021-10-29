const TAU = Math.PI * 2;

import type { TypedArray } from "./types";

// TODO Fix center offset
// random on surface of sphere https://twitter.com/fermatslibrary/status/1430932503578226688
export function randomOnSphere(
  buffer: TypedArray,
  { radius = 1, center = [0, 0, 0] }
) {
  const random = () => Math.random();

  for (let i = 0; i < buffer.length; i += 3) {
    const u = random();
    const v = random();

    const theta = Math.acos(2 * v - 1);
    const phi = TAU * u;

    buffer[i] = Math.sin(theta) * Math.cos(phi) * radius;
    buffer[i + 1] = Math.sin(theta) * Math.sin(phi) * radius;
    buffer[i + 2] = Math.cos(theta) * radius;
  }
}

// TODO Fix center offset
// from "Another Method" https://datagenetics.com/blog/january32020/index.html
export function randomInSphere(
  buffer: TypedArray,
  { radius = 1, center = [0, 0, 0] }
) {
  const random = () => Math.random();

  for (let i = 0; i < buffer.length; i += 3) {
    const u = Math.pow(random(), 1 / 3);

    let x = random() * 2 - 1;
    let y = random() * 2 - 1;
    let z = random() * 2 - 1;

    const mag = Math.sqrt(x * x + y * y + z * z);

    x = (u * x) / mag;
    y = (u * y) / mag;
    z = (u * z) / mag;

    buffer[i] = x * radius;
    buffer[i + 1] = y * radius;
    buffer[i + 2] = z * radius;
  }
}

// random circle https://stackoverflow.com/a/50746409
export function randomInCircle(
  buffer: TypedArray,
  { radius = 1, center = [0, 0] }
) {
  const random = () => Math.random();

  for (let i = 0; i < buffer.length; i += 2) {
    const r = radius * Math.sqrt(random());
    const theta = random() * TAU;

    buffer[i] = Math.sin(theta) * r + center.x;
    buffer[i + 1] = Math.cos(theta) * r + center.y;
  }
}

export function randomOnCircle(
  buffer: TypedArray,
  { radius = 1, center = [0, 0] }
) {
  const random = () => Math.random();

  for (let i = 0; i < buffer.length; i += 2) {
    const theta = random() * TAU;

    buffer[i] = Math.sin(theta) * radius + center.x;
    buffer[i + 1] = Math.cos(theta) * radius + center.y;
  }
}
