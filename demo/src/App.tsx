import { ReactNode, useRef, useState } from "react";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { EllipseCurve, Group, Quaternion, Vector3 } from "three";

import * as random from "maath/random";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";

import Points from "./Points";
import { getCircumcircle } from "maath/triangle";
import { lerp } from "maath/misc";

function ConvexHullDemo() {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<any>(null!);

  const [{ points, randomizedPoints, final }, setPoints] = useState(() => {
    const points = random.inRect(new Float32Array(1_000 * 2)) as Float32Array;
    const randomizedPoints = random.inCircle(points.slice(0), { radius: 0.75 });
    const final = points.slice(0);

    return { points, randomizedPoints, final };
  });

  useFrame(({ clock }) => {
    const t = misc.remap(Math.sin(clock.getElapsedTime()), [-1, 1], [0, 1]);
    buffer.lerp(points, randomizedPoints, final, t);

    const convexHullPoints = misc.convexHull(
      buffer.toVectorArray(final, 2) as THREE.Vector2[]
    );

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    lineRef.current.geometry.setFromPoints(
      [...convexHullPoints, convexHullPoints[0]],
      2
    );
  });

  return (
    <>
      <Points points={final} stride={2} ref={pointsRef}>
        <pointsMaterial size={1} />
      </Points>

      <line castShadow ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>
    </>
  );
}

function TrianglesDemo() {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<any>(null!);
  const circleRef = useRef<any>(null!);
  const circle2Ref = useRef<any>(null!);

  const [{ points, pointsB, final }] = useState(() => {
    // generate two sets of 4 points in a circle, that we'll use for our circumcircle visualization
    const points = random.inCircle(new Float32Array(4 * 2), { radius: 0.4 });
    const pointsB = random.inCircle(points.slice(0), { radius: 0.4 });
    const final = pointsB.slice(0);

    return { points, pointsB, final };
  });

  useFrame(({ clock }, dt) => {
    const t = Math.sin(clock.getElapsedTime()) + 1 * 0.5;

    // lerp between the two different sets of point, thus animating the two visualized triangles
    buffer.lerp(points, pointsB, final, t);

    // get the points as an array, to use them to create the geometries
    const [a, b, c, d] = buffer.toVectorArray(final, 2);

    // prettier-ignore
    lineRef.current.geometry.setFromPoints([ 
      a , b , c, a,
      b, c, d, b
    ], 2);

    {
      // get the circumcircle for the first triangle
      const circle = getCircumcircle([
        [a.x, a.y],
        [b.x, b.y],
        [c.x, c.y],
      ]);

      const curve = new EllipseCurve(
        circle!.x,
        circle!.y,
        circle!.r,
        circle!.r,
        0,
        2 * Math.PI,
        false,
        0
      );

      circleRef.current.geometry.setFromPoints(curve.getPoints(128));
    }

    {
      // get the circumcircle for the second triangle
      const circle = getCircumcircle([
        [b.x, b.y],
        [c.x, c.y],
        [d.x, d.y],
      ]);

      const curve = new EllipseCurve(
        circle!.x,
        circle!.y,
        circle!.r,
        circle!.r,
        0,
        2 * Math.PI,
        false,
        0
      );

      circle2Ref.current.geometry.setFromPoints(curve.getPoints(128));
    }

    // update the points geometry since we imperatively updated the positions buffer
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <Points points={final} stride={2} ref={pointsRef}>
        <pointsMaterial size={5} />
      </Points>

      <line castShadow ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>

      <line castShadow ref={circleRef}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>

      <line castShadow ref={circle2Ref}>
        <bufferGeometry />
        <lineBasicMaterial />
      </line>
    </>
  );
}

const rotationAxis = new Vector3(1, 1, 0).normalize();
const q = new Quaternion();

function LerpbufferDemo(props: any) {
  const pointsRef = useRef<THREE.Points>(null!);
  const [{ box, sphere, final }] = useState(() => {
    // @ts-ignore
    const box = random.inBox(new Float32Array(10_000), { sides: [1, 2, 1] });
    const sphere = random.inSphere(box.slice(0), { radius: 0.75 });
    const final = box.slice(0); // final buffer that will be used for the points mesh

    return { box, sphere, final };
  });

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime();
    const t = misc.remap(Math.sin(et), [-1, 1], [0, 1]);
    const t2 = misc.remap(Math.cos(et * 2), [-1, 1], [0, 1]);

    buffer.rotate(box, {
      q: q.setFromAxisAngle(rotationAxis, t2 * 0.1),
    });

    if (pointsRef.current) {
      buffer.lerp(
        box,
        sphere,
        pointsRef.current.geometry.getAttribute("position")
          .array as Float32Array,
        t
      );
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points points={final} stride={3} ref={pointsRef} {...props}>
      <pointsMaterial size={1} />
    </Points>
  );
}

function Demo({
  position,
  text,
  children,
  color,
}: {
  position?: Vector3 | [x: number, y: number, z: number];
  text: string;
  color: string;
  children: ReactNode;
}) {
  const container = useRef<Group>(null!);
  const [hover, setHover] = useState(false);

  useFrame(({ clock }) => {
    if (hover) {
      container.current.position.z = lerp(
        container.current.position.z,
        misc.remap(
          Math.sin((clock.getElapsedTime()) * 3),
          [-1, 1],
          [-0.05, 0.05]
        ),
        0.1
      );
    } else {
      container.current.position.z = lerp(container.current.position.z, 0, 0.1);
    }
  });

  return (
    <group position={position} ref={container}>
      <mesh
        onPointerEnter={(e) => {
          setHover(true);
          e.stopPropagation();
        }}
        onPointerLeave={(e) => {
          setHover(false);
          e.stopPropagation();
        }}
      >
        <boxGeometry args={[1.5, 1.5, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          wireframe
          depthWrite={false}
        />

        {/* <group rotation-x={Math.PI / 2} position-y={1}>
          <Text lineHeight={1.5}>{text}</Text>
        </group> */}
        <group scale={0.8} position={[0, 0, 0.3]}>
          {children}
        </group>

        <RoundedBox
          position={[0, 0, -0.25]}
          castShadow
          receiveShadow
          args={[1.5, 1.5, 0.1]}
          radius={0.05}
          smoothness={1}
        >
          <meshStandardMaterial color={color} />
        </RoundedBox>
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <group rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      <Demo position={[-2, 0, 0]} color="#ff6080">
        <group scale={0.8}>
          <LerpbufferDemo />
        </group>
      </Demo>

      <Demo color="#ffaf80">
        <group scale={0.8} position-z={-0.3}>
          <TrianglesDemo />
        </group>
      </Demo>

      <Demo position={[2, 0, 0]} color="#20b0ff">
        <group scale={0.8} position-z={-0.3}>
          <ConvexHullDemo />
        </group>
      </Demo>
    </group>
  );
}

function App() {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 2]}
      camera={{ position: [8, 8, 8], zoom: 150 }}
    >
      <color args={["#333337"]} attach="background" />
      <directionalLight
        position={[0, 20, 0]}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Scene />
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
      >
        <planeGeometry args={[10, 10]} />
        <shadowMaterial transparent opacity={0.5} />
      </mesh>
    </Canvas>
  );
}

export default App;
