import { useEffect, useMemo, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, Material, Quaternion, Vector3 } from "three";

import "./materials";

import * as random from "maath/random";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";

import Points from "./Points";
import Lines from "./Lines";
import { addAxis, toVectorArray } from "maath/buffer";

// prettier-ignore
// @ts-ignore
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const makePoints = () => {};

function ConvexHullDemo() {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<any>(null!);

  const [{ points, randomizedPoints, final }, setPoints] = useState(() => {
    const points = random.inRect(new Float32Array(100 * 2)) as Float32Array;
    const randomizedPoints = random.inCircle(
      new Float32Array(100 * 2)
    ) as Float32Array;

    const final = points.slice(0);

    return { points, randomizedPoints, final };
  });

  let convexHullPoints = new Float32Array(10);

  useFrame(({ clock }) => {
    const t = (Math.sin(clock.getElapsedTime()) + 1) * 0.5;
    buffer.lerp(points, randomizedPoints, final, t);

    const convexHullPoints = misc.convexHull(
      buffer.toVectorArray(final, 2) as THREE.Vector2[]
    );
    2;

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    lineRef.current.geometry.setFromPoints([...convexHullPoints, convexHullPoints[0]], 2)
  });

  return (
    <>
      <Points points={final} stride={2} ref={pointsRef}>
        <pointsMaterial size={0.03} />
      </Points>

      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>
    </>
  );
}

function Lerpbuffer() {
  const pointsRef = useRef<THREE.Points>(null!);
  const [{ box, sphere, final }] = useState(() => {
    // @ts-ignore
    const box = random.inBox(new Float32Array(10_000), { sides: [1, 2, 1] });
    const sphere = random.inSphere(box.slice(0), { radius: 0.75 });
    const final = box.slice(0); // final buffer that will be used for the points mesh

    return { box, sphere, final };
  });

  useFrame(({ clock }) => {
    const dt = clock.getElapsedTime();
    const t = (Math.sin(dt) + 1) * 0.5;
    const t2 = Math.cos(dt * 2 + 1) * 0.5;

    const q = new Quaternion().setFromAxisAngle(
      new Vector3(1, 1, 0).normalize(),
      t2 * 0.1
    );

    buffer.rotate(box, {
      q,
    });

    if (pointsRef.current) {
      buffer.lerp(
        box,
        sphere,
        pointsRef.current.geometry.getAttribute("position")
          .array as Float32Array,
        t
      );

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points points={final} stride={3} ref={pointsRef}>
      <pointsMaterial size={0.03} />
    </Points>
  );
}

function App() {
  return (
    <Canvas linear camera={{ position: [0, 0, 10], fov: 25 }}>
      <axesHelper />

      <group position={[-2, 0, 0]}>
        <Lerpbuffer />
      </group>
      <ConvexHullDemo />
      <OrbitControls />
      <color args={["#080406"]} attach="background" />
    </Canvas>
  );
}

export default App;
