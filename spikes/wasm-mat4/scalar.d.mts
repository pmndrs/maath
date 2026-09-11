import type { Tree } from './tree.mjs';

/**
 * Allocates a tree backed by the scalar kernel, for pricing the flat layout
 * separately from SIMD. Diagnostic only, and node only, since it reads the
 * module from disk rather than inlining it.
 */
export function createScalarTree(capacity: number): Tree;
