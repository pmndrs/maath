import * as React from "react";
import { Canvas } from "@react-three/fiber";
import Demos from "./components/Demo";

export default function App() {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 2]}
      camera={{ position: [8, 8, 8], zoom: 200 }}
    >
      <color args={["#333337"]} attach="background" />
      <directionalLight
        position={[0, 20, 0]}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <React.Suspense fallback="">
        <Demos />
      </React.Suspense>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
      >
        <planeGeometry args={[10, 10]} />
        <shadowMaterial transparent opacity={0.5} />
      </mesh>
    </Canvas>
  );
}
