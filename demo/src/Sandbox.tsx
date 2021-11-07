import { Canvas } from "@react-three/fiber";

function App({ children }: { children: any }) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      camera={{ position: [8, 8, 8], zoom: 200 }}
    >
      <color args={["#333"]} attach="background" />

      {children}
    </Canvas>
  );
}

export default App;
