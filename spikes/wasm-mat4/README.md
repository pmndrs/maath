# wasm mat4 spike

A minimal SIMD wasm module for batched 4x4 matrix work, and the measurements
that justify its shape. Exploratory. Nothing here is wired into `src/`.

The assumed layout is a **flat array of matrices**: one contiguous
`Float32Array`, 16 floats per matrix, column major, resident in wasm memory.
That is what `instanceMatrix.array` and `Skeleton.boneMatrices` already are.

```sh
./build.sh        # needs clang with the wasm32 target plus wasm-ld
node example.mjs  # the API, end to end
node bench.mjs    # mat4.wasm is committed, so these run without clang
node tiers.mjs    # residency tiers and the wasm-memory view cost
```

`mat4.mjs` is the whole deliverable at 5.4KB, wasm inlined as base64. No fetch,
no bundler plugin, no async, no dependencies.

## Residency is the whole game

The skill already says state crossing a Wasm boundary lives in a typed array
from the start, so residency is the house pattern rather than something this
design has to work around. What the measurements add is that there are three
tiers, not two, and the gap between the last two is larger than it looks.

Measured at N=4096 on node 22, x86_64, against the current JS `mat4.multiply`
at 87.6us:

| tier | us/frame | vs current JS |
| --- | --- | --- |
| plain `Mat4` tuples, element-wise marshal | 200.4 | 0.44x |
| caller's own `Float32Array`, bulk `.set()` | 45.7 | 1.92x |
| view onto wasm memory, zero copy | 27.0 | **3.24x** |

Tier 1 is the anti-pattern the skill already steers away from, and it is worth
recording only because it is what a drop-in wasm `mat4.multiply` would be. It
costs more than twice doing nothing.

Tier 2 is what "back it with a `Float32Array` at creation" gets you if the array
is allocated the ordinary way. The copy is a bulk memcpy of 768KB, no per element
conversion, and it still costs about 70% on top of the kernel. It nearly halves
the win.

So the module should not merely accept resident buffers, it should be the thing
that allocates them.

## The allocator is the API

A `Float32Array` view onto wasm memory costs JS nothing to touch compared to one
on its own `ArrayBuffer`:

| | own ArrayBuffer | wasm memory view |
| --- | --- | --- |
| read 64K floats | 47.1us | 48.0us |
| write 64K floats | 59.9us | 60.5us |

Within noise. There is no JS side tax for sourcing long-lived typed arrays from
wasm memory, which means the skill's caller-owned-state pattern carries over
unchanged with only the allocation source swapped:

```ts
export function createWorld(capacity: number) {
    return {
        capacity,
        count: 0,
        // same shape the skill prescribes, allocated so kernels read it in place
        local: wasm.allocMat4(capacity),
        world: wasm.allocMat4(capacity),
    };
}
```

Everything else the skill says still applies to that buffer. It is a flat buffer,
so a single matrix marshals out at the edges the documented way, and
`vec3.fromBuffer` / `quat.fromBuffer` work on it directly.

**The memory must never grow.** `memory.grow` detaches every view, which would
silently invalidate every `Float32Array` the caller is holding. That is a nasty
footgun, and it is also exactly what the skill's "allocate at creation, never per
call, preallocate to capacity" rule already forbids. So: size the memory once at
creation, never grow, and report a count or status when full. The two rules line
up, which is a good sign the shape is right.

## The layout is not a compromise

Flat AoS is required for GPU interop, so the question was how much it costs
against a structure of arrays layout that needs no lane broadcasts. It costs
nothing. It is 5.5x faster.

Min of many trials, since a single timed run puts v1 and v2 anywhere between
0.97x and 1.15x of each other:

| kernel | us/frame | ns/matrix | vs v1 |
| --- | --- | --- | --- |
| v1 AoS, serial add chain | 18.8 | 4.58 | 1.00x |
| v2 AoS, tree reduction | 18.8 | 4.59 | 1.00x |
| v3 AoS, tree plus 2x unroll | 20.6 | 5.02 | 0.91x |
| v4 SoA, 4 wide, no broadcasts | 107.8 | 26.31 | **0.17x** |

One matrix in AoS is exactly one 64 byte cache line, and a multiply touches
three of them contiguously. The SoA kernel needs 16 planes each for a, b and
out, so at N=4096 that is 48 concurrent streams over 768KB and it thrashes L2.
The 16 lane broadcasts per matrix that SoA saves are far cheaper than the
locality it gives up.

Tree reduction measures as exactly neutral, so the shorter dependency chain is
not what limits this kernel and LLVM was likely already reassociating it. It is
in the shipped kernel only because it reads no worse. Unrolling to two matrices
per iteration is reliably slower, so there is no instruction level parallelism
left to extract and the loop should stay simple.

Only the layout result is large enough to act on. The two microoptimisations are
noise and a regression respectively.

## API

The public functions take the views themselves and derive pointers from
`byteOffset`, so callers never see a pointer, and a buffer that is not resident
is rejected rather than silently misread.

```js
import { createMat4Wasm } from './mat4.mjs';

const wasm = createMat4Wasm(4096 * 4);   // sized once, never grows

const local = wasm.allocMat4(4096);      // Float32Array view, 4096 * 16
const world = wasm.allocMat4(4096);
const parent = wasm.allocIndex(4096);    // Int32Array, negative meaning root

wasm.compose(local, pos, rot, scl);      // TRS compose, per instance
wasm.hierarchy(world, local, parent);    // world[i] = world[parent[i]] * local[i]
wasm.multiplyBroadcast(out, viewProj, world);
```

`count` defaults to `view.length / 16`, so the common call passes only buffers.
`supported()` validates the real module rather than a stand in probe, so the
check cannot drift from the features the kernels actually use.

## Where the speedup comes from

| build | ns/matrix | note |
| --- | --- | --- |
| JS, plain arrays | 23.0 | today |
| wasm, no SIMD | 16.4 | flat contiguous layout only |
| wasm, f32x4 SIMD | 5.5 | layout plus SIMD |

Flat layout alone buys about 1.4x. SIMD multiplies that by a further 3.0x. Both
matter and SIMD is the larger factor, but note that a non-SIMD wasm fallback is
only 1.4x over JS and is not worth shipping as a second binary. The fallback for
engines without SIMD should be the existing JS, not a scalar wasm module.

## Scaling

Speedup is flat from small N upward, so there is no large batch threshold to
clear once the data is resident.

| N | 1 | 16 | 64 | 256 | 1024 | 4096 | 16384 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| speedup | 2.8x | 3.6x | 3.8x | 4.2x | 3.9x | 3.8x | 3.8x |

## Workloads shaped like three.js

| kernel | JS | wasm | speedup |
| --- | --- | --- | --- |
| `hierarchy`, scene graph propagation | 95.4us | 26.5us | 3.60x |
| `mul_broadcast`, viewProjection times N world matrices | 102.0us | 20.0us | 5.11x |
| `compose_batch`, TRS compose for instancing | n/a | 21.4us | 5.21 ns/instance |

## Design

**Batch only.** No per matrix entrypoint. Every export takes a count and a
pointer. A single matrix multiply through wasm measured 0.47x, so exposing one
would only invite misuse.

**The module allocates, the caller owns.** It exports its `WebAssembly.Memory`
and hands out `Float32Array` views. The caller still owns the buffer and its
lifecycle exactly as the skill describes, the module only decides where it lives.
See the allocator section above for why accepting a foreign `Float32Array` is a
supported fallback rather than the main path.

**f32, deliberately.** Max error against the f64 JS path is 3.5e-7, pure f32
rounding. For data headed to the GPU that is free, since it would be downcast at
upload anyway. For deep hierarchies or authoring math it accumulates, so the JS
f64 path should remain the default and the wasm path should be reserved for GPU
bound data. f64x2 SIMD is only 2 wide and would not beat the JIT by enough to
justify a second code path.

**Stay under 4KB.** At 1226 bytes the module is under V8's 4KB limit for
synchronous `WebAssembly.Module` construction on the main thread. That means no
`await init()` anywhere in the public API, which is a significant DX win, and it
is worth defending as a hard budget as kernels are added. Inline the bytes as
base64 in the JS rather than fetching, so there is no loader, no bundler plugin
and no async, identical in node, bundlers and from a CDN.

**No threads.** SharedArrayBuffer needs COOP and COEP headers, which breaks CDN
embeds and most three.js demo hosting. Not worth it.

**No relaxed SIMD.** `f32x4.relaxed_madd` would give FMA and roughly 25% on these
mul-add chains, but it is unavailable in Safari and it is explicitly allowed to
fuse or not fuse per engine, so results would differ across devices. For a math
library used in networked simulation and replay that is a bad trade. Revisit
behind an explicit opt in.

## Language

The spike is C because this container had clang but no Zig. For production I
would use **Zig** targeting `wasm32-freestanding` with `ReleaseSmall`:

- Same LLVM backend, so byte size and codegen match what is measured here.
- `@Vector(4, f32)` supports plain `*` and `+`, so kernels read like the math.
  The C intrinsics (`wasm_f32x4_mul`, `wasm_i32x4_shuffle`) are noticeably worse
  to maintain.
- No runtime, no allocator, no libc, no imports at all.
- One pinned tarball as the whole toolchain, which is more reproducible in CI
  than whatever clang the runner ships. That matters because the `.wasm` is a
  committed artifact.

Rust would also work with `no_std` and raw `core::arch::wasm32` intrinsics, but
the intrinsics are as verbose as C's and the toolchain is heavier for no gain.
AssemblyScript is the wrong pick here, it carries a runtime and is not smaller.
Emscripten is far too much glue for a module this size.

Keeping the C is also defensible: it builds today with stock Ubuntu clang and
adds no new toolchain.

## Integrating with three.js

Ranked by payoff, driven entirely by whether the data is already a
`Float32Array`:

1. **InstancedMesh.** `instanceMatrix.array` is already a `Float32Array`, and
   three does not care where it came from, so
   `new InstancedBufferAttribute(wasm.allocMat4(count), 16)` puts it in tier 3
   with no changes to three. Zero copy in both directions, and `compose_batch`
   maps directly onto it. Best target by a wide margin.
2. **Skinning.** `Skeleton.boneMatrices` is also a `Float32Array`. Same shape.
3. **Frustum culling.** Big work per call and the result is a bitmask, so the
   crossing cost is negligible. Not a matrix multiply but the best work to
   crossing ratio available.
4. **updateMatrixWorld.** Needs a flat parent index array, and three's
   `Object3D` graph is pointer chasing, so this means maintaining a flat mirror
   of the scene graph. Much bigger lift, and a good share of the win would come
   from flattening rather than from SIMD.

The first two need no changes to three at all, only that the typed array is
allocated from wasm memory rather than by three. Anything that hands you an
array three already allocated is tier 2 at best, which is roughly half the win,
so the integration point is always the constructor.

## Open questions

- Does `math/wasm` want to be a separate entrypoint, or a separate package so the
  core stays dependency and artifact free? The allocator makes this less obviously
  separable, since it wants to be the source of long-lived buffers.
- `hierarchy` needs parents to precede children. Producing that flat order from
  a three `Object3D` graph means maintaining a mirror. In this library's scope,
  or a renderer integration's?
- Committed `.wasm` artifact plus a checked in build, or build in CI?
- `mat4` has no `fromBuffer` / `toBuffer` where `vec3` and `quat` do, so the skill
  documents `buffer.set(m, i * 16)` instead. Worth closing that gap if buffer
  resident matrices become a normal thing to hold.
