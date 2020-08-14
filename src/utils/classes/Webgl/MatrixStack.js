// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-matrix-stack.html
import { mat4, mat3 } from 'gl-matrix'
class MatrixStack {
  type = 'MatrixStack'
  #stack = []
  #matrixType = 4
  #m = mat4

  constructor(matrixType = 4) {
    this.#matrixType = matrixType
    if (matrixType !== 4) {
      this.#m = mat3
    }
    this.#stack[0] = this.#m.identity()
  }

  restore () {
    this.#stack.pop()
    // Never let the stack be totally empty
    if (this.stack.length < 1) {
      this.#stack[0] = this.#m.identity()
    }
  }

  save () {
    this.#stack.push(this.getCurrentMatrix())
  }

  getCurrentMatrix () {
    return this.#stack[this.#stack.length - 1]
  }

  setCurrentMatrix (matrix) {
    this.#stack[this.#stack.length - 1] = matrix
    return matrix
  }

  translate (vector) {
    let matrix = this.#m.create()
    this.#m.translate(matrix, this.getCurrentMatrix(), vector)
    this.setCurrentMatrix(matrix)
  }

  scale (vector) {
    let matrix = this.#m.create()
    this.#m.scale(matrix, this.getCurrentMatrix(), vector)
    this.setCurrentMatrix(matrix)
  }

  rotate (rad, axis) {
    let matrix = this.#m.create()
    if (this.#matrixType === 4) {
      this.#m.rotate(matrix, this.getCurrentMatrix(), rad, axis) // 绕 axis 旋转
    } else {
      this.#m.rotate(matrix, this.getCurrentMatrix(), rad)
    }
    this.setCurrentMatrix(matrix)
  }

  rotateX (rad) {
    if (this.#matrixType !== 4) return
    let matrix = this.#m.create()
    this.#m.rotateX(matrix, this.getCurrentMatrix(), rad)
    this.setCurrentMatrix(matrix)
  }

  rotateY (rad) {
    if (this.#matrixType !== 4) return
    let matrix = this.#m.create()
    this.#m.rotateY(matrix, this.getCurrentMatrix(), rad)
    this.setCurrentMatrix(matrix)
  }

  rotateZ (rad) {
    if (this.#matrixType !== 4) return
    let matrix = this.#m.create()
    this.#m.rotateZ(matrix, this.getCurrentMatrix(), rad)
    this.setCurrentMatrix(matrix)
  }
}
export default MatrixStack
