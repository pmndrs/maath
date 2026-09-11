import { assert, bench, group } from '@pmndrs/labs';
import {
    FRAME_T,
    INSTANCES,
    checksum,
    createInstanced,
    createMathInstanced,
    updateMath,
    updateThreeCompose,
    updateThreeObject3D,
} from './instanced';

// Snapshot instance buffer checksums after the measured work.

function mathReference(): number {
    const s = createInstanced(INSTANCES);
    updateMath(s, createMathInstanced(s), FRAME_T);
    return checksum(s);
}

function threeReference(): number {
    const s = createInstanced(INSTANCES);
    updateThreeObject3D(s, FRAME_T);
    return checksum(s);
}

group(`three instanced transforms ${INSTANCES} @three @instanced`, () => {
    bench('three: Object3D dummy + setMatrixAt', function* () {
        const s = createInstanced(INSTANCES);
        yield () => updateThreeObject3D(s, FRAME_T);
        const sum = checksum(s);
        assert(sum === mathReference(), 'three and math instance buffers differ');
        return sum;
    });

    bench('three: Matrix4.compose + setMatrixAt', function* () {
        const s = createInstanced(INSTANCES);
        yield () => updateThreeCompose(s, FRAME_T);
        const sum = checksum(s);
        assert(sum === mathReference(), 'three (compose) and math instance buffers differ');
        return sum;
    });

    bench('math: compose into instance buffer views', function* () {
        const s = createInstanced(INSTANCES);
        const m = createMathInstanced(s);
        yield () => updateMath(s, m, FRAME_T);
        const sum = checksum(s);
        assert(sum === threeReference(), 'math and three instance buffers differ');
        return sum;
    });
});
