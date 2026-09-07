// f32 drift against f64, as a function of tree depth. Trees compound error with
// depth, so this is the number that decides whether a chain can use the f32 path.
import { createTree, fmaSupported } from './tree.mjs';

const DEPTH = 256;
const tree = createTree(DEPTH);
const fma = fmaSupported() ? createTree(DEPTH, { fma: true }) : null;

// a single chain of realistic transforms, rotation plus translation
let s = 12345;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const locals = [];
for (let i = 0; i < DEPTH; i++) {
    const a = (rnd() - 0.5) * 0.8, c = Math.cos(a), sn = Math.sin(a);
    locals.push([c,sn,0,0, -sn,c,0,0, 0,0,1,0, rnd()*2-1, rnd()*2-1, rnd()*2-1, 1]);
}
for (const t of [tree, fma].filter(Boolean)) {
    for (let i = 0; i < DEPTH; i++) { t.parent[i] = i - 1; t.local.set(locals[i], i * 16); }
    t.update();
}

// f64 reference in plain JS
const ref = [];
for (let i = 0; i < DEPTH; i++) {
    if (i === 0) { ref.push(locals[0].slice()); continue; }
    const A = ref[i - 1], L = locals[i], W = new Array(16);
    for (let j = 0; j < 4; j++)
        for (let r = 0; r < 4; r++)
            W[j*4+r] = L[j*4]*A[r] + L[j*4+1]*A[4+r] + L[j*4+2]*A[8+r] + L[j*4+3]*A[12+r];
    ref.push(W);
}

const drift = (t, d) => {
    let m = 0;
    for (let j = 0; j < 16; j++) m = Math.max(m, Math.abs(ref[d][j] - t.world[d * 16 + j]));
    return m;
};
// translation magnitude, to read the absolute error against
const scale = (d) => Math.max(...ref[d].slice(12, 15).map(Math.abs));

console.log('f32 absolute drift against f64, single chain of realistic transforms\n');
console.log('depth'.padStart(6), 'strict'.padStart(11), 'fma'.padStart(11), '|translation|'.padStart(14));
for (const d of [1, 2, 4, 8, 16, 32, 64, 128, 255])
    console.log(String(d).padStart(6), drift(tree, d).toExponential(2).padStart(11),
        (fma ? drift(fma, d).toExponential(2) : 'n/a').padStart(11), scale(d).toFixed(2).padStart(14));
