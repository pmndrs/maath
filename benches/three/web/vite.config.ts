import { defineConfig } from 'vite';

// Cross-origin isolation gives performance.now() 5 µs resolution instead of 100 µs.
export default defineConfig({
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
});
