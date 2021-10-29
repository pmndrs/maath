import { MathUtils, Vector2, Vector3 } from "three";

const TAU = Math.PI * 2;

type TypedArray = Float32Array | Float64Array;

export function randomInBox(buffer: TypedArray, { x = 0, y = 0, z = 0 }) {
  for (let i = 0; i < buffer.length; i += 3) {}
}

// random on surface of sphere https://twitter.com/fermatslibrary/status/1430932503578226688
export function randomOnSphere(
  buffer: TypedArray,
  { radius = 1, center = new Vector3(0, 0, 0) }
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

// from "Another Method" https://datagenetics.com/blog/january32020/index.html
export function randomInSphere(
  buffer: TypedArray,
  { radius = 1, center = new Vector3(0, 0, 0) }
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

// adapted from https://gist.github.com/stephanbogner/a5f50548a06bec723dcb0991dcbb0856 by https://twitter.com/st_phan
export function fibonacciOnSphere(
  buffer: TypedArray,
  { radius = 1, randomize = false }
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

// random circle https://stackoverflow.com/a/50746409
export function randomInCircle(
  buffer: TypedArray,
  { radius = 1, center = new Vector2() }
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
  { radius = 1, center = new Vector2() }
) {
  const random = () => Math.random();

  for (let i = 0; i < buffer.length; i += 2) {
    const theta = random() * TAU;

    buffer[i] = Math.sin(theta) * radius + center.x;
    buffer[i + 1] = Math.cos(theta) * radius + center.y;
  }
}

// buffer utils
export function bufferToVectorArray(buffer: TypedArray, stride = 3) {
  const p = [];

  for (let i = 0; i < buffer.length; i += stride) {
    p[i] = new (stride === 3 ? Vector3 : Vector2)(
      buffer[i],
      buffer[i + 1],
      buffer[i + 2]
    );
  }

  return p;
}

export function swizzleBuffer(buffer: TypedArray, stride = 3, swizzle = "xyz") {
  const o = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < buffer.length; i += stride) {
    o.x = buffer[i];
    o.y = buffer[i + 1];
    o.z = buffer[i + 2];

    const [x, y, z] = swizzle.split("");

    // TODO Fix this ugly type
    buffer[i] = o[x as "x" | "y" | "z"];
    buffer[i + 1] = o[y as "x" | "y" | "z"];
    buffer[i + 2] = o[z as "x" | "y" | "z"];
  }
}

export function addAxis(
  buffer: TypedArray,
  valueGenerator = () => Math.random()
) {
  const newBuffer = new Float32Array((buffer.length / 2) * 3);

  for (let i = 0; i < buffer.length; i += 2) {
    let j = (i / 2) * 3;

    newBuffer[j] = buffer[i];
    newBuffer[j + 1] = buffer[i + 1];
    newBuffer[j + 2] = valueGenerator();
  }

  return newBuffer;
}

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

// timing
export const rsqw = (t, delta = 0.01, a = 1, f = 1 / (2 * Math.PI)) =>
  (a / Math.atan(1 / delta)) * Math.atan(Math.sin(2 * Math.PI * t * f) / delta);

// bits
export function vectorEquals(a, b, eps = Number.EPSILON) {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.z - b.z) < eps
  );
}
