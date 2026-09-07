import { readFileSync } from 'node:fs';
const e = new WebAssembly.Instance(new WebAssembly.Module(
  readFileSync(new URL('./variants.wasm', import.meta.url))), {}).exports;
const { memory, v1, v2, v3, v4 } = e;

const N = 4096, LEN = N * 16;
const h = new Float32Array(memory.buffer);
const aPtr = 0, bPtr = LEN, outPtr = LEN * 2;
let s = 7; const rnd = () => ((s = (s*1664525+1013904223)>>>0) / 4294967296);
for (let i = 0; i < LEN * 2; i++) h[i] = rnd() * 2 - 1;

// SoA copies of the same data, plane p element i at (p*N + i)
const soaA = LEN * 3, soaB = LEN * 4, soaOut = LEN * 5;
for (let i = 0; i < N; i++) for (let p = 0; p < 16; p++) {
  h[soaA + p*N + i] = h[aPtr + i*16 + p];
  h[soaB + p*N + i] = h[bPtr + i*16 + p];
}

// min of many trials, the robust estimator for this kind of microbenchmark
function time(fn, inner, outer, warm) {
  for (let i = 0; i < warm; i++) fn();
  let best = Infinity;
  for (let o = 0; o < outer; o++) {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < inner; i++) fn();
    const dt = Number(process.hrtime.bigint() - t0) / inner;
    if (dt < best) best = dt;
  }
  return best;
}

// correctness: v2 and v3 must match v1 bit for bit is too strong, tree reorders adds
v1(outPtr*4, aPtr*4, bPtr*4, N);
const ref = Float32Array.from(h.subarray(outPtr, outPtr + LEN));
const check = (fn, name) => {
  h.fill(0, outPtr, outPtr + LEN);
  fn(outPtr*4, aPtr*4, bPtr*4, N);
  let m = 0;
  for (let i = 0; i < LEN; i++) m = Math.max(m, Math.abs(ref[i] - h[outPtr + i]));
  console.log(`  ${name} max delta vs v1: ${m.toExponential(2)}`);
};
console.log('correctness');
check(v2, 'v2'); check(v3, 'v3');
h.fill(0, soaOut, soaOut + LEN);
v4(soaOut*4, soaA*4, soaB*4, N);
let m4 = 0;
for (let i = 0; i < N; i++) for (let p = 0; p < 16; p++)
  m4 = Math.max(m4, Math.abs(ref[i*16+p] - h[soaOut + p*N + i]));
console.log(`  v4 max delta vs v1: ${m4.toExponential(2)}`);

console.log(`\nN=${N} flat array of matrices, per frame`);
const t1 = time(() => v1(outPtr*4, aPtr*4, bPtr*4, N), 10, 100, 500);
const t2 = time(() => v2(outPtr*4, aPtr*4, bPtr*4, N), 10, 100, 500);
const t3 = time(() => v3(outPtr*4, aPtr*4, bPtr*4, N), 10, 100, 500);
const t4 = time(() => v4(soaOut*4, soaA*4, soaB*4, N), 10, 100, 500);
const row = (n, t, note) => console.log(`  ${n.padEnd(34)} ${(t/1000).toFixed(1).padStart(6)} us  ${(t/N).toFixed(2).padStart(5)} ns/mat  ${(t1/t).toFixed(2)}x`, note ?? '');
row('v1 AoS serial chain', t1);
row('v2 AoS tree reduction', t2);
row('v3 AoS tree + 2x unroll', t3);
row('v4 SoA 4-wide, no shuffles', t4, '(different layout)');
