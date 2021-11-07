import { useEffect, useRef } from "react";

import {
  ArrowHelper,
  BufferAttribute,
  Group,
  Line,
  Matrix3,
  Plane,
  PlaneHelper,
  Quaternion,
  Vector3,
  Points,
  Matrix4,
  LineBasicMaterial,
  Mesh,
} from "three";

import * as random from "maath/random";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";
import * as matrix from "maath/matrix";

// https://math.stackexchange.com/questions/180418/calculate-rotation-matrix-to-align-vector-a-to-vector-b-in-3d

function Demo() {

  const plane = new Plane(new Vector3().randomDirection().normalize())

  const $group = useRef<Group>(null!);
  const $line = useRef<Line>(null!);
  const $points = useRef<Points>(null!);
  const $planeHelper = useRef<Points>(null!);
  const $intersection = useRef<Mesh>(null!);

  const points = random.inSphere(new Float32Array(2 * 3))

  useEffect(() => {
    $line.current.geometry.setAttribute(
      "position",
      new BufferAttribute(points, 3)
    );

    $points.current.geometry.setAttribute(
      "position",
      new BufferAttribute(points, 3)
    );

    const [a, b] = buffer.toVectorArray(points, 3) as Vector3[];

    $intersection.current.position.copy(
      misc.planeSegmentIntersection(plane, [a, b]) as Vector3
    );
    
  });

  return (
    <>
      {/* @ts-ignore */}
      <line castShadow ref={$line}>
        <bufferGeometry />
        <lineBasicMaterial color="#ff005b" />
      </line>

      <points castShadow ref={$points}>
        <bufferGeometry />
        <pointsMaterial size={5} color="#ff005b" />
      </points>

      <mesh ref={$intersection}>
        <sphereGeometry args={[0.025, 32, 32]} />
        <meshNormalMaterial />
      </mesh>

      <>
        {/* @ts-ignore */}
        <planeHelper ref={$planeHelper} args={[plane, 3, "#ff005b"]} />
        <arrowHelper args={[plane.normal, new Vector3(), 0.5, "#ff005b"]} />
      </>

      <group ref={$group} />
    </>
  );
}

export default Demo
