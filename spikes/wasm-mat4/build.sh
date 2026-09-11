#!/bin/sh
# Builds both kernels. Needs clang with the wasm32 target and wasm-ld.
# -Oz matches -O3 on this kernel and halves the module, so size is free.
set -e
cd "$(dirname "$0")"

common="--target=wasm32 -msimd128 -Oz -flto -nostdlib -ffreestanding
  -Wl,--no-entry -Wl,--export-dynamic -Wl,--export-memory
  -Wl,--initial-memory=1048576 -Wl,--max-memory=4294967296 -Wl,--growable-table
  -Wl,--strip-all -Wl,--lto-O3"

clang $common -o tree.wasm tree.c
clang $common -mrelaxed-simd -DUSE_FMA -o tree.fma.wasm tree.c

# diagnostic only, not shipped. Prices the flat layout separately from SIMD.
clang --target=wasm32 -Oz -flto -nostdlib -ffreestanding \
  -Wl,--no-entry -Wl,--export-dynamic -Wl,--export-memory \
  -Wl,--initial-memory=1048576 -Wl,--max-memory=4294967296 \
  -Wl,--strip-all -Wl,--lto-O3 -o tree.scalar.wasm tree.scalar.c

for f in tree.wasm tree.fma.wasm tree.scalar.wasm; do echo "$f $(stat -c%s $f) bytes"; done

# keep the inlined base64 in tree.mjs in step with the binaries
node ./embed.mjs
