import * as matrix from '../../math/matrix'
import * as guid from '../../tools/guid'

class DisplayObject {
  #matrix = null

  constructor(x, y, width, height, zIndex) {
    this.x = x || 0
    this.y = y || 0
    this.width = width || 0
    this.height = height || 0
    this.zIndex = zIndex || 0
    this.#matrix = matrix.create()
    this.uid = guid()
  }

  getMatrix () {
    return this.#matrix
  }

  setMatrix (m) {
    this.#matrix = m
  }

  translate (v) {
    this.#matrix = matrix.translate(this.#matrix, v)
  }

  rotate (rad) {
    this.#matrix = matrix.rotate(this.#matrix, rad)
  }

  scale (v) {
    this.#matrix = matrix.scale(this.#matrix, v)
  }

  invert () {
    this.#matrix = matrix.invert(this.#matrix)
  }
}
export default DisplayObject
