import { useStore } from "../store";
import { Sandpack } from "@codesandbox/sandpack-react";
import "@codesandbox/sandpack-react/dist/index.css";

import PublicCode from "../sandboxes/points/public/index.html?raw";
import IndexCode from "../sandboxes/points/src/index.tsx?raw";
import pointsAppCode from "../sandboxes/points/src/App.tsx?raw";
import convexAppCode from "../sandboxes/convex-hull/src/App.tsx?raw";
import circumcircleAppCode from "../sandboxes/circumcircle/src/App.tsx?raw";

function getCode(active: "circumcircle" | "convex-hull" | "points") {
  const codeMap = {
    circumcircle: circumcircleAppCode,
    "convex-hull": convexAppCode,
    points: pointsAppCode
  }

  return codeMap[active]
}

function SandboxOverlay() {
  const active = useStore((state) => state.active);
  const setActive = useStore((state) => state.setActive);

  return (
    <>
      {active && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            right: 0,
            bottom: 0,
            zIndex: 10,
            width: "90vw",
            transform: "translateX(-50%)",
            border: 0,
            borderRadius: "4px 4px 0 0",
            overflow: "hidden",
          }}
        >
          <Sandpack
            theme="night-owl"
            template="react-ts"
            files={{
              "/src/App.tsx": getCode(active),
              "/src/index.tsx": { code: IndexCode, hidden: true },
              "/public/index.html": { code: PublicCode, hidden: true },
            }}
            options={{
              editorWidthPercentage: 50,
              editorHeight: "90vh",
            }}
            customSetup={{
              dependencies: {
                "@react-three/fiber": "latest",
                "@react-three/drei": "latest",
                three: "0.134.0",
                "@types/three": "0.134.0",
                maath: "latest",
              },
            }}
          />
        </div>
      )}
      <div
        className={`backdrop ${active && "visible"}`}
        onClick={() => setActive(undefined)}
      />
    </>
  );
}

export default SandboxOverlay;
