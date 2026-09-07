// Shows the intended shape, a flat array of matrices resident in wasm memory.
import { createMat4Wasm } from './mat4.mjs';

const N = 4096;
const wasm = createMat4Wasm(N * 4);
console.log('simd supported:', wasm.supported);

// the skill's caller owned state pattern, with the allocation source swapped
const local = wasm.allocMat4(N);
const world = wasm.allocMat4(N);
const parent = wasm.allocIndex(N);
const pos = wasm.allocFloat(N, 3);
const rot = wasm.allocFloat(N, 4);
const scl = wasm.allocFloat(N, 3);

parent[0] = -1;
for (let i = 1; i < N; i++) parent[i] = (i - 1) >> 2;
for (let i = 0; i < N; i++) {
    pos[i * 3] = i * 0.01; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
    rot[i * 4] = 0; rot[i * 4 + 1] = 0; rot[i * 4 + 2] = 0; rot[i * 4 + 3] = 1;
    scl[i * 3] = 1; scl[i * 3 + 1] = 1; scl[i * 3 + 2] = 1;
}

// a frame: compose every local, then propagate down the tree
wasm.compose(local, pos, rot, scl);
wasm.hierarchy(world, local, parent);

// translations accumulate down the chain, so child 1 sits at parent 0 plus its own
console.log('node 0 translation:', Array.from(world.subarray(12, 15)));
console.log('node 1 translation:', Array.from(world.subarray(16 + 12, 16 + 15)));
console.log('node 5 translation:', Array.from(world.subarray(5 * 16 + 12, 5 * 16 + 15)));

// a foreign array is rejected rather than silently misread
try { wasm.multiply(new Float32Array(N * 16), local, local); }
catch (e) { console.log('foreign buffer rejected:', e.message); }
