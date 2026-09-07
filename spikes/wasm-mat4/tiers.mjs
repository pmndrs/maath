import { readFileSync } from 'node:fs';
const inst = new WebAssembly.Instance(new WebAssembly.Module(
  readFileSync(new URL('./mat4.wasm', import.meta.url))), {});
const { memory, mul_batch } = inst.exports;

const N = 4096, LEN = N * 16;
const heap = new Float32Array(memory.buffer);
const aPtr = 0, bPtr = LEN, outPtr = LEN * 2;          // element offsets

let s = 7; const rnd = () => ((s = (s*1664525+1013904223)>>>0) / 4294967296);
for (let i = 0; i < LEN * 2; i++) heap[i] = rnd() * 2 - 1;

// tier 2: caller allocated Float32Array, its own ArrayBuffer, not wasm memory
const userA = new Float32Array(heap.subarray(aPtr, aPtr + LEN));
const userB = new Float32Array(heap.subarray(bPtr, bPtr + LEN));
const userOut = new Float32Array(LEN);

// tier 3: views onto wasm memory, zero copy
const viewA = heap.subarray(aPtr, aPtr + LEN);
const viewOut = heap.subarray(outPtr, outPtr + LEN);

function time(fn, inner, outer, warm) {
  for (let i = 0; i < warm; i++) fn();
  const t0 = process.hrtime.bigint();
  for (let o = 0; o < outer; o++) for (let i = 0; i < inner; i++) fn();
  return Number(process.hrtime.bigint() - t0) / (outer * inner);
}

const kernel = time(() => mul_batch(outPtr*4, aPtr*4, bPtr*4, N), 10, 100, 500);
const tier2 = time(() => {
  heap.set(userA, aPtr);
  heap.set(userB, bPtr);
  mul_batch(outPtr*4, aPtr*4, bPtr*4, N);
  userOut.set(heap.subarray(outPtr, outPtr + LEN));
}, 10, 100, 500);
const copyOnly = time(() => {
  heap.set(userA, aPtr);
  heap.set(userB, bPtr);
  userOut.set(heap.subarray(outPtr, outPtr + LEN));
}, 10, 100, 500);

console.log(`N=4096, 768KB moved per frame for the bulk copy path\n`);
console.log(`tier 3  wasm resident, zero copy      ${(kernel/1000).toFixed(1).padStart(6)} us`);
console.log(`tier 2  own Float32Array, bulk .set() ${(tier2/1000).toFixed(1).padStart(6)} us   (copy alone ${(copyOnly/1000).toFixed(1)} us)`);
console.log(`\nbulk copy overhead: ${((tier2/kernel - 1)*100).toFixed(0)}% on top of the kernel`);
console.log(`JS baseline was 87.6us, so tier 2 = ${(87.6/(tier2/1000)).toFixed(2)}x, tier 3 = ${(87.6/(kernel/1000)).toFixed(2)}x`);

// does a view onto wasm memory cost JS anything vs a normal Float32Array?
const sum = buf => { let t = 0; for (let i = 0; i < LEN; i++) t += buf[i]; return t; };
const scale = buf => { for (let i = 0; i < LEN; i++) buf[i] *= 1.0000001; };
console.log(`\nJS touching the buffer, wasm-memory view vs own ArrayBuffer:`);
console.log(`  read   own ${(time(() => sum(userA), 10, 100, 2000)/1000).toFixed(1)}us   wasm-view ${(time(() => sum(viewA), 10, 100, 2000)/1000).toFixed(1)}us`);
console.log(`  write  own ${(time(() => scale(userOut), 10, 100, 2000)/1000).toFixed(1)}us   wasm-view ${(time(() => scale(viewOut), 10, 100, 2000)/1000).toFixed(1)}us`);
