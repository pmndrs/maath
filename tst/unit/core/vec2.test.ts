import { beforeEach, describe, expect, it } from 'vitest';
import { type Vec2, type Vec3, vec2 } from '../../../src';

describe('vec2', () => {
    let a: Vec2;
    let b: Vec2;
    let out: Vec2;

    beforeEach(() => {
        a = [1, 2];
        b = [3, 4];
        out = [0, 0];
    });

    describe('create', () => {
        it('should create a zero vector', () => {
            const result = vec2.create();
            expect(result).toEqual([0, 0]);
        });
    });

    describe('clone', () => {
        it('should create a copy of the vector', () => {
            const result = vec2.clone(a);
            expect(result).toEqual([1, 2]);
            expect(result).not.toBe(a);
        });
    });

    describe('fromValues', () => {
        it('should create a vector with given values', () => {
            const result = vec2.fromValues(5, 6);
            expect(result).toEqual([5, 6]);
        });
    });

    describe('copy', () => {
        it('should copy values from source to output vector', () => {
            const result = vec2.copy(out, a);
            expect(result).toEqual([1, 2]);
            expect(result).toBe(out);
        });
    });

    describe('set', () => {
        it('should set the vector components', () => {
            const result = vec2.set(out, 7, 8);
            expect(result).toEqual([7, 8]);
            expect(result).toBe(out);
        });
    });

    describe('fromBuffer', () => {
        it('should set components from buffer', () => {
            const buffer = [10, 20, 30, 40, 50];
            const result = vec2.fromBuffer(out, buffer, 1);
            expect(result).toEqual([20, 30]);
            expect(result).toBe(out);
        });
    });

    describe('toBuffer', () => {
        it('should write components to buffer', () => {
            const buffer = new Array(5).fill(0);
            const result = vec2.toBuffer(buffer, a, 1);
            expect(buffer).toEqual([0, 1, 2, 0, 0]);
            expect(result).toBe(buffer);
        });
    });

    describe('add', () => {
        it('should add two vectors', () => {
            const result = vec2.add(out, a, b);
            expect(result).toEqual([4, 6]);
        });
    });

    describe('addScalar', () => {
        it('should add scalar to all components', () => {
            const result = vec2.addScalar(out, a, 5);
            expect(result).toEqual([6, 7]);
        });
    });

    describe('subtract', () => {
        it('should subtract second vector from first', () => {
            const result = vec2.subtract(out, b, a);
            expect(result).toEqual([2, 2]);
        });
    });

    describe('subtractScalar', () => {
        it('should subtract scalar from all components', () => {
            const result = vec2.subtractScalar(out, a, 1);
            expect(result).toEqual([0, 1]);
        });
    });

    describe('multiply', () => {
        it('should multiply vectors component-wise', () => {
            const result = vec2.multiply(out, a, b);
            expect(result).toEqual([3, 8]);
        });
    });

    describe('divide', () => {
        it('should divide vectors component-wise', () => {
            const result = vec2.divide(out, [6, 8], [2, 4]);
            expect(result).toEqual([3, 2]);
        });
    });

    describe('ceil', () => {
        it('should ceil all components', () => {
            const result = vec2.ceil(out, [1.1, 2.7]);
            expect(result).toEqual([2, 3]);
        });
    });

    describe('floor', () => {
        it('should floor all components', () => {
            const result = vec2.floor(out, [1.9, 2.1]);
            expect(result).toEqual([1, 2]);
        });
    });

    describe('min', () => {
        it('should return minimum of each component', () => {
            const result = vec2.min(out, a, b);
            expect(result).toEqual([1, 2]);
        });
    });

    describe('max', () => {
        it('should return maximum of each component', () => {
            const result = vec2.max(out, a, b);
            expect(result).toEqual([3, 4]);
        });
    });

    describe('round', () => {
        it('should round all components', () => {
            const result = vec2.round(out, [1.4, 2.6]);
            expect(result).toEqual([1, 3]);
        });
    });

    describe('scale', () => {
        it('should scale vector by scalar', () => {
            const result = vec2.scale(out, a, 2);
            expect(result).toEqual([2, 4]);
        });
    });

    describe('scaleAndAdd', () => {
        it('should scale second vector and add to first', () => {
            const result = vec2.scaleAndAdd(out, a, b, 2);
            expect(result).toEqual([7, 10]);
        });
    });

    describe('distance', () => {
        it('should calculate distance between vectors', () => {
            const result = vec2.distance(a, b);
            expect(result).toBeCloseTo(Math.sqrt(8));
        });

        it('should return 0 for same vectors', () => {
            expect(vec2.distance(a, a)).toBe(0);
        });
    });

    describe('squaredDistance', () => {
        it('should calculate squared distance between vectors', () => {
            const result = vec2.squaredDistance(a, b);
            expect(result).toBe(8);
        });
    });

    describe('length', () => {
        it('should calculate vector length', () => {
            const result = vec2.length([3, 4]);
            expect(result).toBe(5);
        });

        it('should return 0 for zero vector', () => {
            expect(vec2.length([0, 0])).toBe(0);
        });
    });

    describe('squaredLength', () => {
        it('should calculate squared length', () => {
            const result = vec2.squaredLength([3, 4]);
            expect(result).toBe(25);
        });
    });

    describe('negate', () => {
        it('should negate all components', () => {
            const result = vec2.negate(out, a);
            expect(result).toEqual([-1, -2]);
        });
    });

    describe('inverse', () => {
        it('should invert all components', () => {
            const result = vec2.inverse(out, [2, 4]);
            expect(result).toEqual([0.5, 0.25]);
        });
    });

    describe('normalize', () => {
        it('should normalize vector to unit length', () => {
            const result = vec2.normalize(out, [3, 4]);
            expect(result[0]).toBeCloseTo(0.6);
            expect(result[1]).toBeCloseTo(0.8);
            expect(vec2.length(result)).toBeCloseTo(1);
        });

        it('should handle zero vector', () => {
            const result = vec2.normalize(out, [0, 0]);
            expect(result).toEqual([0, 0]);
        });
    });

    describe('dot', () => {
        it('should calculate dot product', () => {
            const result = vec2.dot(a, b);
            expect(result).toBe(11); // 1*3 + 2*4
        });

        it('should return 0 for perpendicular vectors', () => {
            const result = vec2.dot([1, 0], [0, 1]);
            expect(result).toBe(0);
        });
    });

    describe('cross', () => {
        it('should calculate cross product as 3D vector', () => {
            const out3: Vec3 = [0, 0, 0];
            const result = vec2.cross(out3, [1, 0], [0, 1]);
            expect(result).toEqual([0, 0, 1]);
        });

        it('should be anti-commutative', () => {
            const out3a: Vec3 = [0, 0, 0];
            const out3b: Vec3 = [0, 0, 0];
            const result1 = vec2.cross(out3a, a, b);
            const result2 = vec2.cross(out3b, b, a);
            expect(result1[2]).toBe(-2);
            expect(result2[2]).toBe(2);
        });
    });

    describe('lerp', () => {
        it('should interpolate between vectors', () => {
            const result = vec2.lerp(out, a, b, 0.5);
            expect(result).toEqual([2, 3]);
        });

        it('should return first vector at t=0', () => {
            const result = vec2.lerp(out, a, b, 0);
            expect(result).toEqual(a);
        });

        it('should return second vector at t=1', () => {
            const result = vec2.lerp(out, a, b, 1);
            expect(result).toEqual(b);
        });
    });

    describe('lagrange', () => {
        const c: Vec2 = [5, 8];

        it('should return first vector at t=0', () => {
            const result = vec2.lagrange(out, a, b, c, 0);
            expect(result[0]).toBeCloseTo(a[0]);
            expect(result[1]).toBeCloseTo(a[1]);
        });

        it('should return middle vector at t=0.5', () => {
            const result = vec2.lagrange(out, a, b, c, 0.5);
            expect(result[0]).toBeCloseTo(b[0]);
            expect(result[1]).toBeCloseTo(b[1]);
        });

        it('should return last vector at t=1', () => {
            const result = vec2.lagrange(out, a, b, c, 1);
            expect(result[0]).toBeCloseTo(c[0]);
            expect(result[1]).toBeCloseTo(c[1]);
        });
    });

    describe('transformMat2', () => {
        it('should transform vector by 2x2 matrix', () => {
            // Identity matrix should return original vector
            const identity: number[] = [1, 0, 0, 1];
            const result = vec2.transformMat2(out, a, identity as any);
            expect(result).toEqual(a);
        });

        it('should apply scaling transformation', () => {
            // Scale by 2 in x, 3 in y
            const scaleMatrix: number[] = [2, 0, 0, 3];
            const result = vec2.transformMat2(out, [1, 1], scaleMatrix as any);
            expect(result).toEqual([2, 3]);
        });
    });

    describe('transformMat2d', () => {
        it('should transform vector by 2D transformation matrix', () => {
            // Identity matrix should return original vector
            const identity: number[] = [1, 0, 0, 1, 0, 0];
            const result = vec2.transformMat2d(out, a, identity as any);
            expect(result).toEqual(a);
        });

        it('should apply translation', () => {
            // Translation by (5, 3)
            const translateMatrix: number[] = [1, 0, 0, 1, 5, 3];
            const result = vec2.transformMat2d(out, [1, 1], translateMatrix as any);
            expect(result).toEqual([6, 4]);
        });
    });

    describe('transformMat3', () => {
        it('should transform vector by 3x3 matrix', () => {
            // Identity matrix should return original vector
            const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            const result = vec2.transformMat3(out, a, identity as any);
            expect(result).toEqual(a);
        });

        it('should apply translation in homogeneous coordinates', () => {
            // Translation by (5, 3)
            const translateMatrix: number[] = [1, 0, 0, 0, 1, 0, 5, 3, 1];
            const result = vec2.transformMat3(out, [1, 1], translateMatrix as any);
            expect(result).toEqual([6, 4]);
        });
    });

    describe('transformMat4', () => {
        it('should transform vector by 4x4 matrix', () => {
            // Identity matrix should return original vector
            const identity: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            const result = vec2.transformMat4(out, a, identity as any);
            expect(result).toEqual(a);
        });

        it('should apply translation', () => {
            // Translation by (5, 3, 0)
            const translateMatrix: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 3, 0, 1];
            const result = vec2.transformMat4(out, [1, 1], translateMatrix as any);
            expect(result).toEqual([6, 4]);
        });
    });

    describe('rotate', () => {
        it('should rotate vector around origin', () => {
            const origin: Vec2 = [0, 0];
            const result = vec2.rotate(out, [1, 0], origin, Math.PI / 2);
            expect(result[0]).toBeCloseTo(0);
            expect(result[1]).toBeCloseTo(1);
        });

        it('should rotate vector around arbitrary point', () => {
            const center: Vec2 = [1, 1];
            const result = vec2.rotate(out, [2, 1], center, Math.PI / 2);
            expect(result[0]).toBeCloseTo(1);
            expect(result[1]).toBeCloseTo(2);
        });
    });

    describe('angle', () => {
        it('should calculate angle between vectors', () => {
            const result = vec2.angle([1, 0], [0, 1]);
            expect(result).toBeCloseTo(Math.PI / 2);
        });

        it('should return 0 for parallel vectors', () => {
            const result = vec2.angle([1, 2], [2, 4]);
            expect(result).toBeCloseTo(0);
        });

        it('should return PI for opposite vectors', () => {
            const result = vec2.angle([1, 0], [-1, 0]);
            expect(result).toBeCloseTo(Math.PI);
        });
    });

    describe('zero', () => {
        it('should set all components to zero', () => {
            const result = vec2.zero(a);
            expect(result).toEqual([0, 0]);
            expect(result).toBe(a);
        });
    });

    describe('str', () => {
        it('should return string representation', () => {
            const result = vec2.str(a);
            expect(result).toBe('vec2(1, 2)');
        });
    });

    describe('exactEquals', () => {
        it('should return true for exactly equal vectors', () => {
            expect(vec2.exactEquals(a, [1, 2])).toBe(true);
        });

        it('should return false for different vectors', () => {
            expect(vec2.exactEquals(a, b)).toBe(false);
        });

        it('should return false for approximately equal vectors', () => {
            expect(vec2.exactEquals([1, 2], [1.0000001, 2])).toBe(false);
        });
    });

    describe('equals', () => {
        it('should return true for approximately equal vectors', () => {
            expect(vec2.equals([1, 2], [1.0000001, 2])).toBe(true);
        });

        it('should return false for significantly different vectors', () => {
            expect(vec2.equals(a, b)).toBe(false);
        });
    });

    describe('finite', () => {
        it('should return true for finite vectors', () => {
            expect(vec2.finite(a)).toBe(true);
        });

        it('should return false for vectors with infinity', () => {
            expect(vec2.finite([1, Infinity])).toBe(false);
        });

        it('should return false for vectors with NaN', () => {
            expect(vec2.finite([NaN, 2])).toBe(false);
        });
    });

    describe('aliases', () => {
        it('len should be alias for length', () => {
            expect(vec2.len).toBe(vec2.length);
        });

        it('sub should be alias for subtract', () => {
            expect(vec2.sub).toBe(vec2.subtract);
        });

        it('mul should be alias for multiply', () => {
            expect(vec2.mul).toBe(vec2.multiply);
        });

        it('div should be alias for divide', () => {
            expect(vec2.div).toBe(vec2.divide);
        });

        it('dist should be alias for distance', () => {
            expect(vec2.dist).toBe(vec2.distance);
        });

        it('sqrDist should be alias for squaredDistance', () => {
            expect(vec2.sqrDist).toBe(vec2.squaredDistance);
        });

        it('sqrLen should be alias for squaredLength', () => {
            expect(vec2.sqrLen).toBe(vec2.squaredLength);
        });
    });

    describe('projectOnVector', () => {
        it('projects onto an axis', () => {
            const out: Vec2 = [0, 0];
            vec2.projectOnVector(out, [2, 3], [1, 0]);
            expect(out).toEqual([2, 0]);
        });

        it('returns zero when projecting onto the zero vector', () => {
            const out: Vec2 = [9, 9];
            vec2.projectOnVector(out, [2, 3], [0, 0]);
            expect(out).toEqual([0, 0]);
        });

        it('is safe when out aliases an input', () => {
            const v: Vec2 = [2, 3];
            vec2.projectOnVector(v, v, [1, 0]);
            expect(v).toEqual([2, 0]);
        });
    });

    describe('signedAngle', () => {
        it('is positive for a counter-clockwise turn', () => {
            expect(vec2.signedAngle([1, 0], [0, 1])).toBeCloseTo(Math.PI / 2);
        });

        it('is negative for a clockwise turn', () => {
            expect(vec2.signedAngle([0, 1], [1, 0])).toBeCloseTo(-Math.PI / 2);
        });

        it('returns zero for identical vectors', () => {
            expect(vec2.signedAngle([1, 0], [1, 0])).toBe(0);
        });

        it('agrees with angle in magnitude', () => {
            const a: Vec2 = [1, 0];
            const b: Vec2 = [-0.5, 0.5];
            expect(Math.abs(vec2.signedAngle(a, b))).toBeCloseTo(vec2.angle(a, b));
        });
    });

    describe('rotateTowards', () => {
        it('copies the target when it is already within the limit', () => {
            const out: Vec2 = [0, 0];
            vec2.rotateTowards(out, [1, 0], [0, 1], Math.PI);
            expect(out).toEqual([0, 1]);
        });

        it('clamps to exactly the limit when the target is beyond it', () => {
            const out: Vec2 = [0, 0];
            vec2.rotateTowards(out, [1, 0], [0, 1], Math.PI / 4);
            expect(out[0]).toBeCloseTo(Math.SQRT1_2);
            expect(out[1]).toBeCloseTo(Math.SQRT1_2);
            expect(vec2.length(out)).toBeCloseTo(1);
        });

        it('clamps clockwise for a clockwise target', () => {
            const out: Vec2 = [0, 0];
            vec2.rotateTowards(out, [1, 0], [0, -1], Math.PI / 4);
            expect(out[0]).toBeCloseTo(Math.SQRT1_2);
            expect(out[1]).toBeCloseTo(-Math.SQRT1_2);
        });

        it('treats a negative limit as zero', () => {
            const out: Vec2 = [0, 0];
            vec2.rotateTowards(out, [1, 0], [0, 1], -1);
            expect(out[0]).toBeCloseTo(1);
            expect(out[1]).toBeCloseTo(0);
        });

        it('turns counter-clockwise for antiparallel inputs', () => {
            const out: Vec2 = [0, 0];
            vec2.rotateTowards(out, [1, 0], [-1, 0], 0.5);
            expect(vec2.signedAngle([1, 0], out)).toBeCloseTo(0.5);
        });

        it('is safe when out aliases an input', () => {
            const v: Vec2 = [1, 0];
            vec2.rotateTowards(v, v, [0, 1], Math.PI / 4);
            expect(v[0]).toBeCloseTo(Math.SQRT1_2);
            expect(v[1]).toBeCloseTo(Math.SQRT1_2);
        });
    });
});
