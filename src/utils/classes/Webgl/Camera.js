// Reference from: https://zhoyq.github.io/panoramic
import { mat4, vec3 } from 'gl-matrix'
import guid from '../../tools/guid'

function degToRad (d) {
  return d * Math.PI / 180
}

const vecZero = vec3.fromValues(0, 0, 0)

class Camera {
  type = 'Camera'
  position = vec3.fromValues(0, 0, 1)
  target = vec3.fromValues(0, 1, 0)
  up = vec3.fromValues(0, 1, 0)
  zoom = 1
  theta = 0 // 绕 y 轴旋转角度
  phi = 0 // 绕 x 轴旋转角度
  zNear = 0.1
  zFar = 100.0
  yFov = degToRad(45.0)
  aspectRatio = 16.0 / 9.0 // gl.canvas.clientWidth / gl.canvas.clientHeight

  constructor() {
    this.uid = guid()
  }

  projectionMatrix () {
    const { yFov, aspectRatio, zNear, zFar } = this
    const projection = mat4.create()
    mat4.perspective(projection, yFov, aspectRatio, zNear, zFar)
    return projection
  }

  viewMatrix () {
    const { position, target, up } = this
    const view = mat4.create()
    mat4.lookAt(view, position, target, up)
    return view
  }

  updatePosition () {
    const pos = vec3.fromValues(0, 0, 1)

    vec3.rotateX(pos, pos, vecZero, -this.phi)
    vec3.rotateY(pos, pos, vecZero, -this.theta)

    vec3.scale(pos, pos, this.zoom)
    vec3.add(this.position, pos, this.target)
  }

  worldMatrix () {
    const world = mat4.create()
    mat4.fromXRotation(world, -this.phi)
    mat4.rotateY(world, world, -this.theta)
    mat4.scale(world, world, [this.zoom, this.zoom, this.zoom])
    mat4.translate(world, world, this.position)
    return world
  }

  rotate (dx, dy) {
    const phiMax = Math.PI / 2 - 0.01
    this.theta += dx
    this.phi += dy
    this.phi = Math.min(Math.max(this.phi, - Math.PI / 2), phiMax)
  }

  zoomIn (delta) {
    if (delta > 0) {
      this.zoom *= 1.04
    } else {
      this.zoom /= 1.04
    }
  }

  pan (dx, dy) {
    const moveSpeed = 300

    const left = vec3.fromValues(-1, 0, 0)

    vec3.rotateX(left, left, vecZero, -this.phi)
    vec3.rotateY(left, left, vecZero, -this.theta)
    vec3.scale(left, left, dx * moveSpeed)

    const up = vec3.fromValues(0, 0, -1)

    // vec3.rotateX(up, up, vecZero, -this.yRot);
    vec3.rotateY(up, up, vecZero, -this.theta)
    vec3.scale(up, up, dy * moveSpeed)

    vec3.add(this.target, this.target, up)
    vec3.add(this.target, this.target, left)
  }

  fitViewToScene (min = [-10000, -10000, -10000], max = [10000, 10000, 10000]) {
    for (let i of [0, 1, 2]) {
      this.target[i] = (max[i] + min[i]) / 2
    }
    const maxAxisLength = Math.max(max[0] - min[0], max[1] - min[1])

    this.phi = Math.PI / 4.0

    const yFov = this.yFov
    const xFov = yFov * this.aspectRatio

    const yZoom = maxAxisLength / 2 / Math.tan(yFov / 2)
    const xZoom = maxAxisLength / 2 / Math.tan(xFov / 2)

    this.zoom = Math.max(xZoom, yZoom)
  }
}

export default Camera
