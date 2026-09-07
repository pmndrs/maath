---
name: math
description: Use when writing or reviewing geometry, simulation, collision, navigation, culling, procedural generation, transforms, or other performance-sensitive algorithms with the npm `math` package, or when the user invokes /math. Not for routine arithmetic or textbook explanations.
---

# math

Write data-oriented TypeScript on top of the npm `math` package: plain data, free functions, no classes, no allocation in hot paths.

API docs are in `API.md` — every export with its signature, grouped by module and flat enough to grep. Find it at `node_modules/math/API.md` in a consuming project, or at the repo root when working on `math` itself.

## Types

Every type is a plain fixed-length tuple of numbers — no classes, no wrappers, and not a typed array:

- `Vec2` `[x, y]`, `Vec3` `[x, y, z]`, `Vec4` `[x, y, z, w]`
- `Quat` `[x, y, z, w]`, `Quat2` `[x, y, z, w, x2, y2, z2, w2]`
- `Euler` `[x, y, z, order?]`, radians, order defaulting to `'xyz'`
- `Mat2` (4), `Mat2d` (6), `Mat3` (9), `Mat4` (16) — contiguous and column-major, with `Mat4` translation in `m[12]`, `m[13]`, `m[14]`
- `Polar` `[r, theta]`, `Spherical` `[r, theta, phi]`

## Style

- **Functions over data.** Export `function` declarations that take typed data and operate on it. Never classes for data, never closures that hold state. The one exception is a small fixed set of classes implementing a single structural type — a collector handed to a query to receive its hits, say — where the call site is polymorphic and a stable hidden class keeps it fast.
- **`out` first, return `out`** for composite results: `fn(out: Vec3, a: Vec3, b: Vec3): Vec3`. Scalars and booleans return directly.
- **Use result objects and `out` params over returning new objects.** When a result doesn't fit a vector, define a result type with a `createXResult()` factory beside it; report failure with a boolean or status enum rather than `out | null`.
- **Assume the caller aliases** — the same array may arrive as both `out` and an input, as in `vec3.normalize(v, v)` or `vec3.cross(a, a, b)`. Read every input component into a local before the first write to `out`, so a write can't clobber an input still needed.
- **Caller-owned state.** Long-lived state is plain data the caller allocates and owns. Functions receive it, mutate it in place, and return it. The library never owns the data lifecycle, so allocation happens once, ownership is explicit, and the object keeps one stable shape. Naming and file layout are up to the codebase. One common shape:

```ts
export function createWorld(capacity: number) {
    return { capacity, count: 0, positions: new Float32Array(capacity * 3) };
}
export type World = ReturnType<typeof createWorld>;

export function stepWorld(world: World, delta: number): World { /* mutate, return world */ }
export function getWorldPosition(out: Vec3, world: World, i: number): Vec3 { /* write out, return it */ }
```

- **Monomorphic state.** Build the object with the same keys in the same order every time. No optional fields, no keys added later.
- **Allocate at creation, never per call.** Preallocate flat or typed arrays to capacity. When full, return a count, sentinel, or status rather than growing inside a hot loop.
- **Compose `math` primitives** (`vec3`, `mat4`, `quat`, and the `math/shapes`, `math/geometry`, `math/noise`, `math/random`, `math/time` subpaths).
- **Hoist invariants out of loops**

## Gotchas

- Module-level scratch is named `_owner_purpose`. Grow-once buffers carry an explicit size counter rather than `push`/`pop`/`length = 0`.
- Module-level scratch variables are not reentrant. Pass caller-owned workspace for recursive, nested, or worker code.
- One epsilon does not fit every operation or scale. Choose each tolerance and say why.
- Define behavior for empty input, zero-length vectors, degenerate geometry, NaN, and exact boundary contact.
- Compare squared distances; reach for `squaredLength` / `squaredDistance` over their square-rooted pairs.
- Integers in the range [-2^30, 2^30) are stored in the pointer itself (V8 Smi), with no heap object. Use them for indices, handles, packed IDs, bitmasks, and counts.
- Where possible avoid plain array element kind transitions (small integers, doubles, array with holes). Especially avoid unnecessary SMI or PACKED_DOUBLE to holey transitions when holey arrays are not desired.
- Don't assume a typed array is faster. A packed plain array is already unboxed and can still grow. Typed arrays buy footprint, a fixed layout, and zero-copy interop with workers, Wasm, and the GPU; they cost a capacity fixed up front and, for `Float32Array`, a narrowing conversion on every write. Choose one for interop or memory, not on a hunch about speed.
- In a **library**, annotate module-level factory calls `/* @__PURE__ */` so a consumer's bundler can drop the scratch when the function is tree-shaken out. Application code does not need it.

Deliver the implementation with its assumptions, complexity, edge cases, and focused tests.

## Working with other libs

Marshal in, compute, marshal out — and allocate on neither crossing. Keep the scratch `math` types at module scope, fill them from the other library's values, run the algorithm as plain `math` calls, then write the results back. The seam is a few lines at each end of a function; everything between them is flat data.

- **A `Float32Array` is not a `Vec3`.** The tuple types don't accept one, and casting past that gets you a value the rest of the codebase can't rely on. Marshal across the boundary instead.
- **Marshal with whatever writes into memory you already own.** For flat buffers — an instanced attribute, a packed particle array — that's `vec3.fromBuffer(out, buffer, i * 3)` and `vec3.toBuffer(buffer, v, i * 3)` (also on `vec2`, `vec4`, `quat`), or `buffer.set(m, i * 16)` for a whole matrix, since `TypedArray.set` takes any array-like.
- **State that crosses a worker, Wasm, or GPU boundary lives in a typed array from the start.** A plain-array `Vec3` can't be transferred or shared, so back the long-lived data with `Float32Array` / `SharedArrayBuffer` at creation and marshal at the edges.

### three.js

`Vector3`, `Quaternion`, `Matrix4`, and `Euler` all marshal through `toArray(target)` and `fromArray(source)`, and the component order matches `math`'s in every case. Always pass your scratch to `toArray` — called bare, it allocates a fresh array. Writing `object.matrix` directly needs `object.matrixAutoUpdate = false` and `object.matrixWorldNeedsUpdate = true`; otherwise marshal back through `position` / `quaternion` / `scale` and let three compose.

```ts
import { mat4, vec3, type Vec3 } from 'math';
import type { Object3D } from 'three';

// scratch allocated once, at module scope
const _steer_position = vec3.create();
const _steer_target = vec3.create();
const _steer_direction = vec3.create();
const _steer_matrix = mat4.create();

const UP: Vec3 = [0, 1, 0];
const ARRIVED_SQ = 1e-6;

/** Move `object` toward `target`, facing the direction of travel. Set `object.matrixAutoUpdate = false` first. */
export function steer(object: Object3D, target: Object3D, speed: number, delta: number): void {
    // in — three writes into our arrays
    object.position.toArray(_steer_position);
    target.position.toArray(_steer_target);

    // compute — plain math, every result in place
    vec3.subtract(_steer_direction, _steer_target, _steer_position);
    if (vec3.squaredLength(_steer_direction) < ARRIVED_SQ) return;
    vec3.normalize(_steer_direction, _steer_direction);
    vec3.scaleAndAdd(_steer_position, _steer_position, _steer_direction, speed * delta);
    mat4.targetTo(_steer_matrix, _steer_position, _steer_target, UP);

    // out — three reads from our array
    object.matrix.fromArray(_steer_matrix);
    object.matrixWorldNeedsUpdate = true;
}
```
