import { linearToSrgb, srgbToLinear } from './colorspace';

export * from './parse';

/** A linear-sRGB color: [r, g, b] floats in [0, 1]. */
export type Color = [r: number, g: number, b: number];

/** A read-only linear sRGB color */
export type RColor = Readonly<Color>;

/** Accepted input types for creating or parsing a Color. */
export type ColorInput =
    | string // '#f00', '#ff0000', 'red', 'rgb(255,0,0)', 'hsl(0,100%,50%)'
    | number // 0xff0000 integer (sRGB gamma)
    | [number, number, number]; // [r, g, b] linear floats [0, 1]

/** Create a new Color initialized to black [0, 0, 0]. */
export function create(): Color {
    return [0, 0, 0];
}

/** Create a new Color with the given linear r, g, b values. */
export function fromValues(r: number, g: number, b: number): Color {
    return [r, g, b];
}

/** Create a new Color that is a copy of `c`. */
export function clone(c: RColor): Color {
    return [c[0], c[1], c[2]];
}

/** Copy the values from `src` into `out`. Returns `out`. */
export function copy(out: Color, src: RColor): Color {
    out[0] = src[0];
    out[1] = src[1];
    out[2] = src[2];
    return out;
}

/** Set the linear r, g, b components of `out` directly. Returns `out`. */
export function set(out: Color, r: number, g: number, b: number): Color {
    out[0] = r;
    out[1] = g;
    out[2] = b;
    return out;
}

/** Set all three channels of `out` to the same linear value `s` (a gray). Returns `out`. */
export function setScalar(out: Color, s: number): Color {
    out[0] = s;
    out[1] = s;
    out[2] = s;
    return out;
}

/**
 * Set `out` from an sRGB gamma-encoded [r, g, b] array with values in [0, 1].
 * Converts from sRGB gamma space to linear. Returns `out`.
 */
export function setFromSRGB(out: Color, srgb: readonly [number, number, number]): Color {
    out[0] = srgbToLinear(srgb[0]);
    out[1] = srgbToLinear(srgb[1]);
    out[2] = srgbToLinear(srgb[2]);
    return out;
}

/** Create a new Color from an sRGB gamma-encoded [r, g, b] array with values in [0, 1]. */
export function fromSRGB(srgb: readonly [number, number, number]): Color {
    return setFromSRGB(create(), srgb);
}

/** Write the sRGB gamma-encoded [r, g, b] of a linear Color into `out` (values [0, 1]). */
export function toSRGB(out: [number, number, number], c: RColor): [number, number, number] {
    out[0] = linearToSrgb(c[0]);
    out[1] = linearToSrgb(c[1]);
    out[2] = linearToSrgb(c[2]);
    return out;
}

/** Create a CSS `rgb(...)` string in sRGB gamma space (for HTML/canvas use). */
export function toCSS(c: RColor): string {
    return `rgb(${to255(c[0])}, ${to255(c[1])}, ${to255(c[2])})`;
}

/** Convert to a 0xRRGGBB integer in sRGB gamma space. */
export function toHex(c: RColor): number {
    return (to255(c[0]) << 16) | (to255(c[1]) << 8) | to255(c[2]);
}

/** Convert to a 6-digit sRGB hex string without a leading '#', e.g. 'ff8800'. */
export function toHexString(c: RColor): string {
    return toHex(c).toString(16).padStart(6, '0');
}

/** Add `a + b` component-wise into `out`. Returns `out`. */
export function add(out: Color, a: RColor, b: RColor): Color {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
}

/** Add scalar `s` to each channel of `a` into `out`. Returns `out`. */
export function addScalar(out: Color, a: RColor, s: number): Color {
    out[0] = a[0] + s;
    out[1] = a[1] + s;
    out[2] = a[2] + s;
    return out;
}

/** Subtract `a - b` component-wise into `out`. Returns `out`. */
export function sub(out: Color, a: RColor, b: RColor): Color {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
}

/** Multiply `a * b` component-wise into `out` (tinting). Returns `out`. */
export function multiply(out: Color, a: RColor, b: RColor): Color {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
}

/** Scale each channel of `a` by `s` into `out` (brightness). Returns `out`. */
export function multiplyScalar(out: Color, a: RColor, s: number): Color {
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
}

/** Linearly interpolate from `a` to `b` by `t` into `out` (physically-correct blend). Returns `out`. */
export function lerp(out: Color, a: RColor, b: RColor, t: number): Color {
    out[0] = a[0] + (b[0] - a[0]) * t;
    out[1] = a[1] + (b[1] - a[1]) * t;
    out[2] = a[2] + (b[2] - a[2]) * t;
    return out;
}

/** Clamp each channel of `c` to [0, 1] into `out`. Returns `out`. */
export function clamp(out: Color, c: RColor): Color {
    out[0] = clamp01(c[0]);
    out[1] = clamp01(c[1]);
    out[2] = clamp01(c[2]);
    return out;
}

/** Whether `a` and `b` are equal, within an optional per-channel `epsilon` (default exact). */
export function equals(a: RColor, b: RColor, epsilon = 0): boolean {
    return Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon && Math.abs(a[2] - b[2]) <= epsilon;
}

/** Relative luminance in [0, 1] (Rec. 709 weights, on linear light). */
export function luminance(c: RColor): number {
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function clamp01(x: number): number {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** linear channel -> clamped sRGB byte [0, 255]. */
function to255(c: number): number {
    return Math.max(0, Math.min(255, Math.round(linearToSrgb(c) * 255)));
}
