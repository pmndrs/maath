import { useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";

import * as random from "maath/random";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";
import * as v2 from "maath/vector2";
import * as threeUtils from "maath/three";

import { Points } from "@react-three/drei"
import { Mesh, Vector } from "three";

export default function ConvexHullDemo() {
  const pointsRef = useRef<THREE.Points>(null!);
  const $line = useRef<any>(null!);
  const $line2 = useRef<any>(null!);

  const [{ points, randomizedPoints, final }] = useState(() => {
    const points = random.inRect(new Float32Array(1_000 * 2)) as Float32Array;
    const randomizedPoints = random.inCircle(points.slice(0), { radius: 1 });
    const final = points.slice(0);

    return { points, randomizedPoints, final };
  });

  useFrame(({ clock }) => {
    const t = misc.remap(Math.sin(clock.getElapsedTime()), [-1, 1], [0, 1]);

    buffer.lerp(points, randomizedPoints, final, t);

    const convexHullPoints = misc.convexHull(
      threeUtils.bufferToVectors(final, 2) as THREE.Vector2[]
    );

    const convexHullBuffer = threeUtils.vectorsToBuffer(convexHullPoints);

    let center = v2.zero();
    center = buffer.center(convexHullBuffer, 2);
    center = v2.scale(center, 1 / convexHullBuffer.length / 2);

    buffer.expand(convexHullBuffer, 2, { center, distance: 1 * t });

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    const expandedBufferArr = threeUtils.bufferToVectors(convexHullBuffer, 2);

    $line.current.geometry.setFromPoints(
      [...convexHullPoints, convexHullPoints[0]],
      2
    );

    $line2.current.geometry.setFromPoints(
      [...expandedBufferArr, expandedBufferArr[0]],
      2
    );
  });

  return (
    <>
      <Points points={final} stride={2} ref={pointsRef}>
        <pointsMaterial size={1} />
      </Points>
      {/* @ts-ignore */}
      <line castShadow ref={$line}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>

      {/* @ts-ignore */}
      <line castShadow ref={$line2}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>
    </>
  );
}
