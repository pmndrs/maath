#include <wasm_simd128.h>

#define EXPORT __attribute__((visibility("default")))

// broadcast lane l of v across all four lanes
#define BC(v, l) wasm_i32x4_shuffle(v, v, l, l, l, l)

// Relaxed madd fuses the multiply and add into a single operation. Engines are
// free to fuse or not, so the same input gives slightly different results on
// different engines, which is why this build is opt in.
#ifdef USE_FMA
#define MADD(acc, x, y) __builtin_wasm_relaxed_madd_f32x4(x, y, acc)
#else
#define MADD(acc, x, y) wasm_f32x4_add(acc, wasm_f32x4_mul(x, y))
#endif

/*
 * world[i] = world[parent[i]] * local[i], with a negative parent meaning root.
 *
 * Parents must precede children, so one forward pass resolves the whole tree.
 * An index that does not satisfy 0 <= parent[i] < i is treated as a root, which
 * keeps every read inside the buffer whatever the caller passes.
 * Column major, so out column j is the sum over k of parent column k scaled by
 * local[j * 4 + k].
 *
 * world may not overlap local or parent. Reading world[p] while writing
 * world[i] is fine, since p is always less than i.
 */
EXPORT void tree(float *world, const float *local, const int *parent, int n) {
    for (int i = 0; i < n; i++) {
        unsigned p = (unsigned)parent[i];
        const float *L = local + i * 16;
        float *W = world + i * 16;

        // one unsigned compare rejects a root (negative), a forward reference and
        // an out of range index at once. Anything invalid is treated as a root,
        // so p < i < n always holds below and the read cannot leave the buffer.
        if (p >= (unsigned)i) {
            for (int j = 0; j < 4; j++) wasm_v128_store(W + j * 4, wasm_v128_load(L + j * 4));
            continue;
        }

        const float *P = world + p * 16;
        v128_t a0 = wasm_v128_load(P);
        v128_t a1 = wasm_v128_load(P + 4);
        v128_t a2 = wasm_v128_load(P + 8);
        v128_t a3 = wasm_v128_load(P + 12);

        for (int j = 0; j < 4; j++) {
            v128_t bj = wasm_v128_load(L + j * 4);
            v128_t r = wasm_f32x4_mul(a0, BC(bj, 0));
            r = MADD(r, a1, BC(bj, 1));
            r = MADD(r, a2, BC(bj, 2));
            r = MADD(r, a3, BC(bj, 3));
            wasm_v128_store(W + j * 4, r);
        }
    }
}
