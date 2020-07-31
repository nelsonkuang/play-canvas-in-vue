import { vec2 } from 'gl-matrix'
import guid from '../../tools/guid'
import Particle from './Particle'

let out = vec2.create()
class RectParticleSystem {
  /**
   * @var {string}
   * @desc 对象类型
   */
  type = 'RectParticleSystem'
  /**
   * @var {vec2}
   * @desc 吸引场中心
   */
  attractor = vec2.create()
  /**
   * @var {Array}
   * @desc Particle 的合集
   */
  particles = []
  /**
   * constructor
   * @param {number} [x = 0]
   * @param {number} [y = 0]
   * @param {number} [width = 100]
   * @param {number} [height = 100]
   */
  constructor(x = 0, y = 0, width = 100, height = 100, playgroundRect = { x: 0, y: 0, width: 400, height: 400 }) {
    this.x = x
    this.y = y
    this.width = Math.round(width)
    this.height = Math.round(height)
    this.playgroundRect = playgroundRect
    this.attractor = vec2.fromValues(playgroundRect.x + playgroundRect.width / 2, playgroundRect.y + playgroundRect.height / 2)
    this.uid = guid()
    this.create()
  }
  /**
   * 初始化创建粒子的合集
   * @return {void}
   */
  create () {
    let i
    let j
    const { x, y } = this
    for (i = 0; i < this.width; i += 8) {
      for (j = 0; j < this.height; j += 8) {
        this.particles.push(new Particle(vec2.fromValues(x + i, y + j), 0, '#ffffff', Math.random() * 4, Math.random() * 4))
      }
    }
  }
  /**
   * 实时更新粒子的状态
   * @return {void}
   */
  update () {
    let i
    let p
    for (i = 0; i < this.particles.length; i++) {
      p = this.particles[i]
      vec2.subtract(out, this.attractor, p.position)
      let distance = Math.max(1, vec2.length(out))
      vec2.normalize(out, out)
      vec2.scale(out, out, distance / 1024)
      vec2.add(p.velocity, out, p.velocity)
      if (vec2.length(p.velocity) > Particle.maxVelocity) {
        vec2.normalize(p.velocity, p.velocity);
        vec2.scale(p.velocity, p.velocity, Particle.maxVelocity)
      }
      vec2.add(p.position, p.position, p.velocity)

      // bound check
      if (p.position[0] < this.playgroundRect.x) {
        p.position[0] = this.playgroundRect.x
        p.velocity[0] *= -1
      }
      if (p.position[0] > this.playgroundRect.x + this.playgroundRect.width) {
        p.position[0] = this.playgroundRect.x + this.playgroundRect.width
        p.velocity[0] *= -1
      }
      if (p.position[1] < this.playgroundRect.y) {
        p.position[1] = this.playgroundRect.y
        p.velocity[1] *= -1
      }
      if (p.position[1] > this.playgroundRect.y + this.playgroundRect.height) {
        p.position[1] = this.playgroundRect.y + this.playgroundRect.height
        p.velocity[1] *= -1
      }
    }
  }
  /**
   * 实时画所有粒子
   * @return {void}
   */
  draw (ctx) {
    let i
    for (i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx)
    }
  }
}
export default RectParticleSystem