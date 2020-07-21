<template>
  <div class="hello">
    <h1>{{ $route.meta.title }}</h1>
    <div class="container">
      <canvas id="canvas" ref="canvas" class="canvas" width="500" height="500"></canvas>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DraggableImage from '../../utils/classes/Draggable/Image'
import ScaleControl, { controlPosition } from '../../utils/classes/Controls/Scale'
import BoundingRect from '../../utils/classes/BoundingRect'
import { getDomOffset } from '../../utils/tools'
import img from '../../assets/logo.png'
let animationID = null
export default {
  data () {
    return {
    }
  },
  computed: {
  },
  mounted () {
    const canvas = this.$refs.canvas
    const cWidth = Number(canvas.getAttribute('width'))
    const cHeight = Number(canvas.getAttribute('height'))
    const ctx = canvas.getContext('2d')
    const stageObjects = {
      keysByOrder: []
    }

    let tapPos = {
      x: 0,
      y: 0
    }

    const bindEvents = () => {
      let isDraging = false
      let dragingObject = null
      const offset = getDomOffset(canvas)
      // const supportedTouch = window.hasOwnProperty('ontouchstart')
      canvas.onmousedown = function (event) {
        tapPos = {
          x: event.pageX - offset.left,
          y: event.pageY - offset.top
        }
        const hoverDisplayObject = getHoverDisplayObject()
        if (hoverDisplayObject) {
          isDraging = true
          dragingObject = hoverDisplayObject.value
          dragingObject.onDragStart && dragingObject.onDragStart(event)
        }
      }

      canvas.onmousemove = function (event) {
        tapPos = {
          x: event.pageX - offset.left,
          y: event.pageY - offset.top
        }
        if (isDraging && dragingObject) {
          dragingObject.onDragMove && dragingObject.onDragMove(event)
        }
      }

      canvas.onmouseup = function () {
        dragingObject && dragingObject.onDragEnd && dragingObject.onDragEnd()
        isDraging = false
        dragingObject = null
      }

      canvas.onmouseleave = function () {
        dragingObject && dragingObject.onDragEnd && dragingObject.onDragEnd()
        isDraging = false
        dragingObject = null
      }
    }

    const addToStage = (obj) => {
      stageObjects[obj.uid] = obj
      stageObjects.keysByOrder.unshift(obj.uid)
    }

    const getDisplayObjects = () => {
      const result = {}
      stageObjects.keysByOrder.forEach((key) => {
        const boundingRect = new BoundingRect(stageObjects[key].x, stageObjects[key].y, stageObjects[key].width, stageObjects[key].height)
        boundingRect.applyTransform(stageObjects[key].getMatrix())
        result[key] = {
          key: key,
          value: stageObjects[key],
          boundingRect: boundingRect,
          bX: boundingRect.x,
          bY: boundingRect.y,
          bWidth: boundingRect.width,
          bHeight: boundingRect.height,
          bCenter: {
            x: boundingRect.x + boundingRect.width / 2,
            y: boundingRect.y + boundingRect.height / 2
          }
        }
      })
      return result
    }

    const getHoverDisplayObject = () => {
      const displayObjects = getDisplayObjects()
      for (let i = 0; i < stageObjects.keysByOrder.length; i++) {
        const displayObject = displayObjects[stageObjects.keysByOrder[i]]
        if (tapPos.x > displayObject.bX && tapPos.x < displayObject.bX + displayObject.bWidth && tapPos.y > displayObject.bY && tapPos.y < displayObject.bY + displayObject.bHeight) {
          return displayObject
        }
      }
      return null
    }

    const draw = () => {
      const displayObjects = getDisplayObjects()
      for (let key in displayObjects) {
        const displayObject = displayObjects[key].value
        displayObject.draw && displayObject.draw(ctx)
      }
    }

    const update = () => {
      ctx.clearRect(0, 0, cWidth, cHeight)

      const hoverDisplayObject = getHoverDisplayObject()
      if (hoverDisplayObject && hoverDisplayObject.value.cursor) {
        canvas.style.cursor = hoverDisplayObject.value.cursor
      } else {
        canvas.style.cursor = 'auto'
      }

      draw()
      animationID = requestAnimationFrame(update)
    }

    /*************************** 程序主入口 *****************************/
    const myImage = new DraggableImage(img, 150, 150, 200, 200)
    const tlControl = new ScaleControl({
      position: controlPosition.topLeft,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: 140,
      y: 140,
      radius: 10,
      zIndex: 2
    })
    let currentImagePreMatrix
    let currentControlPreMatrix
    let editingImage
    let currentControl
    let dragging = false

    tlControl.cursor = 'nwse-resize'
    tlControl.dragStart = () => {
      const displayObjects = getDisplayObjects()
      editingImage = displayObjects[myImage.uid]
      currentControl = displayObjects[tlControl.uid]
      currentImagePreMatrix = editingImage.value.getMatrix()
      currentControlPreMatrix = currentControl.value.getMatrix()
      dragging = true
    }
    tlControl.dragMove = (translation) => {
      if (dragging) {
        const { bCenter, bWidth } = editingImage
        const { from, to, position } = translation
        const dsFrom = Math.sqrt((from.x - bCenter.x) * (from.x - bCenter.x) + (from.y - bCenter.y) * (from.y - bCenter.y))
        const dsTo = Math.sqrt((to.x - bCenter.x) * (to.x - bCenter.x) + (to.y - bCenter.y) * (to.y - bCenter.y))
        const ds = dsTo - dsFrom
        const isScaleUp = ds > 0
        let newBWidth
        // let newBHeight
        let dsB
        let scaleX = 1
        // let scaleY = 1
        let scale = [1, 1]
        switch (position) {
          case controlPosition.topLeft:
            dsB = Math.sqrt(ds * ds / 2) * 3 // 增加灵敏度
            if (isScaleUp) {
              newBWidth = bWidth + dsB
            } else {
              newBWidth = bWidth - dsB
            }
            scaleX = newBWidth / bWidth
            scale = [scaleX, scaleX]
            break
          // to do
          case controlPosition.left:
            break
          case controlPosition.bottomLeft:
            break
          case controlPosition.topRight:
            break
          case controlPosition.right:
            break
          case controlPosition.bottomRight:
            break
          case controlPosition.top:
            break
          case controlPosition.bottom:
            break
          default:
            break
        }

        const editingImageObject = editingImage.value
        editingImageObject.setMatrix(currentImagePreMatrix)
        editingImageObject.translate([-1 * bCenter.x, -1 * bCenter.y]) // 设置画布旋转锚点中心
        editingImageObject.scale(scale)
        editingImageObject.translate([bCenter.x, bCenter.y]) // 恢复画布锚点中心

        const currentControlTranslationX = isScaleUp ? -1 * dsB / 2 : dsB / 2
        const currentControlObject = currentControl.value
        currentControlObject.setMatrix(currentControlPreMatrix)
        currentControlObject.translate([currentControlTranslationX, currentControlTranslationX])
      }
    }
    tlControl.dragEnd = () => {
      editingImage = null
      currentControl = null
      currentImagePreMatrix = null
      currentControlPreMatrix = null
      dragging = false
    }

    myImage.dragStart = () => {
      const displayObjects = getDisplayObjects()
      currentControl = displayObjects[tlControl.uid]
      currentControlPreMatrix = currentControl.value.getMatrix()
      dragging = true
    }
    myImage.dragMove = (v2) => {
      if (dragging) {
        const currentControlObject = currentControl.value
        currentControlObject.setMatrix(currentControlPreMatrix)
        currentControlObject.translate(v2)
      }
    }
    myImage.dragEnd = () => {
      editingImage = null
      currentControl = null
      currentImagePreMatrix = null
      currentControlPreMatrix = null
      dragging = false
    }

    addToStage(myImage)
    addToStage(tlControl)

    bindEvents()
    update()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.canvas {
  border: 1px dashed #ddd;
}
</style>
