import type { TypedArray } from "./ctypes";
import { Vector2, Vector3 } from "three";

/**
 * Helpers for converting buffers to and from Three.js objects
 */

export function bufferToVectors(buffer: TypedArray, stride: 3): Vector3[];
export function bufferToVectors(buffer: TypedArray, stride: 2): Vector2[];
/**
 * Convents passed buffer of passed stride to an array of vectors with the correct length.
 * 
 * @param buffer 
 * @param stride 
 * @returns 
 */
export function bufferToVectors(buffer: TypedArray, stride = 3) {
  const p = [];

  for (let i = 0, j = 0; i < buffer.length; i += stride, j++) {
    if (stride === 3) {
      p[j] = new Vector3(buffer[i], buffer[i + 1], buffer[i + 2]);
    } else {
      p[j] = new Vector2(buffer[i], buffer[i + 1]);
    }
  }

  return p;
}

/**
 * Transforms a passed Vector2 or Vector3 array to a points buffer
 * 
 * @param vectorArray 
 * @returns 
 */
export function vectorsToBuffer(vectorArray: Vector2[] | Vector3[]) {
  const l = vectorArray.length;
  const stride = vectorArray[0].hasOwnProperty("z") ? 3 : 2;
  const buffer = new Float32Array(l * stride);

  for (let i = 0; i < l; i++) {
    let j = i * stride;

    buffer[j] = vectorArray[i].x;
    buffer[j + 1] = vectorArray[i].y;

    if (stride === 3) {
      buffer[j + 2] = (vectorArray[i] as Vector3).z;
    }
  }

  return buffer;
}
