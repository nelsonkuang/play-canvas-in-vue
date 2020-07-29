import { vec2 } from 'gl-matrix'
import guid from '../../tools/guid'
import Particle from './Particle'
class RectParticleSystem {
  /**
   * @var {string}
   * @desc 对象类型
   */
  type = 'RectParticleSystem'
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
  constructor(x, y, width, height) {
    this.x = x || 0
    this.y = y || 0
    this.width = Math.round(width || 100)
    this.height = Math.round(height || 100)
    this.uid = guid()
  }
  /**
   * 初始化创建粒子的合集
   * @return {void}
   */
  create () {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        this.particles.push(new Particle(vec2.fromValues(i, j), 0, '#ffffff', 1, 1))
      }
    }
  }
}
export default RectParticleSystem