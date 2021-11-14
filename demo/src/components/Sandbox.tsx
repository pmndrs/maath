import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function App({ children }: { children: any }) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], zoom: 400 }}
    >
      <color args={["#333"]} attach="background" />

      {children}

      <OrbitControls />
    </Canvas>
  );
}

export default App;
