import { convexHull } from "maath/misc";

import { Vector2 } from "three";

export class ConvexHull {
  points: Vector2[] = [];
  convexHull: Vector2[] = [];

  constructor(points = []) {
    this.points = points;
    this.convexHull = convexHull(this.points);
  }

  add = (point: Vector2) => {
    this.points.push(point);

    this.convexHull = convexHull([...this.convexHull, point]);
  };

  setPoints = (points: Vector2[]) => {
    this.points = points;
    this.convexHull = convexHull(this.points);
  };
}
