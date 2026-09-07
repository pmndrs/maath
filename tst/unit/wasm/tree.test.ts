import { describe, expect, it } from 'vitest';
import * as mat4 from '../../../src/core/mat4';
import type { Mat4 } from '../../../src/core/mat4';
import { createTree, fmaSupported } from '../../../spikes/wasm-mat4/tree.mjs';

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
        it('should place each node relative to its parent down a chain', () => {
            // the root sits at the origin and every other node steps one unit
            // along x, so depth d ends up at x = d
            const locals = Array.from({ length: 8 }, (_, i) => transform(0, i === 0 ? 0 : 1, 0, 0));
            const tree = build(locals, [-1, 0, 1, 2, 3, 4, 5, 6]).update();

            for (let i = 0; i < 8; i++) expect(tree.world[i * 16 + 12]).toBeCloseTo(i, 5);
        });

        it('should match the f64 reference over a 4-ary tree', () => {
            const locals = Array.from({ length: 64 }, (_, i) => transform(i * 0.37, i * 0.1, -i * 0.05, 1));
            const parent = Array.from({ length: 64 }, (_, i) => (i === 0 ? -1 : (i - 1) >> 2));
            const tree = build(locals, parent).update();
            const expected = reference(locals, parent);

            // four places, since the kernel is f32 and the reference is f64
            for (let i = 0; i < 64; i++)
                for (let j = 0; j < 16; j++) expect(tree.world[i * 16 + j]).toBeCloseTo(expected[i][j], 4);
        });

        it('should copy the local transform for every root', () => {
            const locals = [transform(0.5, 1, 2, 3), transform(1.5, 4, 5, 6)];
            const tree = build(locals, [-1, -1]).update();

            for (let i = 0; i < 2; i++) for (let j = 0; j < 16; j++) expect(tree.world[i * 16 + j]).toBeCloseTo(locals[i][j], 5);
        });

        it('should update only the requested prefix', () => {
            const locals = Array.from({ length: 4 }, (_, i) => transform(0, i === 0 ? 0 : 1, 0, 0));
            const tree = build(locals, [-1, 0, 1, 2]).update(2);

            expect(tree.world[1 * 16 + 12]).toBeCloseTo(1, 5);
            expect(tree.world[3 * 16 + 12]).toBe(0); // never written
        });
    });

    // the kernel takes raw indices from a caller owned buffer, so an index it
    // cannot resolve must not read outside that buffer
    describe('malformed trees', () => {
        it('should treat an out of range parent as a root', () => {
            const tree = build([transform(0, 1, 0, 0), transform(0, 1, 0, 0)], [-1, 999999]).update();

            expect(tree.world[1 * 16 + 12]).toBeCloseTo(1, 5);
            expect(tree.validate()).toBe(1);
        });

        it('should treat a forward reference as a root', () => {
            const locals = Array.from({ length: 3 }, () => transform(0, 1, 0, 0));
            const tree = build(locals, [-1, 2, 0]).update();

            expect(tree.world[1 * 16 + 12]).toBeCloseTo(1, 5);
            expect(tree.validate()).toBe(1);
        });

        it('should report -1 from validate when every parent precedes its child', () => {
            const locals = Array.from({ length: 8 }, () => transform(0, 1, 0, 0));
            expect(build(locals, [-1, 0, 0, 1, 1, 2, 2, 3]).validate()).toBe(-1);
        });
    });

    describe('bounds', () => {
        it('should reject a capacity it cannot allocate a tree for', () => {
            for (const bad of [2.5, -5, NaN, undefined, 1e9]) expect(() => createTree(bad as number)).toThrow(RangeError);
        });

        it('should reject a count outside the tree', () => {
            const tree = createTree(8);
            for (const bad of [9, -1, 1.5]) expect(() => tree.update(bad)).toThrow(RangeError);
        });

        it('should leave the tree untouched when it rejects an update', () => {
            const tree = createTree(8);
            tree.parent.set([-1, 0, 1, 2, 3, 4, 5, 6]);

            expect(() => tree.update(100000)).toThrow(RangeError);
            expect(Array.from(tree.parent)).toEqual([-1, 0, 1, 2, 3, 4, 5, 6]);
        });
    });

    describe('relaxed simd kernel', () => {
        it.skipIf(!fmaSupported())('should agree with the strict kernel', () => {
            const locals = Array.from({ length: 32 }, (_, i) => transform(i * 0.21, i * 0.1, 1, -i * 0.03));
            const parent = Array.from({ length: 32 }, (_, i) => i - 1);

            const strict = build(locals, parent).update();
            const fused = build(locals, parent, { fma: true }).update();

            // fusing changes rounding, so the two agree only to f32 precision
            for (let i = 0; i < 32 * 16; i++) expect(fused.world[i]).toBeCloseTo(strict.world[i], 5);
        });
    });
});
