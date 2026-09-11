import { assert, bench, group } from '@pmndrs/labs';
import { MESHES, createCulling, createMathCulling, cullMath, cullThree } from './culling';

// Plane extraction can round differently for spheres touching the frustum boundary.

group(`three frustum culling ${MESHES} @three @culling`, () => {
    bench('three: Frustum.intersectsObject', function* () {
        const s = createCulling(MESHES);
        const expected = cullMath(s, createMathCulling(s));
        const visible = yield () => cullThree(s);
        assert(visible === expected, `three saw ${visible} visible, math saw ${expected}`);
        return visible;
    });

    bench('math: frustumFromCamera + sphereToWorld', function* () {
        const s = createCulling(MESHES);
        const c = createMathCulling(s);
        const expected = cullThree(s);
        const visible = yield () => cullMath(s, c);
        assert(visible === expected, `math saw ${visible} visible, three saw ${expected}`);
        return visible;
    });
});
