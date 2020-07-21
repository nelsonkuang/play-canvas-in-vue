import DisplayableImage from '../Displayable/Image'

class DraggableImage extends DisplayableImage {
  #startPos = {
    x: 0,
    y: 0
  }
  #isDragging = false
  cursor = 'move'

  constructor(src, x, y, width, height, zIndex) {
    super(src, x, y, width, height, zIndex)
  }

  onDragStart (event) {
    this.#startPos = {
      x: event.pageX || event.changedTouches[0].pageX,
      y: event.pageY || event.changedTouches[0].pageY
    }
    this.#isDragging = true
  }

  onDragMove (event) {
    if (this.#isDragging) {
      const currentPos = {
        x: event.pageX || event.changedTouches[0].pageX,
        y: event.pageY || event.changedTouches[0].pageY
      }
      this.translate([currentPos.x - this.#startPos.x, currentPos.y - this.#startPos.y])
    }
  }

  onDragEnd () {
    this.#isDragging = false
    this.#startPos = {
      x: 0,
      y: 0
    }
  }
}

export default DraggableImage