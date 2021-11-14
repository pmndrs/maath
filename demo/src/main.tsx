import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";

import { Route } from "wouter";

import "@pmndrs/branding/styles.css";
import { Footer } from "@pmndrs/branding";

import App from "./App";

import SandboxOverlay from "./components/SandboxOverlay";
import Header from "./components/Header";

const Sandbox = lazy(() => import("./components/Sandbox"));
const DevBox = lazy(() => import("./sandboxes/points/src/App"));

import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <Route path="/">
      <Header />
      <App />
      <SandboxOverlay />
      {/* @ts-ignore */}
      <Footer year="2021" />
    </Route>

    {/* Use this route for local development */}
    <Route path="/sandbox">
      <Suspense fallback="">
        <Sandbox>
          <DevBox />
        </Sandbox>
      </Suspense>
    </Route>
  </React.StrictMode>,
  document.getElementById("root")
);
