import * as matrix from '../../math/matrix'
import guid from '../../tools/guid'
import { applyTransform } from '../../math/vector2'

class DisplayableObject {
  type = 'DisplayableObject'
  #matrix = null

  constructor(x, y, width, height, zIndex) {
    this.x = x || 0
    this.y = y || 0
    this.width = width || 0
    this.height = height || 0
    this.zIndex = zIndex || 0
    this.defaultMatrix = matrix.create()
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

  getCenterByV2 () {
    return applyTransform([this.x, this.y], this.#matrix)
  }
}
export default DisplayableObject
