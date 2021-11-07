import { Canvas } from "@react-three/fiber";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <Canvas>
      <color attach="background" args={['#000']} />
      <App />
    </Canvas>
  </React.StrictMode>,
  rootElement
);
