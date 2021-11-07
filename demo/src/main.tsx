import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Sandbox from "./Sandbox";
import { Route } from "wouter";
import PointsDemo from "./sandboxes/points2/src/App";
import { OrbitControls } from "@react-three/drei";

import { Footer } from "@pmndrs/branding";
import logo from "./logo.svg";

import '@pmndrs/branding/styles.css'

ReactDOM.render(
  <React.StrictMode>
    <Route path="/">
      <a href="" className="logo">
        <img src={logo} />
      </a>
      <App />
      <Footer year="2021" />
    </Route>

    <Route path="/sandbox">
      <Sandbox>
        <PointsDemo />
        <OrbitControls />
      </Sandbox>
    </Route>
  </React.StrictMode>,
  document.getElementById("root")
);
