import {
  arePointsCollinear,
  doThreePointsMakeARight,
  getCircumcircle,
  isPointInCircumcircle,
  isPointInTriangle,
  triangleDeterminant,
} from "../triangle";

const collinearTriangle = [
  [0, 0],
  [0, 1],
  [0, 2],
];

const clockwiseTriangle = [
  [0, 0],
  [-1, 1],
  [-2, 0],
];

describe("Triangle", () => {
  test("triangleDeterminant", () => {
    expect(triangleDeterminant(collinearTriangle)).toBe(0);

    expect(triangleDeterminant(clockwiseTriangle)).toBe(2);

    expect(triangleDeterminant(clockwiseTriangle.reverse())).toBe(-2);
  });

  test("isPointInTriangle", () => {
    const triangle = [
      [-1, 0],
      [0, 1],
      [1, 0],
    ];

    // point is ON triangle
    expect(isPointInTriangle([0, 0], triangle)).toBe(true);

    // point is obviously outside
    expect(isPointInTriangle([10, 10], triangle)).toBe(false);
  });

  test("arePointsCollinear", () => {
    expect(arePointsCollinear(collinearTriangle)).toBe(true);
    expect(arePointsCollinear(clockwiseTriangle)).toBe(false);
  });

  test("getCircumcircle", () => {
    expect(getCircumcircle(collinearTriangle)).toBe(null);
    expect(getCircumcircle(clockwiseTriangle)).toStrictEqual({
      x: -1,
      y: 0,
      r: 1,
    });
  });

  test("isPointInCircumcircle", () => {
    // point is one of the vertices
    expect(isPointInCircumcircle([0, 0], clockwiseTriangle)).toBe(true);

    // point lies on edge
    expect(isPointInCircumcircle([-1, 0], clockwiseTriangle)).toBe(true)

    // point is outside
    expect(isPointInCircumcircle([10, 0], clockwiseTriangle)).toBe(false);
  });


  test("doThreePointsMakeARight", () => {

    // collinear points don't make any turn
    expect(doThreePointsMakeARight(collinearTriangle)).toBe(false)

    // clockwise triangle should make a right turn
    expect(doThreePointsMakeARight(clockwiseTriangle)).toBe(true)

    // counterclockwise triangle should make a left turn
    expect(doThreePointsMakeARight(clockwiseTriangle.reverse())).toBe(false)

  })
});
