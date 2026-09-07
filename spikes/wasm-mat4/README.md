# wasm tree matrix multiply

`world[i] = world[parent[i]] * local[i]` over a parent/child graph, as a minimal
SIMD wasm module plus its interface. Exploratory. Nothing here is wired into
`src/`.

Layout is a **flat array of matrices**: one contiguous `Float32Array`, 16 floats
per matrix, column major, resident in wasm memory. Parents precede children, so
one forward pass resolves the whole tree.

```sh
./build.sh         # needs clang with the wasm32 target and wasm-ld
node example.mjs   # the API, end to end
node bench.mjs     # the .wasm files are committed, so these run without clang
node precision.mjs # f32 drift against f64 as depth grows
```

`tree.mjs` is the whole deliverable at 4.0KB with both kernels inlined as
base64. No fetch, no bundler plugin, no async, no dependencies.

| | bytes |
| --- | --- |
| `tree.wasm` | 394 |
| `tree.fma.wasm` | 385 |
| `tree.mjs`, both inlined | 4026 |

## Results

N=4096, min of trials, node 22 on x86_64. `JS plain` is the representation the
library uses today, and it is the honest baseline because JS is about 1.4x
faster on plain arrays than on a flat `Float32Array`.

| shape | JS flat | JS plain | wasm | wasm+fma | vs plain | fma |
| --- | --- | --- | --- | --- | --- | --- |
| 4-ary (scene graph) | 126.9us | 89.4us | 19.1us | 16.4us | **4.67x** | 1.16x |
| binary | 131.2us | 92.5us | 20.9us | 16.3us | 4.43x | 1.28x |
| chains of 32 (skeleton) | 127.8us | 86.5us | 23.3us | 22.5us | 3.72x | 1.04x |
| flat under one root | 127.1us | 95.0us | 18.8us | 16.3us | 5.06x | 1.15x |

Cost per node is flat from 1K to 262K nodes, so the parent gather does not
become a scaling problem as the working set leaves cache.

| N | 1024 | 4096 | 16384 | 65536 | 262144 |
| --- | --- | --- | --- | --- | --- |
| wasm ns/node | 4.75 | 4.60 | 4.80 | 5.19 | 5.23 |
| vs JS plain | 4.18x | 5.00x | 4.75x | 4.67x | 4.67x |

## The kernel is issue bound, which settles the rest

Per node the kernel issues roughly 56 uops: 16 multiplies, 12 adds, 16 lane
broadcasts, 8 loads and 4 stores. At 4.6ns on a 3GHz core that is about 4 uops
per cycle, which is the issue width of the core. There is no stall to hide.

That model predicts what helps and what cannot, and the measurements agree:

| change | effect | why |
| --- | --- | --- |
| relaxed SIMD fma | **1.16x to 1.28x** | removes 12 of 56 uops, predicted 1.2x |
| sibling grouping, parent held in registers | 1.01x at best, 0.79x at worst | the parent is already L1 resident |
| `restrict` on the pointers | none | the gather blocks the reordering it would allow |
| 2x unroll | 0.91x | no instruction level parallelism left to extract |
| `-O3` over `-Oz` | none | so `-Oz` is free, at half the size |
| structure of arrays | 0.17x | 48 concurrent streams thrash L2 |

Sibling grouping was the idea that looked most promising and it does not work.
Runs of siblings let the parent matrix stay in registers across its children,
which sounds like it should pay on a 4-ary tree. It measures 1.01x on the shape
it was designed for and loses up to 21% on shapes with short runs, because the
branch to detect runs costs more than the load it saves.

The structure of arrays result is the one worth keeping in mind for anything
else here. One AoS matrix is exactly one 64 byte cache line and a multiply
touches three of them contiguously. SoA needs 16 planes each for parent, local
and world, which at N=4096 is 48 concurrent streams over 768KB. The 16 lane
broadcasts per node that SoA saves cost far less than the locality it gives up.

So the flat array of matrices is not a compromise made for GPU interop. It is
also the fastest layout, and the simple loop is the fastest loop.

## Relaxed SIMD

`f32x4.relaxed_madd` is the only real lever, and it is opt in rather than the
default because engines are free to fuse or not, so results differ slightly
between them. That matters for networked simulation and replay and not much
otherwise.

Its gain tracks the issue bound model exactly. Bushy trees are issue bound and
gain 1.16x to 1.28x. Chains of 32 gain only 1.04x, because a chain is latency
bound on the parent dependency and fma cuts uop count rather than latency.

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

So f32 is fine for transform trees, including deep skeletons, and fma costs
about a factor of two in drift while staying in the same range.

## API

```js
import { createTree, fmaSupported } from './tree.mjs';

const tree = createTree(4096);            // sized once, never grows
// or createTree(4096, { fma: true })     // about 1.2x, engine dependent results

tree.parent[0] = -1;                      // negative means root
for (let i = 1; i < tree.capacity; i++) tree.parent[i] = (i - 1) >> 2;
tree.local.set(matrix, i * 16);

tree.update();                            // world[i] = world[parent[i]] * local[i]
tree.validate();                          // first index whose parent follows it, or -1
```

`local`, `world` and `parent` are views onto wasm memory, so the kernel reads
them in place. They are the caller's to fill and read, matching the skill's
caller owned state pattern with only the allocation source swapped, and a
`Float32Array` view onto wasm memory measures the same as one on its own
`ArrayBuffer` for JS to touch.

Memory is sized once in `createTree` and never grows, because `memory.grow`
detaches every view already handed out. That is also what the skill's allocate
to capacity rule already asks for.

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

- Two modules or one? Both kernels are inlined, which costs about 1KB of base64
  for a path many callers will not use. A single strict module would be 2.6KB.
- `mat4` has no `fromBuffer` / `toBuffer` where `vec3` and `quat` do, so the
  skill documents `buffer.set(m, i * 16)`. Worth closing if buffer resident
  matrices become normal to hold.
- Producing the parents before children ordering from a real scene graph is the
  caller's job here. Whether a flattening helper belongs in this library or in a
  renderer integration is still open.
