import { describe, expect, it } from 'vitest';
import * as mat4 from '../../../src/core/mat4';
import type { Mat4 } from '../../../src/core/mat4';
import { createTree, fmaSupported } from '../../../spikes/wasm-mat4/tree.mjs';

// f32 kernels against an f64 reference, so comparisons carry a tolerance
const F32_TOLERANCE = 1e-5;

/** A local transform that rotates about z and translates, well conditioned. */
function transform(angle: number, x: number, y: number, z: number): Mat4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

/** world[i] = world[parent[i]] * local[i] in f64, using the library's multiply. */
function reference(locals: Mat4[], parent: number[]): Mat4[] {
    const world: Mat4[] = [];
    for (let i = 0; i < locals.length; i++) {
        const w = mat4.create();
        if (parent[i] < 0) mat4.copy(w, locals[i]);
        else mat4.multiply(w, world[parent[i]], locals[i]);
        world.push(w);
    }
    return world;
}

function build(locals: Mat4[], parent: number[], options?: { fma: boolean }) {
    const tree = createTree(locals.length, options);
    for (let i = 0; i < locals.length; i++) {
        tree.local.set(locals[i], i * 16);
        tree.parent[i] = parent[i];
    }
    return tree;
}

describe('wasm tree', () => {
    describe('update', () => {
        it('should translate each node relative to its parent down a chain', () => {
            // the root sits at the origin and every other node steps one unit
            // along x, so depth d ends up at x = d
            const locals = Array.from({ length: 8 }, (_, i) => transform(0, i === 0 ? 0 : 1, 0, 0));
            const tree = build(locals, [-1, 0, 1, 2, 3, 4, 5, 6]).update();

            for (let i = 0; i < 8; i++) expect(tree.world[i * 16 + 12]).toBeCloseTo(i, 5);
        });

        it('should match the f64 reference over a 4-ary tree', () => {
            const n = 64;
            const locals = Array.from({ length: n }, (_, i) => transform(i * 0.37, i * 0.1, -i * 0.05, 1));
            const parent = Array.from({ length: n }, (_, i) => (i === 0 ? -1 : (i - 1) >> 2));
            const tree = build(locals, parent).update();
            const expected = reference(locals, parent);

            for (let i = 0; i < n; i++)
                for (let j = 0; j < 16; j++)
                    expect(tree.world[i * 16 + j]).toBeCloseTo(expected[i][j], 4);
        });

        it('should copy the local transform for every root', () => {
            const locals = [transform(0.5, 1, 2, 3), transform(1.5, 4, 5, 6)];
            const tree = build(locals, [-1, -1]).update();

            for (let i = 0; i < 2; i++)
                for (let j = 0; j < 16; j++) expect(tree.world[i * 16 + j]).toBeCloseTo(locals[i][j], 5);
        });

        it('should update only the requested prefix', () => {
            const locals = Array.from({ length: 4 }, (_, i) => transform(0, i === 0 ? 0 : 1, 0, 0));
            const tree = build(locals, [-1, 0, 1, 2]).update(2);

            expect(tree.world[1 * 16 + 12]).toBeCloseTo(1, 5);
            expect(tree.world[3 * 16 + 12]).toBe(0); // never written
        });
    });

    describe('malformed trees', () => {
        // the kernel takes raw indices, so an invalid one must not read out of
        // bounds. Anything outside 0 <= parent[i] < i is treated as a root.
        it('should treat an out of range parent as a root rather than read out of bounds', () => {
            const locals = [transform(0, 1, 0, 0), transform(0, 1, 0, 0)];
            const tree = build(locals, [-1, 999999]).update();

            expect(tree.world[1 * 16 + 12]).toBeCloseTo(1, 5);
            expect(tree.validate()).toBe(1);
        });

        it('should treat a forward reference as a root', () => {
            const locals = Array.from({ length: 3 }, () => transform(0, 1, 0, 0));
            const tree = build(locals, [-1, 2, 0]).update();

            expect(tree.world[1 * 16 + 12]).toBeCloseTo(1, 5);
            expect(tree.validate()).toBe(1);
        });

        it('should report -1 from validate for a well formed tree', () => {
            const locals = Array.from({ length: 8 }, () => transform(0, 1, 0, 0));
            expect(build(locals, [-1, 0, 0, 1, 1, 2, 2, 3]).validate()).toBe(-1);
        });
    });

    describe('createTree', () => {
        it('should reject a capacity that is not a non negative integer', () => {
            for (const bad of [2.5, -5, NaN, undefined]) expect(() => createTree(bad as number)).toThrow(RangeError);
        });

        it('should reject a capacity larger than a 4GiB wasm memory holds', () => {
            expect(() => createTree(1e9)).toThrow(RangeError);
        });

        it('should expose views sized to capacity that share one buffer', () => {
            const tree = createTree(16);

            expect(tree.local.length).toBe(16 * 16);
            expect(tree.world.length).toBe(16 * 16);
            expect(tree.parent.length).toBe(16);
            expect(tree.world.buffer).toBe(tree.memory.buffer);
        });
    });

    describe('update bounds', () => {
        it('should reject a count outside [0, capacity]', () => {
            const tree = createTree(8);
            for (const bad of [9, -1, 1.5]) expect(() => tree.update(bad)).toThrow(RangeError);
        });

        it('should leave the parent indices untouched by a rejected update', () => {
            const tree = createTree(8);
            tree.parent.set([-1, 0, 1, 2, 3, 4, 5, 6]);
            expect(() => tree.update(100000)).toThrow(RangeError);
            expect(Array.from(tree.parent)).toEqual([-1, 0, 1, 2, 3, 4, 5, 6]);
        });
    });

    describe('relaxed simd kernel', () => {
        it.skipIf(!fmaSupported())('should agree with the strict kernel within f32 tolerance', () => {
            const n = 32;
            const locals = Array.from({ length: n }, (_, i) => transform(i * 0.21, i * 0.1, 1, -i * 0.03));
            const parent = Array.from({ length: n }, (_, i) => i - 1);

            const strict = build(locals, parent).update();
            const fused = build(locals, parent, { fma: true }).update();

            for (let i = 0; i < n * 16; i++)
                expect(Math.abs(strict.world[i] - fused.world[i])).toBeLessThan(F32_TOLERANCE);
        });

        it('should reject fma when the engine cannot run it', () => {
            if (fmaSupported()) expect(createTree(4, { fma: true }).fma).toBe(true);
            else expect(() => createTree(4, { fma: true })).toThrow();
        });
    });
});
