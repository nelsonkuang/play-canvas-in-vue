import * as matrix from '../../math/matrix'
import * as guid from '../../tools/guid'

const matrixSymbol = Symbol('matrix')
class DisplayObject {
  constructor(x, y, width, height, zIndex) {
    this.x = x || 0
    this.y = y || 0
    this.width = width || 0
    this.height = height || 0
    this.zIndex = zIndex || 0
    this[matrixSymbol] = matrix.create()
    this.uid = guid()
  }

  getMatrix () {
    return this[matrixSymbol]
  }

  translate (v) {
    this[matrixSymbol] = matrix.translate(this[matrixSymbol], v)
  }

  rotate (rad) {
    this[matrixSymbol] = matrix.rotate(this[matrixSymbol], rad)
  }

  scale (v) {
    this[matrixSymbol] = matrix.scale(this[matrixSymbol], v)
  }

  invert () {
    this[matrixSymbol] = matrix.invert(this[matrixSymbol])
  }
}
export default DisplayObject
