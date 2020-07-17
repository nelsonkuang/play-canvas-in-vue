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
  #startPos = {
    x: 0,
    y: 0
  }

  constructor({ position = controlPosition.topLeft, fillStyle = '#ffffff', strokeStyle = '#000000', lineWidth = 1, x = 0, y = 0, radius = 10, zIndex = 0 }) {
    super({ fillStyle, strokeStyle, lineWidth, x, y, radius, zIndex })
    this.position = position
  }

  onDragStart (event) {
    this.#startPos = {
      x: event.pageX || event.changedTouches[0].pageX,
      y: event.pageY || event.changedTouches[0].pageY
    }
  }

  onDragMove (event) {
    event.preventDefault()
    const currentPos = {
      x: event.pageX || event.changedTouches[0].pageX,
      y: event.pageY || event.changedTouches[0].pageY
    }
    const { x, y, position } = this
    if (position === controlPosition.topLeft || position === controlPosition.topRight || position === controlPosition.bottomLeft || position === controlPosition.bottomRight) {
      this.x = x + currentPos.x - this.#startPos.x
      this.y = y + currentPos.y - this.#startPos.y
    } else if (position === controlPosition.top || position === controlPosition.bottom) {
      this.y = y + currentPos.y - this.#startPos.y
    } else if (position === controlPosition.left || position === controlPosition.right) {
      this.x = x + currentPos.x - this.#startPos.x
    }
  }

  onDragEnd () {
    this.#startPos = {
      x: 0,
      y: 0
    }
  }
}

export default ScaleControl