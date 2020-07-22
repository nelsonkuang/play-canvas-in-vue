import DisplayableImage from '../Displayable/Image'

class DraggableImage extends DisplayableImage {
  type = 'DraggableImage'
  #startPos = {
    x: 0,
    y: 0
  }
  #isDragging = false
  cursor = 'move'
  #preMatrix = this.getMatrix()

  dragStart = null
  dragMove = null
  dragEnd = null

  constructor(src, x, y, width, height, zIndex) {
    super(src, x, y, width, height, zIndex)
  }

  onDragStart (event) {
    this.#startPos = {
      x: event.pageX || event.changedTouches[0].pageX,
      y: event.pageY || event.changedTouches[0].pageY
    }
    this.#preMatrix = this.getMatrix()
    this.dragStart && this.dragStart(this.#startPos)
    this.#isDragging = true
  }

  onDragMove (event) {
    if (this.#isDragging) {
      const currentPos = {
        x: event.pageX || event.changedTouches[0].pageX,
        y: event.pageY || event.changedTouches[0].pageY
      }
      this.setMatrix(this.#preMatrix)
      const v2 = [currentPos.x - this.#startPos.x, currentPos.y - this.#startPos.y]
      this.translate(v2)
      this.dragMove && this.dragMove(v2)
    }
  }

  onDragEnd () {
    this.dragEnd && this.dragEnd()
    this.#isDragging = false
    this.#startPos = {
      x: 0,
      y: 0
    }
  }
}

export default DraggableImage