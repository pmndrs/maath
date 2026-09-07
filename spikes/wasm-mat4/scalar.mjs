// Diagnostic only. Loads the scalar twin of the kernel from disk so a bench can
// price the flat layout separately from SIMD. Not part of the interface, not
// inlined, and node only.
import { readFileSync } from 'node:fs';

export function createScalarTree(capacity) {
    const bytes = readFileSync(new URL('./tree.scalar.wasm', import.meta.url));
    const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
    const memory = instance.exports.memory;

    const needed = Math.ceil((capacity * 132 + 65536) / 65536);
    const have = memory.buffer.byteLength / 65536;
    if (needed > have && memory.grow(needed - have) < 0) throw new Error('could not grow wasm memory');

    const matrices = capacity * 16;
    const tree = {
        capacity,
        count: capacity,
        local: new Float32Array(memory.buffer, 0, matrices),
        world: new Float32Array(memory.buffer, matrices * 4, matrices),
        parent: new Int32Array(memory.buffer, matrices * 8, capacity),
    };
    tree.update = (count = tree.count) => {
        instance.exports.tree(tree.world.byteOffset, tree.local.byteOffset, tree.parent.byteOffset, count);
        return tree;
    };
    return tree;
}
