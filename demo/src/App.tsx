import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, MathUtils } from "three";

import {
  fibonacciOnSphere,
  onSphere
} from "maath";

import { inCircle } from 'maath/random'

function Thing() {
  const [{ geometry }] = useState(() => {
    const buffer = new Float32Array(10_000 * 3);

    const geometry = new BufferGeometry();

    fibonacciOnSphere(buffer, { radius: 3 });

    geometry.setAttribute("position", new BufferAttribute(buffer, 3));

    return { buffer, geometry };
  });

  return (
    <points>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial color="red" size={0.05} />
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
