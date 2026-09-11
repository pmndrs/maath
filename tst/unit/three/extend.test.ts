import {
    AnimationClip,
    AnimationMixer,
    Bone,
    BoxGeometry,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    Scene,
    Skeleton,
    SkinnedMesh,
    Vector3,
    VectorKeyframeTrack,
} from 'three';
import { describe, expect, it } from 'vitest';
import { quat, vec3 } from '../../../src';
import { extend, extendObject, release, transformOf, unextend } from '../../../src/three';

// A plain scene and an extended scene are put through the same operations. Three's own
// updateMatrixWorld on the plain scene is the reference, and world matrices must match exactly.

function makeScene(count: number) {
    const scene = new Scene();
    const objects: Object3D[] = [];
    for (let i = 0; i < count; i++) {
        const object = new Object3D();
        (i === 0 ? scene : objects[(i - 1) >> 2]).add(object);
        object.position.set(i * 0.1, 1, -i * 0.05);
        object.rotation.set(0, i * 0.01, 0.2);
        objects.push(object);
    }
    scene.updateMatrixWorld();
    return { scene, objects };
}

function worlds(scene: Scene): number[] {
    const out: number[] = [];
    scene.traverse((object) => out.push(...object.matrixWorld.elements));
    return out;
}

describe('extend', () => {
    it('drives three from records: write position and rotation tuples, three renders the result', () => {
        const plain = makeScene(64);
        const { scene, objects } = makeScene(64);
        extend(scene);
        for (const [i, object] of objects.entries()) {
            const t = transformOf(object);
            vec3.set(t.position, i, 2, 3);
            quat.setAxisAngle(t.rotation, [0, 1, 0], i * 0.1);
            plain.objects[i].position.set(i, 2, 3);
            plain.objects[i].quaternion.setFromAxisAngle(new Vector3(0, 1, 0), i * 0.1);
        }
        scene.updateMatrixWorld();
        plain.scene.updateMatrixWorld();
        expect(worlds(scene)).toEqual(worlds(plain.scene));
        // the Object3D interface reads what the records hold
        expect(objects[5].position.x).toBe(5);
        expect(objects[5].rotation.y).toBe(plain.objects[5].rotation.y);
        // the record aliases the matrices three renders from
        expect(transformOf(objects[5]).world).toBe(objects[5].matrixWorld.elements);
    });

    it("keeps three's API working: position, rotation, quaternion and scale writes land in the records", () => {
        const plain = makeScene(16);
        const { scene, objects } = makeScene(16);
        extend(scene);
        for (const [i, object] of objects.entries()) {
            object.position.x += 1;
            object.rotation.y = 2;
            object.scale.set(2, 1, 0.5);
            plain.objects[i].position.x += 1;
            plain.objects[i].rotation.y = 2;
            plain.objects[i].scale.set(2, 1, 0.5);
        }
        scene.updateMatrixWorld();
        plain.scene.updateMatrixWorld();
        expect(worlds(scene)).toEqual(worlds(plain.scene));
        expect(transformOf(objects[3]).scale).toEqual([2, 1, 0.5]);
        // explicit Euler angles survive a pass until the quaternion changes, as in three
        objects[3].rotation.y += 0.1;
        plain.objects[3].rotation.y += 0.1;
        expect(objects[3].rotation.y).toBe(2.1);
        scene.updateMatrixWorld();
        plain.scene.updateMatrixWorld();
        expect(worlds(scene)).toEqual(worlds(plain.scene));
    });

    it('follows structural changes: objects added later are extended, removed ones released, attach keeps world transforms', () => {
        const plain = makeScene(32);
        const { scene, objects } = makeScene(32);
        extend(scene);
        for (const s of [plain, { scene, objects }]) {
            const added = new Object3D();
            added.position.set(1, 2, 3);
            s.objects[5].add(added);
            s.objects[2].attach(s.objects[30]);
            s.objects[3].removeFromParent();
            s.scene.updateMatrixWorld();
        }
        expect(worlds(scene)).toEqual(worlds(plain.scene));
        expect(transformOf(objects[5].children[objects[5].children.length - 1]).position).toEqual([1, 2, 3]);
        expect(() => transformOf(objects[3])).toThrow();
    });

    it('keeps an object working when it moves from one extended scene to another', () => {
        const a = extend(makeScene(8).scene);
        const b = extend(makeScene(8).scene);
        const object = a.children[0].children[0];
        const record = transformOf(object);
        b.add(object);
        a.updateMatrixWorld();
        b.updateMatrixWorld();
        object.position.x = 7;
        b.updateMatrixWorld();
        expect(transformOf(object)).toBe(record);
        expect(object.matrixWorld.elements[12]).toBe(7);
    });

    it('lets cameras and skinned meshes run their own updateMatrixWorld', () => {
        const plain = makeScene(8);
        const { scene, objects } = makeScene(8);
        extend(scene);
        const make = (parent: Object3D) => {
            const camera = new PerspectiveCamera();
            camera.position.set(0, 0, 5);
            parent.add(camera);
            const bone = new Bone();
            const skinned = new SkinnedMesh(new BoxGeometry(), new MeshBasicMaterial());
            skinned.add(bone);
            skinned.bind(new Skeleton([bone]));
            parent.add(skinned);
            return { camera, skinned };
        };
        const a = make(plain.objects[7]);
        const b = make(objects[7]);
        plain.scene.updateMatrixWorld();
        scene.updateMatrixWorld();
        expect(b.camera.matrixWorldInverse.elements).toEqual(a.camera.matrixWorldInverse.elements);
        expect(b.skinned.bindMatrixInverse.elements).toEqual(a.skinned.bindMatrixInverse.elements);
    });

    it('works with an AnimationMixer created after extend', () => {
        const plain = makeScene(4);
        const { scene, objects } = makeScene(4);
        extend(scene);
        const clip = new AnimationClip('move', 1, [new VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 1, 2, 3])]);
        const mixers = [plain.objects[2], objects[2]].map((target) => {
            const mixer = new AnimationMixer(target);
            mixer.clipAction(clip).play();
            return mixer;
        });
        for (const mixer of mixers) mixer.update(0.5);
        plain.scene.updateMatrixWorld();
        scene.updateMatrixWorld();
        expect(worlds(scene)).toEqual(worlds(plain.scene));
        expect(transformOf(objects[2]).position[1]).toBe(1);
    });

    it('extendObject covers objects outside the scene, such as a camera, across scene updates', () => {
        const { scene } = makeScene(4);
        extend(scene);
        const camera = new PerspectiveCamera();
        const t = extendObject(camera);
        vec3.set(t.position, 1, 2, 3);
        camera.updateMatrixWorld();
        expect(camera.position.toArray()).toEqual([1, 2, 3]);
        expect(camera.matrixWorld.elements.slice(12, 15)).toEqual([1, 2, 3]);
        // the scene updating, including a rebuild after a structural change, leaves the camera alone
        scene.add(new Object3D());
        scene.updateMatrixWorld();
        vec3.set(t.position, 4, 5, 6);
        camera.updateMatrixWorld();
        expect(transformOf(camera)).toBe(t);
        expect(camera.matrixWorld.elements.slice(12, 15)).toEqual([4, 5, 6]);
        release(camera);
        expect(() => transformOf(camera)).toThrow();
    });

    it('release and unextend put plain three back and the scene keeps updating', () => {
        const plain = makeScene(16);
        const { scene, objects } = makeScene(16);
        extend(scene);
        release(objects[4]);
        expect(() => transformOf(objects[4])).toThrow();
        // a released object still reports hierarchy changes while it stays in the scene
        const child = new Object3D();
        objects[4].add(child);
        plain.objects[4].add(new Object3D());
        scene.updateMatrixWorld();
        expect(transformOf(child)).toBeDefined();

        unextend(scene);
        expect(() => transformOf(objects[1])).toThrow();
        expect(Object.keys(objects[1].position)).toEqual(['x', 'y', 'z']);
        for (const s of [plain, { scene, objects }]) {
            s.objects[1].position.x = 9;
            s.objects[4].add(new Object3D());
            s.scene.updateMatrixWorld();
        }
        expect(worlds(scene)).toEqual(worlds(plain.scene));
    });
});
