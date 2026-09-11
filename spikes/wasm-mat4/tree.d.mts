/** A tree of transforms resident in wasm memory, allocated by {@link createTree}. */
export type Tree = {
    /** How many nodes the buffers were sized for. */
    readonly capacity: number;
    /** How many nodes `update` and `validate` cover by default. */
    count: number;
    /** The memory backing every view, sized once and never grown. */
    readonly memory: WebAssembly.Memory;
    /** Whether this tree runs the relaxed SIMD kernel. */
    readonly fma: boolean;
    /** Each node's transform relative to its parent, 16 floats per node, column major. */
    readonly local: Float32Array;
    /** Each node's transform in world space, written by `update`. */
    readonly world: Float32Array;
    /** Each node's parent index. Negative means root. */
    readonly parent: Int32Array;
    /**
     * Propagates local to world for the first `count` nodes.
     *
     * A parent index outside `0 <= parent[i] < i` is treated as a root, so a
     * malformed tree gives wrong values rather than reading out of bounds.
     *
     * @throws RangeError when `count` is outside `[0, capacity]`
     */
    update(count?: number): Tree;
    /**
     * Finds the first node that is neither a root nor a backward reference,
     * which is what the kernel needs to resolve the tree in one pass. Not for
     * hot paths.
     *
     * @returns that index, or -1 when the tree is well formed
     * @throws RangeError when `count` is outside `[0, capacity]`
     */
    validate(count?: number): number;
};

/** True when this engine can run the relaxed SIMD kernel. */
export function fmaSupported(): boolean;

/**
 * Allocates a tree of `capacity` nodes resident in wasm memory.
 *
 * Pass `fma` to use the relaxed SIMD kernel. Engines are free to fuse or not, so
 * results differ slightly between them. Leave it off when results have to match
 * across devices, as in a networked simulation or replay.
 *
 * @throws RangeError when `capacity` is not a non negative integer, or is larger
 * than a 4GiB wasm memory holds
 * @throws Error when `fma` is asked for and the engine cannot run it
 */
export function createTree(capacity: number, options?: { fma?: boolean }): Tree;
