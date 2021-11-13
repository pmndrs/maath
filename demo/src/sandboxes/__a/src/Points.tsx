import { forwardRef, ReactNode, useEffect, useState } from "react";

import {
  BufferAttribute,
  BufferGeometry,
  Points,
  StreamDrawUsage,
} from "three";

const PointsImpl = forwardRef<
  Points,
  { points: Float32Array; stride: number; children: ReactNode }
>(function Points(props, passedRef) {
  const { children, points, stride = 3, ...rest } = props;

  const [geometry] = useState(() => {
    const geometry = new BufferGeometry();

    const attr = new BufferAttribute(points, stride);
    attr.usage = StreamDrawUsage;

    geometry.setAttribute("position", attr);

    return geometry;
  });

  useEffect(() => {
    const attr = new BufferAttribute(points, stride);
    attr.usage = StreamDrawUsage;

    geometry.setAttribute("position", attr);
  }, [points]);

  return (
    <points castShadow ref={passedRef} {...rest}>
      <primitive object={geometry} attach="geometry" />
      {children}
    </points>
  );
});

export default PointsImpl;
