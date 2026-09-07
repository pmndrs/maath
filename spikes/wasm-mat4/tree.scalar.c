// Scalar twin of tree.c, built only to price the flat layout separately from
// SIMD. Not shipped, and not part of the interface.
#define EXPORT __attribute__((visibility("default")))

EXPORT void tree(float *world, const float *local, const int *parent, int n) {
    for (int i = 0; i < n; i++) {
        int p = parent[i];
        const float *L = local + i * 16;
        float *W = world + i * 16;
        if (p < 0) {
            for (int j = 0; j < 16; j++) W[j] = L[j];
            continue;
        }
        const float *P = world + p * 16;
        for (int j = 0; j < 4; j++) {
            float b0 = L[j*4], b1 = L[j*4+1], b2 = L[j*4+2], b3 = L[j*4+3];
            for (int r = 0; r < 4; r++)
                W[j*4+r] = b0*P[r] + b1*P[4+r] + b2*P[8+r] + b3*P[12+r];
        }
    }
}
