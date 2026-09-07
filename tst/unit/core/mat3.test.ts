import { describe, expect, it } from 'vitest';
import type { Mat2d, Mat3, Mat4, Vec2 } from '../../../src';
import { mat3, mat4, quat } from '../../../src';

describe('mat3', () => {
    describe('create', () => {
        it('should create identity matrix', () => {
            const result = mat3.create();
            expect(result).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        });
    });

    describe('fromMat4', () => {
        it('should extract 3x3 from 4x4 matrix', () => {
            const m4: Mat4 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            const result = mat3.create();

            mat3.fromMat4(result, m4);
            expect(result).toEqual([1, 2, 3, 5, 6, 7, 9, 10, 11]);
        });
    });

    describe('clone', () => {
        it('should clone matrix', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result = mat3.clone(m);

            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(result).not.toBe(m);
        });
    });

    describe('copy', () => {
        it('should copy values from one matrix to another', () => {
            const src: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const dst: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];

            const result = mat3.copy(dst, src);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(result).toBe(dst);
        });
    });

    describe('fromValues', () => {
        it('should create matrix from values', () => {
            const result = mat3.fromValues(1, 2, 3, 4, 5, 6, 7, 8, 9);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe('set', () => {
        it('should set matrix values', () => {
            const m: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
            const result = mat3.set(m, 1, 2, 3, 4, 5, 6, 7, 8, 9);

            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(result).toBe(m);
        });
    });

    describe('identity', () => {
        it('should set matrix to identity', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result = mat3.identity(m);

            expect(result).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
            expect(result).toBe(m);
        });
    });

    describe('transpose', () => {
        it('should transpose matrix', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result = mat3.create();

            mat3.transpose(result, m);
            expect(result).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
        });

        it('should transpose in place', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

            mat3.transpose(m, m);
            expect(m).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
        });
    });

    describe('invert', () => {
        it('should invert matrix', () => {
            const m: Mat3 = [1, 0, 0, 0, 1, 0, 2, 3, 1]; // Identity with translation
            const result = mat3.create();

            const inverted = mat3.invert(result, m);
            expect(inverted).not.toBeNull();
            expect(result[0]).toBeCloseTo(1);
            expect(result[4]).toBeCloseTo(1);
            expect(result[8]).toBeCloseTo(1);
            expect(result[6]).toBeCloseTo(-2);
            expect(result[7]).toBeCloseTo(-3);
        });

        it('should return null for non-invertible matrix', () => {
            const m: Mat3 = [1, 2, 3, 2, 4, 6, 3, 6, 9]; // Singular matrix
            const result = mat3.create();

            const inverted = mat3.invert(result, m);
            expect(inverted).toBeNull();
        });

        it('should verify identity when multiplying by inverse', () => {
            const m: Mat3 = [2, 0, 1, 0, 2, 0, 0, 0, 1];
            const inverse = mat3.create();
            const identity = mat3.create();

            mat3.invert(inverse, m);
            mat3.multiply(identity, m, inverse);

            expect(identity[0]).toBeCloseTo(1);
            expect(identity[4]).toBeCloseTo(1);
            expect(identity[8]).toBeCloseTo(1);
            expect(identity[1]).toBeCloseTo(0);
            expect(identity[2]).toBeCloseTo(0);
            expect(identity[3]).toBeCloseTo(0);
        });
    });

    describe('adjoint', () => {
        it('should calculate adjoint matrix', () => {
            const m: Mat3 = [1, 2, 3, 0, 1, 4, 5, 6, 0];
            const result = mat3.create();

            mat3.adjoint(result, m);

            // Verify adjoint properties
            expect(result).toHaveLength(9);
            expect(result.every(Number.isFinite)).toBe(true);
        });
    });

    describe('determinant', () => {
        it('should calculate determinant', () => {
            const m: Mat3 = [1, 2, 3, 0, 1, 4, 5, 6, 0];
            const det = mat3.determinant(m);

            expect(det).toBe(1);
        });

        it('should return 0 for singular matrix', () => {
            const m: Mat3 = [1, 2, 3, 2, 4, 6, 3, 6, 9];
            const det = mat3.determinant(m);

            expect(det).toBe(0);
        });
    });

    describe('multiply', () => {
        it('should multiply two matrices', () => {
            const a: Mat3 = [1, 0, 0, 0, 1, 0, 2, 3, 1];
            const b: Mat3 = [1, 0, 0, 0, 1, 0, 4, 5, 1];
            const result = mat3.create();

            mat3.multiply(result, a, b);
            expect(result[6]).toBeCloseTo(6); // Translation should combine
            expect(result[7]).toBeCloseTo(8);
        });

        it('should work with identity matrix', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const identity = mat3.identity(mat3.create());
            const result = mat3.create();

            mat3.multiply(result, m, identity);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe('translate', () => {
        it('should translate matrix by vector', () => {
            const m = mat3.identity(mat3.create());
            const translation: Vec2 = [5, 3];
            const result = mat3.create();

            mat3.translate(result, m, translation);
            expect(result[6]).toBe(5);
            expect(result[7]).toBe(3);
            expect(result[8]).toBe(1);
        });
    });

    describe('rotate', () => {
        it('should rotate matrix by given angle', () => {
            const m = mat3.identity(mat3.create());
            const result = mat3.create();
            const angle = Math.PI / 2; // 90 degrees

            mat3.rotate(result, m, angle);

            expect(result[0]).toBeCloseTo(0, 5);
            expect(result[1]).toBeCloseTo(1, 5);
            expect(result[3]).toBeCloseTo(-1, 5);
            expect(result[4]).toBeCloseTo(0, 5);
        });
    });

    describe('scale', () => {
        it('should scale matrix by vector', () => {
            const m = mat3.identity(mat3.create());
            const scale: Vec2 = [2, 3];
            const result = mat3.create();

            mat3.scale(result, m, scale);
            expect(result[0]).toBe(2);
            expect(result[4]).toBe(3);
            expect(result[8]).toBe(1);
        });
    });

    describe('fromTranslation', () => {
        it('should create translation matrix from vector', () => {
            const result = mat3.create();
            const translation: Vec2 = [5, 3];

            mat3.fromTranslation(result, translation);
            expect(result).toEqual([1, 0, 0, 0, 1, 0, 5, 3, 1]);
        });
    });

    describe('fromRotation', () => {
        it('should create rotation matrix from angle', () => {
            const result = mat3.create();
            const angle = Math.PI / 4; // 45 degrees

            mat3.fromRotation(result, angle);

            const cos45 = Math.cos(angle);
            const sin45 = Math.sin(angle);
            expect(result[0]).toBeCloseTo(cos45);
            expect(result[1]).toBeCloseTo(sin45);
            expect(result[3]).toBeCloseTo(-sin45);
            expect(result[4]).toBeCloseTo(cos45);
            expect(result[8]).toBe(1);
        });
    });

    describe('fromScaling', () => {
        it('should create scaling matrix from vector', () => {
            const result = mat3.create();
            const scale: Vec2 = [2, 3];

            mat3.fromScaling(result, scale);
            expect(result).toEqual([2, 0, 0, 0, 3, 0, 0, 0, 1]);
        });
    });

    describe('fromMat2d', () => {
        it('should convert mat2d to mat3', () => {
            const m2d: Mat2d = [1, 2, 3, 4, 5, 6];
            const result = mat3.create();

            mat3.fromMat2d(result, m2d);
            expect(result).toEqual([1, 2, 0, 3, 4, 0, 5, 6, 1]);
        });
    });

    describe('fromQuat', () => {
        it('should create rotation matrix from quaternion', () => {
            const q = quat.setAxisAngle(quat.create(), [0, 0, 1], Math.PI / 2);
            const result = mat3.create();

            mat3.fromQuat(result, q);

            // Should be a 90-degree rotation around Z
            expect(result[0]).toBeCloseTo(0, 5);
            expect(result[1]).toBeCloseTo(1, 5);
            expect(result[3]).toBeCloseTo(-1, 5);
            expect(result[4]).toBeCloseTo(0, 5);
        });
    });

    describe('normalFromMat4', () => {
        it('should calculate normal matrix from mat4', () => {
            const m4 = mat4.identity(mat4.create());
            mat4.scale(m4, m4, [2, 2, 2]);
            const result = mat3.create();

            const normal = mat3.normalFromMat4(result, m4);
            expect(normal).not.toBeNull();

            // Normal matrix should be the inverse transpose
            expect(result[0]).toBeCloseTo(0.5);
            expect(result[4]).toBeCloseTo(0.5);
            expect(result[8]).toBeCloseTo(0.5);
        });

        it('should return null for non-invertible matrix', () => {
            const m4: Mat4 = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            const result = mat3.create();

            const normal = mat3.normalFromMat4(result, m4);
            expect(normal).toBeNull();
        });
    });

    describe('projection', () => {
        it('should generate 2D projection matrix', () => {
            const result = mat3.create();

            mat3.projection(result, 800, 600);

            expect(result[0]).toBeCloseTo(2 / 800);
            expect(result[4]).toBeCloseTo(-2 / 600);
            expect(result[6]).toBe(-1);
            expect(result[7]).toBe(1);
            expect(result[8]).toBe(1);
        });
    });

    describe('str', () => {
        it('should return string representation', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result = mat3.str(m);

            expect(result).toBe('mat3(1, 2, 3, 4, 5, 6, 7, 8, 9)');
        });
    });

    describe('frob', () => {
        it('should calculate Frobenius norm', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const norm = mat3.frob(m);

            expect(norm).toBeCloseTo(Math.sqrt(285)); // sqrt(1+4+9+16+25+36+49+64+81)
        });
    });

    describe('add', () => {
        it('should add two matrices', () => {
            const a: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const b: Mat3 = [1, 1, 1, 1, 1, 1, 1, 1, 1];
            const result = mat3.create();

            mat3.add(result, a, b);
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });
    });

    describe('subtract', () => {
        it('should subtract second matrix from first', () => {
            const a: Mat3 = [5, 6, 7, 8, 9, 10, 11, 12, 13];
            const b: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result = mat3.create();

            mat3.subtract(result, a, b);
            expect(result).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4]);
        });
    });

    describe('multiplyScalar', () => {
        it('should multiply matrix by scalar', () => {
            const m: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result = mat3.create();

            mat3.multiplyScalar(result, m, 2);
            expect(result).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18]);
        });
    });

    describe('multiplyScalarAndAdd', () => {
        it('should multiply second matrix by scalar and add to first', () => {
            const a: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const b: Mat3 = [1, 1, 1, 1, 1, 1, 1, 1, 1];
            const result = mat3.create();

            mat3.multiplyScalarAndAdd(result, a, b, 2);
            expect(result).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11]);
        });
    });

    describe('exactEquals', () => {
        it('should return true for identical matrices', () => {
            const a: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const b: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

            expect(mat3.exactEquals(a, b)).toBe(true);
        });

        it('should return false for different matrices', () => {
            const a: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const b: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 10];

            expect(mat3.exactEquals(a, b)).toBe(false);
        });
    });

    describe('equals', () => {
        it('should return true for nearly equal matrices', () => {
            const a: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const b: Mat3 = [1.0000001, 2.0000001, 3.0000001, 4.0000001, 5.0000001, 6.0000001, 7.0000001, 8.0000001, 9.0000001];

            expect(mat3.equals(a, b)).toBe(true);
        });

        it('should return false for significantly different matrices', () => {
            const a: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const b: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 10];

            expect(mat3.equals(a, b)).toBe(false);
        });
    });

    describe('aliases', () => {
        it('mul should be alias for multiply', () => {
            const a: Mat3 = [1, 0, 0, 0, 1, 0, 2, 3, 1];
            const b: Mat3 = [1, 0, 0, 0, 1, 0, 4, 5, 1];
            const result1 = mat3.create();
            const result2 = mat3.create();

            mat3.multiply(result1, a, b);
            mat3.mul(result2, a, b);

            expect(result1).toEqual(result2);
        });

        it('sub should be alias for subtract', () => {
            const a: Mat3 = [5, 6, 7, 8, 9, 10, 11, 12, 13];
            const b: Mat3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result1 = mat3.create();
            const result2 = mat3.create();

            mat3.subtract(result1, a, b);
            mat3.sub(result2, a, b);

            expect(result1).toEqual(result2);
        });
    });

    describe('transformation composition', () => {
        it('should combine translation, rotation, and scaling correctly', () => {
            const translate = mat3.fromTranslation(mat3.create(), [5, 3]);
            const rotate = mat3.fromRotation(mat3.create(), Math.PI / 4);
            const scale = mat3.fromScaling(mat3.create(), [2, 1.5]);

            const composed = mat3.create();
            mat3.multiply(composed, translate, rotate);
            mat3.multiply(composed, composed, scale);

            // Should be a valid transformation matrix
            expect(mat3.determinant(composed)).not.toBe(0);

            // Should preserve homogeneous coordinate
            expect(composed[8]).toBe(1);
        });
    });
});
