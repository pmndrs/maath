import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, MathUtils } from "three";

import {
  addAxis,
  fibonacciOnSphere,
  lerpBuffers,
  randomInCircle,
  rsqw,
} from "maath";

function Thing() {
  const [{ bufferA, bufferB, final, geometry }] = useState(() => {
    const bufferA = new Float32Array(10_000 * 3);
    let bufferB = new Float32Array(10_000 * 2);

    const geometry = new BufferGeometry();

    fibonacciOnSphere(bufferA, { radius: 3 });

    randomInCircle(bufferB, { radius: 3 });
    bufferB = addAxis(bufferB, () => MathUtils.randFloatSpread(10));

    const final = new Float32Array(bufferB);
    geometry.setAttribute("position", new BufferAttribute(final, 3));

    return { bufferA, bufferB, final, geometry };
  });

  useFrame(({ clock }) => {
    const time = (Math.cos(clock.getElapsedTime()) + 1) * 0.5;
    const t = rsqw(time);

    lerpBuffers(bufferA, bufferB, final, t);
    // @ts-ignore
    geometry.attributes.position.needsUpdate = true;
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
