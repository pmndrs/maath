import { Vector2 } from "three";

export type TypedArray = Float32Array | Float64Array;

// fun fact, I think three's types aren't updated, vectors SHOULD be iterable in latest
export type MyVector2 = number[];
export type MyVector3 = number[];

export type Triangle = [MyVector2, MyVector2, MyVector2] | Vector2[];
