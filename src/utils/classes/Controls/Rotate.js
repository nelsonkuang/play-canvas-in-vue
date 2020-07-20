import DisplayableImage from '../Displayable/Image'
import { getDomOffset } from '../../tools/index'

class RotateControl extends DisplayableImage {
  #currentAngle = 0
  #p = [0, 0]
  #p0 = [0, 0]
  #p90 = [0, 0]
  #p180 = [0, 0]
  #p270 = [0, 0]

  constructor(radius, src, x, y, width, height, zIndex) {
    super(src, x, y, width, height, zIndex)
    this.radius = radius
    this.#p0 = [x + width / 2, y + height / 2]
    this.#p90 = [this.#p0[0] + radius, this.#p0[1] + radius]
    this.#p180 = [this.#p0[0], this.#p0[1] + 2 * radius]
    this.#p270 = [this.#p0[0] - radius, this.#p90[1]]
    this.#p = [this.#p0[0], this.#p0[1]]
  }

  onDragStart () {
  }

  onDragMove (event) {
    event.preventDefault()
    const offset = getDomOffset(event.target)
    const currentPos = {
      x: (event.pageX || event.changedTouches[0].pageX) - offset.left,
      y: (event.pageY || event.changedTouches[0].pageY) - offset.top
    }
    const dy = Math.sqrt((this.radius * this.radius) - ((currentPos.x - this.#p0[0]) * (currentPos.x - this.#p0[0])))
    if (currentPos.x > this.#p0[0] && currentPos.y < this.#p90[1]) { // 当前点在右上
      this.#p[0] = currentPos.x < this.#p90[0] ? currentPos.x : this.#p90[0]
      this.#p[1] = this.#p0[1] + this.radius - dy
      this.#currentAngle = Math.acos(dy / this.radius)
    } else if (currentPos.x > this.#p0[0] && currentPos.y > this.#p90[1]) { // 当前点在右下
      this.#p[0] = currentPos.x < this.#p90[0] ? currentPos.x : this.#p90[0]
      this.#p[1] = this.#p0[1] + this.radius + dy
      this.#currentAngle = Math.PI - Math.acos(dy / this.radius)
    } else if (currentPos.x < this.#p0[0] && currentPos.y > this.#p90[1]) { // 当前点在左下
      this.#p[0] = currentPos.x > this.#p270[0] ? currentPos.x : this.#p270[0]
      this.#p[1] = this.#p0[1] + this.radius + dy
      this.#currentAngle = Math.PI + Math.acos(dy / this.radius)
    } else if (currentPos.x < this.#p0[0] && currentPos.y < this.#p90[1]) { // 当前点在右上
      this.#p[0] = currentPos.x > this.#p270[0] ? currentPos.x : this.#p270[0]
      this.#p[1] = this.#p0[1] + this.radius - dy
      this.#currentAngle = Math.PI * 2 - Math.acos(dy / this.radius)
    }
    this.x = this.#p[0] - this.width / 2
    this.y = this.#p[1] - this.height / 2
  }

  onDragEnd () {
  }

  getCurrentAngle () {
    return this.#currentAngle
  }
}

export default RotateControl