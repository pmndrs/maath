import React from "react";
import ReactDOM from "react-dom";

import { Route } from "wouter";
import { OrbitControls } from "@react-three/drei";

import "@pmndrs/branding/styles.css";
import { Footer } from "@pmndrs/branding";

import App from "./App";

import Sandbox from "./components/Sandbox";
import PointsDemo from "./sandboxes/sutherlandHodgman/src/App";

import "./index.css";

import SandboxOverlay from "./components/SandboxOverlay";
import Header from "./components/Header";

ReactDOM.render(
  <React.StrictMode>
    <Header />
    
    <Route path="/">
      <App />
      <SandboxOverlay />
    </Route>

    <Route path="/sandbox">
      <Sandbox>
        <PointsDemo />
        <OrbitControls />
      </Sandbox>
    </Route>

    {/* @ts-ignore */}
    <Footer year="2021" />
  </React.StrictMode>,
  document.getElementById("root")
);
