import { beforeEach, describe, expect, it } from 'vitest';
import { type Vec3, vec3 } from '../../../src';

describe('vec3', () => {
    let a: Vec3;
    let b: Vec3;
    let out: Vec3;

    beforeEach(() => {
        a = [1, 2, 3];
        b = [4, 5, 6];
        out = [0, 0, 0];
    });

    describe('create', () => {
        it('should create a zero vector', () => {
            const result = vec3.create();
            expect(result).toEqual([0, 0, 0]);
        });
    });

    describe('clone', () => {
        it('should create a copy of the vector', () => {
            const result = vec3.clone(a);
            expect(result).toEqual([1, 2, 3]);
            expect(result).not.toBe(a);
        });
    });

    describe('fromValues', () => {
        it('should create a vector with given values', () => {
            const result = vec3.fromValues(7, 8, 9);
            expect(result).toEqual([7, 8, 9]);
        });
    });

    describe('copy', () => {
        it('should copy values from source to output vector', () => {
            const result = vec3.copy(out, a);
            expect(result).toEqual([1, 2, 3]);
            expect(result).toBe(out);
        });
    });

    describe('set', () => {
        it('should set the vector components', () => {
            const result = vec3.set(out, 1, 2, 3);
            expect(result).toEqual([1, 2, 3]);
            expect(result).toBe(out);
        });
    });

    describe('fromBuffer', () => {
        it('should set components from buffer', () => {
            const buffer = [10, 20, 30, 40, 50];
            const result = vec3.fromBuffer(out, buffer, 1);
            expect(result).toEqual([20, 30, 40]);
        });
    });

    describe('toBuffer', () => {
        it('should write components to buffer', () => {
            const buffer = new Array(5).fill(0);
            vec3.toBuffer(buffer, a, 1);
            expect(buffer).toEqual([0, 1, 2, 3, 0]);
        });
    });

    describe('add', () => {
        it('should add two vectors', () => {
            const result = vec3.add(out, a, b);
            expect(result).toEqual([5, 7, 9]);
        });
    });

    describe('addScalar', () => {
        it('should add scalar to all components', () => {
            const result = vec3.addScalar(out, a, 10);
            expect(result).toEqual([11, 12, 13]);
        });
    });

    describe('subtract', () => {
        it('should subtract second vector from first', () => {
            const result = vec3.subtract(out, b, a);
            expect(result).toEqual([3, 3, 3]);
        });
    });

    describe('subtractScalar', () => {
        it('should subtract scalar from all components', () => {
            const result = vec3.subtractScalar(out, a, 1);
            expect(result).toEqual([0, 1, 2]);
        });
    });

    describe('multiply', () => {
        it('should multiply vectors component-wise', () => {
            const result = vec3.multiply(out, a, b);
            expect(result).toEqual([4, 10, 18]);
        });
    });

    describe('divide', () => {
        it('should divide vectors component-wise', () => {
            const result = vec3.divide(out, [8, 10, 12], [2, 5, 4]);
            expect(result).toEqual([4, 2, 3]);
        });
    });

    describe('ceil', () => {
        it('should ceil all components', () => {
            const result = vec3.ceil(out, [1.1, 2.7, 3.3]);
            expect(result).toEqual([2, 3, 4]);
        });
    });

    describe('floor', () => {
        it('should floor all components', () => {
            const result = vec3.floor(out, [1.9, 2.1, 3.8]);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe('min', () => {
        it('should return minimum of each component', () => {
            const result = vec3.min(out, a, b);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe('max', () => {
        it('should return maximum of each component', () => {
            const result = vec3.max(out, a, b);
            expect(result).toEqual([4, 5, 6]);
        });
    });

    describe('round', () => {
        it('should round all components', () => {
            const result = vec3.round(out, [1.4, 2.6, 3.5]);
            expect(result).toEqual([1, 3, 4]);
        });
    });

    describe('scale', () => {
        it('should scale vector by scalar', () => {
            const result = vec3.scale(out, a, 2);
            expect(result).toEqual([2, 4, 6]);
        });
    });

    describe('scaleAndAdd', () => {
        it('should scale second vector and add to first', () => {
            const result = vec3.scaleAndAdd(out, a, b, 2);
            expect(result).toEqual([9, 12, 15]);
        });
    });

    describe('distance', () => {
        it('should calculate distance between vectors', () => {
            const result = vec3.distance(a, b);
            expect(result).toBeCloseTo(Math.sqrt(27));
        });

        it('should return 0 for same vectors', () => {
            expect(vec3.distance(a, a)).toBe(0);
        });
    });

    describe('squaredDistance', () => {
        it('should calculate squared distance between vectors', () => {
            const result = vec3.squaredDistance(a, b);
            expect(result).toBe(27);
        });
    });

    describe('length', () => {
        it('should calculate vector length', () => {
            const result = vec3.length([3, 4, 0]);
            expect(result).toBe(5);
        });

        it('should return 0 for zero vector', () => {
            expect(vec3.length([0, 0, 0])).toBe(0);
        });
    });

    describe('squaredLength', () => {
        it('should calculate squared length', () => {
            const result = vec3.squaredLength([3, 4, 0]);
            expect(result).toBe(25);
        });
    });

    describe('negate', () => {
        it('should negate all components', () => {
            const result = vec3.negate(out, a);
            expect(result).toEqual([-1, -2, -3]);
        });
    });

    describe('inverse', () => {
        it('should invert all components', () => {
            const result = vec3.inverse(out, [2, 4, 8]);
            expect(result).toEqual([0.5, 0.25, 0.125]);
        });
    });

    describe('normalize', () => {
        it('should normalize vector to unit length', () => {
            const result = vec3.normalize(out, [3, 4, 0]);
            expect(result[0]).toBeCloseTo(0.6);
            expect(result[1]).toBeCloseTo(0.8);
            expect(result[2]).toBeCloseTo(0);
            expect(vec3.length(result)).toBeCloseTo(1);
        });

        it('should handle zero vector', () => {
            const result = vec3.normalize(out, [0, 0, 0]);
            expect(result).toEqual([0, 0, 0]);
        });
    });

    describe('dot', () => {
        it('should calculate dot product', () => {
            const result = vec3.dot(a, b);
            expect(result).toBe(32); // 1*4 + 2*5 + 3*6
        });

        it('should return 0 for perpendicular vectors', () => {
            const result = vec3.dot([1, 0, 0], [0, 1, 0]);
            expect(result).toBe(0);
        });
    });

    describe('cross', () => {
        it('should calculate cross product', () => {
            const result = vec3.cross(out, [1, 0, 0], [0, 1, 0]);
            expect(result).toEqual([0, 0, 1]);
        });

        it('should be anti-commutative', () => {
            const result1 = vec3.cross(vec3.create(), a, b);
            const result2 = vec3.cross(vec3.create(), b, a);
            expect(result1).toEqual([-3, 6, -3]);
            expect(result2).toEqual([3, -6, 3]);
        });
    });

    describe('lerp', () => {
        it('should interpolate between vectors', () => {
            const result = vec3.lerp(out, a, b, 0.5);
            expect(result).toEqual([2.5, 3.5, 4.5]);
        });

        it('should return first vector at t=0', () => {
            const result = vec3.lerp(out, a, b, 0);
            expect(result).toEqual(a);
        });

        it('should return second vector at t=1', () => {
            const result = vec3.lerp(out, a, b, 1);
            expect(result).toEqual(b);
        });
    });

    describe('lagrange', () => {
        const c: Vec3 = [7, 9, 11];

        it('should return first vector at t=0', () => {
            const result = vec3.lagrange(out, a, b, c, 0);
            expect(result[0]).toBeCloseTo(a[0]);
            expect(result[1]).toBeCloseTo(a[1]);
            expect(result[2]).toBeCloseTo(a[2]);
        });

        it('should return middle vector at t=0.5', () => {
            const result = vec3.lagrange(out, a, b, c, 0.5);
            expect(result[0]).toBeCloseTo(b[0]);
            expect(result[1]).toBeCloseTo(b[1]);
            expect(result[2]).toBeCloseTo(b[2]);
        });

        it('should return last vector at t=1', () => {
            const result = vec3.lagrange(out, a, b, c, 1);
            expect(result[0]).toBeCloseTo(c[0]);
            expect(result[1]).toBeCloseTo(c[1]);
            expect(result[2]).toBeCloseTo(c[2]);
        });
    });

    describe('slerp', () => {
        it('should spherically interpolate between normalized vectors', () => {
            const v1 = vec3.normalize(vec3.create(), [1, 0, 0]);
            const v2 = vec3.normalize(vec3.create(), [0, 1, 0]);
            const result = vec3.slerp(out, v1, v2, 0.5);
            expect(vec3.length(result)).toBeCloseTo(1);
        });
    });

    describe('hermite', () => {
        it('should perform hermite interpolation', () => {
            const p0: Vec3 = [0, 0, 0];
            const p1: Vec3 = [1, 1, 1];
            const t0: Vec3 = [1, 0, 0];
            const t1: Vec3 = [0, 1, 0];
            const result = vec3.hermite(out, p0, t0, t1, p1, 0.5);
            expect(result).toHaveLength(3);
        });
    });

    describe('bezier', () => {
        it('should perform bezier interpolation', () => {
            const p0: Vec3 = [0, 0, 0];
            const p1: Vec3 = [1, 0, 0];
            const p2: Vec3 = [1, 1, 0];
            const p3: Vec3 = [0, 1, 0];
            const result = vec3.bezier(out, p0, p1, p2, p3, 0.5);
            expect(result).toHaveLength(3);
        });
    });

    describe('transformMat4', () => {
        it('should transform vector by 4x4 matrix', () => {
            // Identity matrix should return original vector
            const identity: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            const result = vec3.transformMat4(out, a, identity as any);
            expect(result).toEqual(a);
        });
    });

    describe('transformMat3', () => {
        it('should transform vector by 3x3 matrix', () => {
            // Identity matrix should return original vector
            const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            const result = vec3.transformMat3(out, a, identity as any);
            expect(result).toEqual(a);
        });
    });

    describe('transformQuat', () => {
        it('should transform vector by quaternion', () => {
            // Identity quaternion should return original vector
            const identityQuat: number[] = [0, 0, 0, 1];
            const result = vec3.transformQuat(out, a, identityQuat as any);
            expect(result[0]).toBeCloseTo(a[0]);
            expect(result[1]).toBeCloseTo(a[1]);
            expect(result[2]).toBeCloseTo(a[2]);
        });
    });

    describe('rotateX', () => {
        it('should rotate vector around x-axis', () => {
            const origin: Vec3 = [0, 0, 0];
            const result = vec3.rotateX(out, [0, 1, 0], origin, Math.PI / 2);
            expect(result[0]).toBeCloseTo(0);
            expect(result[1]).toBeCloseTo(0);
            expect(result[2]).toBeCloseTo(1);
        });
    });

    describe('rotateY', () => {
        it('should rotate vector around y-axis', () => {
            const origin: Vec3 = [0, 0, 0];
            const result = vec3.rotateY(out, [1, 0, 0], origin, Math.PI / 2);
            expect(result[0]).toBeCloseTo(0);
            expect(result[1]).toBeCloseTo(0);
            expect(result[2]).toBeCloseTo(-1);
        });
    });

    describe('rotateZ', () => {
        it('should rotate vector around z-axis', () => {
            const origin: Vec3 = [0, 0, 0];
            const result = vec3.rotateZ(out, [1, 0, 0], origin, Math.PI / 2);
            expect(result[0]).toBeCloseTo(0);
            expect(result[1]).toBeCloseTo(1);
            expect(result[2]).toBeCloseTo(0);
        });
    });

    describe('angle', () => {
        it('should calculate angle between vectors', () => {
            const result = vec3.angle([1, 0, 0], [0, 1, 0]);
            expect(result).toBeCloseTo(Math.PI / 2);
        });

        it('should return 0 for parallel vectors', () => {
            const result = vec3.angle([1, 2, 3], [2, 4, 6]);
            expect(result).toBeCloseTo(0);
        });
    });

    describe('zero', () => {
        it('should set all components to zero', () => {
            const result = vec3.zero(a);
            expect(result).toEqual([0, 0, 0]);
            expect(result).toBe(a);
        });
    });

    describe('str', () => {
        it('should return string representation', () => {
            const result = vec3.str(a);
            expect(result).toBe('vec3(1, 2, 3)');
        });
    });

    describe('exactEquals', () => {
        it('should return true for exactly equal vectors', () => {
            expect(vec3.exactEquals(a, [1, 2, 3])).toBe(true);
        });

        it('should return false for different vectors', () => {
            expect(vec3.exactEquals(a, b)).toBe(false);
        });

        it('should return false for approximately equal vectors', () => {
            expect(vec3.exactEquals([1, 2, 3], [1.0000001, 2, 3])).toBe(false);
        });
    });

    describe('equals', () => {
        it('should return true for approximately equal vectors', () => {
            expect(vec3.equals([1, 2, 3], [1.0000001, 2, 3])).toBe(true);
        });

        it('should return false for significantly different vectors', () => {
            expect(vec3.equals(a, b)).toBe(false);
        });
    });

    describe('finite', () => {
        it('should return true for finite vectors', () => {
            expect(vec3.finite(a)).toBe(true);
        });

        it('should return false for vectors with infinity', () => {
            expect(vec3.finite([1, Infinity, 3])).toBe(false);
        });

        it('should return false for vectors with NaN', () => {
            expect(vec3.finite([1, NaN, 3])).toBe(false);
        });
    });

    describe('aliases', () => {
        it('sub should be alias for subtract', () => {
            expect(vec3.sub).toBe(vec3.subtract);
        });

        it('mul should be alias for multiply', () => {
            expect(vec3.mul).toBe(vec3.multiply);
        });

        it('div should be alias for divide', () => {
            expect(vec3.div).toBe(vec3.divide);
        });

        it('dist should be alias for distance', () => {
            expect(vec3.dist).toBe(vec3.distance);
        });

        it('sqrDist should be alias for squaredDistance', () => {
            expect(vec3.sqrDist).toBe(vec3.squaredDistance);
        });

        it('len should be alias for length', () => {
            expect(vec3.len).toBe(vec3.length);
        });

        it('sqrLen should be alias for squaredLength', () => {
            expect(vec3.sqrLen).toBe(vec3.squaredLength);
        });
    });

    describe('isScaleInsideOut', () => {
        it('should return false for all positive scale', () => {
            expect(vec3.isScaleInsideOut([1, 2, 3])).toBe(false);
            expect(vec3.isScaleInsideOut([0.5, 2, 4])).toBe(false);
        });

        it('should return true for one negative component (reflection)', () => {
            expect(vec3.isScaleInsideOut([-1, 1, 1])).toBe(true);
            expect(vec3.isScaleInsideOut([1, -2, 1])).toBe(true);
            expect(vec3.isScaleInsideOut([1, 1, -3])).toBe(true);
        });

        it('should return false for two negative components', () => {
            expect(vec3.isScaleInsideOut([-1, -2, 1])).toBe(false);
            expect(vec3.isScaleInsideOut([-1, 1, -3])).toBe(false);
            expect(vec3.isScaleInsideOut([1, -2, -3])).toBe(false);
        });

        it('should return true for three negative components', () => {
            expect(vec3.isScaleInsideOut([-1, -2, -3])).toBe(true);
        });

        it('should handle zero and negative values', () => {
            expect(vec3.isScaleInsideOut([0, 1, 1])).toBe(false);
            expect(vec3.isScaleInsideOut([0, -1, 1])).toBe(true);
            expect(vec3.isScaleInsideOut([0, -1, -1])).toBe(false);
        });
    });

    describe('projectOnVector', () => {
        it('projects onto an axis', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.projectOnVector(out, [2, 3, 4], [1, 0, 0]);
            expect(out).toEqual([2, 0, 0]);
        });

        it('handles a non-unit target', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.projectOnVector(out, [2, 2, 0], [5, 0, 0]);
            expect(out).toEqual([2, 0, 0]);
        });

        it('returns zero when projecting onto the zero vector', () => {
            const out: Vec3 = [9, 9, 9];
            vec3.projectOnVector(out, [2, 3, 4], [0, 0, 0]);
            expect(out).toEqual([0, 0, 0]);
        });

        it('is safe when out aliases an input', () => {
            const v: Vec3 = [2, 3, 4];
            vec3.projectOnVector(v, v, [1, 0, 0]);
            expect(v).toEqual([2, 0, 0]);
        });
    });

    describe('projectOnPlane', () => {
        it('drops the component along the normal', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.projectOnPlane(out, [1, 2, 3], [0, 1, 0]);
            expect(out).toEqual([1, 0, 3]);
        });

        it('returns zero for a vector parallel to the normal', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.projectOnPlane(out, [0, 5, 0], [0, 1, 0]);
            expect(out[0]).toBeCloseTo(0);
            expect(out[1]).toBeCloseTo(0);
            expect(out[2]).toBeCloseTo(0);
        });

        it('leaves an in-plane vector untouched', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.projectOnPlane(out, [1, 0, 3], [0, 1, 0]);
            expect(out).toEqual([1, 0, 3]);
        });

        it('is safe when out aliases an input', () => {
            const v: Vec3 = [1, 2, 3];
            vec3.projectOnPlane(v, v, [0, 1, 0]);
            expect(v).toEqual([1, 0, 3]);
        });
    });

    describe('signedAngle', () => {
        it('is positive for a counter-clockwise turn about the axis', () => {
            expect(vec3.signedAngle([1, 0, 0], [0, 1, 0], [0, 0, 1])).toBeCloseTo(Math.PI / 2);
        });

        it('is negative for a clockwise turn about the axis', () => {
            expect(vec3.signedAngle([0, 1, 0], [1, 0, 0], [0, 0, 1])).toBeCloseTo(-Math.PI / 2);
        });

        it('negates when the axis is flipped', () => {
            const positive = vec3.signedAngle([1, 0, 0], [0, 1, 0], [0, 0, 1]);
            const negative = vec3.signedAngle([1, 0, 0], [0, 1, 0], [0, 0, -1]);
            expect(negative).toBeCloseTo(-positive);
        });

        it('ignores the components along the axis', () => {
            const flat = vec3.signedAngle([1, 0, 0], [0, 1, 0], [0, 0, 1]);
            const tilted = vec3.signedAngle([1, 0, 7], [0, 1, -3], [0, 0, 1]);
            expect(tilted).toBeCloseTo(flat);
        });

        it('returns zero for identical vectors', () => {
            expect(vec3.signedAngle([0, 0, 1], [0, 0, 1], [0, 0, 1])).toBe(0);
        });

        it('agrees with angle in magnitude for in-plane vectors', () => {
            const a: Vec3 = [1, 0, 0];
            const b: Vec3 = [-0.5, 0.5, 0];
            const axis: Vec3 = [0, 0, 1];
            expect(Math.abs(vec3.signedAngle(a, b, axis))).toBeCloseTo(vec3.angle(a, b));
        });
    });

    describe('rotateTowards', () => {
        it('copies the target when it is already within the limit', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.rotateTowards(out, [1, 0, 0], [0, 1, 0], Math.PI);
            expect(out).toEqual([0, 1, 0]);
        });

        it('clamps to exactly the limit when the target is beyond it', () => {
            const out: Vec3 = [0, 0, 0];
            const from: Vec3 = [1, 0, 0];
            vec3.rotateTowards(out, from, [0, 1, 0], Math.PI / 4);
            expect(vec3.angle(from, out)).toBeCloseTo(Math.PI / 4);
            expect(vec3.length(out)).toBeCloseTo(1);
        });

        it('rotates in the plane of the two vectors', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.rotateTowards(out, [1, 0, 0], [0, 1, 0], Math.PI / 4);
            expect(out[0]).toBeCloseTo(Math.SQRT1_2);
            expect(out[1]).toBeCloseTo(Math.SQRT1_2);
            expect(out[2]).toBeCloseTo(0);
        });

        it('returns from when the limit is zero', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.rotateTowards(out, [1, 0, 0], [0, 1, 0], 0);
            expect(out[0]).toBeCloseTo(1);
            expect(out[1]).toBeCloseTo(0);
        });

        it('treats a negative limit as zero', () => {
            const out: Vec3 = [0, 0, 0];
            vec3.rotateTowards(out, [1, 0, 0], [0, 1, 0], -1);
            expect(out[0]).toBeCloseTo(1);
            expect(out[1]).toBeCloseTo(0);
        });

        it('picks an arbitrary plane for antiparallel inputs', () => {
            const out: Vec3 = [0, 0, 0];
            const from: Vec3 = [0, 1, 0];
            vec3.rotateTowards(out, from, [0, -1, 0], 0.5);
            expect(out.every(Number.isFinite)).toBe(true);
            expect(vec3.length(out)).toBeCloseTo(1);
            expect(vec3.angle(from, out)).toBeCloseTo(0.5);
        });

        it('is safe when out aliases an input', () => {
            const v: Vec3 = [1, 0, 0];
            vec3.rotateTowards(v, v, [0, 1, 0], Math.PI / 4);
            expect(v[0]).toBeCloseTo(Math.SQRT1_2);
            expect(v[1]).toBeCloseTo(Math.SQRT1_2);
        });
    });

    describe('perpendicular', () => {
        it('returns a unit vector perpendicular to the input', () => {
            const out: Vec3 = [0, 0, 0];
            for (const v of [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
                [0.3, -0.5, 0.81],
            ] as Vec3[]) {
                vec3.perpendicular(out, v);
                expect(vec3.length(out)).toBeCloseTo(1);
                expect(vec3.dot(out, v)).toBeCloseTo(0);
            }
        });

        it('returns an axis rather than NaN for the zero vector', () => {
            // every direction is perpendicular to the zero vector, so there is nothing to divide by
            const out: Vec3 = [0, 0, 0];
            vec3.perpendicular(out, [0, 0, 0]);
            expect(out.every(Number.isFinite)).toBe(true);
            expect(vec3.length(out)).toBeCloseTo(1);
        });
    });
});
