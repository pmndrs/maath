import * as random from '../random'
import * as buffer from '../buffer'

describe('addAxis', () => {
  it('adds a 3rd axis to a 2D buffer', () => {

    const my2DBuffer = random.inCircle(new Float32Array(1_000 * 2))
    const my3DBuffer = buffer.addAxis( my2DBuffer, 2, () => .75 )

    for (let i = 0; i < my2DBuffer.length; i+= 2) {
      let j = (i / 2) * 3;

      expect( my3DBuffer[j] ).toEqual( my2DBuffer[i] )
      expect( my3DBuffer[j+1] ).toEqual( my2DBuffer[i+1] )
      expect( my3DBuffer[j+2] ).toEqual( .75 )

    }

  })

  it('adds a 4th axis to a 3D buffer', () => {

    const my3DBuffer = random.inSphere(new Float32Array(1_000 * 3))
    const my4DBuffer = buffer.addAxis( my3DBuffer, 3, () => .75 )

    for (let i = 0; i < my3DBuffer.length; i+= 3) {
      let j = (i / 3) * 4;

      expect( my4DBuffer[j] ).toEqual( my3DBuffer[i] )
      expect( my4DBuffer[j+1] ).toEqual( my3DBuffer[i+1] )
      expect( my4DBuffer[j+2] ).toEqual( my3DBuffer[i+2] )
      expect( my4DBuffer[j+3] ).toEqual( .75 )

    }

  })
})