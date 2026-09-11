# math

math is a collection of math helpers for graphics and simulations.

- **High performance**: allocation-free, monomorphic, benchmarked
- **Tiny**: mean and lean, tree-shakable, only pay for what you use
- **Portable**: interops with WebGL, WebGPU, Wasm, your favourite renderer, more.
- **Data-oriented**: data-in, data-out functions over caller-owned data, without owning the data lifecycle.

```sh
> npm install math@canary
```

## What's inside

| Import | Description | Contents |
| --- | --- | --- |
| [`math`](API.md#api-math) | Vectors, quaternions, euler angles & matrices | [`vec2`](API.md#api-math-vec2) [`vec3`](API.md#api-math-vec3) [`vec4`](API.md#api-math-vec4) [`euler`](API.md#api-math-euler) [`quat`](API.md#api-math-quat) [`quat2`](API.md#api-math-quat2) [`mat2`](API.md#api-math-mat2) [`mat2d`](API.md#api-math-mat2d) [`mat3`](API.md#api-math-mat3) [`mat4`](API.md#api-math-mat4) [`spherical`](API.md#api-math-spherical) [`polar`](API.md#api-math-polar) [`EPSILON`](API.md#epsilon) [`round`](API.md#round) [`equals`](API.md#equals) [`fade`](API.md#fade) [`lerp`](API.md#lerp) [`lagrange`](API.md#lagrange) [`binomial`](API.md#binomial) [`clamp`](API.md#clamp) [`repeat`](API.md#repeat) [`remap`](API.md#remap) [`remapClamp`](API.md#remapclamp) [`DEGREES_TO_RADIANS`](API.md#degrees_to_radians) [`RADIANS_TO_DEGREES`](API.md#radians_to_degrees) [`degreesToRadians`](API.md#degreestoradians) [`radiansToDegrees`](API.md#radianstodegrees) [`wrapAngle`](API.md#wrapangle) [`deltaAngle`](API.md#deltaangle) |
| [`math/shapes`](API.md#api-math-shapes) | Shape primitives & spatial queries | [`box2`](API.md#api-math-shapes-box2) [`box3`](API.md#api-math-shapes-box3) [`obb3`](API.md#api-math-shapes-obb3) [`plane3`](API.md#api-math-shapes-plane3) [`sphere`](API.md#api-math-shapes-sphere) [`circle`](API.md#api-math-shapes-circle) [`segment2`](API.md#api-math-shapes-segment2) [`polygon2`](API.md#api-math-shapes-polygon2) [`triangle2`](API.md#api-math-shapes-triangle2) [`triangle3`](API.md#api-math-shapes-triangle3) [`raycast3`](API.md#api-math-shapes-raycast3) [`frustum`](API.md#api-math-shapes-frustum) |
| [`math/geometry`](API.md#api-math-geometry) | Geometric algorithms | [`circumcircle`](API.md#circumcircle) [`decomposePolygon2Quick`](API.md#decomposepolygon2quick) [`decomposePolygon2Quality`](API.md#decomposepolygon2quality) [`triangulatePolygon2`](API.md#triangulatepolygon2) [`quickhull2`](API.md#quickhull2) [`quickhull3`](API.md#quickhull3) |
| [`math/time`](API.md#api-math-time) | Easing & spring animation | [`easing`](API.md#api-math-time-easing) [`spring`](API.md#api-math-time-spring) [`spring2`](API.md#api-math-time-spring2) [`spring3`](API.md#api-math-time-spring3) [`spring4`](API.md#api-math-time-spring4) |
| [`math/random`](API.md#api-math-random) | Seeded random number generators | [`isaac32`](API.md#api-math-random-isaac32) [`isaac64`](API.md#api-math-random-isaac64) [`mulberry32`](API.md#api-math-random-mulberry32) [`random`](API.md#api-math-random-random) |
| [`math/noise`](API.md#api-math-noise) | Perlin, simplex & worley noise, plus fractal helpers | [`perlin2d`](API.md#api-math-noise-perlin2d) [`perlin3d`](API.md#api-math-noise-perlin3d) [`simplex2d`](API.md#api-math-noise-simplex2d) [`simplex3d`](API.md#api-math-noise-simplex3d) [`simplex4d`](API.md#api-math-noise-simplex4d) [`worley2d`](API.md#api-math-noise-worley2d) [`worley3d`](API.md#api-math-noise-worley3d) [`fbm`](API.md#fbm) [`ridged`](API.md#ridged) [`billow`](API.md#billow) [`domainWarp2`](API.md#domainwarp2) [`domainWarp3`](API.md#domainwarp3) [`curl2`](API.md#curl2) [`curl3`](API.md#curl3) |
| [`math/color`](API.md#api-math-color) | Color & colorspace utilities | [`color`](API.md#api-math-color-color) [`colorspace`](API.md#api-math-color-colorspace) [`hsl`](API.md#api-math-color-hsl) |
| [`math/ik`](API.md#api-math-ik) | Inverse kinematics | [`fabrik2`](API.md#api-math-ik-fabrik2) [`fabrik3`](API.md#api-math-ik-fabrik3) |
| [`math/three`](API.md#api-math-three) | Zero-copy bridge to three.js: extend a scene so math drives its transforms | [`extend`](API.md#extend) [`extendObject`](API.md#extendobject) [`propagate`](API.md#propagate) [`release`](API.md#release) [`transformOf`](API.md#transformof) [`unextend`](API.md#unextend) [`claimTransform`](API.md#claimtransform) [`frustumFromCamera`](API.md#frustumfromcamera) [`instanceMat4Views`](API.md#instancemat4views) [`mat4Of`](API.md#mat4of) [`quatFromQuaternion`](API.md#quatfromquaternion) [`quatToQuaternion`](API.md#quattoquaternion) [`sphereToWorld`](API.md#spheretoworld) [`vec3FromAttribute`](API.md#vec3fromattribute) [`vec3FromVector3`](API.md#vec3fromvector3) [`vec3ToAttribute`](API.md#vec3toattribute) [`vec3ToVector3`](API.md#vec3tovector3) |


## Quick Start

```ts
import { type Vec3, vec3 } from 'math';

// math types are plain arrays — the constructors just return literals:
const a: Vec3 = [1, 2, 3]; // a plain-array literal
const b = vec3.fromValues(1, 2, 3); // the same as `a`
const out = vec3.create(); // returns [0, 0, 0]

// functions write into their first argument, so nothing is allocated:
vec3.add(out, a, b); // out = [2, 4, 6]
vec3.normalize(out, out); // aliasing an argument is fine
```

The library is grouped by domain behind subpath entrypoints. All APIs are highly tree-shakeable, only pay for what you use:

```ts
import { mat4, quat, vec3 } from 'math'; // core: vectors, quats, matrices
import { simplex3d } from 'math/noise'; // perlin / simplex noise
import { mulberry32 } from 'math/random'; // seeded rng
import { easing, spring } from 'math/time'; // easings & springs
import { fabrik2, fabrik3 } from 'math/ik'; // inverse kinematics
// Other modules: math/color, math/geometry, math/shapes and math/three.
```

## Examples

<table>
  <tr>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-look-at">
        <img src="./examples/public/screenshots/example-look-at.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Look At
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-fibonacci-sphere">
        <img src="./examples/public/screenshots/example-fibonacci-sphere.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Fibonacci Sphere
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-contains-point">
        <img src="./examples/public/screenshots/example-contains-point.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Contains Point
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-convex-hull-3d">
        <img src="./examples/public/screenshots/example-convex-hull-3d.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Convex Hull 3D
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-convex-hull-2d">
        <img src="./examples/public/screenshots/example-convex-hull-2d.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Convex Hull 2D
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-polygon2-decomposition">
        <img src="./examples/public/screenshots/example-polygon2-decomposition.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Polygon2 Decomposition
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-polygon2-triangulation">
        <img src="./examples/public/screenshots/example-polygon2-triangulation.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Polygon2 Triangulation
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-circumcircle">
        <img src="./examples/public/screenshots/example-circumcircle.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Circumcircle
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-fabrik-2d">
        <img src="./examples/public/screenshots/example-fabrik-2d.png" width="180" height="120" style="object-fit:cover;"/><br/>
        FABRIK 2D
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-fabrik-2d-snek">
        <img src="./examples/public/screenshots/example-fabrik-2d-snek.png" width="180" height="120" style="object-fit:cover;"/><br/>
        FABRIK 2D Snek
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-fabrik-3d">
        <img src="./examples/public/screenshots/example-fabrik-3d.png" width="180" height="120" style="object-fit:cover;"/><br/>
        FABRIK 3D
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-flow-field">
        <img src="./examples/public/screenshots/example-flow-field.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Flow Field
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-color-wheel">
        <img src="./examples/public/screenshots/example-color-wheel.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Color Wheel
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-ridged-noise-voxel-terrain">
        <img src="./examples/public/screenshots/example-ridged-noise-voxel-terrain.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Ridged Noise Voxel Terrain
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-simplex-4d-looping-noise">
        <img src="./examples/public/screenshots/example-simplex-4d-looping-noise.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Simplex 4D Looping Noise
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-simplex-2d-noise-terrain">
        <img src="./examples/public/screenshots/example-simplex-2d-noise-terrain.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Simplex 2D Noise Terrain
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-quaternion-slerp">
        <img src="./examples/public/screenshots/example-quaternion-slerp.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Quaternion Slerp
      </a>
    </td>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-spring">
        <img src="./examples/public/screenshots/example-spring.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Spring
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://pmndrs.github.io/math/examples/#example-easing">
        <img src="./examples/public/screenshots/example-easing.png" width="180" height="120" style="object-fit:cover;"/><br/>
        Easing
      </a>
    </td>
  </tr>
</table>

## Documentation

- **[API.md](./API.md)** — every export with its signature and a one-line description, grouped by module. Flat and greppable, so it's easy to search or hand to an AI coding assistant.
- **[Online API docs](https://pmndrs.github.io/math/docs/)** — the full typedoc reference, with search and cross-links.
- **[What's inside](#whats-inside)** — jump straight to a module or namespace.

## Acknowledgements:

- The vec*, quat*, mat* code started life as a port of mathcat, which started as a TypeScript port of glMatrix (https://glmatrix.net/)
- The simplex noise is adapted from https://github.com/josephg/noisejs
- Thank you [@kaleb](https://github.com/kaleb) for the npm package name!
