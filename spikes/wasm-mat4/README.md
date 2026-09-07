# wasm tree matrix multiply

`world[i] = world[parent[i]] * local[i]` over a parent/child graph, as a minimal
SIMD wasm module plus its interface.

**Status: a spike.** The kernel and interface are safe and tested, but this is
not wired into `src/`, has no entrypoint, and the language choice is unsettled.
See [Open questions](#open-questions).

Layout is a flat array of matrices: one contiguous `Float32Array`, 16 floats per
matrix, column major, resident in wasm memory. Parents precede children, so one
forward pass resolves the tree.

```sh
./build.sh          # needs clang with the wasm32 target and wasm-ld, then re-embeds
./embed.mjs --check # verifies tree.mjs matches the committed .wasm files
node example.mjs    # the API, end to end
node precision.mjs  # f32 drift against f64 as depth grows
pnpm bench "@tree"  # the head to head, from benches/wasm/tree.bench.ts
pnpm test tst/unit/wasm
```

`tree.mjs` is the whole deliverable at 5.3KB with both kernels inlined as
base64. No fetch, no bundler plugin, no async, no dependencies.

| | bytes |
| --- | --- |
| `tree.wasm` | 394 |
| `tree.fma.wasm` | 385 |
| `tree.mjs`, both inlined | 5308 |

## Results

From `benches/wasm/tree.bench.ts`, N=4096 over a 4-ary tree, run with
`@pmndrs/labs`. All five comparators sit in one file so labs interleaves their
blocks and drift hits them equally. `js plain` uses the real `mat4.multiply` and
is the honest baseline, since it is the representation the library uses today.

Averages over seven runs on a 2.05GHz Xeon container, node 22, x64 linux:

| bench | µs/iter | vs js plain |
| --- | --- | --- |
| js plain arrays | ~138 | 1.00x |
| js flat f32 | ~147 | 0.94x |
| wasm scalar | ~113 | 1.22x |
| wasm simd | ~34 | **~4.0x** |
| wasm simd fma | ~32 | ~4.3x |

Read these as one significant figure. **Labs reports this machine as unstable**,
with a comparison resolution of about ±7.5%, within-process noise up to ±20% and
clock drift up to 14%. Only the SIMD result is far enough outside that to be
solid. Run-to-run, `js plain / wasm simd` came out 3.83, 3.95, 4.09, 4.15, 4.03,
3.93 and 3.73.

Two consequences of that noise floor:

- **The flat layout is worth roughly 1.2x and SIMD about 3.2x on top of it.**
  Non-SIMD wasm is not worth shipping as a fallback for engines without SIMD,
  since it barely beats JS. The fallback should be the existing JS.
- **The relaxed SIMD gain is not resolvable here.** It measures 1.05x to 1.14x
  against a ±7.5% resolution. It may well be real, but this machine cannot show
  it, so treat the fma kernel as unproven rather than a 1.2x win.

## Memory safety

The kernel takes raw indices from a caller owned buffer, so it treats them as
untrusted. A single unsigned compare, `p >= (unsigned)i`, rejects a root, a
forward reference and an out of range index together, and every one of them is
treated as a root. So `0 <= p < i < n` always holds on the multiply path and no
read can leave the buffer, whatever the parent array contains. It costs nothing
measurable and no bytes.

A malformed tree therefore produces wrong values rather than corrupt memory.
`validate()` returns the first offending index, or -1.

On the JS side `createTree` rejects a capacity that is not a non negative
integer or is larger than a 4GiB wasm memory holds, and `update` rejects a count
outside `[0, capacity]` before calling the kernel.

## Layout and kernel shape

Measured with an ad hoc harness before the bench moved to labs, so treat the
small numbers as indicative and only the large one as settled.

| change | effect |
| --- | --- |
| structure of arrays instead of AoS | **0.17x** |
| sibling grouping, parent held in registers | 1.01x best, 0.79x worst |
| `restrict` on the pointers | none |
| 2x unroll | 0.91x |
| `-O3` over `-Oz` | none, so `-Oz` is free at half the size |

The SoA result is the one worth keeping. One AoS matrix is exactly one 64 byte
cache line and a multiply touches three of them contiguously. SoA needs 16 planes
each for parent, local and world, which at N=4096 is 48 concurrent streams over
768KB. The 16 lane broadcasts per node that SoA saves cost far less than the
locality it gives up. So the flat array of matrices is not a compromise made for
GPU interop, it is also the fastest layout.

Sibling grouping was the idea that looked most promising and it does not work.
Runs of siblings let the parent matrix stay in registers across its children,
which sounds like it should pay on a 4-ary tree. It never beat the simple loop.
The parent is already L1 resident, so there is no load worth saving.

Nothing here moved the kernel except SIMD itself, and the simple loop is the
fastest loop.

## Precision

f32 drift against an f64 reference, down a single chain of realistic rotation
plus translation transforms:

| depth | 1 | 16 | 64 | 128 | 255 |
| --- | --- | --- | --- | --- | --- |
| strict | 8.4e-8 | 2.2e-7 | 6.9e-7 | 6.8e-7 | 2.4e-6 |
| fma | 8.4e-8 | 3.4e-7 | 6.9e-7 | 1.6e-6 | 5.1e-6 |

At depth 255 the translation magnitude is about 10.6, so 2.4e-6 absolute is
roughly f32 epsilon in relative terms. Error does not amplify with depth here
because rotations are orthonormal and well conditioned. Ill conditioned matrices
are a different story, and random matrices with entries in [-1, 1] diverge by
1e-3 over 32 levels, but those are not transforms.

So f32 is fine for transform trees, including deep skeletons.

## API

```js
import { createTree, fmaSupported } from './tree.mjs';

const tree = createTree(4096);            // sized once, never grows
// or createTree(4096, { fma: true })     // unproven, see Results

tree.parent[0] = -1;                      // negative means root
for (let i = 1; i < tree.capacity; i++) tree.parent[i] = (i - 1) >> 2;
tree.local.set(matrix, i * 16);

tree.update();                            // world[i] = world[parent[i]] * local[i]
tree.validate();                          // first index that is not a backward reference, or -1
```

`local`, `world` and `parent` are views onto wasm memory, so the kernel reads
them in place. They are the caller's to fill and read, matching the skill's
caller owned state pattern with only the allocation source swapped, and a
`Float32Array` view onto wasm memory measures the same as one on its own
`ArrayBuffer` for JS to touch.

Memory is sized once in `createTree` and never grows, because `memory.grow`
detaches every view already handed out. That is also what the skill's allocate
to capacity rule asks for.

`update` takes an optional count, so a tree can be sized to a capacity and
updated over its live prefix. `validate` is not for hot paths.

## Language

The spike is C because this container had clang and no Zig. For production I
would use **Zig** targeting `wasm32-freestanding` with `ReleaseSmall`:

- Same LLVM backend, so size and codegen match what is measured here.
- `@Vector(4, f32)` supports plain `*` and `+`, so the kernel reads like the
  math. `wasm_f32x4_mul` and `wasm_i32x4_shuffle` are noticeably worse to
  maintain, and the fma path needs a `__builtin_` call in C.
- No runtime, allocator, libc, or imports at all.
- One pinned tarball as the whole toolchain, more reproducible in CI than
  whatever clang the runner ships, which matters because the `.wasm` files are
  committed artifacts.

Rust works with `no_std` and raw `core::arch::wasm32` intrinsics, but they are as
verbose as C's for a heavier toolchain. AssemblyScript carries a runtime and is
not smaller. Emscripten is far too much glue at this size.

Keeping the C is defensible too, since it builds with stock Ubuntu clang and
adds no new toolchain.

## Open questions

- **Measured on one noisy container only.** 2.05GHz x64 linux, node 22. No
  browser, no ARM, no Safari, which is exactly where relaxed SIMD support is in
  doubt. The fma path needs a stable machine to justify shipping at all.
- **Two modules or one?** Both kernels inlined costs about 1KB of base64 for a
  path that is currently unproven. A strict only module would be about 4.3KB.
- **The `.wasm` files are committed** and `embed.mjs --check` guards the base64
  against drift, but nothing yet rebuilds them in CI to prove they match the C.
- Producing the parents before children ordering from a real scene graph is the
  caller's job here. Whether a flattening helper belongs in this library or in a
  renderer integration is open.
- `mat4` has no `fromBuffer` / `toBuffer` where `vec3` and `quat` do, so the
  skill documents `buffer.set(m, i * 16)`. Worth closing if buffer resident
  matrices become normal to hold.
