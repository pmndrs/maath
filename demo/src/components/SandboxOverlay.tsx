import { useStore } from "../store";

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
            bottom: 0,
            zIndex: 10,
            transform: "translateX(-50%)",
            border: 0,
            borderRadius: "4px 4px 0 0",
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

export default SandboxOverlay;
