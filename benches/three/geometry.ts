import { BufferAttribute, Matrix3, Matrix4, Quaternion, TorusKnotGeometry, Vector3 } from 'three';
import * as mat3 from '../../src/core/mat3';
import * as vec3 from '../../src/core/vec3';
import { mat4Of, vec3FromAttribute, vec3ToAttribute } from '../../src/three';

// Transform source positions and normals into destination attributes for CPU deformation.

export function createGeometry() {
    const source = new TorusKnotGeometry(1, 0.3, 256, 32);
    const sourcePosition = source.getAttribute('position') as BufferAttribute;
    const sourceNormal = source.getAttribute('normal') as BufferAttribute;
    const vertexCount = sourcePosition.count;
    const position = new BufferAttribute(new Float32Array(vertexCount * 3), 3);
    const normal = new BufferAttribute(new Float32Array(vertexCount * 3), 3);
    const matrix = new Matrix4().compose(
        new Vector3(1, 2, 3),
        new Quaternion().setFromAxisAngle(new Vector3(0.267261, 0.534522, 0.801784), 0.7),
        new Vector3(1, 2, 0.5),
    );
    return { sourcePosition, sourceNormal, position, normal, matrix, vertexCount };
}
export type Geometry = ReturnType<typeof createGeometry>;

const v = new Vector3();
const n = new Vector3();
const normalMatrix = new Matrix3();

export function transformThree(g: Geometry): void {
    const { sourcePosition, sourceNormal, position, normal, matrix, vertexCount } = g;
    normalMatrix.getNormalMatrix(matrix);
    for (let i = 0; i < vertexCount; i++) {
        v.fromBufferAttribute(sourcePosition, i).applyMatrix4(matrix);
        position.setXYZ(i, v.x, v.y, v.z);
        n.fromBufferAttribute(sourceNormal, i).applyNormalMatrix(normalMatrix);
        normal.setXYZ(i, n.x, n.y, n.z);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
}

export function createMathGeometry() {
    return { v: vec3.create(), n: vec3.create(), nm: mat3.create() };
}
export type MathGeometry = ReturnType<typeof createMathGeometry>;

export function transformMath(g: Geometry, w: MathGeometry): void {
    const { sourcePosition, sourceNormal, position, normal, vertexCount } = g;
    const { v, n, nm } = w;
    const m = mat4Of(g.matrix);
    if (mat3.normalFromMat4(nm, m) === null) throw new Error('singular matrix');
    for (let i = 0; i < vertexCount; i++) {
        vec3FromAttribute(v, sourcePosition, i);
        vec3.transformMat4(v, v, m);
        vec3ToAttribute(position, v, i);
        vec3FromAttribute(n, sourceNormal, i);
        vec3.transformMat3(n, n, nm);
        vec3.normalize(n, n);
        vec3ToAttribute(normal, n, i);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
}

export function checksum(g: Geometry): number {
    const p = g.position.array;
    const nn = g.normal.array;
    let sum = 0;
    for (let i = 0; i < p.length; i++) sum += p[i] + nn[i];
    return sum;
}

/** Largest absolute element difference between two geometries' destination attributes. */
export function maxDifference(a: Geometry, b: Geometry): number {
    const pa = a.position.array;
    const pb = b.position.array;
    const na = a.normal.array;
    const nb = b.normal.array;
    let max = 0;
    for (let i = 0; i < pa.length; i++) {
        max = Math.max(max, Math.abs(pa[i] - pb[i]), Math.abs(na[i] - nb[i]));
    }
    return max;
}
