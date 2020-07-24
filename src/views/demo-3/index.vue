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
    let currentControlLinearFunctions = {}
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

    const lControl = new ScaleControl({
      position: controlPosition.left,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x - 10,
      y: myImageRect.y + myImageRect.height / 2 - 10,
      radius: 10,
      zIndex: 2
    })
    lControl.cursor = 'ew-resize'
    lControl.dragStart = scaleControlDragStartHandler
    lControl.dragMove = scaleControlDragMoveHandler
    lControl.dragEnd = scaleControldragEndHandler

    myImage.dragStart = () => {
      const displayObjects = getDisplayObjects()
      stageObjects.keysOfScaleControl.forEach((key) => {
        currentScaleControls[key] = displayObjects[key]
        currentScaleControlPreMatrixs[key] = displayObjects[key].value.getMatrix()
      })
      dragging = true
    }
    myImage.dragMove = (scaleControlCenters) => {
      if (dragging) {
        stageObjects.keysOfScaleControl.forEach((key) => {
          const scaleControl = currentScaleControls[key].value
          const v2 = scaleControlCenters[scaleControl.getPosition()]
          scaleControl.x = v2[0] - scaleControl.width / 2
          scaleControl.y = v2[1] - scaleControl.height / 2
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
    addToStage(lControl)

    bindEvents()
    update()

    /*************************** 主程序用到的函数 *****************************/
    function scaleControlDragStartHandler () {
      const displayObjects = getDisplayObjects()
      editingImage = displayObjects[stageObjects.keysOfDraggableImage[0]] // 暂时只有一个图片
      currentImagePreMatrix = editingImage.value.getMatrix()
      stageObjects.keysOfScaleControl.forEach((key) => {
        currentScaleControls[key] = displayObjects[key]
        currentControlLinearFunctions[displayObjects[key].value.getPosition()] = getCurrentControlLinearFunction(editingImage.bCenter, displayObjects[key].bCenter)
        currentScaleControlPreMatrixs[key] = displayObjects[key].value.getMatrix()
      })
      dragging = true
    }
    function scaleControlDragMoveHandler (translation) {
      if (dragging) {
        const { bCenter, bWidth, bHeight } = editingImage
        const { from, to, position } = translation
        const dsFrom = Math.sqrt((from.x - bCenter.x) * (from.x - bCenter.x) + (from.y - bCenter.y) * (from.y - bCenter.y))
        const dsTo = Math.sqrt((to.x - bCenter.x) * (to.x - bCenter.x) + (to.y - bCenter.y) * (to.y - bCenter.y))
        const ds = dsTo - dsFrom
        const isScaleUp = ds > 0
        let newBWidth = 0
        let newBHeight = 0
        let dsB
        let scaleX = 1
        let scaleY = 1
        let scale = [1, 1]
        const { direction } = currentControlLinearFunctions[position]
        let absLdx
        switch (position) {
          case controlPosition.topLeft:
          case controlPosition.bottomLeft:
          case controlPosition.topRight:
          case controlPosition.bottomRight:
            dsB = Math.sqrt(ds * ds / 2) * 3 // 增加灵敏度
            if (isScaleUp) {
              newBWidth = bWidth + dsB
            } else {
              newBWidth = bWidth - dsB
            }
            scaleX = newBWidth / bWidth
            scale = [scaleX, scaleX]
            break
          case controlPosition.left:
          case controlPosition.right:
          case controlPosition.top:
          case controlPosition.bottom:
            dsB = Math.sqrt(ds * ds) * 2 // 增加灵敏度
            absLdx = Math.abs(direction.x)
            if (absLdx > 0.0001) {
              if (isScaleUp) {
                newBWidth = bWidth + dsB
              } else {
                newBWidth = bWidth - dsB
              }
            } else {
              if (isScaleUp) {
                newBHeight = bHeight + dsB
              } else {
                newBHeight = bHeight - dsB
              }
            }
            scaleX = newBWidth / bWidth
            scaleY = newBHeight / bWidth
            if (position === controlPosition.top || controlPosition.bottom) {
              scale = [scaleX || scaleY, 1]
            } else {
              scale = [1, scaleX || scaleY]
            }
            break
          default:
            break
        }
        const editingImageObject = editingImage.value
        editingImageObject.setMatrix(currentImagePreMatrix)
        editingImageObject.translate([-1 * bCenter.x, -1 * bCenter.y]) // 设置画布旋转锚点中心
        editingImageObject.scale(scale)
        editingImageObject.translate([bCenter.x, bCenter.y]) // 恢复画布锚点中心
        const scaleControlCenters = editingImageObject.getScaleControlCentersByV2()
        stageObjects.keysOfScaleControl.forEach((key) => {
          const scaleControl = currentScaleControls[key].value
          const v2 = scaleControlCenters[scaleControl.getPosition()]
          scaleControl.x = v2[0] - scaleControl.width / 2
          scaleControl.y = v2[1] - scaleControl.height / 2
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
    function getCurrentControlLinearFunction (p0, p1) {
      // y = kx + b
      // p0.y = k * p0.x + b
      // p1.y = k * p1.x + b
      // => k = (p0.x - p1.x) / (p0.y - p1.y)
      const k = (p0.x - p1.x) / (p0.y - p1.y)
      const b = p0.y - k * p0.x
      return {
        k: k,
        b: b,
        linearFunction: `y = ${k} * x + ${b}`,
        direction: {
          x: p1.x - p0.x,
          y: p1.y - p1.y
        }
      }
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
