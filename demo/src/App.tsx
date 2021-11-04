import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Point } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  Euler,
  MathUtils,
  NormalBlending,
  Quaternion,
  Vector3,
} from "three";

import "./materials";

import { inSphere } from "maath/random";
import { lerpBuffers } from "maath/buffer";
import { useControls } from "leva";

import { translateBuffer, rotateBuffer } from "maath/buffer/fn";
import { onCircle, onSphere, inBox } from "maath/random/fn";

// prettier-ignore
// @ts-ignore
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

function LerpBuffers() {
  const [{ geometry, box, sphere }] = useState(() => {
    // @ts-ignore
    const box = pipe(
      () => new Float32Array(10_000 * 3),
      inBox({ sides: [1, 3, 1] }),
      translateBuffer([0, 1, 0])
    )();

    const sphere = inSphere(new Float32Array(10_000 * 3), { radius: 1 });

    const final = sphere.slice(0);

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(final, 3));

    return { geometry, box, sphere };
  });

  useFrame(({ clock }) => {
    const t = (Math.sin(clock.getElapsedTime()) + 1) * .5;

    const q = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0).normalize(), (t) * 0.1)

    rotateBuffer(box, {
      q,
    });

    lerpBuffers(
      box,
      sphere,
      geometry.getAttribute("position").array as Float32Array,
      0
    );

    geometry.attributes.position.needsUpdate = true;
  });

  const props = useControls({
    uFocus: { value: 5, min: 3, max: 7, step: 0.01 },
    aperture: { value: 3, min: 1, max: 5.6, step: 0.1 },
    uFov: { value: 0, min: 0, max: 200 },
  });

  return (
    <points>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial size={0.02} />
      {/* @ts-ignore */}
      {/* <dofPointsMaterial transparent color="white" blending={NormalBlending} depthWrite={false} {...props} uBlur={(5.6 - props.aperture) * 9} /> */}
    </points>
  );
}

function App() {
  return (
    <Canvas linear camera={{ position: [0, 0, 6], fov: 25 }}>
      <axesHelper />
      <LerpBuffers />
      <OrbitControls />
      <color args={["#080406"]} attach="background" />
    </Canvas>
  );
}

export default App;
