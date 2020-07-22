import DisplayableImage from '../Displayable/Image'
import { getDomOffset } from '../../tools/index'

class RotateControl extends DisplayableImage {
  type = 'RotateControl'
  #isDragging = false
  #currentAngle = 0
  #p = [0, 0] // 当前中心点
  #p0 = [0, 0]  // 0 度时中心点
  #p90 = [0, 0] // 90 度时中心点
  #p180 = [0, 0] // 180 度时中心点
  #p270 = [0, 0] // 270 度时中心点

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
    this.#isDragging = true
  }
  /*
  * 基本按下面图形来计算每个 onDragMove 事件点对应所在的圆弧上
  *     O
  * O   |   O
  *  \  |  /
  *   \ | /
  *    \|/
  *    /|\
  *   / | \
  *  /  |  \ 
  * O   |   O
  *     O
  */
  onDragMove (event) {
    if (this.#isDragging) {
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
      // 先旋转，后平移
      this.setMatrix([...this.defaultMatrix])
      this.translate([-1 * (this.x + this.width / 2), -1 * (this.y + this.height / 2)]) // 设置画布旋转锚点中心
      this.rotate(this.#currentAngle)
      this.translate([this.x + this.width / 2, this.y + this.height / 2]) // 恢复画布锚点中心
      this.translate([this.#p[0] - this.#p0[0], this.#p[1] - this.#p0[1]])
    }
  }

  onDragEnd () {
    this.#isDragging = false
  }

  getCurrentAngle () {
    return this.#currentAngle
  }
}

export default RotateControl