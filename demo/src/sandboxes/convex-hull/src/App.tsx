import { useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";

import * as random from "maath/random";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";

import Points from "./Points";

export default function ConvexHullDemo() {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<any>(null!);

  const [{ points, randomizedPoints, final }, setPoints] = useState(() => {
    const points = random.inRect(new Float32Array(1_000 * 2)) as Float32Array;
    const randomizedPoints = random.inCircle(points.slice(0), { radius: 0.75 });
    const final = points.slice(0);

    return { points, randomizedPoints, final };
  });

  useFrame(({ clock }) => {
    const t = misc.remap(Math.sin(clock.getElapsedTime()), [-1, 1], [0, 1]);
    buffer.lerp(points, randomizedPoints, final, t);

    const convexHullPoints = misc.convexHull(
      buffer.toVectorArray(final, 2) as THREE.Vector2[]
    );

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    lineRef.current.geometry.setFromPoints(
      [...convexHullPoints, convexHullPoints[0]],
      2
    );
  });

  return (
    <>
      <Points points={final} stride={2} ref={pointsRef}>
        <pointsMaterial size={1} />
      </Points>
      {/* @ts-ignore */}
      <line castShadow ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>
    </>
  );
}
