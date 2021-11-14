import { Vector2, Vector3 } from 'three'
import { Generator, inCircle, inPoisson, inSphere, onCircle, onSphere } from '../random'
import { noise } from '../random'

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

  describe('inSphere', () => {

    const circle = { radius: 3 }

    const buffer = new Float32Array(10_000 * 3)
    inSphere(buffer, circle)
    
    it("should generate n points on a sphere surface", () => {
      expect(buffer.length).toBe(30_000)
    })

    it("all points in the set belong to the sphere surface", () => {
      let check = true

      const v3 = new Vector3()

      // run through all the points and check that they are at lessEq distance from the center
      for (let i = 0; i < buffer.length; i+= 3) {

        const x = buffer[i]
        const y = buffer[i + 1]
        const z = buffer[i + 2]

        v3.set(x, y, z)

        // give some room for floating precision in the check
        check = v3.length() < circle.radius && check
      }

      expect(check).toBe(true)
    })
    
  })

  describe('onSphere', () => {

    const circle = { radius: 3 }

    const buffer = new Float32Array(10_000 * 3)
    onSphere(buffer, circle)
    
    it("should generate n points on a sphere surface", () => {
      expect(buffer.length).toBe(30_000)
    })

    it("all points in the set belong to the sphere surface", () => {
      let check = true

      const v3 = new Vector3()

      // run through all the points and check that they are at lessEq distance from the center
      for (let i = 0; i < buffer.length; i+= 3) {

        const x = buffer[i]
        const y = buffer[i + 1]
        const z = buffer[i + 2]

        v3.set(x, y, z)

        // give some room for floating precision in the check
        check = (Math.abs(v3.length() - circle.radius) < 0.000001) && check
      }

      expect(check).toBe(true)
    })
    
  })
})

describe("seeded random", () => {

  describe('random value', () => {

    it ('should always produce the same sequence of numbers given the same seed', () => {
      const generator = new Generator("test")
      const generator2 = new Generator("test2")

      const numbers = Array.from({ length: 40 }, () => generator.value())
      const numbers2 = Array.from({ length: 40 }, () => generator2.value())

      expect(numbers).not.toEqual(numbers2)

      // same seed as the first generator
      const generator3 = new Generator("test")
      const numbers3 = Array.from({ length: 40 }, () => generator3.value())

      expect(numbers).toEqual(numbers3)
     
    })

  })

})

describe("noise", () => {
  it('should produce same values for same coords & seed', () => {

    let i = 0;
    const values = Array.from({ length: 10 }, () => noise.simplex2(i, i++))

    i = 0;
    const values2 = Array.from({ length: 10 }, () => noise.simplex2(i, i++))

    expect(values).toEqual(values2)

  })

  it('should produce different values for same coords & different seed', () => {
  
    let i = 0;
    const values = Array.from({ length: 10 }, () => noise.simplex2(i, i++))

    noise.seed(1)

    i = 0;
    const values2 = Array.from({ length: 10 }, () => noise.simplex2(i, i++))

    expect(values).not.toEqual(values2)

  })
})