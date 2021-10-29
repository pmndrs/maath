export type TypedArray = Float32Array | Float64Array;

export type MyVector2 = number[]; // fun fact, I think three's types aren't updated, vectors SHOULD be iterable in latest

export type Triangle = [MyVector2, MyVector2, MyVector2]