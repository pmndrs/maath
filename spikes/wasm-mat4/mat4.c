#include <wasm_simd128.h>

#define EXPORT __attribute__((visibility("default")))

// broadcast lane l of v across all four lanes
#define BC(v, l) wasm_i32x4_shuffle(v, v, l, l, l, l)

// column major 4x4, out_col_j = sum_k a_col_k * b[j*4+k]
static inline void mul4(float *out, const float *a, const float *b) {
    v128_t a0 = wasm_v128_load(a);
    v128_t a1 = wasm_v128_load(a + 4);
    v128_t a2 = wasm_v128_load(a + 8);
    v128_t a3 = wasm_v128_load(a + 12);

    // tree reduction, two dependent adds rather than three
    for (int j = 0; j < 4; j++) {
        v128_t bj = wasm_v128_load(b + j * 4);
        v128_t lo = wasm_f32x4_add(wasm_f32x4_mul(a0, BC(bj, 0)), wasm_f32x4_mul(a1, BC(bj, 1)));
        v128_t hi = wasm_f32x4_add(wasm_f32x4_mul(a2, BC(bj, 2)), wasm_f32x4_mul(a3, BC(bj, 3)));
        wasm_v128_store(out + j * 4, wasm_f32x4_add(lo, hi));
    }
}

// n pairwise multiplies
EXPORT void mul_batch(float *out, const float *a, const float *b, int n) {
    for (int i = 0; i < n; i++) mul4(out + i * 16, a + i * 16, b + i * 16);
}

// one matrix times n matrices, the viewProjection * world workload
EXPORT void mul_broadcast(float *out, const float *m, const float *a, int n) {
    v128_t m0 = wasm_v128_load(m);
    v128_t m1 = wasm_v128_load(m + 4);
    v128_t m2 = wasm_v128_load(m + 8);
    v128_t m3 = wasm_v128_load(m + 12);

    for (int i = 0; i < n; i++) {
        const float *a_i = a + i * 16;
        float *o = out + i * 16;
        for (int j = 0; j < 4; j++) {
            v128_t aj = wasm_v128_load(a_i + j * 4);
            v128_t lo = wasm_f32x4_add(wasm_f32x4_mul(m0, BC(aj, 0)), wasm_f32x4_mul(m1, BC(aj, 1)));
            v128_t hi = wasm_f32x4_add(wasm_f32x4_mul(m2, BC(aj, 2)), wasm_f32x4_mul(m3, BC(aj, 3)));
            wasm_v128_store(o + j * 4, wasm_f32x4_add(lo, hi));
        }
    }
}

// scene graph propagation, parents must precede children
EXPORT void hierarchy(float *world, const float *local, const int *parent, int n) {
    for (int i = 0; i < n; i++) {
        int p = parent[i];
        if (p < 0) {
            for (int j = 0; j < 4; j++)
                wasm_v128_store(world + i * 16 + j * 4, wasm_v128_load(local + i * 16 + j * 4));
        } else {
            mul4(world + i * 16, world + p * 16, local + i * 16);
        }
    }
}

// TRS compose from position, quaternion, scale, the instancing workload
EXPORT void compose_batch(float *out, const float *pos, const float *quat, const float *scale, int n) {
    for (int i = 0; i < n; i++) {
        float x = quat[i * 4], y = quat[i * 4 + 1], z = quat[i * 4 + 2], w = quat[i * 4 + 3];
        float x2 = x + x, y2 = y + y, z2 = z + z;
        float xx = x * x2, xy = x * y2, xz = x * z2;
        float yy = y * y2, yz = y * z2, zz = z * z2;
        float wx = w * x2, wy = w * y2, wz = w * z2;
        float sx = scale[i * 3], sy = scale[i * 3 + 1], sz = scale[i * 3 + 2];

        float *o = out + i * 16;
        wasm_v128_store(o, wasm_f32x4_mul(wasm_f32x4_make(1 - (yy + zz), xy + wz, xz - wy, 0), wasm_f32x4_splat(sx)));
        wasm_v128_store(o + 4, wasm_f32x4_mul(wasm_f32x4_make(xy - wz, 1 - (xx + zz), yz + wx, 0), wasm_f32x4_splat(sy)));
        wasm_v128_store(o + 8, wasm_f32x4_mul(wasm_f32x4_make(xz + wy, yz - wx, 1 - (xx + yy), 0), wasm_f32x4_splat(sz)));
        wasm_v128_store(o + 12, wasm_f32x4_make(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], 1));
    }
}
