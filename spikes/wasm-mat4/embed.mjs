#!/usr/bin/env node
// Rewrites the base64 kernels inlined in tree.mjs from the committed .wasm
// files, so the two cannot drift. Pass --check to verify instead of rewrite,
// which is what CI should run.
import { readFileSync, writeFileSync } from 'node:fs';

const here = (name) => new URL(`./${name}`, import.meta.url);

function wrap(name) {
    const b64 = readFileSync(here(name)).toString('base64');
    const lines = [];
    for (let i = 0; i < b64.length; i += 92) lines.push(`    '${b64.slice(i, i + 92)}' +`);
    return lines.join('\n').replace(/ \+$/, '');
}

const source = readFileSync(here('tree.mjs'), 'utf8');
let next = source
    .replace(/const WASM =\n[\s\S]*?;\n/, `const WASM =\n${wrap('tree.wasm')};\n`)
    .replace(/const WASM_FMA =\n[\s\S]*?;\n/, `const WASM_FMA =\n${wrap('tree.fma.wasm')};\n`);

if (process.argv.includes('--check')) {
    if (next !== source) {
        console.error('tree.mjs is out of sync with the .wasm files, run ./embed.mjs');
        process.exit(1);
    }
    console.log('tree.mjs matches the committed .wasm files');
} else {
    writeFileSync(here('tree.mjs'), next);
    console.log('embedded tree.wasm and tree.fma.wasm into tree.mjs');
}
