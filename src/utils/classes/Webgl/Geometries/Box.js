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
      nearTopLeft: vec3.fromValues(leftX, topY, nearZ),
      nearTopRight: vec3.fromValues(rightX, topY, nearZ),
      nearBottomLeft: vec3.fromValues(leftX, bottomY, nearZ),
      nearBottomRight: vec3.fromValues(rightX, bottomY, nearZ),
      farTopLeft: vec3.fromValues(leftX, topY, farZ),
      farTopRight: vec3.fromValues(rightX, topY, farZ),
      farBottomLeft: vec3.fromValues(leftX, bottomY, farZ),
      farBottomRight: vec3.fromValues(rightX, bottomY, farZ)
    }
  }

  getCornerVertices () {
    return this.#cornerVertices
  }

  getMin (cornerVertices) {
    cornerVertices = cornerVertices || this.#cornerVertices
    let minX = + Infinity
    let minY = + Infinity
    let minZ = + Infinity
    Object.values(cornerVertices).forEach((point) => {
      const x = point[0]
      const y = point[1]
      const z = point[2]
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (z < minZ) minZ = z
    })
    return vec3.fromValues(minX, minY, minZ)
  }

  getMax (cornerVertices) {
    cornerVertices = cornerVertices || this.#cornerVertices
    let maxX = - Infinity
    let maxY = - Infinity
    let maxZ = - Infinity
    Object.values(cornerVertices).forEach((point) => {
      const x = point[0]
      const y = point[1]
      const z = point[2]
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      if (z > maxZ) maxZ = z
    })
    return vec3.fromValues(maxX, maxY, maxZ)
  }

  applyTransform (cornerVertices) {
    const faked = !!cornerVertices
    cornerVertices = cornerVertices || this.#cornerVertices
    Object.keys(cornerVertices).forEach((key) => {
      vec3.transformMat4(cornerVertices[key], cornerVertices[key], this.#matrix)
    })
    !faked && mat4.identity(this.#matrix)
    return cornerVertices
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