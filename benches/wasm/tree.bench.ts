import { assert, bench, group } from "@pmndrs/labs";
import * as mat4 from "../../src/core/mat4";
import type { Mat4 } from "../../src/core/mat4";
import { createScalarTree } from "../../spikes/wasm-mat4/scalar.mjs";
import { createTree, fmaSupported } from "../../spikes/wasm-mat4/tree.mjs";

// Tree matrix multiply, world[i] = world[parent[i]] * local[i] over a 4-ary
// scene graph. Every comparator lives in this one file so labs interleaves
// their blocks and environmental drift hits all of them equally.

const N = 4096;

// 4-ary tree, parents always preceding children
function parents(n: number): Int32Array {
    const p = new Int32Array(n);
    p[0] = -1;
    for (let i = 1; i < n; i++) p[i] = (i - 1) >> 2;
    return p;
}

// well conditioned transforms, a rotation about z plus a translation
function locals(n: number): number[][] {
    let s = 7;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const out: number[][] = [];
    for (let i = 0; i < n; i++) {
        const a = rnd() * 6.283;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        out.push([c, sn, 0, 0, -sn, c, 0, 0, 0, 0, 1, 0, rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1, 1]);
    }
    return out;
}

// f64 reference over plain arrays, used to check every kernel
function reference(n: number): number[][] {
    const par = parents(n);
    const loc = locals(n);
    const world: number[][] = [];
    for (let i = 0; i < n; i++) {
        const w = mat4.create();
        if (par[i] < 0) mat4.copy(w, loc[i] as Mat4);
        else mat4.multiply(w, world[par[i]] as Mat4, loc[i] as Mat4);
        world.push(w);
    }
    return world;
}

// max relative difference against the reference, so f32 rounding reads sanely
function drift(got: (i: number, j: number) => number, n: number): number {
    const ref = reference(n);
    let d = 0;
    for (let i = 0; i < n; i++)
        for (let j = 0; j < 16; j++) {
            const r = ref[i][j];
            d = Math.max(d, Math.abs(r - got(i, j)) / Math.max(1, Math.abs(r)));
        }
    return d;
}

function checksum(read: (i: number, j: number) => number, n: number): number {
    let sum = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < 16; j++) sum += read(i, j) * (1 + ((i + j) & 7));
    return sum;
}

group(`tree matrix multiply ${N} @wasm @tree`, () => {
    bench("js plain arrays", function* () {
        const par = parents(N);
        const loc = locals(N) as Mat4[];
        const world: Mat4[] = [];
        for (let i = 0; i < N; i++) world.push(mat4.create());

        // labs runs a snapshot outside the timed work, so the checksum it digests
        // does not enter the measurement
        const sum = yield {
            bench: () => {
                for (let i = 0; i < N; i++) {
                    if (par[i] < 0) mat4.copy(world[i], loc[i]);
                    else mat4.multiply(world[i], world[par[i]], loc[i]);
                }
            },
            snapshot: () => checksum((i, j) => world[i][j], N),
        };

        assert(drift((i, j) => world[i][j], N) < 1e-12, "js plain must match the f64 reference");
        return sum;
    });

    bench("js flat f32", function* () {
        const par = parents(N);
        const loc = locals(N);
        const local = new Float32Array(N * 16);
        for (let i = 0; i < N; i++) local.set(loc[i], i * 16);
        const world = new Float32Array(N * 16);

        const sum = yield {
            bench: () => {
            for (let i = 0; i < N; i++) {
                const p = par[i];
                const o = i * 16;
                if (p < 0) {
                    for (let j = 0; j < 16; j++) world[o + j] = local[o + j];
                    continue;
                }
                const P = p * 16;
                const a00=world[P],a01=world[P+1],a02=world[P+2],a03=world[P+3];
                const a10=world[P+4],a11=world[P+5],a12=world[P+6],a13=world[P+7];
                const a20=world[P+8],a21=world[P+9],a22=world[P+10],a23=world[P+11];
                const a30=world[P+12],a31=world[P+13],a32=world[P+14],a33=world[P+15];
                for (let j = 0; j < 4; j++) {
                    const b0=local[o+j*4],b1=local[o+j*4+1],b2=local[o+j*4+2],b3=local[o+j*4+3];
                    world[o+j*4]=b0*a00+b1*a10+b2*a20+b3*a30;
                    world[o+j*4+1]=b0*a01+b1*a11+b2*a21+b3*a31;
                    world[o+j*4+2]=b0*a02+b1*a12+b2*a22+b3*a32;
                    world[o+j*4+3]=b0*a03+b1*a13+b2*a23+b3*a33;
                }
            }
            },
            snapshot: () => checksum((i, j) => world[i * 16 + j], N),
        };

        assert(drift((i, j) => world[i * 16 + j], N) < 1e-5, "js flat must match within f32 rounding");
        return sum;
    });

    // prices the flat layout on its own, so the SIMD contribution is separable
    bench("wasm scalar", function* () {
        const tree = createScalarTree(N);
        tree.parent.set(parents(N));
        const loc = locals(N);
        for (let i = 0; i < N; i++) tree.local.set(loc[i], i * 16);

        const sum = yield {
            bench: () => { tree.update(); },
            snapshot: () => checksum((i, j) => tree.world[i * 16 + j], N),
        };

        assert(drift((i, j) => tree.world[i * 16 + j], N) < 1e-5, "wasm scalar must match within f32 rounding");
        return sum;
    });

    bench("wasm simd", function* () {
        const tree = createTree(N);
        tree.parent.set(parents(N));
        const loc = locals(N);
        for (let i = 0; i < N; i++) tree.local.set(loc[i], i * 16);

        const sum = yield {
            bench: () => { tree.update(); },
            snapshot: () => checksum((i, j) => tree.world[i * 16 + j], N),
        };

        assert(drift((i, j) => tree.world[i * 16 + j], N) < 1e-5, "wasm simd must match within f32 rounding");
        return sum;
    });

    if (fmaSupported()) {
        bench("wasm simd fma", function* () {
            const tree = createTree(N, { fma: true });
            tree.parent.set(parents(N));
            const loc = locals(N);
            for (let i = 0; i < N; i++) tree.local.set(loc[i], i * 16);

            const sum = yield {
                bench: () => { tree.update(); },
                snapshot: () => checksum((i, j) => tree.world[i * 16 + j], N),
            };

            assert(drift((i, j) => tree.world[i * 16 + j], N) < 1e-5, "wasm fma must match within f32 rounding");
            return sum;
        });
    }
});
