import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, MathUtils } from "three";

import { inBox, inCircle, inSphere } from "maath/random";
import { lerpBuffers } from 'maath/buffer'

function Thing() {
  const [{ geometry, box, sphere }] = useState(() => {
    const box = inBox(new Float32Array(10_000 * 3), { sides: [1, 3, 2] });
    const sphere = inSphere(new Float32Array(10_000 * 3), { radius: 1.5 });

    const final = sphere.slice(0)

    const geometry = new BufferGeometry();

    geometry.setAttribute("position", new BufferAttribute(final, 3));

    return { geometry, box, sphere };
  });

  useFrame(({clock}) => {
    const t = (Math.sin(clock.getElapsedTime()) + 1) * 0.5
    lerpBuffers(box, sphere, geometry.getAttribute('position').array as Float32Array, t)

    geometry.attributes.position.needsUpdate = true

  })

  return (
    <points>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial color="red" size={0.01} />
    </points>
  );
}

function App() {
  return (
    <Canvas camera={{ position: [2, 1, 3] }}>
      <Thing />
      <OrbitControls />
      <axesHelper />
      <color args={["#080406"]} attach="background" />
    </Canvas>
  );
}

export default App;
