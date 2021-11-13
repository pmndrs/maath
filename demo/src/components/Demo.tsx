
import * as React from "react";
import { ReactNode, useRef, useState } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group, Vector3 } from "three";

import * as misc from "maath/misc";

import { useStore } from "../store";

const CircumcircleDemo = React.lazy(
  () => import("../sandboxes/circumcircle/src/App")
);
const ConvexHullDemo = React.lazy(
  () => import("../sandboxes/convex-hull/src/App")
);
const PointsDemo = React.lazy(() => import("../sandboxes/points/src/App"));

function Demo({
  position,
  text,
  children,
  color,
  slug,
}: {
  position?: Vector3 | [x: number, y: number, z: number];
  text?: string;
  color: string;
  children: ReactNode;
  slug: "circumcircle" | "convex-hull" | "points";
}) {
  const container = useRef<Group>(null!);
  const [hover, setHover] = useState(false);

  useFrame(({ clock }) => {
    if (hover) {
      container.current.position.z = misc.lerp(
        container.current.position.z,
        misc.remap(
          Math.sin(clock.getElapsedTime() * 3),
          [-1, 1],
          [-0.05, 0.05]
        ),
        0.1
      );
    } else {
      container.current.position.z = misc.lerp(
        container.current.position.z,
        0,
        0.1
      );
    }
  });

  const setActive = useStore((state) => state.setActive);

  return (
    <group position={position} ref={container}>
      <mesh
        onPointerEnter={(e) => {
          setHover(true);
          e.stopPropagation();
        }}
        onPointerLeave={(e) => {
          setHover(false);
          e.stopPropagation();
        }}
        onPointerDown={() => setActive(slug)}
      >
        <boxGeometry args={[1.5, 1.5, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          wireframe
          depthWrite={false}
        />
        <group scale={0.8} position={[0, 0, 0.3]}>
          {children}
        </group>

        <RoundedBox
          position={[0, 0, -0.25]}
          castShadow
          receiveShadow
          args={[1.5, 1.5, 0.1]}
          radius={0.05}
          smoothness={1}
        >
          <meshStandardMaterial color={color} />
        </RoundedBox>
      </mesh>
    </group>
  );
}

export default function Demos() {
  return (
    <group rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      <Demo slug={"points"} position={[-2, 0, 0]} color="#ff6080">
        <group scale={0.8}>
          <PointsDemo />
        </group>
      </Demo>

      <Demo slug="circumcircle" color="#ffaf80">
        <group scale={0.8} position-z={-0.3}>
          <CircumcircleDemo />
        </group>
      </Demo>

      <Demo slug="convex-hull" position={[2, 0, 0]} color="#20b0ff">
        <group scale={0.8} position-z={-0.3}>
          <ConvexHullDemo />
        </group>
      </Demo>
    </group>
  );
}