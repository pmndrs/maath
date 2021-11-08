[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

<a href="https://github.com/pmndrs/maath"><img src="https://github.com/pmndrs/maath/blob/main/hero.svg?raw=true" /></a>
<br />

```bash
yarn add maath
```

This is a collection of useful math helpers, random generators, bits and bobs. 

The library is mostly meant to be used with [three.js](https://github.com/mrdoob/three.js/), so if you are using it outside of a three project, make sure you check the source and - if you don't need the dep - just copy paste!

> 🟡 The library is still heavily WIP, don't use it for production work until a stable API is relased in a ^1.0.0

### But why?

Yes, there are a lot of these libraries. The more the merrier! We are all here to learn, and maintaining a dedicated library for our creative endeavors at [Poimandres](https://github.com/pmndrs) just made sense.

## Contributing

Do you want to add something? No rules, but keep these in mind:

- try to add explainers to whatever function you add, if you saw it in a tweet link that!
- add a cool example! Make it a sandbox or whatever, just show how the function can be used creatively
- keep copy-paste simple. Try not to add too many inter-dependencies so the functions are copy-paste friendly
- loose typing. Try to add typing, but don't go crazy with generics and complexity

If you are not sure how to help, check out the [🟡 Roadmap](#-roadmap) below.
## 🪶 Reference

### Buffer

```js
import * as buffer from 'maath/buffer'
```

#### 🪶 toVectorArray(buffer, stride)

Converts an `[..., x, y, z, ...]` typed array to a `Vector[]`

```js
const myBuffer = new Float32Array(100 * 3)
const myArray = toVectorArray(myBuffer, 3) 
```

#### 🪶 swizzleBuffer(buffer, axes)

[Swizzle](https://en.wikipedia.org/wiki/Swizzling_(computer_graphics)) the individual vectors in a vector buffer

```js
const myBuffer = new Float32Array(100 * 3)
myBuffer.push(0, 1, 2)

swizzleBuffer(myBuffer, 'xzy') // buffer is now [0, 2, 1] 
```

This is a way to make simple rotations.

#### 🪶 addAxis(buffer, getZValue)

Adds a z axis to an `[..., x, y, ...]` typed array:

```js
const my2DBuffer = new Float32Array(100 * 2)

const my3DBuffer = addAxis(my2DBuffer, () => Math.random()) // zAxis will now be a random value between 0 and 1
```

#### 🪶 lerpBuffers(bufferA, bufferB, destinationBuffer, t)

Linearly interpolate two buffers, writing on a third one.

```js
const mySphere = inSphere(new Float32Array(100 * 3), { radius: 4 })
const myBox = inBox(new Float32Array(100 * 3), { side: 4 })

const interpolationTarget = myBox.slice(0)

lerpBuffers(mySphere, myBox, interpolationTarget, Math.sin(performance.now()))
```

### Easing

```js
import * as easing from 'maath/easing'
```

TBD

### Matrix

```js
import * as matrix from 'maath/matrix'
```

#### 🪶 determinant2(...matrixInRowMajorOrder)

Returns the determinant of a passed 2x2 matrix:

```js
const d = determinant2(
  1, 1,
  2, 2
)
```

#### 🪶 determinant3(...matrixInRowMajorOrder)

Returns the determinant of a passed 3x3 matrix:

```js
const d = determinant3(
  1, 1, 1,
  2, 2, 2
)
```

#### 🪶 determinant4(...matrixInRowMajorOrder) // TBD

#### 🪶 getMinor(matrix, column, row) 

Returns the [minor](https://en.wikipedia.org/wiki/Minor_(linear_algebra)) of a given matrix.

```js
const minor = getMinor([
  1, 2, 1,
  2, 1, 1,
  3, 2, 3
], 1, 1)

// minor will be the determinant of the submatrix without row 1 and colum 1
// | 1 1 |
// | 2 3 |
```

### Misc

```js
import * as misc from 'maath/misc'
```

TBD

### Random

```js
import * as random from 'maath/random'
```

#### 🪶 onTorus(buffer, { innerRadius, outerRadius })

[TODO](https://math.stackexchange.com/questions/2017079/uniform-random-points-on-a-torus)

#### 🪶 inTorus(buffer, { innerRadius, outerRadius })

[TODO](https://answers.unity.com/questions/1259394/finding-random-position-in-torus.html)

### Triangle

```js
import * as triangle from 'maath/triangle'
```

TBD


## Inspiration

The kitchen-sink nature of the library was inspired by other projects that manage to bring together an immense amount of knowledge from different domains that would otherwise be fragmented in many places or even lost:

- [drei](https://github.com/pmndrs/drei) 🌭 useful helpers for react-three-fiber
- [lygia](https://github.com/patriciogonzalezvivo/lygia) a granular and multi-language shader library designed for performance and flexibility

## 🟡 Roadmap

- Make the random generator seedable for every function
- Figure out a good API for vectors
- Figure out a good API for functions that might work on both buffers and arrays of vectors
- Fix type errors that might come from using different vector libs
- Keep adding tests
- Figure out if we can get rid of the Three.js dependency. While useful, it feels superfluous 


