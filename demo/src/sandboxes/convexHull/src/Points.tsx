import { forwardRef, ReactNode, useEffect, useState } from "react";

import { BufferAttribute, BufferGeometry, Points } from "three";

const PointsImpl = forwardRef<
  Points,
  { points: Float32Array; stride: number; children: ReactNode }
>(function Points(props, passedRef) {
  const { children, points, stride = 3, ...rest } = props;

  const [geometry] = useState(() => {
    return new BufferGeometry();
  });

  useEffect(() => {
    geometry.setAttribute("position", new BufferAttribute(points, stride));
  }, [points]);

  return (
    <points castShadow ref={passedRef} {...rest}>
      <primitive object={geometry} attach="geometry" />
      {children}
    </points>
  );
});

export default PointsImpl;
