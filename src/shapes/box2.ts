import { EPSILON } from '../core/scalar';
import type { RVec2, Vec2 } from '../core/vec2';
import type { RCircle } from './circle';

/** An axis-aligned box in 2D space, as [minX, minY, maxX, maxY] */
export type Box2 = [minX: number, minY: number, maxX: number, maxY: number];

/** A read-only 2D axis-aligned bounding box */
export type RBox2 = Readonly<Box2>;

/**
 * Create a new empty Box2 with "min" set to positive infinity and "max" set to negative infinity
 * @returns A new Box2
 */
export function create(): Box2 {
    return [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
}

/**
 * Clones a Box2
 * @param box - A Box2 to clone
 * @returns a clone of box
 */
export function clone(box: RBox2): Box2 {
    return [box[0], box[1], box[2], box[3]];
}

/**
 * Copies a Box2 to another Box2
 * @param out the output Box2
 * @param box the input Box2
 * @returns the output Box2
 */
export function copy(out: Box2, box: RBox2): Box2 {
    out[0] = box[0];
    out[1] = box[1];
    out[2] = box[2];
    out[3] = box[3];
    return out;
}

/**
 * Sets the min and max values of a Box2
 * @param out - The output Box2
 * @param minX - The minimum X coordinate
 * @param minY - The minimum Y coordinate
 * @param maxX - The maximum X coordinate
 * @param maxY - The maximum Y coordinate
 * @returns The updated Box2
 */
export function set(out: Box2, minX: number, minY: number, maxX: number, maxY: number): Box2 {
    out[0] = minX;
    out[1] = minY;
    out[2] = maxX;
    out[3] = maxY;
    return out;
}

/**
 * Sets the min and max values of a Box2 from Vec2 vectors
 * @param out - The output Box2
 * @param min - The minimum corner
 * @param max - The maximum corner
 * @returns The updated Box2
 */
export function setFromVectors(out: Box2, min: RVec2, max: RVec2): Box2 {
    out[0] = min[0];
    out[1] = min[1];
    out[2] = max[0];
    out[3] = max[1];
    return out;
}

/**
 * Extracts the minimum corner of a Box2
 * @param out - The output Vec2 for the minimum corner
 * @param box - The input Box2
 * @returns The minimum corner
 */
export function min(out: Vec2, box: RBox2): Vec2 {
    out[0] = box[0];
    out[1] = box[1];
    return out;
}

/**
 * Extracts the maximum corner of a Box2
 * @param out - The output Vec2 for the maximum corner
 * @param box - The input Box2
 * @returns The maximum corner
 */
export function max(out: Vec2, box: RBox2): Vec2 {
    out[0] = box[2];
    out[1] = box[3];
    return out;
}

/**
 * Set a Box2 to empty (min to positive infinity, max to negative infinity)
 * @param out - The Box2 to make empty
 * @returns The emptied Box2
 */
export function empty(out: Box2): Box2 {
    out[0] = Number.POSITIVE_INFINITY;
    out[1] = Number.POSITIVE_INFINITY;
    out[2] = Number.NEGATIVE_INFINITY;
    out[3] = Number.NEGATIVE_INFINITY;
    return out;
}

/**
 * Returns whether or not the boxes have exactly the same elements in the same position (when compared with ===)
 * @param a - The first box
 * @param b - The second box
 * @returns True if the boxes are equal, false otherwise
 */
export function exactEquals(a: RBox2, b: RBox2): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the boxes have approximately the same elements in the same position
 * @param a - The first box
 * @param b - The second box
 * @returns True if the boxes are equal, false otherwise
 */
export function equals(a: RBox2, b: RBox2): boolean {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];
    const b3 = b[3];
    return (
        Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
        Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3))
    );
}

/**
 * Sets the box from a center point and size
 * @param out - The output Box2
 * @param center - The center point
 * @param size - The size of the box
 * @returns The updated Box2
 */
export function setFromCenterAndSize(out: Box2, center: RVec2, size: RVec2): Box2 {
    const hx = size[0] * 0.5;
    const hy = size[1] * 0.5;
    out[0] = center[0] - hx;
    out[1] = center[1] - hy;
    out[2] = center[0] + hx;
    out[3] = center[1] + hy;
    return out;
}

/**
 * Expands a Box2 to include a point
 * @param out - The output Box2
 * @param box - The input Box2
 * @param point - The point to include
 * @returns The expanded Box2
 */
export function expandByPoint(out: Box2, box: RBox2, point: RVec2): Box2 {
    out[0] = Math.min(box[0], point[0]);
    out[1] = Math.min(box[1], point[1]);
    out[2] = Math.max(box[2], point[0]);
    out[3] = Math.max(box[3], point[1]);
    return out;
}

/**
 * Widens a Box2 by a vector on both sides
 * Subtracts the vector from min and adds it to max
 * @param out - The output Box2
 * @param box - The input Box2
 * @param vector - The vector to expand by
 * @returns The expanded Box2
 */
export function expandByExtents(out: Box2, box: RBox2, vector: RVec2): Box2 {
    out[0] = box[0] - vector[0];
    out[1] = box[1] - vector[1];
    out[2] = box[2] + vector[0];
    out[3] = box[3] + vector[1];
    return out;
}

/**
 * Expands a Box2 uniformly by a scalar margin on all sides
 * Subtracts the margin from min and adds it to max on each axis
 * @param out - The output Box2
 * @param box - The input Box2
 * @param margin - The uniform margin to expand by
 * @returns The expanded Box2
 */
export function expandByMargin(out: Box2, box: RBox2, margin: number): Box2 {
    out[0] = box[0] - margin;
    out[1] = box[1] - margin;
    out[2] = box[2] + margin;
    out[3] = box[3] + margin;
    return out;
}

/**
 * Computes the union of two bounding boxes
 * Returns a Box2 that encompasses both input boxes
 * @param out - The output Box2
 * @param boxA - The first Box2
 * @param boxB - The second Box2
 * @returns The union Box2
 */
export function union(out: Box2, boxA: RBox2, boxB: RBox2): Box2 {
    out[0] = Math.min(boxA[0], boxB[0]);
    out[1] = Math.min(boxA[1], boxB[1]);
    out[2] = Math.max(boxA[2], boxB[2]);
    out[3] = Math.max(boxA[3], boxB[3]);
    return out;
}

/**
 * Calculate the center point of a bounding box
 * @param out - The output Vec2 for the center
 * @param box - The input Box2
 * @returns The center point
 */
export function center(out: Vec2, box: RBox2): Vec2 {
    out[0] = (box[0] + box[2]) * 0.5;
    out[1] = (box[1] + box[3]) * 0.5;
    return out;
}

/**
 * Calculate the extents (half-size) of a bounding box
 * @param out - The output Vec2 for the extents
 * @param box - The input Box2
 * @returns The extents (distance from center to each edge)
 */
export function extents(out: Vec2, box: RBox2): Vec2 {
    out[0] = (box[2] - box[0]) * 0.5;
    out[1] = (box[3] - box[1]) * 0.5;
    return out;
}

/**
 * Calculate the size (dimensions) of a bounding box
 * @param out - The output Vec2 for the size
 * @param box - The input Box2
 * @returns The size (width, height)
 */
export function size(out: Vec2, box: RBox2): Vec2 {
    out[0] = box[2] - box[0];
    out[1] = box[3] - box[1];
    return out;
}

/**
 * Calculate the area of a bounding box
 * @param box - The input Box2
 * @returns The area (width * height)
 */
export function area(box: RBox2): number {
    return (box[2] - box[0]) * (box[3] - box[1]);
}

/**
 * Scale a bounding box by a vector, handling non-uniform and negative scaling
 * @param out - The output Box2
 * @param box - The input Box2
 * @param scale - The scale to apply (as a Vec2)
 * @returns The scaled Box2
 */
export function scale(out: Box2, box: RBox2, scale: RVec2): Box2 {
    const minX = box[0] * scale[0];
    const maxX = box[2] * scale[0];
    const minY = box[1] * scale[1];
    const maxY = box[3] * scale[1];

    // handle negative scaling by ensuring min <= max for each axis
    out[0] = Math.min(minX, maxX);
    out[2] = Math.max(minX, maxX);
    out[1] = Math.min(minY, maxY);
    out[3] = Math.max(minY, maxY);

    return out;
}

/**
 * Test if a point is contained within the bounding box
 * @param box - The bounding box
 * @param point - The point to test
 * @returns true if the point is inside or on the boundary of the box
 */
export function containsPoint(box: RBox2, point: RVec2): boolean {
    return point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3];
}

/**
 * Test if one Box2 completely contains another Box2
 * @param container - The potentially containing Box2
 * @param contained - The Box2 that might be contained
 * @returns true if the container Box2 completely contains the contained Box2
 */
export function containsBox2(container: RBox2, contained: RBox2): boolean {
    return (
        contained[0] >= container[0] &&
        contained[2] <= container[2] &&
        contained[1] >= container[1] &&
        contained[3] <= container[3]
    );
}

/**
 * Check whether two bounding boxes intersect
 */
export function intersectsBox2(boxA: RBox2, boxB: RBox2): boolean {
    return boxA[0] <= boxB[2] && boxA[2] >= boxB[0] && boxA[1] <= boxB[3] && boxA[3] >= boxB[1];
}

/**
 * Test intersection between an axis-aligned bounding box and a circle.
 */
export function intersectsCircle(box: RBox2, circle: RCircle): boolean {
    const { center, radius } = circle;
    const cx = center[0];
    const cy = center[1];
    // distance from the circle centre to the box along each axis (0 when inside)
    const dx = cx < box[0] ? box[0] - cx : cx > box[2] ? cx - box[2] : 0;
    const dy = cy < box[1] ? box[1] - cy : cy > box[3] ? cy - box[3] : 0;
    return dx * dx + dy * dy <= radius * radius;
}
