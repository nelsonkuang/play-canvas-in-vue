import DisplayableCircle from '../Displayable/Circle'
export const controlPosition = {
  0: 'top',
  1: 'right',
  2: 'bottom',
  3: 'left',
  4: 'topLeft',
  5: 'topRight',
  6: 'bottomRight',
  7: 'bottomLeft',
  top: 0,
  right: 1,
  bottom: 2,
  left: 3,
  topLeft: 4,
  topRight: 5,
  bottomRight: 6,
  bottomLeft: 7,
  length: 8
}
class ScaleControl extends DisplayableCircle {
  type = 'ScaleControl'
  #startPos = {
    x: 0,
    y: 0
  }
  #isDragging = false
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
    },
    position: controlPosition.topLeft
  }
  // #preMatrix = this.getMatrix()
  cursor = 'auto'

  dragStart = null
  dragMove = null
  dragEnd = null

  constructor({ position = controlPosition.topLeft, fillStyle = '#ffffff', strokeStyle = '#000000', lineWidth = 1, x = 0, y = 0, radius = 10, zIndex = 0 }) {
    super({ fillStyle, strokeStyle, lineWidth, x, y, radius, zIndex })
    this.#translation.position = position
  }

  onDragStart (event) {
    this.#startPos = {
      x: event.pageX || event.changedTouches[0].pageX,
      y: event.pageY || event.changedTouches[0].pageY
    }
    this.#translation.from = this.#startPos
    this.dragStart && this.dragStart(this.#translation, this.uid)
    this.#isDragging = true
  }

  onDragMove (event) {
    if (this.#isDragging) {
      const currentPos = {
        x: event.pageX || event.changedTouches[0].pageX,
        y: event.pageY || event.changedTouches[0].pageY
      }
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

  getPosition () {
    return this.#translation.position
  }
}

export default ScaleControl