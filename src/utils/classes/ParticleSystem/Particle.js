import guid from '../../tools/guid'
import { vec2 } from 'gl-matrix'
class Particle {
  /**
   * @var {string}
   * @desc 对象类型
   */
  type = 'Particle'
  /**
   * constructor
   * @param {vec2} position
   * @param {vec2} velocity
   * @param {string} fillStyle
   * @param {number} width
   * @param {number} height
   */
  constructor(position, velocity, fillStyle = '#ffffff', width = 1, height = 1) {
    this.position = position || vec2.create()
    this.velocity = velocity || vec2.create()
    this.width = width
    this.height = height
    this.fillStyle = fillStyle
    this.uid = guid()
  }

  /**
   * 把点画到画布上
   * @param {CanvasRenderingContext2D} ctx
   * @return {void}
   */
  draw (ctx) {
    const { position, fillStyle, width, height } = this
    ctx.fillStyle = fillStyle
    ctx.fillRect(position[0], position[1], width, height)
  }
}

/**
* @constant {number}
* @default 1
* @desc 最大速度
*/
Particle.maxVelocity = 1024

export default Particle