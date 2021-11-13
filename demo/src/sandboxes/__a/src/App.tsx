import { useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";

import * as random from "maath/random";

import Points from "./Points";

export default function PointsDemo(props: any) {
  const pointsRef = useRef<THREE.Points>(null!);
  const [generator] = useState(() => new random.Generator("maath"));
  const [{ box, box2 }] = useState(() => {
    // @ts-ignore
    const box = random.inBox(new Float32Array(1_000 * 3), { sides: [1, 2, 0] });
    const box2 = random.inBox(
      new Float32Array(1_000 * 3),
      { sides: [1, 2, 0] },
      generator
    );
    return { box, box2 };
  });

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime();
  });

  return (
    <>
      <Points points={box} stride={3} ref={pointsRef} position-x={-.6}>
        <pointsMaterial size={1} />
      </Points>

      <Points points={box2} stride={3} ref={pointsRef} position-x={.6}>
        <pointsMaterial size={1} />
      </Points>
    </>
  );
}
