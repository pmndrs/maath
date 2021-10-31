import { MathUtils, Vector2, Vector3 } from "three";
import type { TypedArray } from "./types";

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
