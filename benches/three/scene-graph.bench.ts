import { assert, bench, group } from '@pmndrs/labs';
import {
    FRAME_T,
    NODES,
    checksum,
    createExtended,
    createMathGraph,
    createMirror,
    createSceneGraph,
    prepareThreeManual,
    readTransforms,
    updateExtended,
    updateMath,
    updateMirror,
    updateMirrorViaObject3D,
    updateThree,
    updateThreeManual,
} from './scene-graph';

// Snapshot world matrix checksums after the measured work.

function mathReference(): number {
    const s = createSceneGraph(NODES);
    updateMath(s, createMathGraph(s), FRAME_T);
    return checksum(s);
}

function threeReference(): number {
    const s = createSceneGraph(NODES);
    updateThree(s, FRAME_T);
    return checksum(s);
}

group(`three scene graph ${NODES} @three @scene`, () => {
    bench('three: position/quaternion + updateMatrixWorld', function* () {
        const s = createSceneGraph(NODES);
        yield () => updateThree(s, FRAME_T);
        const sum = checksum(s);
        assert(sum === mathReference(), 'three and math world matrices differ');
        return sum;
    });

    bench('three: matrix.compose + updateMatrixWorld', function* () {
        const s = createSceneGraph(NODES);
        prepareThreeManual(s);
        yield () => updateThreeManual(s, FRAME_T);
        const sum = checksum(s);
        assert(sum === mathReference(), 'three (manual) and math world matrices differ');
        return sum;
    });

    bench('math: flat propagate into claimed matrices', function* () {
        const s = createSceneGraph(NODES);
        const g = createMathGraph(s);
        yield () => updateMath(s, g, FRAME_T);
        const sum = checksum(s);
        assert(sum === threeReference(), 'math and three world matrices differ');
        return sum;
    });

    bench('mirror: tuples + root override', function* () {
        const s = createSceneGraph(NODES);
        const g = createMirror(s);
        yield () => updateMirror(s, g, FRAME_T);
        const sum = checksum(s);
        assert(sum === threeReference(), 'mirror and three world matrices differ');
        return sum;
    });

    bench('extend: records + scene override', function* () {
        const s = createSceneGraph(NODES);
        const a = createExtended(s);
        yield () => updateExtended(s, a, FRAME_T);
        const sum = checksum(s);
        assert(sum === threeReference(), 'extend and three world matrices differ');
        return sum;
    });

    bench('mirror: written through Object3D views', function* () {
        const s = createSceneGraph(NODES);
        const g = createMirror(s);
        yield () => updateMirrorViaObject3D(s, g, FRAME_T);
        const sum = checksum(s);
        assert(sum === threeReference(), 'mirror (views) and three world matrices differ');
        return sum;
    });

    bench('three: step + read every position/rotation', function* () {
        const s = createSceneGraph(NODES);
        const acc = yield () => {
            updateThree(s, FRAME_T);
            return readTransforms(s);
        };
        return acc;
    });

    bench('mirror: step + read every position/rotation', function* () {
        const s = createSceneGraph(NODES);
        const g = createMirror(s);
        const acc = yield () => {
            updateMirror(s, g, FRAME_T);
            return readTransforms(s);
        };
        const ref = createSceneGraph(NODES);
        updateThree(ref, FRAME_T);
        assert(acc === readTransforms(ref), 'mirror reads differ from three');
        return acc;
    });
});
