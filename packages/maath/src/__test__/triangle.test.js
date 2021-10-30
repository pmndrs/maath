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

  describe("isPointInTriangle", () => {
    
    const triangle = [
      [-1, 0],
      [0, 1],
      [1, 0],
    ];

    it("returns true if point is on an edge", () => {
      expect(isPointInTriangle([0, 0], triangle)).toBe(true);
    })

    it("returns false if point is outside of triangle", () => {
      expect(isPointInTriangle([10, 10], triangle)).toBe(false);
    })
  });

  /**
    ●──────●──────●
    A      B      C
   */
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

  describe("isPointInCircumcircle", () => {
    it("throws if passed collinear points", () => {
      expect(() => isPointInCircumcircle([0, 0], collinearTriangle)).toThrow(Error)
    })
    
    /**
              B            
          .───●───.        
       ,─'   ╱ ╲   '─.     
     ,'     ╱   ╲     `.   
    ╱      ╱     ╲      ╲  
   ;      ╱       ╲      : 
   │     ╱         ╲     │ 
   │    ╱           ╲    │ 
   :   ╱             ╲   ; 
    ╲ ╱               ╲ ╱  
     ●─────────────────●   
A / P `.             ,' C  
        '─.       ,─'      
           `─────'               
     */
    it("returns true if point is one of the vertices", () => {
      expect(isPointInCircumcircle([0, 0], clockwiseTriangle)).toBe(true);
    })

    /**
              B            
          .───●───.        
       ,─'   ╱ ╲   '─.     
     ,'     ╱   ╲     `.   
    ╱      ╱     ╲      ╲  
   ;      ╱       ╲      : 
   │     ╱         ╲     │ 
   │    ╱           ╲    │ 
   :   ╱             ╲   ; 
    ╲ ╱      ┌─┐      ╲ ╱  
     ●───────┤P├───────●   
  A   `.     └─┘     ,' C  
        '─.       ,─'      
           `─────'         
     */
    it("returns true if point lies on an edge", () => {
      expect(isPointInCircumcircle([-1, 0], clockwiseTriangle)).toBe(true)
    })

/**

              B             ┌─┐
          .───●───.         │P│
       ,─'   ╱ ╲   '─.      └─┘
     ,'     ╱   ╲     `.       
    ╱      ╱     ╲      ╲      
   ;      ╱       ╲      :     
   │     ╱         ╲     │     
   │    ╱           ╲    │     
   :   ╱             ╲   ;     
    ╲ ╱               ╲ ╱      
     ●─────────────────●       
  A   `.             ,' C      
        '─.       ,─'          
           `─────'             

 */
    it("returns false if point is outside of triangle", () => {
      expect(isPointInCircumcircle([10, 10], clockwiseTriangle)).toBe(false);
    })
  });


  describe("doThreePointsMakeARight", () => {

    it("returns false if points are collinear, thus not making any turn", () => {
      expect(doThreePointsMakeARight(collinearTriangle)).toBe(false)
    })

    it("returns true if points are clockwise, thus making a right turn", () => {
      expect(doThreePointsMakeARight(clockwiseTriangle)).toBe(true)
    })

    it ("returns false if points are counter-clockwise, thus making a left turn", () => {
      expect(doThreePointsMakeARight(clockwiseTriangle.reverse())).toBe(false)
    })

  })
});
