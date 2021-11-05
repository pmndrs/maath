import { forwardRef, ReactNode, useEffect, useState } from "react";

import { BufferAttribute, BufferGeometry, Points } from "three";

import "./materials";

const PointsImpl = forwardRef<
  Points,
  { points: Float32Array; stride: number; children: ReactNode }
>(function Points(props, passedRef) {
  const { children, points, stride = 3 } = props;

  const [geometry] = useState(() => {
    return new BufferGeometry();
  });

  useEffect(() => {
    geometry.setAttribute("position", new BufferAttribute(points, stride));
  }, [points]);

  return (
    <points ref={passedRef}>
      <primitive object={geometry} attach="geometry" />
      {children}
    </points>
  );
});

export default PointsImpl;
