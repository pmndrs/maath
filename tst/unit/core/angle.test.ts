import { describe, expect, it } from 'vitest';
import { deltaAngle, degreesToRadians, radiansToDegrees, wrapAngle } from '../../../src';

const PI = Math.PI;

describe('angle', () => {
    describe('degreesToRadians / radiansToDegrees', () => {
        it('converts known values', () => {
            expect(degreesToRadians(0)).toBe(0);
            expect(degreesToRadians(180)).toBeCloseTo(PI);
            expect(degreesToRadians(90)).toBeCloseTo(PI / 2);
            expect(radiansToDegrees(PI)).toBeCloseTo(180);
            expect(radiansToDegrees(PI / 4)).toBeCloseTo(45);
        });

        it('are exact inverses of each other', () => {
            for (const a of [-540, -180, -45, 0, 33, 90, 180, 405]) {
                expect(radiansToDegrees(degreesToRadians(a))).toBeCloseTo(a);
            }
        });

        it('handle negative angles', () => {
            expect(degreesToRadians(-90)).toBeCloseTo(-PI / 2);
            expect(radiansToDegrees(-PI)).toBeCloseTo(-180);
        });
    });

    describe('wrapAngle', () => {
        it('is a no-op inside (-pi, pi]', () => {
            expect(wrapAngle(0)).toBe(0);
            expect(wrapAngle(PI / 2)).toBeCloseTo(PI / 2);
            expect(wrapAngle(-PI / 2)).toBeCloseTo(-PI / 2);
            expect(wrapAngle(PI)).toBeCloseTo(-PI);
        });

        it('wraps angles beyond one revolution', () => {
            expect(wrapAngle(2 * PI + PI / 3)).toBeCloseTo(PI / 3);
            expect(wrapAngle(-2 * PI - PI / 3)).toBeCloseTo(-PI / 3);
            expect(wrapAngle(4 * PI)).toBeCloseTo(0);
            expect(wrapAngle(-4 * PI)).toBeCloseTo(0);
        });

        it('always returns a value in (-pi, pi]', () => {
            for (const a of [-1000, -50.5, -10, -3, 1, 7, 50.5, 1000]) {
                const wrapped = wrapAngle(a);
                expect(wrapped).toBeGreaterThan(-PI);
                expect(wrapped).toBeLessThanOrEqual(PI);
                expect(wrapAngle(wrapped)).toBeCloseTo(wrapped);
            }
        });

        it('is periodic with period 2*pi', () => {
            for (const a of [-2, 0.5, 1, 3]) {
                expect(wrapAngle(a + 2 * PI)).toBeCloseTo(wrapAngle(a));
                expect(wrapAngle(a - 4 * PI)).toBeCloseTo(wrapAngle(a));
            }
        });
    });

    describe('deltaAngle', () => {
        it('returns the shortest signed difference', () => {
            expect(deltaAngle(0, PI / 2)).toBeCloseTo(PI / 2);
            expect(deltaAngle(PI / 2, 0)).toBeCloseTo(-PI / 2);
            expect(deltaAngle(1, 1)).toBe(0);
        });

        it('takes the short way across the +/-pi seam', () => {
            // from -170 deg to +170 deg crosses +/-180 deg: a -20 deg delta, not +340 deg
            const from = (-170 * PI) / 180;
            const to = (170 * PI) / 180;
            expect(deltaAngle(from, to)).toBeCloseTo((-20 * PI) / 180);
            expect(deltaAngle(to, from)).toBeCloseTo((20 * PI) / 180);
        });

        it('handles full turns of difference', () => {
            expect(deltaAngle(0, 2 * PI)).toBeCloseTo(0);
            expect(deltaAngle(0, 3 * PI)).toBeCloseTo(PI);
            expect(deltaAngle(2 * PI, 0)).toBeCloseTo(0);
        });

        it('wraps arbitrary magnitude inputs', () => {
            expect(deltaAngle(100, 1)).toBeCloseTo(wrapAngle(1 - 100));
            expect(deltaAngle(-50.5, 40.25)).toBeCloseTo(wrapAngle(40.25 + 50.5));
        });

        it('returns a value in (-pi, pi]', () => {
            for (const [a, b] of [
                [1000, -1000],
                [-3, 3],
                [0.5, 0.4],
                [-10, -2],
            ]) {
                const delta = deltaAngle(a, b);
                expect(delta).toBeGreaterThan(-PI);
                expect(delta).toBeLessThanOrEqual(PI);
            }
        });
    });
});
