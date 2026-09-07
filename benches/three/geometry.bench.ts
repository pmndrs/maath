import { assert, bench, group } from '@pmndrs/labs';
import { checksum, createGeometry, createMathGeometry, maxDifference, transformMath, transformThree } from './geometry';

// Normal matrix arithmetic can differ by one float32 rounding step.

function threeReference() {
    const g = createGeometry();
    transformThree(g);
    return g;
}

function mathReference() {
    const g = createGeometry();
    transformMath(g, createMathGeometry());
    return g;
}

group('three geometry transform 8481 vertices @three @geometry', () => {
    bench('three: fromBufferAttribute/applyMatrix4/setXYZ', function* () {
        const g = createGeometry();
        yield () => transformThree(g);
        const diff = maxDifference(g, mathReference());
        assert(diff <= 1e-5, `three and math attributes differ by ${diff}`);
        return checksum(g);
    });

    bench('math: fromBuffer/transformMat4/toBuffer', function* () {
        const g = createGeometry();
        const w = createMathGeometry();
        yield () => transformMath(g, w);
        const diff = maxDifference(g, threeReference());
        assert(diff <= 1e-5, `math and three attributes differ by ${diff}`);
        return checksum(g);
    });
});
