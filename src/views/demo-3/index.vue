<template>
  <div class="hello">
    <h1>{{ $route.meta.title }}</h1>
    <div class="container">
      <canvas id="canvas" ref="canvas" class="canvas" width="400" height="500"></canvas>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import DraggableImage from '../../utils/classes/Draggable/Image'
import ScaleControl, { controlPosition } from '../../utils/classes/Controls/Scale'
import RotateControl from '../../utils/classes/Controls/Rotate'
import BoundingRect from '../../utils/classes/BoundingRect'
import { getDomOffset } from '../../utils/tools'
import img from '../../assets/logo.jpg'
import rotateCtrImg from '../../assets/rotate.png'
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

    const supportedTouch = window.hasOwnProperty('ontouchstart')

    const bindEvents = () => {
      let isDraging = false
      let dragingObject = null
      const offset = getDomOffset(canvas)
      if (supportedTouch) {
        canvas.ontouchstart = function (event) {
          tapPos = {
            x: event.touches[0].pageX - offset.left,
            y: event.touches[0].pageY - offset.top
          }
          const hoverDisplayObject = getHoverDisplayObject()
          if (hoverDisplayObject) {
            isDraging = true
            dragingObject = hoverDisplayObject.value
            dragingObject.onDragStart && dragingObject.onDragStart(event, { ...tapPos }, offset)
          }
        }

        canvas.ontouchmove = function (event) {
          event.preventDefault()
          tapPos = {
            x: event.touches[0].pageX - offset.left,
            y: event.touches[0].pageY - offset.top
          }
          if (isDraging && dragingObject) {
            dragingObject.onDragMove && dragingObject.onDragMove(event, { ...tapPos }, offset)
          }
        }

        canvas.ontouchend = function () {
          dragingObject && dragingObject.onDragEnd && dragingObject.onDragEnd()
          isDraging = false
          dragingObject = null
        }
      } else {
        canvas.onmousedown = function (event) {
          tapPos = {
            x: event.pageX - offset.left,
            y: event.pageY - offset.top
          }
          const hoverDisplayObject = getHoverDisplayObject()
          if (hoverDisplayObject) {
            isDraging = true
            dragingObject = hoverDisplayObject.value
            dragingObject.onDragStart && dragingObject.onDragStart(event, { ...tapPos }, offset)
          }
        }

        canvas.onmousemove = function (event) {
          tapPos = {
            x: event.pageX - offset.left,
            y: event.pageY - offset.top
          }
          if (isDraging && dragingObject) {
            dragingObject.onDragMove && dragingObject.onDragMove(event, { ...tapPos }, offset)
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
    let editingImage
    let currentScaleControls = {}
    let currentRotateControl
    let currentImagePreAngle
    let currentControlLinearFunctions = {}
    let dragging = false

    const myImageRect = {
      x: 100,
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

    const tControl = new ScaleControl({
      position: controlPosition.top,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x + myImageRect.width / 2 - 10,
      y: myImageRect.y - 10,
      radius: 10,
      zIndex: 2
    })
    tControl.cursor = 'ns-resize'
    tControl.dragStart = scaleControlDragStartHandler
    tControl.dragMove = scaleControlDragMoveHandler
    tControl.dragEnd = scaleControldragEndHandler

    const rControl = new ScaleControl({
      position: controlPosition.right,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x + myImageRect.width - 10,
      y: myImageRect.y + myImageRect.height / 2 - 10,
      radius: 10,
      zIndex: 2
    })
    rControl.cursor = 'ew-resize'
    rControl.dragStart = scaleControlDragStartHandler
    rControl.dragMove = scaleControlDragMoveHandler
    rControl.dragEnd = scaleControldragEndHandler

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

    const bControl = new ScaleControl({
      position: controlPosition.bottom,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x + myImageRect.width / 2 - 10,
      y: myImageRect.y + myImageRect.height - 10,
      radius: 10,
      zIndex: 2
    })
    bControl.cursor = 'ns-resize'
    bControl.dragStart = scaleControlDragStartHandler
    bControl.dragMove = scaleControlDragMoveHandler
    bControl.dragEnd = scaleControldragEndHandler

    const blControl = new ScaleControl({
      position: controlPosition.bottomLeft,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x - 10,
      y: myImageRect.y + myImageRect.height - 10,
      radius: 10,
      zIndex: 2
    })
    blControl.cursor = 'nesw-resize'
    blControl.dragStart = scaleControlDragStartHandler
    blControl.dragMove = scaleControlDragMoveHandler
    blControl.dragEnd = scaleControldragEndHandler

    const brControl = new ScaleControl({
      position: controlPosition.bottomRight,
      fillStyle: '#fff',
      strokeStyle: '#f00',
      lineWidth: 1,
      x: myImageRect.x + myImageRect.width - 10,
      y: myImageRect.y + myImageRect.height - 10,
      radius: 10,
      zIndex: 2
    })
    brControl.cursor = 'nwse-resize'
    brControl.dragStart = scaleControlDragStartHandler
    brControl.dragMove = scaleControlDragMoveHandler
    brControl.dragEnd = scaleControldragEndHandler

    const rotateControl = new RotateControl(rotateCtrImg, myImageRect.x + myImageRect.width / 2 - 20, myImageRect.y - 40 - 20, 40, 40)

    myImage.dragStart = () => {
      const displayObjects = getDisplayObjects()
      stageObjects.keysOfScaleControl.forEach((key) => {
        currentScaleControls[key] = displayObjects[key]
      })
      currentRotateControl = displayObjects[stageObjects.keysOfRotateControl[0]].value
      dragging = true
    }
    myImage.dragMove = (scaleControlCenters, rotateControlCenter) => {
      if (dragging) {
        stageObjects.keysOfScaleControl.forEach((key) => {
          const scaleControl = currentScaleControls[key].value
          const v2 = scaleControlCenters[scaleControl.getPosition()]
          scaleControl.x = v2[0] - scaleControl.width / 2
          scaleControl.y = v2[1] - scaleControl.height / 2
        })
        currentRotateControl.x = rotateControlCenter[0] - currentRotateControl.width / 2
        currentRotateControl.y = rotateControlCenter[1] - currentRotateControl.height / 2
      }
    }
    myImage.dragEnd = () => {
      editingImage = null
      currentScaleControls = {}
      currentRotateControl = null
      dragging = false
    }

    rotateControl.dragStart = () => {
      const displayObjects = getDisplayObjects()
      editingImage = displayObjects[stageObjects.keysOfDraggableImage[0]] // 暂时只有一个图片
      currentImagePreMatrix = editingImage.value.getMatrix()
      currentImagePreAngle = editingImage.value.getAngle()
      stageObjects.keysOfScaleControl.forEach((key) => {
        currentScaleControls[key] = displayObjects[key]
      })
      currentRotateControl = displayObjects[stageObjects.keysOfRotateControl[0]].value
      dragging = true
    }

    rotateControl.dragMove = (translation) => {
      if (dragging) {
        const { bCenter } = editingImage
        const { x, y } = translation.to
        // y = kx + b
        // k = tanα
        // 倾斜角 α 是函数图像上某点的切线与 x 轴的夹角
        // 下面求 k：
        // bCenter.y = bCenter.x * k + b
        // y = x * k + b
        // => k = (y - bCenter.y) / (x - bCenter.x)
        let d = Math.sqrt((y - bCenter.y) ** 2 + (x - bCenter.x) ** 2)
        let dx = Math.abs(x - bCenter.x)
        let dy = Math.abs(y - bCenter.y)
        let angle
        if (x >= bCenter.x && y < bCenter.y) { // 右上
          angle = Math.asin(dx / d)
        } else if (x > bCenter.x && y >= bCenter.y) { // 右下
          angle = Math.asin(dy / d) + Math.PI / 2
          // console.log(angle)
        } else if (x <= bCenter.x && y > bCenter.y) { // 左下
          angle = Math.asin(dx / d) + Math.PI
        } else if (x <= bCenter.x && y <= bCenter.y) { // 左上
          angle = Math.asin(dy / d) + 1.5 * Math.PI
        }
        const editingImageObject = editingImage.value
        editingImageObject.setMatrix(currentImagePreMatrix)
        editingImageObject.translate([-1 * bCenter.x, -1 * bCenter.y]) // 设置画布旋转锚点中心
        editingImageObject.rotate(-1 * currentImagePreAngle)
        editingImageObject.rotate(angle)
        editingImageObject.translate([bCenter.x, bCenter.y]) // 恢复画布锚点中心
        editingImageObject.setAngle(angle)

        const scaleControlCenters = editingImageObject.getScaleControlCentersByV2()
        stageObjects.keysOfScaleControl.forEach((key) => {
          const scaleControl = currentScaleControls[key].value
          const v2 = scaleControlCenters[scaleControl.getPosition()]
          scaleControl.x = v2[0] - scaleControl.width / 2
          scaleControl.y = v2[1] - scaleControl.height / 2
        })
        const rotateControlCenter = editingImageObject.getRotateControlCenterByV2()
        currentRotateControl.x = rotateControlCenter[0] - currentRotateControl.width / 2
        currentRotateControl.y = rotateControlCenter[1] - currentRotateControl.height / 2
      }
    }

    rotateControl.dragEnd = () => {
      editingImage = null
      currentRotateControl = null
      currentImagePreMatrix = null
      currentScaleControls = {}
      currentImagePreAngle = null
      dragging = false
    }

    addToStage(myImage)
    addToStage(tlControl)
    addToStage(trControl)
    addToStage(lControl)
    addToStage(tControl)
    addToStage(rControl)
    addToStage(bControl)
    addToStage(brControl)
    addToStage(blControl)
    addToStage(rotateControl)

    bindEvents()
    update()

    /*************************** 主程序用到的函数 *****************************/
    function scaleControlDragStartHandler () {
      const displayObjects = getDisplayObjects()
      editingImage = displayObjects[stageObjects.keysOfDraggableImage[0]] // 暂时只有一个图片
      currentImagePreMatrix = editingImage.value.getMatrix()
      currentImagePreAngle = editingImage.value.getAngle()
      stageObjects.keysOfScaleControl.forEach((key) => {
        currentScaleControls[key] = displayObjects[key]
        currentControlLinearFunctions[displayObjects[key].value.getPosition()] = getCurrentControlLinearFunction(editingImage.bCenter, displayObjects[key].bCenter)
      })
      currentRotateControl = displayObjects[stageObjects.keysOfRotateControl[0]].value
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
            if (isScaleUp) {
              newBWidth = bWidth + dsB
              newBHeight = bHeight + dsB
            } else {
              newBWidth = bWidth - dsB
              newBHeight = bHeight - dsB
            }
            scaleX = newBWidth / bWidth
            scaleY = newBHeight / bWidth
            if (isScaleUp) {
              if (position === controlPosition.top || position === controlPosition.bottom) {
                scale = [1, Math.max(scaleX, scaleY)]
              } else {
                scale = [Math.max(scaleX, scaleY), 1]
              }
            } else {
              if (position === controlPosition.top || position === controlPosition.bottom) {
                scale = [1, Math.min(scaleX, scaleY)]
              } else {
                scale = [Math.min(scaleX, scaleY), 1]
              }
            }
            break
          default:
            break
        }
        const editingImageObject = editingImage.value
        editingImageObject.setMatrix(currentImagePreMatrix)
        editingImageObject.translate([-1 * bCenter.x, -1 * bCenter.y]) // 设置画布旋转锚点中心
        editingImageObject.rotate(-1 * currentImagePreAngle)
        editingImageObject.scale(scale)
        editingImageObject.rotate(currentImagePreAngle)
        editingImageObject.translate([bCenter.x, bCenter.y]) // 恢复画布锚点中心
        const scaleControlCenters = editingImageObject.getScaleControlCentersByV2()
        stageObjects.keysOfScaleControl.forEach((key) => {
          const scaleControl = currentScaleControls[key].value
          const v2 = scaleControlCenters[scaleControl.getPosition()]
          scaleControl.x = v2[0] - scaleControl.width / 2
          scaleControl.y = v2[1] - scaleControl.height / 2
        })
        const rotateControlCenter = editingImageObject.getRotateControlCenterByV2()
        currentRotateControl.x = rotateControlCenter[0] - currentRotateControl.width / 2
        currentRotateControl.y = rotateControlCenter[1] - currentRotateControl.height / 2
      }
    }
    function scaleControldragEndHandler () {
      editingImage = null
      currentRotateControl = null
      currentImagePreMatrix = null
      currentImagePreAngle = null
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
  display: block;
  margin: 0 auto;
}
</style>
