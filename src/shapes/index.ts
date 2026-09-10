// shape primitives and the spatial queries that operate on them.
// computational-geometry algorithms (hull, circumcircle) live in math/geometry.
export type * from '../core';

export * as box2 from './box2';
export type { Box2, RBox2 } from './box2';

export * as box3 from './box3';
export type { Box3 } from './box3';

export * as obb3 from './obb3';
export type { OBB3 } from './obb3';

export * as plane3 from './plane3';
export type { Plane3 } from './plane3';

export * as sphere from './sphere';
export type { Sphere } from './sphere';

export * as circle from './circle';
export type { Circle } from './circle';

export * as segment2 from './segment2';

export * as polygon2 from './polygon2';

export * as triangle2 from './triangle2';

export * as triangle3 from './triangle3';

export * as raycast3 from './raycast3';

export * as frustum from './frustum';
export type { Frustum, FrustumCorners } from './frustum';
