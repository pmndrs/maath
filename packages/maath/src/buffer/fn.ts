import * as buffer from ".";
import { curryRight, curry } from "lodash-es";

export const toVectorArray = curryRight(buffer.toVectorArray)
export const swizzleBuffer = curryRight(buffer.swizzleBuffer)
export const addAxis = curryRight(buffer.addAxis)
export const lerpBuffers = curryRight(buffer.lerpBuffers)
export const translateBuffer = curryRight(buffer.translateBuffer)
export const rotateBuffer = curryRight(buffer.rotateBuffer)