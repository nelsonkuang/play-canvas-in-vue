import DisplayableImage from '../Displayable/Image'

class DraggableImage extends DisplayableImage {
  #startPos = {
    x: 0,
    y: 0
  }

  constructor(src, x, y, width, height, zIndex) {
    super(src, x, y, width, height, zIndex)
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
    this.x = this.x + currentPos.x - this.#startPos.x
    this.y = this.y + currentPos.y - this.#startPos.y
  }

  onDragEnd () {
    this.#startPos = {
      x: 0,
      y: 0
    }
  }
}

export default DraggableImage