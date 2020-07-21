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
import BoundingRect from '../../utils/classes/BoundingRect'
import { getDomOffset } from '../../utils/tools'
import img from '../../assets/logo.png'
export default {
  data () {
    return {
      animationID: null
    }
  },
  computed: {
  },
  mounted () {
    const canvas = this.$refs.canvas
    const ctx = canvas.getContext('2d')
    const myImage = new DraggableImage(img, 150, 150, 200, 200)
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

    const getDisplayObjects = () => {
      const myImageBoundingRect = new BoundingRect(myImage.x, myImage.y, myImage.width, myImage.height)
      myImageBoundingRect.applyTransform(myImage.getMatrix())
      return {
        myImage: {
          key: 'myImage',
          value: myImage,
          boundingRect: myImageBoundingRect,
          bX: myImageBoundingRect.x,
          bY: myImageBoundingRect.y,
          bWidth: myImageBoundingRect.width,
          bHeight: myImageBoundingRect.height
        }
      }
    }

    const getHoverDisplayObject = () => {
      const { myImage } = getDisplayObjects()
      // console.log(tapPos)
      // console.log(myImage)
      if (tapPos.x > myImage.bX && tapPos.x < myImage.bX + myImage.bWidth && tapPos.y > myImage.bY && tapPos.y < myImage.bY + myImage.bHeight) {
        return myImage
      } else {
        return null
      }
    }

    const update = () => {
      const hoverDisplayObject = getHoverDisplayObject()
      // console.log(hoverDisplayObject)
      if (hoverDisplayObject && hoverDisplayObject.value.cursor) {
        canvas.style.cursor = hoverDisplayObject.value.cursor
      } else {
        canvas.style.cursor = 'auto'
      }

      myImage.draw(ctx)
      this.animationID = requestAnimationFrame(update)
    }

    bindEvents()
    update()
  },
  beforeDestroy () {
    cancelAnimationFrame(this.animationID)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.canvas {
  border: 1px dashed #ddd;
}
</style>
