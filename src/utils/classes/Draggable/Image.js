import DisplayableImage from '../Displayable/Image'
import { controlPosition } from '../Controls/Scale'
import { applyTransform } from '../../math/vector2'

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
      this.dragMove && this.dragMove(this.getScaleControlCentersByV2(), this.getRotateControlCenterByV2())
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

  getScaleControlCentersByV2 () {
    const { x, y, width, height } = this
    const m = this.getMatrix()
    return {
      [controlPosition.topLeft]: applyTransform([x, y], m),
      [controlPosition.top]: applyTransform([x + width / 2, y], m),
      [controlPosition.topRight]: applyTransform([x + width, y], m),
      [controlPosition.right]: applyTransform([x + width, y + height / 2], m),
      [controlPosition.bottomRight]: applyTransform([x + width, y + height], m),
      [controlPosition.bottom]: applyTransform([x + width / 2, y + height], m),
      [controlPosition.bottomLeft]: applyTransform([x, y + height], m),
      [controlPosition.left]: applyTransform([x, y + height / 2], m)
    }
  }

  getRotateControlCenterByV2 () {
    return applyTransform([this.x + this.width / 2, this.y - 40], this.getMatrix())
  }
}

export default DraggableImage