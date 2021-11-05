import { useEffect, useMemo, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Line, OrbitControls } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  EllipseCurve,
  Material,
  Quaternion,
  Vector3,
} from "three";

import "./materials";

import * as random from "maath/random";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";

import Points from "./Points";
import Lines from "./Lines";
import { addAxis, toVectorArray } from "maath/buffer";
import { getCircumcircle } from "maath/triangle";

// prettier-ignore
// @ts-ignore
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const makePoints = () => {};

function ConvexHullDemo() {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<any>(null!);

  const [{ points, randomizedPoints, final }, setPoints] = useState(() => {
    const points = random.inRect(new Float32Array(1_000 * 2)) as Float32Array;
    const randomizedPoints = random.inCircle(points.slice(0), { radius: 0.75 });

    const final = points.slice(0);

    return { points, randomizedPoints, final };
  });

  useFrame(({ clock }) => {
    const t = (Math.sin(clock.getElapsedTime()) + 1) * 0.5;
    buffer.lerp(points, randomizedPoints, final, t);

    const convexHullPoints = misc.convexHull(
      buffer.toVectorArray(final, 2) as THREE.Vector2[]
    );
    2;

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    lineRef.current.geometry.setFromPoints(
      [...convexHullPoints, convexHullPoints[0]],
      2
    );
  });

  return (
    <Billboard>
      <Points points={final} stride={2} ref={pointsRef}>
        <pointsMaterial size={0.03} />
      </Points>

      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>
    </Billboard>
  );
}

function TrianglesDemo() {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<any>(null!);
  const circleRef = useRef<any>(null!);
  const circle2Ref = useRef<any>(null!);

  const [{ points, pointsB, final }] = useState(() => {
    const points = random.inCircle(new Float32Array(4 * 2), { radius: .4 });
    const pointsB = random.inCircle(points.slice(0), { radius: .4})
    const final = pointsB.slice(0)

    return { points, pointsB, final };
  });

  useFrame(({ clock }, dt) => {
    const t = Math.sin(clock.getElapsedTime())  + 1 * .5

    buffer.lerp(points, pointsB, final, t)
    
    const [a, b, c, d] = toVectorArray(final, 2)

    // prettier-ignore
    lineRef.current.geometry.setFromPoints([ 
      a , b , c, a,
      b, c, d, b
    ], 2);

    {
      const circle = getCircumcircle([
        [a.x, a.y],
        [b.x, b.y],
        [c.x, c.y],
      ]);

      const curve = new EllipseCurve(
        circle!.x,
        circle!.y,
        circle!.r,
        circle!.r,
        0,
        2 * Math.PI, // aStartAngle, aEndAngle
        false, // aClockwise
        0 // aRotation
      );

      circleRef.current.geometry.setFromPoints(curve.getPoints(128));
    }

    {
      const circle = getCircumcircle([
        [b.x, b.y],
        [c.x, c.y],
        [d.x, d.y],
      ]);

      const curve = new EllipseCurve(
        circle!.x,
        circle!.y,
        circle!.r,
        circle!.r,
        0,
        2 * Math.PI, // aStartAngle, aEndAngle
        false, // aClockwise
        0 // aRotation
      );

      circle2Ref.current.geometry.setFromPoints(curve.getPoints(128));
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

  });

  return (
    <>
      <Points points={final} stride={2} ref={pointsRef}>
        <pointsMaterial size={0.1} />
      </Points>

      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>

      <line ref={circleRef}>
        <bufferGeometry />
        <lineBasicMaterial  transparent opacity={0.25}/>
      </line>

      <line ref={circle2Ref}>
        <bufferGeometry  />
        <lineBasicMaterial transparent opacity={0.25} />
      </line>
    </>
  );
}

function LerpbufferDemo() {
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
    <Canvas
      linear
      camera={{ position: [0, 0, 10], near: 0.1, far: 20, fov: 25 }}
    >
      <group position={[-2, 0, 0]}>
        <LerpbufferDemo />
      </group>

      <group>
        <TrianglesDemo />
      </group>

      <group position={[2, 0, 0]}>
        <ConvexHullDemo />
      </group>
      <OrbitControls />
      <color args={["#080406"]} attach="background" />
    </Canvas>
  );
}

export default App;
