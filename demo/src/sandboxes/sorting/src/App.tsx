import { useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";

import * as random from "maath/random";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";
import * as v3 from "maath/vector3";

import { Points } from "@react-three/drei";

import { colord } from "colord";

const rotationAxis = new Vector3(0, 1, 0).normalize();
const q = new Quaternion();

const x = new Float32Array();

// function pipe<Q extends 2 | 3>(n: number, s: Q, ...fns: ((b: Float32Array, s: Q) => any)[]) {
//   const buffer = new Float32Array(n * s)

//   fns.reduce((buffer, fn) => fn(buffer, s), buffer)

//   return buffer
// }

// const newB = pipe<3>(
//   1000, 3,
//   (b) => random.inBox(b),
//   (b, s) => buffer.sort(b, s, (a, b) => v3.length(a) - v3.length(b)),
// )

// console.log(newB)

export default function PointsDemo(props: any) {
  const pointsRef = useRef<THREE.Points>(null!);
  const [box] = useState(() => {
    const box = random.inSphere(new Float32Array(100_000 * 3), { radius: 3 });
    // buffer.sort(box, 3, (a,b) => a[0] - b[0]);
    buffer.sort(box, 3, (a, b) => a[1] * a[0] * a[2] - b[1] * b[0] * b[2]);

    return box;
  });

  const [colors] = useState(() => {
    return buffer.map(box.slice(0), 3, (_, i) => {
      const h = (i / (box.length / 3)) * 360;
      const { r, g, b } = colord({ h, s: 100, v: 100 }).toRgb();
      return [r / 255, g / 255, b / 255];
    });
  });

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime();
    const t = misc.remap(Math.sin(et), [-1, 1], [0, 1]);
    const t2 = misc.remap(Math.cos(et * 3), [-1, 1], [0, 1]);
  });

  return (
    <Points
      positions={box}
      colors={colors}
      stride={3}
      ref={pointsRef}
      {...props}
    >
      <pointsMaterial size={2} vertexColors />
    </Points>
  );
}
