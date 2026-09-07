#include <wasm_simd128.h>
#define EXPORT __attribute__((visibility("default")))
#define BC(v, l) wasm_i32x4_shuffle(v, v, l, l, l, l)

// v1: serial add chain, what the spike shipped
EXPORT void v1(float *out, const float *a, const float *b, int n) {
    for (int i = 0; i < n; i++) {
        const float *A = a + i*16, *B = b + i*16; float *O = out + i*16;
        v128_t a0 = wasm_v128_load(A), a1 = wasm_v128_load(A+4);
        v128_t a2 = wasm_v128_load(A+8), a3 = wasm_v128_load(A+12);
        for (int j = 0; j < 4; j++) {
            v128_t bj = wasm_v128_load(B + j*4);
            v128_t r = wasm_f32x4_mul(a0, BC(bj,0));
            r = wasm_f32x4_add(r, wasm_f32x4_mul(a1, BC(bj,1)));
            r = wasm_f32x4_add(r, wasm_f32x4_mul(a2, BC(bj,2)));
            r = wasm_f32x4_add(r, wasm_f32x4_mul(a3, BC(bj,3)));
            wasm_v128_store(O + j*4, r);
        }
    }
}

// v2: tree reduction, 2 dependent adds instead of 3
EXPORT void v2(float *out, const float *a, const float *b, int n) {
    for (int i = 0; i < n; i++) {
        const float *A = a + i*16, *B = b + i*16; float *O = out + i*16;
        v128_t a0 = wasm_v128_load(A), a1 = wasm_v128_load(A+4);
        v128_t a2 = wasm_v128_load(A+8), a3 = wasm_v128_load(A+12);
        for (int j = 0; j < 4; j++) {
            v128_t bj = wasm_v128_load(B + j*4);
            v128_t lo = wasm_f32x4_add(wasm_f32x4_mul(a0, BC(bj,0)), wasm_f32x4_mul(a1, BC(bj,1)));
            v128_t hi = wasm_f32x4_add(wasm_f32x4_mul(a2, BC(bj,2)), wasm_f32x4_mul(a3, BC(bj,3)));
            wasm_v128_store(O + j*4, wasm_f32x4_add(lo, hi));
        }
    }
}

// v3: tree reduction, two matrices per iteration for more ILP
EXPORT void v3(float *out, const float *a, const float *b, int n) {
    int i = 0;
    for (; i + 1 < n; i += 2) {
        for (int k = 0; k < 2; k++) {
            const float *A = a + (i+k)*16, *B = b + (i+k)*16; float *O = out + (i+k)*16;
            v128_t a0 = wasm_v128_load(A), a1 = wasm_v128_load(A+4);
            v128_t a2 = wasm_v128_load(A+8), a3 = wasm_v128_load(A+12);
            for (int j = 0; j < 4; j++) {
                v128_t bj = wasm_v128_load(B + j*4);
                v128_t lo = wasm_f32x4_add(wasm_f32x4_mul(a0, BC(bj,0)), wasm_f32x4_mul(a1, BC(bj,1)));
                v128_t hi = wasm_f32x4_add(wasm_f32x4_mul(a2, BC(bj,2)), wasm_f32x4_mul(a3, BC(bj,3)));
                wasm_v128_store(O + j*4, wasm_f32x4_add(lo, hi));
            }
        }
    }
    for (; i < n; i++) v2(out + i*16, a + i*16, b + i*16, 1);
}

// v4: SoA reference, 16 planes of n floats, 4 matrices per iteration, no shuffles
// not a drop in, different layout, measured only to price the shuffles
EXPORT void v4(float *out, const float *a, const float *b, int n) {
    for (int i = 0; i < n; i += 4) {
        for (int c = 0; c < 4; c++) {
            for (int r = 0; r < 4; r++) {
                v128_t acc = wasm_f32x4_splat(0);
                for (int k = 0; k < 4; k++)
                    acc = wasm_f32x4_add(acc, wasm_f32x4_mul(
                        wasm_v128_load(a + (k*4 + r)*n + i),
                        wasm_v128_load(b + (c*4 + k)*n + i)));
                wasm_v128_store(out + (c*4 + r)*n + i, acc);
            }
        }
    }
}
