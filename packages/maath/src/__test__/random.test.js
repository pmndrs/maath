import { Vector2 } from 'three'
import { inCircle, onCircle } from '../random'

describe('random', () => {

  describe('inCircle', () => {

    const circle = { radius: 3 }

    const buffer = new Float32Array(10_000 * 2)
    inCircle(buffer, circle)
    
    it("should generate n points in a circle", () => {
      expect(buffer.length).toBe(20_000)
    })

    it("all points in the set belong to the circle", () => {
      let check = true

      const v2 = new Vector2()

      // run through all the points and check that they are at lessEq distance from the center
      for (let i = 0; i < buffer.length; i+= 2) {

        const x = buffer[i]
        const y = buffer[i + 1]

        v2.set(x, y)

        check = v2.length() <= circle.radius && check
      }

      expect(check).toBe(true)
    })
    
  })

  describe('onCircle', () => {

    const circle = { radius: 3 }

    const buffer = new Float32Array(10_000 * 2)
    onCircle(buffer, circle)
    
    it("should generate n points in a circle", () => {
      expect(buffer.length).toBe(20_000)
    })

    it("all points in the set belong to the circle", () => {
      let check = true

      const v2 = new Vector2()

      // run through all the points and check that they are at lessEq distance from the center
      for (let i = 0; i < buffer.length; i+= 2) {

        const x = buffer[i]
        const y = buffer[i + 1]

        v2.set(x, y)

        // give some room for floating precision in the check
        check = (Math.abs(v2.length() - circle.radius) < 0.000001) && check
      }

      expect(check).toBe(true)
    })
    
  })

})