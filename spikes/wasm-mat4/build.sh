#!/bin/sh
# Builds the SIMD kernel. Needs clang with the wasm32 target and wasm-ld.
# -Oz plus LTO keeps the module under the 4KB V8 sync compile limit.
set -e
cd "$(dirname "$0")"
clang --target=wasm32 -msimd128 -Oz -flto -nostdlib -ffreestanding \
  -Wl,--no-entry -Wl,--export-dynamic -Wl,--export-memory \
  -Wl,--initial-memory=16777216 -Wl,--strip-all -Wl,--lto-O3 \
  -o mat4.wasm mat4.c
echo "mat4.wasm $(stat -c%s mat4.wasm) bytes"

# layout and kernel variants behind the table in the README
clang --target=wasm32 -msimd128 -Oz -flto -nostdlib -ffreestanding \
  -Wl,--no-entry -Wl,--export-dynamic -Wl,--export-memory \
  -Wl,--initial-memory=33554432 -Wl,--strip-all -Wl,--lto-O3 \
  -o variants.wasm variants.c
echo "variants.wasm $(stat -c%s variants.wasm) bytes"
