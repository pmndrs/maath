/**
 * Conventions:
 * 1. try to avoid threejs dependencies, TBD how to solve them
 * 2. use overload signatures to support stride 2 and 3 with ok typing
 */

import { Quaternion, Vector3 } from "three";
import type { TypedArray, MyVector2, MyVector3 } from "./ctypes";
import { lerp as _lerp, lpi3 as _lpi3 } from "./misc";
import * as v2 from "./vector2";
import * as v3 from "./vector3";

export function swizzle(buffer: TypedArray, stride = 3, swizzle = "xyz") {
  const o = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < buffer.length; i += stride) {
    o.x = buffer[i];
    o.y = buffer[i + 1];
    o.z = buffer[i + 2];

    const [x, y, z] = swizzle.split("");

    // TODO Fix this ugly type
    buffer[i] = o[x as "x" | "y" | "z"];
    buffer[i + 1] = o[y as "x" | "y" | "z"];

    if (stride === 3) {
      buffer[i + 2] = o[z as "x" | "y" | "z"];
    }
  }

  return buffer;
}

/**
 * @param buffer A stride 2 points buffer
 * @param valueGenerator A function that returns the value of the z axis at index i
 * @returns
 */
export function addAxis(
  buffer: TypedArray,
  size: number,
  valueGenerator: (j: number) => number = () => Math.random()
): TypedArray {
  const newSize = size + 1;
  const newBuffer = new Float32Array(
    (buffer.length / size) * newSize
  ) as TypedArray;

  for (let i = 0; i < buffer.length; i += size) {
    let j = (i / size) * newSize;

    newBuffer[j] = buffer[i];
    newBuffer[j + 1] = buffer[i + 1];

    if (size === 2) {
      newBuffer[j + 2] = valueGenerator(j);
    }

    if (size === 3) {
      newBuffer[j + 2] = buffer[i + 2];
      newBuffer[j + 3] = valueGenerator(j);
    }
  }

  return newBuffer;
}

/**
 * Lerps bufferA and bufferB into final
 *
 * @param bufferA
 * @param bufferB
 * @param final
 * @param t
 */
export function lerp(
  bufferA: TypedArray,
  bufferB: TypedArray,
  final: TypedArray,
  t: number
) {
  for (let i = 0; i < bufferA.length; i++) {
    final[i] = _lerp(bufferA[i], bufferB[i], t);
  }
}

/**
 *
 * Interpolates using Lagrane Interpolation between three buffers, passed in as array into final
 *
 * @param buffers array of three buffers: bufferA, bufferB, bufferC
 * @param final interpolation buffer (output)
 * @param t time, reccomended
 */
export function lpi3(
  buffers: [TypedArray, TypedArray, TypedArray],
  final: TypedArray,
  t: number
) {
  for (let i = 0; i < buffers[0].length; i++) {
    final[i] = _lpi3([buffers[0][i], buffers[1][i], buffers[2][i]], t);
  }
}

// TODO add stride
// TODO Fix types & vectors
/**
 *
 * Translate all points in the passed buffer by the passed translactionVector.
 *
 * @param buffer
 * @param translationVector
 * @returns
 */
export function translate(
  buffer: TypedArray,
  translationVector: MyVector2 | MyVector3
) {
  const stride = translationVector.length;

  for (let i = 0; i < buffer.length; i += stride) {
    buffer[i] += translationVector[0];
    buffer[i + 1] += translationVector[1];
    buffer[i + 2] += translationVector[2];
  }

  return buffer;
}

// TODO add stride
// TODO remove quaternion & vector3 dependencies
export function rotate(
  buffer: TypedArray,
  rotation: { q: Quaternion; center?: number[] }
) {
  const defaultRotation = {
    center: [0, 0, 0],
    q: new Quaternion().identity(),
  };

  const v = new Vector3();

  const { q, center } = {
    ...defaultRotation,
    ...rotation,
  };

  for (let i = 0; i < buffer.length; i += 3) {
    v.set(
      buffer[i] - center[0],
      buffer[i + 1] - center[1],
      buffer[i + 2] - center[2]
    );
    v.applyQuaternion(q);

    buffer[i] = v.x + center[0];
    buffer[i + 1] = v.y + center[1];
    buffer[i + 2] = v.z + center[1];
  }

  return buffer;
}

export function map(
  buffer: TypedArray,
  stride: 2,
  fn: (v: v2.V2, i: number) => number[]
): TypedArray;

export function map(
  buffer: TypedArray,
  stride: 3,
  fn: (v: v3.V3, i: number) => number[]
): TypedArray;

export function map(buffer: any, stride: any, callback: any) {
  for (let i = 0, j = 0; i < buffer.length; i += stride, j++) {
    if (stride === 3) {
      const res = callback([buffer[i], buffer[i + 1], buffer[i + 2]], j);
      buffer.set(res, i);
    } else {
      buffer.set(callback([buffer[i], buffer[i + 1]], j), i);
    }
  }

  return buffer;
}

/**
 * Reduces passed buffer
 */
type IReduceCallback<T> = (final: T, point: v2.V2, i: number) => T;

export function reduce<T>(
  b: TypedArray,
  stride: 2,
  callback: IReduceCallback<T>,
  acc: T
): T;

export function reduce<T>(
  b: TypedArray,
  stride: 3,
  callback: IReduceCallback<T>,
  acc: T
): T;

export function reduce<T>(b: TypedArray, stride: any, callback: any, acc: T) {
  for (let i = 0, j = 0; i < b.length; i += stride, j++) {
    if (stride === 2) {
      acc = callback(acc, [b[i], b[i + 1]], j);
    } else {
      acc = callback(acc, [b[i], b[i + 1], b[i + 2]], j);
    }
  }

  return acc;
}

type ExpandOptions = {
  center?: [number, number];
  distance: number;
};

export function expand(b: TypedArray, stride: 2 | 3, opts: ExpandOptions) {
  const defaultExpandOptions = {
    center: [0, 0, 0],
  };

  const { center, distance } = {
    ...defaultExpandOptions,
    ...opts,
  };

  for (let i = 0; i < b.length; i += stride) {
    /**
     * 1. translate to origin (subtract the scaling center)
     * 2. scale by the correct amount (multiply by a constant)
     * 2. translate from origin (add the scaling center)
     */
    b[i] = (b[i] - center[0]) * (1 + distance) + center[0];
    b[i + 1] = (b[i + 1] - center[1]) * (1 + distance) + center[1];

    if (stride === 3) {
      b[i + 2] = (b[i + 2] - center[1]) * (1 + distance) + center[2];
    }
  }

  return b;
}

export function center(myBuffer: TypedArray, stride: 2): v2.V2;
export function center(myBuffer: TypedArray, stride: 3): v3.V3;
export function center(myBuffer: TypedArray, stride: any) {
  return reduce<v3.V3 | v2.V2>(
    myBuffer,
    stride,
    (acc, point) => {
      if (stride === 3) {
        // some type hacking is necessary to avoid type errors going from [n, n] => [n, n, n]
        // but it's not an actual problem, as this path would always get a v3
        acc = v3.add(acc as v3.V3, point as unknown as v3.V3);
      } else {
        acc = v2.add(acc as v2.V2, point);
      }

      return acc;
    },
    v2.zero()
  );
}

type ISortingCallback<T> = (a: T, b: T) => number;

export function sort(
  myBuffer: TypedArray,
  stride: 2,
  callback: ISortingCallback<v2.V2>
): TypedArray;
export function sort(
  myBuffer: TypedArray,
  stride: 3,
  callback: ISortingCallback<v3.V3>
): TypedArray;
export function sort(myBuffer: TypedArray, stride: 2 | 3, callback: any) {
  // 1. make an array of the correct size
  const indices = Int16Array.from(
    { length: myBuffer.length / stride },
    (_, i) => i
  );

  // 2. sort the indices array
  indices.sort((a, b) => {
    const pa = myBuffer.slice(a * stride, a * stride + stride);
    const pb = myBuffer.slice(b * stride, b * stride + stride);

    return callback(pa, pb);
  });

  // 3. make a copy of the original array to fetch indices from
  const prevBuffer = myBuffer.slice(0);

  // 4. mutate the passed array
  for (let i = 0; i < indices.length; i++) {
    const j = indices[i];
    myBuffer.set(prevBuffer.slice(j * stride, j * stride + stride), i * 3);
  }

  return myBuffer;
}
