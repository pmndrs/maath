import type { Color, RColor } from './color';
import { linearToSrgb, srgbToLinear } from './colorspace';

/** A hue-saturation-lightness color: [h, s, l], all in [0, 1] (hue wraps). */
export type HSL = [hue: number, saturation: number, lightness: number];

/** A read-only HSL color */
export type RHSL = Readonly<HSL>;

/** Create a new HSL initialized to [0, 0, 0] (black). */
export function create(): HSL {
    return [0, 0, 0];
}

/** Create a new HSL with the given h, s, l values (all in [0, 1]). */
export function fromValues(h: number, s: number, l: number): HSL {
    return [h, s, l];
}

/** Create a new HSL that is a copy of `a`. */
export function clone(a: RHSL): HSL {
    return [a[0], a[1], a[2]];
}

/** Copy the values from `src` into `out`. Returns `out`. */
export function copy(out: HSL, src: RHSL): HSL {
    out[0] = src[0];
    out[1] = src[1];
    out[2] = src[2];
    return out;
}

/** Set the h, s, l components of `out` directly. Returns `out`. */
export function set(out: HSL, h: number, s: number, l: number): HSL {
    out[0] = h;
    out[1] = s;
    out[2] = l;
    return out;
}

/** Write the HSL of a linear Color into `out`. Returns `out`. */
export function fromColor(out: HSL, c: RColor): HSL {
    // linear -> sRGB gamma; HSL is defined on gamma-encoded sRGB
    const r = linearToSrgb(c[0]);
    const g = linearToSrgb(c[1]);
    const b = linearToSrgb(c[2]);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }

    out[0] = h;
    out[1] = s;
    out[2] = l;
    return out;
}

/** Write the linear Color of an HSL into `out`. Returns `out`. */
export function toColor(out: Color, a: RHSL): Color {
    const h = a[0];
    const s = a[1];
    const l = a[2];

    if (s === 0) {
        const v = srgbToLinear(l);
        out[0] = v;
        out[1] = v;
        out[2] = v;
        return out;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    out[0] = srgbToLinear(hue(p, q, h + 1 / 3));
    out[1] = srgbToLinear(hue(p, q, h));
    out[2] = srgbToLinear(hue(p, q, h - 1 / 3));
    return out;
}

/**
 * Interpolate from `a` to `b` by `t` into `out`, taking the shortest path around
 * the hue wheel (so e.g. 350°→10° passes through 0°, not all the way back).
 * Returns `out`.
 */
export function lerp(out: HSL, a: RHSL, b: RHSL, t: number): HSL {
    let dh = b[0] - a[0];
    if (dh > 0.5) dh -= 1;
    else if (dh < -0.5) dh += 1;

    let h = a[0] + dh * t;
    h -= Math.floor(h); // wrap into [0, 1)

    out[0] = h;
    out[1] = a[1] + (b[1] - a[1]) * t;
    out[2] = a[2] + (b[2] - a[2]) * t;
    return out;
}

/**
 * Offset `a` by (dh, ds, dl) into `out`: hue wraps into [0, 1), saturation and
 * lightness are clamped to [0, 1]. Returns `out`.
 */
export function offset(out: HSL, a: RHSL, dh: number, ds: number, dl: number): HSL {
    let h = a[0] + dh;
    h -= Math.floor(h);
    out[0] = h;
    out[1] = clamp01(a[1] + ds);
    out[2] = clamp01(a[2] + dl);
    return out;
}

function clamp01(x: number): number {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}

function hue(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}
