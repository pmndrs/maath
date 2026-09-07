# wasm mat4 spike

A minimal SIMD wasm module for batched 4x4 matrix work, and the measurements
that justify its shape. Exploratory. Nothing here is wired into `src/`.

```sh
./build.sh      # needs clang with the wasm32 target plus wasm-ld
node bench.mjs  # mat4.wasm is committed, so this runs without clang
```

## The constraint that decides everything

`Mat4` in this library is a plain JS array of 16 doubles. Wasm cannot read that.
Every matrix has to be converted to f32 and stored into linear memory before a
kernel can touch it, then read back out. That marshalling costs more than the
multiply it enables.

Measured at N=4096 on node 22, x86_64:

| path | us/frame | vs current JS |
| --- | --- | --- |
| JS plain arrays (current `mat4.multiply`) | 87.6 | 1.00x |
| wasm SIMD, buffers already resident | 27.4 | **3.84x** |
| wasm SIMD, marshal plain arrays in and out | 200.4 | **0.44x** |

Marshalling does not merely erase the win, it costs more than twice what doing
nothing costs. A drop-in `mat4.multiply` backed by wasm would be a large
regression. The only design that pays is one where the data already lives in
wasm memory and stays there across frames.

The JS to wasm call itself is cheap, about 8 ns. Copying is the entire problem.

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

**The module owns the memory.** It exports its `WebAssembly.Memory` and the
caller gets `Float32Array` views onto it. Callers keep their matrices there
between frames. This still fits the library's data in, data out philosophy: the
caller owns the buffer and its lifecycle, the module just says where it can live.
Views must be rebuilt after any `memory.grow`, which detaches them.

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

1. **InstancedMesh.** `instanceMatrix.array` is already a `Float32Array`. Back it
   with a view into wasm memory and it is zero copy in both directions. Best
   target by a wide margin, and `compose_batch` maps directly onto it.
2. **Skinning.** `Skeleton.boneMatrices` is also a `Float32Array`. Same shape.
3. **Frustum culling.** Big work per call and the result is a bitmask, so the
   crossing cost is negligible. Not a matrix multiply but the best work to
   crossing ratio available.
4. **updateMatrixWorld.** Needs a flat parent index array, and three's
   `Object3D` graph is pointer chasing, so this means maintaining a flat mirror
   of the scene graph. Much bigger lift, and a good share of the win would come
   from flattening rather than from SIMD.

The first two need no changes to three at all, only that the typed array is
allocated from wasm memory.

## Open questions

- Is a flat SoA mirror of the scene graph acceptable in this library's scope, or
  does that belong in a consumer such as a renderer integration?
- Committed `.wasm` artifact plus a checked in build, or build in CI?
- Does `math/wasm` want to be a separate entrypoint, or a separate package so the
  core stays dependency and artifact free?
