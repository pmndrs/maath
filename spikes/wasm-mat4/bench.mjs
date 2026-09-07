// Tree matrix multiply, wasm SIMD against the equivalent JS.
import { createTree, fmaSupported } from './tree.mjs';

// world[i] = world[parent[i]] * local[i] using the library's multiply, on the
// same flat buffers, so only the kernel differs
function jsTree(world, local, parent, n) {
    for (let i = 0; i < n; i++) {
        const p = parent[i], L = i * 16, W = i * 16;
        if (p < 0) { for (let j = 0; j < 16; j++) world[W + j] = local[L + j]; continue; }
        const P = p * 16;
        const a00=world[P],a01=world[P+1],a02=world[P+2],a03=world[P+3];
        const a10=world[P+4],a11=world[P+5],a12=world[P+6],a13=world[P+7];
        const a20=world[P+8],a21=world[P+9],a22=world[P+10],a23=world[P+11];
        const a30=world[P+12],a31=world[P+13],a32=world[P+14],a33=world[P+15];
        for (let j = 0; j < 4; j++) {
            const b0=local[L+j*4],b1=local[L+j*4+1],b2=local[L+j*4+2],b3=local[L+j*4+3];
            world[W+j*4]=b0*a00+b1*a10+b2*a20+b3*a30;
            world[W+j*4+1]=b0*a01+b1*a11+b2*a21+b3*a31;
            world[W+j*4+2]=b0*a02+b1*a12+b2*a22+b3*a32;
            world[W+j*4+3]=b0*a03+b1*a13+b2*a23+b3*a33;
        }
    }
}

// the same tree over plain arrays, the representation the library uses today.
// JS is faster on these than on a flat Float32Array, so this is the honest
// baseline for whether wasm is worth it at all.
function jsTreePlain(world, local, parent, n) {
    for (let i = 0; i < n; i++) {
        const p = parent[i], L = local[i], W = world[i];
        if (p < 0) { for (let j = 0; j < 16; j++) W[j] = L[j]; continue; }
        const A = world[p];
        const a00=A[0],a01=A[1],a02=A[2],a03=A[3],a10=A[4],a11=A[5],a12=A[6],a13=A[7];
        const a20=A[8],a21=A[9],a22=A[10],a23=A[11],a30=A[12],a31=A[13],a32=A[14],a33=A[15];
        for (let j = 0; j < 4; j++) {
            const b0=L[j*4],b1=L[j*4+1],b2=L[j*4+2],b3=L[j*4+3];
            W[j*4]=b0*a00+b1*a10+b2*a20+b3*a30;
            W[j*4+1]=b0*a01+b1*a11+b2*a21+b3*a31;
            W[j*4+2]=b0*a02+b1*a12+b2*a22+b3*a32;
            W[j*4+3]=b0*a03+b1*a13+b2*a23+b3*a33;
        }
    }
}

function toPlain(flat, n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(Array.from(flat.subarray(i * 16, i * 16 + 16)));
    return out;
}

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

// tree shapes as parent arrays, parents always preceding children
const shapes = {
    '4-ary (scene graph)': (n) => { const p = new Int32Array(n); p[0] = -1; for (let i = 1; i < n; i++) p[i] = (i-1) >> 2; return p; },
    'binary': (n) => { const p = new Int32Array(n); p[0] = -1; for (let i = 1; i < n; i++) p[i] = (i-1) >> 1; return p; },
    'chains of 32 (skeleton)': (n) => { const p = new Int32Array(n); for (let i = 0; i < n; i++) p[i] = i % 32 === 0 ? -1 : i - 1; return p; },
    'flat under one root': (n) => { const p = new Int32Array(n); p[0] = -1; for (let i = 1; i < n; i++) p[i] = 0; return p; },
};

function fill(tree, n) {
    let s = 7; const rnd = () => ((s = (s*1664525+1013904223)>>>0) / 4294967296);
    for (let i = 0; i < n; i++) {
        const a = rnd() * 6.283, c = Math.cos(a), sn = Math.sin(a);
        tree.local.set([c,sn,0,0, -sn,c,0,0, 0,0,1,0, rnd()*2-1, rnd()*2-1, rnd()*2-1, 1], i * 16);
    }
}

console.log(`relaxed simd available: ${fmaSupported()}\n`);

const N = 4096;
console.log(`N = ${N}, min of trials\n`);
console.log('shape'.padEnd(25), 'JS flat'.padStart(9), 'JS plain'.padStart(9), 'wasm'.padStart(8), 'wasm+fma'.padStart(9), 'vs plain'.padStart(9), 'fma'.padStart(6));
for (const [name, make] of Object.entries(shapes)) {
    const strict = createTree(N);
    const fma = fmaSupported() ? createTree(N, { fma: true }) : null;
    const parent = make(N);
    strict.parent.set(parent); fill(strict, N);
    if (fma) { fma.parent.set(parent); fill(fma, N); }

    const jsWorld = new Float32Array(N * 16);
    jsTree(jsWorld, strict.local, parent, N);
    strict.update();
    let d = 0;
    for (let i = 0; i < N * 16; i++) d = Math.max(d, Math.abs(jsWorld[i] - strict.world[i]) / Math.max(1, Math.abs(jsWorld[i])));

    const pLocal = toPlain(strict.local, N), pWorld = toPlain(jsWorld, N);
    const tj = time(() => jsTree(jsWorld, strict.local, parent, N), 20, 50, 500);
    const tp = time(() => jsTreePlain(pWorld, pLocal, parent, N), 20, 50, 500);
    const tw = time(() => strict.update(), 20, 50, 500);
    const tf = fma ? time(() => fma.update(), 20, 50, 500) : NaN;
    console.log(name.padEnd(25), `${(tj/1000).toFixed(1)}us`.padStart(9), `${(tp/1000).toFixed(1)}us`.padStart(9),
        `${(tw/1000).toFixed(1)}us`.padStart(8), `${(tf/1000).toFixed(1)}us`.padStart(9),
        `${(tp/tw).toFixed(2)}x`.padStart(9), `${(tw/tf).toFixed(2)}x`.padStart(6));
    if (d > 1e-4) console.log(`  WARNING rel delta vs JS ${d.toExponential(2)}`);
}

console.log('\nscaling, 4-ary, ns per node');
console.log('N'.padStart(9), 'JS flat'.padStart(8), 'JS plain'.padStart(9), 'wasm'.padStart(7), 'wasm+fma'.padStart(9), 'vs plain'.padStart(9));
for (const n of [1024, 4096, 16384, 65536, 262144]) {
    const strict = createTree(n);
    const fma = fmaSupported() ? createTree(n, { fma: true }) : null;
    const parent = shapes['4-ary (scene graph)'](n);
    strict.parent.set(parent); fill(strict, n);
    if (fma) { fma.parent.set(parent); fill(fma, n); }
    const jsWorld = new Float32Array(n * 16);
    const inner = n >= 65536 ? 3 : 20, outer = n >= 65536 ? 20 : 50, warm = n >= 65536 ? 30 : 400;
    const pLocal = toPlain(strict.local, n), pWorld = toPlain(jsWorld, n);
    const tj = time(() => jsTree(jsWorld, strict.local, parent, n), inner, outer, warm) / n;
    const tp = time(() => jsTreePlain(pWorld, pLocal, parent, n), inner, outer, warm) / n;
    const tw = time(() => strict.update(), inner, outer, warm) / n;
    const tf = fma ? time(() => fma.update(), inner, outer, warm) / n : NaN;
    console.log(String(n).padStart(9), tj.toFixed(2).padStart(8), tp.toFixed(2).padStart(9), tw.toFixed(2).padStart(7), tf.toFixed(2).padStart(9), `${(tp/tw).toFixed(2)}x`.padStart(9));
}
