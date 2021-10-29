# Maath

A collection of useful math helpers, random generators, bits and bobs. 

### Usage

```bash
yarn add maath
```

The library is mostly meant to be used with [three.js](https://github.com/mrdoob/three.js/), so if you are using it outside of a three project, make sure you check the source and - if you don't need the dep - just copy paste!

### But why?

Yes, there are a lot of these libraries. The more the merrier! We are all here to learn, and maintaining a dedicated library for our creative endeavors at [Poimandres](https://github.com/pmndrs) just made sense!

### Contributing

Do you want to add something? No rules, but keep these in mind:

- no elitism, whatever goes, no matter how small or simple
- try to add explainers to whatever function you add, if you saw it in a tweet link that!
- add a cool example! Make it a sandbox or whatever, just show how the function can be used creatively
- keep copy-paste simple. Try not to add too many inter-dependencies so the functions are copy-paste friendly
- loose typing. Try to add typing, but don't go crazy with generics and complexity

### Functions

#### Distributions

Functions that give distributions of points in a space. Notice how we use IN and ON in the function names to determine wether the points are in the volume or on the surface.

- **randomInCircle**: random points in a circle of given radius
- **randomOnCircle**: random points on the circumference of a circle of given radius

- **randomInSphere**: random uniform points in a sphere of given radius
- **randomOnSphere**: random uniform points on the surface of a sphere of given radius

- **fibonacciOnSphere**: a Fibonacci lattice mapped on the surface of a sphere of given radius