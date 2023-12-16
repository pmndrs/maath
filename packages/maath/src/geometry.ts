// From: https://discourse.threejs.org/t/roundedrectangle-squircle/28645/20

import * as THREE from "three";

export class RoundedPlaneGeometry extends THREE.BufferGeometry {
  parameters: {
    width: number;
    height: number;
    radius: number;
    segments: number;
  };
  constructor(width = 2, height = 1, radius = 0.2, segments = 16) {
    super();
    this.parameters = {
      width,
      height,
      radius,
      segments,
    };

    // helper const's
    const wi = width / 2 - radius; // inner width
    const hi = height / 2 - radius; // inner height
    const ul = radius / width; // u left
    const ur = (width - radius) / width; // u right
    const vl = radius / height; // v low
    const vh = (height - radius) / height; // v high

    let positions = [wi, hi, 0, -wi, hi, 0, -wi, -hi, 0, wi, -hi, 0];
    let uvs = [ur, vh, ul, vh, ul, vl, ur, vl];
    let n = [
      3 * (segments + 1) + 3,
      3 * (segments + 1) + 4,
      segments + 4,
      segments + 5,
      2 * (segments + 1) + 4,
      2,
      1,
      2 * (segments + 1) + 3,
      3,
      4 * (segments + 1) + 3,
      4,
      0,
    ];
    let indices = [
      n[0],
      n[1],
      n[2],
      n[0],
      n[2],
      n[3],
      n[4],
      n[5],
      n[6],
      n[4],
      n[6],
      n[7],
      n[8],
      n[9],
      n[10],
      n[8],
      n[10],
      n[11],
    ];
    let phi, cos, sin, xc, yc, uc, vc, idx;

    for (let i = 0; i < 4; i++) {
      xc = i < 1 || i > 2 ? wi : -wi;
      yc = i < 2 ? hi : -hi;
      uc = i < 1 || i > 2 ? ur : ul;
      vc = i < 2 ? vh : vl;
      for (let j = 0; j <= segments; j++) {
        phi = (Math.PI / 2) * (i + j / segments);
        cos = Math.cos(phi);
        sin = Math.sin(phi);
        positions.push(xc + radius * cos, yc + radius * sin, 0);
        uvs.push(uc + ul * cos, vc + vl * sin);
        if (j < segments) {
          idx = (segments + 1) * i + j + 4;
          indices.push(i, idx, idx + 1);
        }
      }
    }

    this.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    this.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    this.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), 2)
    );
  }
}

// Author: https://stackoverflow.com/users/128511/gman
// https://stackoverflow.com/questions/34958072/programmatically-generate-simple-uv-mapping-for-models

export function applyCylindricalUV(bufferGeometry: THREE.BufferGeometry) {
  const uvs = [];
  for (
    let i = 0;
    i < bufferGeometry.attributes.position.array.length / 3;
    i++
  ) {
    const x = bufferGeometry.attributes.position.array[i * 3 + 0];
    const y = bufferGeometry.attributes.position.array[i * 3 + 1];
    const z = bufferGeometry.attributes.position.array[i * 3 + 2];
    uvs.push(
      (Math.atan2(x, z) / Math.PI) * 0.5 + 0.5,
      (y / Math.PI) * 0.5 + 0.5
    );
  }
  if (bufferGeometry.attributes.uv) delete bufferGeometry.attributes.uv;
  bufferGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  bufferGeometry.attributes.uv.needsUpdate = true;
  return bufferGeometry;
}

// Author: https://stackoverflow.com/users/268905/knee-cola
// https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate

export function applySphereUV(bufferGeometry: THREE.BufferGeometry) {
  const uvs = [];
  const vertices = [];

  for (
    let i = 0;
    i < bufferGeometry.attributes.position.array.length / 3;
    i++
  ) {
    const x = bufferGeometry.attributes.position.array[i * 3 + 0];
    const y = bufferGeometry.attributes.position.array[i * 3 + 1];
    const z = bufferGeometry.attributes.position.array[i * 3 + 2];
    vertices.push(new THREE.Vector3(x, y, z));
  }

  const polarVertices = vertices.map(cartesian2polar);

  for (let i = 0; i < polarVertices.length / 3; i++) {
    const tri = new THREE.Triangle(
      vertices[i * 3 + 0],
      vertices[i * 3 + 1],
      vertices[i * 3 + 2]
    );
    const normal = tri.getNormal(new THREE.Vector3());

    for (let f = 0; f < 3; f++) {
      let vertex = polarVertices[i * 3 + f];
      if (vertex.theta === 0 && (vertex.phi === 0 || vertex.phi === Math.PI)) {
        const alignedVertice = vertex.phi === 0 ? i * 3 + 1 : i * 3 + 0;
        vertex = {
          r: vertex.r,
          phi: vertex.phi,
          theta: polarVertices[alignedVertice].theta,
        };
      }
      if (
        vertex.theta === Math.PI &&
        cartesian2polar(normal).theta < Math.PI / 2
      ) {
        vertex.theta = -Math.PI;
      }
      const canvasPoint = polar2canvas(vertex);
      uvs.push(1 - canvasPoint.x, 1 - canvasPoint.y);
    }
  }

  if (bufferGeometry.attributes.uv) delete bufferGeometry.attributes.uv;
  bufferGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  bufferGeometry.attributes.uv.needsUpdate = true;
  return bufferGeometry;
}

type PolarPoint = { r: number; phi: number; theta: number };

function cartesian2polar(position: THREE.Vector3): PolarPoint {
  var r = Math.sqrt(
    position.x * position.x + position.z * position.z + position.y * position.y
  );
  return {
    r,
    phi: Math.acos(position.y / r),
    theta: Math.atan2(position.z, position.x),
  };
}

function polar2canvas(polarPoint: PolarPoint) {
  return {
    y: polarPoint.phi / Math.PI,
    x: (polarPoint.theta + Math.PI) / (2 * Math.PI),
  };
}

// Author: Alex Khoroshylov (https://stackoverflow.com/users/8742287/alex-khoroshylov)
// https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate

export function applyBoxUV(bufferGeometry: THREE.BufferGeometry) {
  bufferGeometry.computeBoundingBox();
  let bboxSize = bufferGeometry.boundingBox!.getSize(new THREE.Vector3());
  let boxSize = Math.min(bboxSize.x, bboxSize.y, bboxSize.z);
  let boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

  let cube = new THREE.Mesh(boxGeometry);
  cube.rotation.set(0, 0, 0);
  cube.updateWorldMatrix(true, false);

  const transformMatrix = cube.matrix.clone().invert();

  let uvBbox = new THREE.Box3(
    new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2),
    new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2)
  );
  _applyBoxUV(bufferGeometry, transformMatrix, uvBbox, boxSize);
  bufferGeometry.attributes.uv.needsUpdate = true;
  return bufferGeometry;
}

function _applyBoxUV(
  geom: THREE.BufferGeometry,
  transformMatrix: THREE.Matrix4,
  bbox: THREE.Box3,
  bbox_max_size: number
) {
  let coords: number[] = [];
  coords.length = (2 * geom.attributes.position.array.length) / 3;

  //maps 3 verts of 1 face on the better side of the cube
  //side of the cube can be XY, XZ or YZ
  let makeUVs = function (
    v0: THREE.Vector3,
    v1: THREE.Vector3,
    v2: THREE.Vector3
  ) {
    //pre-rotate the model so that cube sides match world axis
    v0.applyMatrix4(transformMatrix);
    v1.applyMatrix4(transformMatrix);
    v2.applyMatrix4(transformMatrix);

    //get normal of the face, to know into which cube side it maps better
    let n = new THREE.Vector3();
    n.crossVectors(v1.clone().sub(v0), v1.clone().sub(v2)).normalize();
    n.x = Math.abs(n.x);
    n.y = Math.abs(n.y);
    n.z = Math.abs(n.z);

    let uv0 = new THREE.Vector2();
    let uv1 = new THREE.Vector2();
    let uv2 = new THREE.Vector2();
    // xz mapping
    if (n.y > n.x && n.y > n.z) {
      uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
      uv0.y = (bbox.max.z - v0.z) / bbox_max_size;
      uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
      uv1.y = (bbox.max.z - v1.z) / bbox_max_size;
      uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
      uv2.y = (bbox.max.z - v2.z) / bbox_max_size;
    } else if (n.x > n.y && n.x > n.z) {
      uv0.x = (v0.z - bbox.min.z) / bbox_max_size;
      uv0.y = (v0.y - bbox.min.y) / bbox_max_size;
      uv1.x = (v1.z - bbox.min.z) / bbox_max_size;
      uv1.y = (v1.y - bbox.min.y) / bbox_max_size;
      uv2.x = (v2.z - bbox.min.z) / bbox_max_size;
      uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
    } else if (n.z > n.y && n.z > n.x) {
      uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
      uv0.y = (v0.y - bbox.min.y) / bbox_max_size;
      uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
      uv1.y = (v1.y - bbox.min.y) / bbox_max_size;
      uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
      uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
    }
    return {
      uv0: uv0,
      uv1: uv1,
      uv2: uv2,
    };
  };

  if (geom.index) {
    // is it indexed buffer geometry?
    for (let vi = 0; vi < geom.index.array.length; vi += 3) {
      let idx0 = geom.index.array[vi];
      let idx1 = geom.index.array[vi + 1];
      let idx2 = geom.index.array[vi + 2];
      let vx0 = geom.attributes.position.array[3 * idx0];
      let vy0 = geom.attributes.position.array[3 * idx0 + 1];
      let vz0 = geom.attributes.position.array[3 * idx0 + 2];
      let vx1 = geom.attributes.position.array[3 * idx1];
      let vy1 = geom.attributes.position.array[3 * idx1 + 1];
      let vz1 = geom.attributes.position.array[3 * idx1 + 2];
      let vx2 = geom.attributes.position.array[3 * idx2];
      let vy2 = geom.attributes.position.array[3 * idx2 + 1];
      let vz2 = geom.attributes.position.array[3 * idx2 + 2];
      let v0 = new THREE.Vector3(vx0, vy0, vz0);
      let v1 = new THREE.Vector3(vx1, vy1, vz1);
      let v2 = new THREE.Vector3(vx2, vy2, vz2);
      let uvs = makeUVs(v0, v1, v2);
      coords[2 * idx0] = uvs.uv0.x;
      coords[2 * idx0 + 1] = uvs.uv0.y;
      coords[2 * idx1] = uvs.uv1.x;
      coords[2 * idx1 + 1] = uvs.uv1.y;
      coords[2 * idx2] = uvs.uv2.x;
      coords[2 * idx2 + 1] = uvs.uv2.y;
    }
  } else {
    for (let vi = 0; vi < geom.attributes.position.array.length; vi += 9) {
      let vx0 = geom.attributes.position.array[vi];
      let vy0 = geom.attributes.position.array[vi + 1];
      let vz0 = geom.attributes.position.array[vi + 2];
      let vx1 = geom.attributes.position.array[vi + 3];
      let vy1 = geom.attributes.position.array[vi + 4];
      let vz1 = geom.attributes.position.array[vi + 5];
      let vx2 = geom.attributes.position.array[vi + 6];
      let vy2 = geom.attributes.position.array[vi + 7];
      let vz2 = geom.attributes.position.array[vi + 8];
      let v0 = new THREE.Vector3(vx0, vy0, vz0);
      let v1 = new THREE.Vector3(vx1, vy1, vz1);
      let v2 = new THREE.Vector3(vx2, vy2, vz2);
      let uvs = makeUVs(v0, v1, v2);
      let idx0 = vi / 3;
      let idx1 = idx0 + 1;
      let idx2 = idx0 + 2;
      coords[2 * idx0] = uvs.uv0.x;
      coords[2 * idx0 + 1] = uvs.uv0.y;
      coords[2 * idx1] = uvs.uv1.x;
      coords[2 * idx1 + 1] = uvs.uv1.y;
      coords[2 * idx2] = uvs.uv2.x;
      coords[2 * idx2 + 1] = uvs.uv2.y;
    }
  }
  if (geom.attributes.uv) delete geom.attributes.uv;
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(coords, 2));
}
