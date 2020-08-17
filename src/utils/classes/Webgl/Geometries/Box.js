import { mat4, vec3 } from 'gl-matrix'
const initCornerVertices = Symbol('initCornerVertices')
class Box {
  type = 'Box'
  #matrix
  #cornerVertices
  constructor(centerX = 0, centerY = 0, centerZ = 0, width = 0, height = 0, depth = 0, zIndex = 0) {
    this.centerX = centerX
    this.centerY = centerY
    this.centerZ = centerZ
    this.width = width
    this.height = height
    this.depth = depth
    this.zIndex = zIndex
    this.#matrix = mat4.create()
    this[initCornerVertices]()
  }

  [initCornerVertices] () {
    const leftX = this.centerX - this.width / 2
    const rightX = this.centerX + this.width / 2
    const topY = this.centerY + this.height / 2
    const bottomY = this.centerY - this.height / 2
    const nearZ = this.centerZ + this.depth / 2
    const farZ = this.centerZ - this.depth / 2
    this.#cornerVertices = {
      nearTopLeft: [leftX, topY, nearZ],
      nearTopRight: [rightX, topY, nearZ],
      nearBottomLeft: [leftX, bottomY, nearZ],
      nearBottomRight: [rightX, bottomY, nearZ],
      farTopLeft: [leftX, topY, farZ],
      farTopRight: [rightX, topY, farZ],
      farBottomLeft: [leftX, bottomY, farZ],
      farBottomRight: [rightX, bottomY, farZ]
    }
  }

  applyTransform () {
    Object.keys(this.#cornerVertices).forEach((key) => {
      vec3.transformMat4(this.#cornerVertices[key], this.#cornerVertices[key], this.#matrix)
    })
    mat4.identity(this.#matrix)
  }

  getMatrix () {
    return this.#matrix
  }

  setMatrix (m) {
    mat4.copy(this.#matrix, m)
    return this
  }

  translate (vector) {
    mat4.translate(this.#matrix, this.#matrix, vector)
    return this
  }

  scale (vector) {
    mat4.scale(this.#matrix, this.#matrix, vector)
    return this
  }

  rotate (rad, axis) {
    mat4.rotate(this.#matrix, this.#matrix, rad, axis) // 绕 axis 旋转
    return this
  }

  rotateX (rad) {
    mat4.rotateX(this.#matrix, this.#matrix, rad)
    return this
  }

  rotateY (rad) {
    mat4.rotateY(this.#matrix, this.#matrix, rad)
    return this
  }

  rotateZ (rad) {
    mat4.rotateZ(this.#matrix, this.#matrix, rad)
    return this
  }
}
export default Box