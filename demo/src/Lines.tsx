import { useFrame } from "@react-three/fiber";
import { forwardRef, ReactNode, useEffect, useState } from "react";

import { BufferAttribute, BufferGeometry, Points } from "three";

import "./materials";

const LineImpl = forwardRef<
  any,
  { points: Float32Array; stride: number; children: ReactNode }
>(function Points(props, passedRef) {
  const { children, points, stride = 3 } = props;

  const [geometry] = useState(() => {
    return new BufferGeometry();
  });



  return (
    <line ref={passedRef}>
      <primitive object={geometry} attach="geometry" />
      {children}
    </line>
  );
});

export default LineImpl;
