// Single file loader for the mat4 SIMD kernels.
// The module is inlined as base64, so there is no fetch, no bundler plugin and
// no async anywhere in the API. Works the same in node, a bundler and from a CDN.

const WASM_BASE64 =
    'AGFzbQEAAAABFgNgBH9/f38AYAN/f38AYAV/f39/fwADBgUAAQAAAgUEAQCAAgYIAX8BQYCIBAsHQgUGbWVtb3J5AgAJbXVs' +
    'X2JhdGNoAAANbXVsX2Jyb2FkY2FzdAACCWhpZXJhcmNoeQADDWNvbXBvc2VfYmF0Y2gABArLCAVGACADQQAgA0EAShshAwNA' +
    'AkAgAw0ADwsgACABIAIQgYCAgAAgA0F/aiEDIABBwABqIQAgAUHAAGohASACQcAAaiECDAALC8cBAQV7IAH9AAAwIQMgAf0A' +
    'ACAhBCAB/QAAECEFIAH9AAAAIQZBACEBA0ACQCABQcAARw0ADwsgACABaiAGIAIgAWr9AAAAIgcgB/0NAAECAwABAgMAAQID' +
    'AAECA/3mASAFIAcgB/0NBAUGBwQFBgcEBQYHBAUGB/3mAf3kASAEIAcgB/0NCAkKCwgJCgsICQoLCAkKC/3mASADIAcgB/0N' +
    'DA0ODwwNDg8MDQ4PDA0OD/3mAf3kAf3kAf0LAAAgAUEQaiEBDAALC/4BAgF/BXtBACEEIANBACADQQBKGyEDIAH9AAAwIQUg' +
    'Af0AACAhBiAB/QAAECEHIAH9AAAAIQgCQANAIAQgA0YNAUEAIQEDQAJAIAFBwABHDQAgAkHAAGohAiAAQcAAaiEAIARBAWoh' +
    'BAwCCyAAIAFqIAggAiABav0AAAAiCSAJ/Q0AAQIDAAECAwABAgMAAQID/eYBIAcgCSAJ/Q0EBQYHBAUGBwQFBgcEBQYH/eYB' +
    '/eQBIAYgCSAJ/Q0ICQoLCAkKCwgJCgsICQoL/eYBIAUgCSAJ/Q0MDQ4PDA0ODwwNDg8MDQ4P/eYB/eQB/eQB/QsAACABQRBq' +
    'IQEMAAsLCwulAQEEf0EAIQQgA0EAIANBAEobIQUgACEGIAEhBwJAA0AgBCAFRg0BAkACQCACIARBAnRqKAIAIgNBf0oNAEEA' +
    'IQMDQCADQcAARg0CIAYgA2ogByADav0AAAD9CwAAIANBEGohAwwACwsgACAEQQZ0aiAAIANBBnRqIAEgBEEEdEECdGoQgYCA' +
    'gAALIAZBwABqIQYgB0HAAGohByAEQQFqIQQMAAsLC5EDAwJ/A3sLfUEAIQUgBEEAIARBAEobIQQDQAJAIAQNAA8LIAMgBWoi' +
    'Bv0JAgAhByAGQQRq/QkCACEIIABBIGr9DAAAAAAAAAAAAAAAAAAAAAAiCSACKgIAIgogAkEIaioCACILIAuSIgyUIg0gAkEE' +
    'aioCACIOIA6SIg8gAkEMaioCACIQlCIRkv0gACAOIAyUIhIgCiAKkiITIBCUIhST/SABQwAAgD8gCiATlCITIA4gD5QiDpKT' +
    '/SACIAZBCGr9CQIA/eYB/QsAACAAQRBqIAggCSAKIA+UIgogECAMlCIPk/0gAEMAAIA/IBMgCyAMlCIMkpP9IAEgEiAUkv0g' +
    'Av3mAf0LAAAgACAHIAlDAACAPyAOIAySk/0gACAKIA+S/SABIA0gEZP9IAL95gH9CwAAIABBMGr9DAAAAAAAAAAAAAAAAAAA' +
    'gD8gASAFaiIGKgIA/SAAIAZBBGoqAgD9IAEgBkEIaioCAP0gAv0LAAAgBEF/aiEEIABBwABqIQAgBUEMaiEFIAJBEGohAgwA' +
    'Cws=';

function decode(base64) {
    if (typeof Buffer !== 'undefined') return Buffer.from(base64, 'base64');
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

/**
 * True when this engine can run this module.
 *
 * Validates the real module rather than a stand in probe, so the check tests
 * exactly the features the kernels use and cannot drift away from them.
 */
export function supported() {
    return WebAssembly.validate(decode(WASM_BASE64));
}

/**
 * Creates a kernel instance owning `capacity * 16` floats of scratch per buffer.
 *
 * Memory is sized once and never grows, because `memory.grow` detaches every
 * view already handed out. Allocate to capacity up front.
 */
export function createMat4Wasm(capacity) {
    const bytes = decode(WASM_BASE64);
    // sync compile, legal on the main thread only while the module stays under 4KB
    const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
    const memory = instance.exports.memory;

    const pages = Math.ceil((capacity * 64 * 4 + 65536) / 65536);
    if (pages > memory.buffer.byteLength / 65536) memory.grow(pages - memory.buffer.byteLength / 65536);

    let offset = 0;
    const own = (view) => {
        if (view.buffer !== memory.buffer)
            throw new Error('buffer was not allocated by this module, so it is not resident');
        return view.byteOffset;
    };
    const bump = (bytesNeeded) => {
        const at = offset;
        offset += (bytesNeeded + 15) & ~15; // keep every allocation 16 byte aligned
        if (offset > memory.buffer.byteLength) throw new Error('out of wasm memory, raise capacity');
        return at;
    };

    return {
        memory,
        supported: supported(),

        /** A flat array of `count` matrices, 16 floats each, resident in wasm memory. */
        allocMat4: (count) => new Float32Array(memory.buffer, bump(count * 64), count * 16),
        /** A flat array of `count` vec3 or quat, for the compose inputs. */
        allocFloat: (count, stride) => new Float32Array(memory.buffer, bump(count * stride * 4), count * stride),
        /** Parent indices for `hierarchy`, negative meaning root. */
        allocIndex: (count) => new Int32Array(memory.buffer, bump(count * 4), count),

        /** out[i] = a[i] * b[i] */
        multiply(out, a, b, count = out.length / 16) {
            instance.exports.mul_batch(own(out), own(a), own(b), count);
            return out;
        },
        /** out[i] = m * a[i], for viewProjection times every world matrix */
        multiplyBroadcast(out, m, a, count = out.length / 16) {
            instance.exports.mul_broadcast(own(out), own(m), own(a), count);
            return out;
        },
        /** world[i] = world[parent[i]] * local[i]. Parents must precede children. */
        hierarchy(world, local, parent, count = world.length / 16) {
            instance.exports.hierarchy(own(world), own(local), own(parent), count);
            return world;
        },
        /** out[i] = translate(pos[i]) * rotate(quat[i]) * scale(scale[i]) */
        compose(out, pos, quat, scale, count = out.length / 16) {
            instance.exports.compose_batch(own(out), own(pos), own(quat), own(scale), count);
            return out;
        },
    };
}
