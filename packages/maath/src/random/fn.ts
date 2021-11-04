import * as buffer from ".";
import { curry, curryRight } from "lodash-es";

export const onCircle = curryRight(buffer.onCircle)
export const onSphere = curryRight(buffer.onSphere)

export const inBox = curryRight(buffer.inBox)