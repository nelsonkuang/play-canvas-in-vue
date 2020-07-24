import DisplayableImage from '../Displayable/Image'

class RotateControl extends DisplayableImage {
  type = 'RotateControl'
  #isDragging = false
  #startPos = {
    x: 0,
    y: 0
  }
  #translation = {
    x: 0,
    y: 0,
    from: {
      x: 0,
      y: 0,
    },
    to: {
      x: 0,
      y: 0,
    }
  }

  dragStart = null
  dragMove = null
  dragEnd = null

  cursor = 'grabbing'

  constructor(src, x, y, width, height, zIndex) {
    super(src, x, y, width, height, zIndex)
  }

  onDragStart (event, tapPos) {
    this.#startPos = tapPos
    this.#translation.from = this.#startPos
    this.dragStart && this.dragStart(this.#translation, this.uid)
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
  onDragMove (event, tapPos) {
    if (this.#isDragging) {
      const currentPos = tapPos
      this.#translation.x = currentPos.x - this.#startPos.x
      this.#translation.y = currentPos.y - this.#startPos.y
      this.#translation.to = currentPos
      this.dragMove && this.dragMove(this.#translation)
    }
  }

  onDragEnd () {
    this.dragEnd && this.dragEnd(this.#translation)
    this.#startPos = {
      x: 0,
      y: 0
    }
    this.#isDragging = false
  }
}

export default RotateControl