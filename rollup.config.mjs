import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

// `preserveModules` keeps the source module graph intact so `export * as ns`
// stays a native namespace re-export instead of being materialised into a
// getter-based namespace object (which taxes hot-loop calls like
// `mat4.multiply`). All entry points are fed in so every subtree — the root and
// the /shapes, /geometry, /time, /random, /noise, /color, /ik subpaths — is emitted.
//
// Declarations are handled separately by `build:dts` (tsc), unchanged.
export default {
    input: [
        './src/index.ts',
        './src/shapes/index.ts',
        './src/geometry/index.ts',
        './src/time/index.ts',
        './src/random/index.ts',
        './src/noise/index.ts',
        './src/color/index.ts',
        './src/ik/index.ts',
    ],
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: true,
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: 'src',
    },
    plugins: [
        nodeResolve(),
        typescript({
            tsconfig: './tsconfig.json',
            compilerOptions: {
                declaration: false,
                emitDeclarationOnly: false,
                declarationDir: undefined,
                noEmit: false,
                outDir: 'dist',
                rootDir: 'src',
            },
        }),
    ],
};
