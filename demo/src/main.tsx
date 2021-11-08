import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Sandbox from "./Sandbox";
import { Route } from "wouter";
import PointsDemo from "./sandboxes/sutherlandHodgman/src/App";
import { OrbitControls } from "@react-three/drei";

import { Footer } from "@pmndrs/branding";
import logo from "./logo.svg";

import "@pmndrs/branding/styles.css";

import create from "zustand";

export const useStore = create<{
  active?: "circumcircle" | "convex-hull" | "points";
  setActive: (
    slug: "circumcircle" | "convex-hull" | "points" | undefined
  ) => void;
}>((set) => ({
  active: undefined,
  setActive: (slug) => {
    set({ active: slug });
  },
}));

function SandboxOverlay() {
  const active = useStore((state) => state.active);
  const setActive = useStore((state) => state.setActive);

  return (
    <>
      {active && (
        <iframe
          src={`https://codesandbox.io/embed/github/pmndrs/maath/tree/main/demo/src/sandboxes/${active}?fontsize=14&hidenavigation=1&theme=dark`}
          style={{
            position: "fixed",
            left: "50%",
            right: 0,
            bottom: -10,
            zIndex: 10,
            transform: "translateX(-50%)",
            border: 0,
            borderRadius: "4px",
            overflow: "hidden",
          }}
          width={"90%"}
          height={"90%"}
          title="maath-demo-circumcircle"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        ></iframe>
      )}
      <div
        className={`backdrop ${active && "visible"}`}
        onClick={() => setActive(undefined)}
      />
    </>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Route path="/">
      <a
        href="https://github.com/pmndrs/maath"
        title="Maath - View on github"
        className="logo"
      >
        <img src={logo} />

        <div>View on Github ⟶</div>
      </a>

      <App />
      {/* @ts-ignore */}
      <Footer year="2021" />
    </Route>

    <SandboxOverlay  />

    <Route path="/sandbox">
      <Sandbox>
        <PointsDemo />
        <OrbitControls />
      </Sandbox>
    </Route>
  </React.StrictMode>,
  document.getElementById("root")
);
