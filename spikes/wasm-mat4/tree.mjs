// Tree matrix multiply. world[i] = world[parent[i]] * local[i].
//
// Both kernels are inlined as base64, so there is no fetch, no bundler plugin
// and no async anywhere in the API.

const WASM =
    'AGFzbQEAAAABCAFgBH9/f38AAwIBAAUGAQEQgIAEBggBfwFBgIgECwcRAgZtZW1vcnkCAAR0cmVlAAAKzAIByQICA38F' +
    'e0EAIQQgA0EAIANBAEobIQUgACEGAkADQCAEIAVGDQECQAJAIAIgBEECdGooAgAiA0F/Sg0AQQAhAwNAIANBwABGDQIg' +
    'BiADaiABIANq/QAAAP0LAAAgA0EQaiEDDAALCyAAIANBBnRqIgP9AAAwIQcgA/0AACAhCCAD/QAAECEJIAP9AAAAIQpB' +
    'ACEDA0AgA0HAAEYNASAGIANqIAcgASADav0AAAAiCyAL/Q0MDQ4PDA0ODwwNDg8MDQ4P/eYBIAggCyAL/Q0ICQoLCAkK' +
    'CwgJCgsICQoL/eYBIAogCyAL/Q0AAQIDAAECAwABAgMAAQID/eYBIAkgCyAL/Q0EBQYHBAUGBwQFBgcEBQYH/eYB/eQB' +
    '/eQB/eQB/QsAACADQRBqIQMMAAsLIAFBwABqIQEgBkHAAGohBiAEQQFqIQQMAAsLCw==';

const WASM_FMA =
    'AGFzbQEAAAABCAFgBH9/f38AAwIBAAUGAQEQgIAEBggBfwFBgIgECwcRAgZtZW1vcnkCAAR0cmVlAAAKwwIBwAICA38F' +
    'e0EAIQQgA0EAIANBAEobIQUgACEGAkADQCAEIAVGDQECQAJAIAIgBEECdGooAgAiA0F/Sg0AQQAhAwNAIANBwABGDQIg' +
    'BiADaiABIANq/QAAAP0LAAAgA0EQaiEDDAALCyAAIANBBnRqIgP9AAAwIQcgA/0AACAhCCAD/QAAECEJIAP9AAAAIQpB' +
    'ACEDA0AgA0HAAEYNASAGIANqIAcgASADav0AAAAiCyAL/Q0MDQ4PDA0ODwwNDg8MDQ4PIAggCyAL/Q0ICQoLCAkKCwgJ' +
    'CgsICQoLIAkgCyAL/Q0EBQYHBAUGBwQFBgcEBQYHIAogCyAL/Q0AAQIDAAECAwABAgMAAQID/eYB/YUC/YUC/YUC/QsA' +
    'ACADQRBqIQMMAAsLIAFBwABqIQEgBkHAAGohBiAEQQFqIQQMAAsLCw==';

function decode(base64) {
    if (typeof Buffer !== 'undefined') return Buffer.from(base64, 'base64');
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

/**
 * True when this engine can run the relaxed SIMD kernel.
 *
 * Validates the real module rather than a stand in probe, so the check tests
 * exactly the features the kernel uses and cannot drift away from them.
 */
export function fmaSupported() {
    return WebAssembly.validate(decode(WASM_FMA));
}

/**
 * Allocates a tree of `capacity` nodes resident in wasm memory.
 *
 * Pass `fma` to use the relaxed SIMD kernel, worth about 1.2x. Engines are free
 * to fuse or not, so results differ slightly between them. Leave it off when
 * results have to match across devices, as in a networked simulation or replay.
 *
 * Memory is sized once here and never grows afterwards, because `memory.grow`
 * detaches every view already handed out.
 */
export function createTree(capacity, options) {
    const fma = options?.fma === true;
    if (fma && !fmaSupported()) throw new Error('relaxed simd is unavailable on this engine');

    const instance = new WebAssembly.Instance(
        // sync compile, legal on the main thread while the module stays under 4KB
        new WebAssembly.Module(decode(fma ? WASM_FMA : WASM)),
        {},
    );
    const memory = instance.exports.memory;

    // one grow at creation, before any view exists
    const needed = Math.ceil((capacity * 132 + 65536) / 65536);
    const have = memory.buffer.byteLength / 65536;
    if (needed > have) memory.grow(needed - have);

    const matrices = capacity * 16;
    const tree = {
        capacity,
        count: capacity,
        memory,
        fma,
        local: new Float32Array(memory.buffer, 0, matrices),
        world: new Float32Array(memory.buffer, matrices * 4, matrices),
        parent: new Int32Array(memory.buffer, matrices * 8, capacity),
    };

    /** Propagates local to world for the first `count` nodes. Returns `tree`. */
    tree.update = (count = tree.count) => {
        instance.exports.tree(tree.world.byteOffset, tree.local.byteOffset, tree.parent.byteOffset, count);
        return tree;
    };

    /**
     * Checks that every parent precedes its child, which the kernel assumes so
     * that one forward pass resolves the tree. Returns the first offending
     * index, or -1. Not for hot paths.
     */
    tree.validate = (count = tree.count) => {
        for (let i = 0; i < count; i++) if (tree.parent[i] >= i) return i;
        return -1;
    };

    return tree;
}
