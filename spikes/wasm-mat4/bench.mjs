// Measures the wasm SIMD kernel against the current JS mat4.multiply.
// Run with: node bench.mjs
import { readFileSync } from 'node:fs';

const wasm = new WebAssembly.Instance(
  // sync instantiation, only legal on the main thread while the module stays under 4KB
  new WebAssembly.Module(readFileSync(new URL('./mat4.wasm', import.meta.url))),
  {},
);
const { memory, mul_batch, mul_broadcast, hierarchy, compose_batch } = wasm.exports;

// exact transcription of src/core/mat4.ts multiply
function jsMultiply(out, a, b) {
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7];
  const a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
  let b0=b[0],b1=b[1],b2=b[2],b3=b[3];
  out[0]=b0*a00+b1*a10+b2*a20+b3*a30; out[1]=b0*a01+b1*a11+b2*a21+b3*a31;
  out[2]=b0*a02+b1*a12+b2*a22+b3*a32; out[3]=b0*a03+b1*a13+b2*a23+b3*a33;
  b0=b[4];b1=b[5];b2=b[6];b3=b[7];
  out[4]=b0*a00+b1*a10+b2*a20+b3*a30; out[5]=b0*a01+b1*a11+b2*a21+b3*a31;
  out[6]=b0*a02+b1*a12+b2*a22+b3*a32; out[7]=b0*a03+b1*a13+b2*a23+b3*a33;
  b0=b[8];b1=b[9];b2=b[10];b3=b[11];
  out[8]=b0*a00+b1*a10+b2*a20+b3*a30; out[9]=b0*a01+b1*a11+b2*a21+b3*a31;
  out[10]=b0*a02+b1*a12+b2*a22+b3*a32; out[11]=b0*a03+b1*a13+b2*a23+b3*a33;
  b0=b[12];b1=b[13];b2=b[14];b3=b[15];
  out[12]=b0*a00+b1*a10+b2*a20+b3*a30; out[13]=b0*a01+b1*a11+b2*a21+b3*a31;
  out[14]=b0*a02+b1*a12+b2*a22+b3*a32; out[15]=b0*a03+b1*a13+b2*a23+b3*a33;
  return out;
}

const MAX = 16384;
const aPtr = 0;
const bPtr = MAX * 64;
const outPtr = MAX * 128;
const parentPtr = MAX * 192;

const heap = new Float32Array(memory.buffer);
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < MAX * 16; i++) {
  heap[i] = rnd() * 2 - 1;
  heap[MAX * 16 + i] = rnd() * 2 - 1;
}

// plain array mirrors of the same data, the layout the library uses today
const aArr = [], bArr = [], oArr = [];
for (let i = 0; i < MAX; i++) {
  const m = [], k = [];
  for (let j = 0; j < 16; j++) { m.push(heap[i * 16 + j]); k.push(heap[MAX * 16 + i * 16 + j]); }
  aArr.push(m); bArr.push(k); oArr.push(new Array(16).fill(0));
}

// ---- correctness ----
mul_batch(outPtr, aPtr, bPtr, MAX);
const scratch = new Array(16);
let maxErr = 0;
for (let i = 0; i < MAX; i++) {
  jsMultiply(scratch, aArr[i], bArr[i]);
  for (let j = 0; j < 16; j++)
    maxErr = Math.max(maxErr, Math.abs(scratch[j] - heap[outPtr / 4 + i * 16 + j]));
}
console.log(`max abs error vs JS f64: ${maxErr.toExponential(3)}  (pure f32 rounding)\n`);

// inner repetitions keep small N above timer resolution
function time(fn, inner, outer, warm) {
  for (let i = 0; i < warm; i++) fn();
  const t0 = process.hrtime.bigint();
  for (let o = 0; o < outer; o++) for (let i = 0; i < inner; i++) fn();
  return Number(process.hrtime.bigint() - t0) / (outer * inner);
}

console.log(`JS -> wasm call overhead: ${time(() => mul_batch(outPtr, aPtr, bPtr, 0), 1000, 200, 20000).toFixed(1)} ns\n`);

console.log('resident buffers, per frame');
console.log('      N      JS us    wasm us   speedup');
for (const N of [1, 16, 64, 256, 1024, 4096, 16384]) {
  const inner = N <= 64 ? 1000 : N <= 1024 ? 100 : 10;
  const outer = N <= 64 ? 200 : N <= 1024 ? 100 : 40;
  const js = time(() => { for (let i = 0; i < N; i++) jsMultiply(oArr[i], aArr[i], bArr[i]); }, inner, outer, 2000);
  const wa = time(() => mul_batch(outPtr, aPtr, bPtr, N), inner, outer, 2000);
  console.log(String(N).padStart(7), (js / 1000).toFixed(3).padStart(10),
    (wa / 1000).toFixed(3).padStart(10), `${(js / wa).toFixed(2)}x`.padStart(9));
}

// the cost that decides the whole design, marshalling plain arrays across the boundary
const N = 4096;
const marshal = time(() => {
  for (let i = 0; i < N; i++) {
    const ai = aArr[i], bi = bArr[i];
    for (let j = 0; j < 16; j++) { heap[i * 16 + j] = ai[j]; heap[MAX * 16 + i * 16 + j] = bi[j]; }
  }
  mul_batch(outPtr, aPtr, bPtr, N);
  for (let i = 0; i < N; i++) {
    const oi = oArr[i];
    for (let j = 0; j < 16; j++) oi[j] = heap[outPtr / 4 + i * 16 + j];
  }
}, 10, 40, 200);
const plain = time(() => { for (let i = 0; i < N; i++) jsMultiply(oArr[i], aArr[i], bArr[i]); }, 10, 40, 200);
console.log(`\nN=4096 with marshalling: ${(marshal / 1000).toFixed(1)}us vs JS ${(plain / 1000).toFixed(1)}us -> ${(plain / marshal).toFixed(2)}x`);

console.log('\nthree.js shaped workloads, N = 4096');
const parents = new Int32Array(memory.buffer, parentPtr, N);
parents[0] = -1;
for (let i = 1; i < N; i++) parents[i] = (i - 1) >> 2;
const parentArr = Array.from(parents);

const wH = time(() => hierarchy(outPtr, aPtr, parentPtr, N), 10, 40, 200);
const jH = time(() => {
  for (let i = 0; i < N; i++) {
    const p = parentArr[i];
    if (p < 0) { const o = oArr[i], a = aArr[i]; for (let j = 0; j < 16; j++) o[j] = a[j]; }
    else jsMultiply(oArr[i], oArr[p], aArr[i]);
  }
}, 10, 40, 200);
console.log(`hierarchy (updateMatrixWorld) JS ${(jH / 1000).toFixed(1)}us  wasm ${(wH / 1000).toFixed(1)}us  ${(jH / wH).toFixed(2)}x`);

const wB = time(() => mul_broadcast(outPtr, aPtr, bPtr, N), 10, 40, 200);
const jB = time(() => { for (let i = 0; i < N; i++) jsMultiply(oArr[i], aArr[0], bArr[i]); }, 10, 40, 200);
console.log(`broadcast (viewProj * world)  JS ${(jB / 1000).toFixed(1)}us  wasm ${(wB / 1000).toFixed(1)}us  ${(jB / wB).toFixed(2)}x`);

const wC = time(() => compose_batch(outPtr, parentPtr + 65536, parentPtr + 131072, parentPtr + 196608, N), 10, 40, 200);
console.log(`compose TRS (instancing)      wasm ${(wC / 1000).toFixed(1)}us  (${(wC / N).toFixed(2)} ns/instance)`);
