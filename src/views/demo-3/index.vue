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
import img from '../../assets/logo.jpg'
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
      keysByOrder: [],
      keysOfScaleControl: [],
      keysOfRotateControl: [],
      keysOfDraggableImage: []
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
      if (obj.type === 'ScaleControl') {
        stageObjects.keysOfScaleControl.push(obj.uid)
      } else if (obj.type === 'RotateControl') {
        stageObjects.keysOfRotateControl.push(obj.uid)
      } else if (obj.type === 'DraggableImage') {
        stageObjects.keysOfDraggableImage.push(obj.uid)
      }
    }

    const getDisplayObjects = () => {
      const result = {}
      stageObjects.keysByOrder.forEach((key) => {
        const boundingRect = new BoundingRect(stageObjects[key].x, stageObjects[key].y, stageObjects[key].width, stageObjects[key].height)
        boundingRect.applyTransform(stageObjects[key].getMatrix())
        result[key] = {
          key: key,
          type: stageObjects[key].type,
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
      // console.log(hoverDisplayObject)
      if (hoverDisplayObject && hoverDisplayObject.value.cursor) {
        canvas.style.cursor = hoverDisplayObject.value.cursor
      } else {
        canvas.style.cursor = 'auto'
      }

      draw()
      animationID = requestAnimationFrame(update)
    }

    /*************************** 程序主入口 *****************************/
    let currentImagePreMatrix
    let currentScaleControlPreMatrixs = {}
    let editingImage
    let currentScaleControls = {}
    let dragging = false

    const myImageRect = {
      x: 150,
      y: 150,
      width: 200,
      height: 200
    }
    const myImage = new DraggableImage(img, myImageRect.x, myImageRect.y, myImageRect.width, myImageRect.height)
    const tlControl = new ScaleControl({
      position: controlPosition.topLeft,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x - 10,
      y: myImageRect.y - 10,
      radius: 10,
      zIndex: 2
    })
    tlControl.cursor = 'nwse-resize'
    tlControl.dragStart = scaleControlDragStartHandler
    tlControl.dragMove = scaleControlDragMoveHandler
    tlControl.dragEnd = scaleControldragEndHandler

    const trControl = new ScaleControl({
      position: controlPosition.topRight,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x + myImageRect.width - 10,
      y: myImageRect.y - 10,
      radius: 10,
      zIndex: 2
    })
    trControl.cursor = 'nesw-resize'
    trControl.dragStart = scaleControlDragStartHandler
    trControl.dragMove = scaleControlDragMoveHandler
    trControl.dragEnd = scaleControldragEndHandler

    myImage.dragStart = () => {
      const displayObjects = getDisplayObjects()
      stageObjects.keysOfScaleControl.forEach((key) => {
        currentScaleControls[key] = displayObjects[key]
        currentScaleControlPreMatrixs[key] = displayObjects[key].value.getMatrix()
      })
      dragging = true
    }
    myImage.dragMove = (v2) => {
      if (dragging) {
        stageObjects.keysOfScaleControl.forEach((key) => {
          const currentScaleControl = currentScaleControls[key].value
          currentScaleControl.setMatrix(currentScaleControlPreMatrixs[key])
          currentScaleControl.translate(v2)
        })
      }
    }
    myImage.dragEnd = () => {
      editingImage = null
      currentScaleControlPreMatrixs = {}
      currentScaleControls = {}
      dragging = false
    }

    addToStage(myImage)
    addToStage(tlControl)
    addToStage(trControl)

    bindEvents()
    update()

    /*************************** 主程序用到的函数 *****************************/
    function scaleControlDragStartHandler () {
      const displayObjects = getDisplayObjects()
      editingImage = displayObjects[stageObjects.keysOfDraggableImage[0]] // 暂时只有一个图片
      currentImagePreMatrix = editingImage.value.getMatrix()
      stageObjects.keysOfScaleControl.forEach((key) => {
        currentScaleControls[key] = displayObjects[key]
        currentScaleControlPreMatrixs[key] = displayObjects[key].value.getMatrix()
      })
      dragging = true
    }
    function scaleControlDragMoveHandler (translation) {
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
        let v2 = [0, 0]
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
            v2[0] = isScaleUp ? -1 * dsB / 2 : dsB / 2
            v2[1] = v2[0]
            break
          // to do
          case controlPosition.left:
            break
          // to do
          case controlPosition.bottomLeft:
            break
          case controlPosition.topRight:
            dsB = Math.sqrt(ds * ds / 2) * 3
            if (isScaleUp) {
              newBWidth = bWidth + dsB
            } else {
              newBWidth = bWidth - dsB
            }
            scaleX = newBWidth / bWidth
            scale = [scaleX, scaleX]
            v2[0] = isScaleUp ? dsB / 2 : -1 * dsB / 2
            v2[1] = isScaleUp ? -1 * dsB / 2 : dsB / 2
            break
          // to do
          case controlPosition.right:
            break
          case controlPosition.bottomRight:
            break
          // to do
          case controlPosition.top:
            break
          // to do
          case controlPosition.bottom:
            break
          default:
            break
        }
        let controlTranslations = getScaleControlTranslations(v2, position)
        const editingImageObject = editingImage.value
        editingImageObject.setMatrix(currentImagePreMatrix)
        editingImageObject.translate([-1 * bCenter.x, -1 * bCenter.y]) // 设置画布旋转锚点中心
        editingImageObject.scale(scale)
        editingImageObject.translate([bCenter.x, bCenter.y]) // 恢复画布锚点中心

        stageObjects.keysOfScaleControl.forEach((key) => {
          const currentScaleControl = currentScaleControls[key].value
          currentScaleControl.setMatrix(currentScaleControlPreMatrixs[key])
          currentScaleControl.translate(controlTranslations[currentScaleControl.getPosition()])
        })
      }
    }
    function scaleControldragEndHandler () {
      editingImage = null
      currentImagePreMatrix = null
      currentScaleControlPreMatrixs = {}
      currentScaleControls = {}
      dragging = false
    }
    function getScaleControlTranslations (v2, position) {
      const controlTranslations = {}
      controlTranslations[position] = v2
      switch (position) {
        case controlPosition.topLeft:
          controlTranslations[controlPosition.topRight] = [-1 * v2[0], v2[1]]
          break
        case controlPosition.left:
          break
        case controlPosition.bottomLeft:
          break
        case controlPosition.topRight:
          controlTranslations[controlPosition.topLeft] = [-1 * v2[0], v2[1]]
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
      return controlTranslations
    }
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
