import { useEffect, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import { BufferAttribute, PlaneGeometry, Quaternion, Vector3 } from "three";

import * as buffer from "maath/buffer";
import * as misc from "maath/misc";

const rotationAxis = new Vector3(0, 1, 0).normalize();
const q = new Quaternion();

function Side({
  position,
  rotate,
  rotate2,
  color,
}: {
  color: string;
  position: [x: number, y: number, z: number];
  rotate?: boolean;
  rotate2?: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null!);
  const [{ box, sphere, final }] = useState(() => {
    const g = new PlaneGeometry(2, 2, 10, 10).toNonIndexed();
    const box = buffer.translate(
      g.attributes.position.array as Float32Array,
      position
    );

    rotate &&
      buffer.rotate(box, {
        q: new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
      });

    rotate2 &&
      buffer.rotate(box, {
        q: new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2),
      });

    const sphere = box.slice(0);

    buffer.map(sphere, 3, misc.pointOnCubeToPointOnSphere);
    // buffer.map(sphere, 3, misc.normalize);

    const final = sphere.slice(0); // final buffer that will be used for the points mesh

    return { box, sphere, final };
  });

  useEffect(() => {
    pointsRef.current.geometry.setAttribute(
      "position",
      new BufferAttribute(final, 3)
    );
  }, []);

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime();
    const t = misc.remap(Math.sin(et), [-1, 1], [0, 1]);

    buffer.lerp(
      box,
      sphere,
      pointsRef.current.geometry.getAttribute("position").array as Float32Array,
      t
    );

    buffer.rotate(final, {
      q: q.setFromAxisAngle(rotationAxis, et * 0.2 * Math.PI),
    });

    pointsRef.current.geometry.computeVertexNormals();

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <axesHelper />
      <mesh ref={pointsRef}>
        <bufferGeometry />
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  );
}

export default function PointsDemo(props: any) {
  return (
    <>
      <axesHelper />
      <Side position={[0, 0, -1]} color="#ff005b" />
      <Side position={[0, 0, 1]} color="#ff005b" />

      <Side position={[0, 0, -1]} rotate color="#0EEC82" />
      <Side position={[0, 0, 1]} rotate color="#0EEC82" />

      <Side position={[0, 0, -1]} rotate2 color="#F8D628" />
      <Side position={[0, 0, 1]} rotate2 color="#F8D628" />
    </>
  );
}
