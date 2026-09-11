import type { Sphere as ThreeSphere } from 'three';
import { Frustum, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SphereGeometry, Vector3 } from 'three';
import type { Mat4 } from '../../src/core/mat4';
import * as mulberry32 from '../../src/random/mulberry32';
import * as frustum from '../../src/shapes/frustum';
import * as sphere from '../../src/shapes/sphere';
import { frustumFromCamera, sphereToWorld } from '../../src/three';

// Cull bounding spheres against a perspective camera. Both variants read three's matrices.

export const MESHES = 4096;

const AXIS = new Vector3(0.267261, 0.534522, 0.801784);

export function createCulling(count: number) {
    const rand = mulberry32.create(42);
    const scene = new Scene();
    const geometry = new SphereGeometry(1, 8, 6);
    geometry.computeBoundingSphere();
    const material = new MeshBasicMaterial();
    const meshes: Mesh[] = [];
    for (let i = 0; i < count; i++) {
        const mesh = new Mesh(geometry, material);
        mesh.position.set(
            (mulberry32.sample(rand) - 0.5) * 80,
            (mulberry32.sample(rand) - 0.5) * 80,
            (mulberry32.sample(rand) - 0.5) * 80,
        );
        mesh.scale.set(
            0.5 + mulberry32.sample(rand) * 1.5,
            0.5 + mulberry32.sample(rand) * 1.5,
            0.5 + mulberry32.sample(rand) * 1.5,
        );
        mesh.quaternion.setFromAxisAngle(AXIS, mulberry32.sample(rand) * Math.PI * 2);
        scene.add(mesh);
        meshes.push(mesh);
    }
    const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 100);
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    scene.updateMatrixWorld();
    return { scene, camera, meshes, count };
}
export type Culling = ReturnType<typeof createCulling>;

const projScreen = new Matrix4();
const threeFrustum = new Frustum();

export function cullThree(s: Culling): number {
    const { camera, meshes, count } = s;
    projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    threeFrustum.setFromProjectionMatrix(projScreen);
    let visible = 0;
    for (let i = 0; i < count; i++) {
        if (threeFrustum.intersectsObject(meshes[i])) visible++;
    }
    return visible;
}

export function createMathCulling(s: Culling) {
    const worlds: Mat4[] = new Array(s.count);
    const spheres: ThreeSphere[] = new Array(s.count);
    for (let i = 0; i < s.count; i++) {
        const mesh = s.meshes[i];
        worlds[i] = mesh.matrixWorld.elements;
        const bounds = mesh.geometry.boundingSphere;
        if (bounds === null) throw new Error('geometry has no bounding sphere');
        spheres[i] = bounds;
    }
    return { worlds, spheres, f: frustum.create(), s: sphere.create() };
}
export type MathCulling = ReturnType<typeof createMathCulling>;

export function cullMath(s: Culling, c: MathCulling): number {
    const { worlds, spheres, f } = c;
    frustumFromCamera(f, s.camera);
    let visible = 0;
    for (let i = 0; i < s.count; i++) {
        sphereToWorld(c.s, spheres[i], worlds[i]);
        if (frustum.intersectsSphere(f, c.s)) visible++;
    }
    return visible;
}
