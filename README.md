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

### Contributing

Do you want to add something? No rules, but keep these in mind:

- try to add explainers to whatever function you add, if you saw it in a tweet link that!
- add a cool example! Make it a sandbox or whatever, just show how the function can be used creatively
- keep copy-paste simple. Try not to add too many inter-dependencies so the functions are copy-paste friendly
- loose typing. Try to add typing, but don't go crazy with generics and complexity

If you are not sure how to help, check out the [🟡 Roadmap](#🟡-roadmap) below.
## Functions

### Random

Functions that give distributions of points in a space. Notice how we use IN and ON in the function names to determine wether the points are in the volume or on the surface.

- **inCircle**: random points in a circle of given radius
- **onCircle**: random points on the circumference of a circle of given radius

- **inSphere**: random uniform points in a sphere of given radius
- **onSphere**: random uniform points on the surface of a sphere of given radius

### Misc

- **fibonacciOnSphere**: a Fibonacci lattice mapped on the surface of a sphere of given radius


### 🟡 Roadmap

- Make the random generator seedable for every function
- Figure out a good API for vectors
- Figure out a good API for functions that might work on both buffers and arrays of vectors
- Fix type errors that might come from using different vector libs
- Keep adding tests

