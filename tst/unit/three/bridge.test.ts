import {
    BoxGeometry,
    BufferAttribute,
    Frustum,
    InstancedMesh,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    Scene,
    SphereGeometry,
    Vector3,
} from 'three';
import { describe, expect, it } from 'vitest';
import { mat4, quat, vec3 } from '../../../src';
import { frustum, sphere } from '../../../src/shapes';
import {
    claimTransform,
    frustumFromCamera,
    instanceMat4Views,
    mat4Of,
    sphereToWorld,
    vec3FromAttribute,
    vec3ToAttribute,
} from '../../../src/three';

describe('three bridge', () => {
    it('writes instance transforms into the buffer used by three', () => {
        const a = new InstancedMesh(new BoxGeometry(), new MeshBasicMaterial(), 8);
        const b = new InstancedMesh(new BoxGeometry(), new MeshBasicMaterial(), 8);
        const views = instanceMat4Views(a);
        const dummy = new Object3D();
        for (let i = 0; i < 8; i++) {
            const q = quat.setAxisAngle(quat.create(), [0, 1, 0], i * 0.3);
            mat4.fromRotationTranslationScale(views[i], q, [i, 0, 0], [1, 2, 1]);
            dummy.position.set(i, 0, 0);
            dummy.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), i * 0.3);
            dummy.scale.set(1, 2, 1);
            dummy.updateMatrix();
            b.setMatrixAt(i, dummy.matrix);
        }
        expect(a.instanceMatrix.array).toEqual(b.instanceMatrix.array);
    });

    it('culls visible, offscreen and behind-camera meshes like three', () => {
        const scene = new Scene();
        const geometry = new SphereGeometry(1, 4, 3);
        geometry.computeBoundingSphere();
        for (const position of [new Vector3(0, 0, -5), new Vector3(20, 0, -5), new Vector3(0, 0, 5)]) {
            const mesh = new Mesh(geometry, new MeshBasicMaterial());
            mesh.position.copy(position);
            mesh.scale.set(1, 2, 0.5);
            scene.add(mesh);
        }
        const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 100);
        camera.updateMatrixWorld();
        scene.updateMatrixWorld();

        const threeFrustum = new Frustum().setFromProjectionMatrix(
            new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
        );
        const f = frustumFromCamera(frustum.create(), camera);
        const s = sphere.create();
        const visible: boolean[] = [];
        for (const mesh of scene.children as Mesh[]) {
            sphereToWorld(s, geometry.boundingSphere!, mesh.matrixWorld.elements);
            const result = frustum.intersectsSphere(f, s);
            expect(result).toBe(threeFrustum.intersectsObject(mesh));
            visible.push(result);
        }
        expect(visible).toEqual([true, false, false]);
    });

    it('transforms vertex attributes like three', () => {
        const source = new BoxGeometry().getAttribute('position') as BufferAttribute;
        const a = new BufferAttribute(new Float32Array(source.count * 3), 3);
        const b = new BufferAttribute(new Float32Array(source.count * 3), 3);
        const matrix = new Matrix4().makeRotationY(0.4).setPosition(1, 2, 3);
        const v = vec3.create();
        const w = new Vector3();
        for (let i = 0; i < source.count; i++) {
            vec3.transformMat4(v, vec3FromAttribute(v, source, i), mat4Of(matrix));
            vec3ToAttribute(a, v, i);
            w.fromBufferAttribute(source, i).applyMatrix4(matrix);
            b.setXYZ(i, w.x, w.y, w.z);
        }
        expect(a.array).toEqual(b.array);
    });

    it('preserves caller-owned matrices during three updates', () => {
        const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
        const { world } = claimTransform(mesh);
        mat4.fromRotationTranslationScale(world, quat.create(), [4, 5, 6], [1, 1, 1]);
        mesh.position.set(9, 9, 9);
        mesh.updateMatrixWorld(true);
        expect(mesh.matrixWorld.elements.slice(12, 15)).toEqual([4, 5, 6]);
    });

    it('honors normalized attributes like getX and setXYZ', () => {
        const a = new BufferAttribute(new Uint8Array([255, 128, 0]), 3, true);
        const v = vec3FromAttribute(vec3.create(), a, 0);
        expect(v).toEqual([a.getX(0), a.getY(0), a.getZ(0)]);
        const b = new BufferAttribute(new Uint8Array(3), 3, true);
        const c = new BufferAttribute(new Uint8Array(3), 3, true);
        vec3ToAttribute(b, [1, 0.5, 0], 0);
        c.setXYZ(0, 1, 0.5, 0);
        expect(b.array).toEqual(c.array);
    });
});
