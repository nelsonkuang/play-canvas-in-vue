<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-2d-vs-3d-library.html
import { mat4, vec3 } from 'gl-matrix'
import { resizeCanvasToDisplaySize } from '../../utils/tools/web-gl'
let animationID = null
export default {
  data () {
    return {
    }
  },
  computed: {
  },
  mounted () {
    const cubeVertices = [
      -1, -1, -1,
      1, -1, -1,
      1, 1, -1,
      -1, 1, -1,
      -1, -1, 1,
      1, -1, 1,
      1, 1, 1,
      -1, 1, 1,
    ]
    const indices = [
      0, 1,
      1, 2,
      2, 3,
      3, 0,
      4, 5,
      5, 6,
      6, 7,
      7, 4,
      0, 4,
      1, 5,
      2, 6,
      3, 7,
    ]
    const canvas = this.$refs.canvas
    const ctx = canvas.getContext('2d')
    function render (time) {
      time *= 0.001
      const scale = 2
      resizeCanvasToDisplaySize(ctx.canvas, window.devicePixelRatio)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(canvas.width / scale, canvas.height / scale)
      ctx.lineWidth = scale / canvas.width
      ctx.strokeStyle = '#000'

      const fieldOfView = Math.PI * 1 / 4
      const aspect = canvas.clientWidth / canvas.clientHeight
      const projection = mat4.create()
      mat4.perspective(projection, fieldOfView, aspect, 1, 500)
      const radius = 5
      const cameraPosition = [
        Math.sin(time) * radius,
        -2,
        Math.cos(time) * radius]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      const view = mat4.create()
      mat4.lookAt(view, cameraPosition, target, up)
      const viewProjection = mat4.create()
      mat4.multiply(viewProjection, projection, view)
      drawLines(cubeVertices, indices, viewProjection)
      ctx.restore()
      animationID = requestAnimationFrame(render)
    }
    requestAnimationFrame(render)

    function drawLines (cubeVertices, indices, viewProjection) {
      ctx.beginPath()
      // transform points
      const points = []
      for (let ii = 0; ii < cubeVertices.length; ii += 3) {
        const point = vec3.create()
        vec3.transformMat4(point, [cubeVertices[ii + 0], cubeVertices[ii + 1], cubeVertices[ii + 2]], viewProjection)
        points.push(point)
      }
      for (let ii = 0; ii < indices.length; ii += 2) {
        const p0 = points[indices[ii + 0]]
        const p1 = points[indices[ii + 1]]
        ctx.moveTo(p0[0], p0[1])
        ctx.lineTo(p1[0], p1[1])
      }
      ctx.stroke()
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
<style scoped>
.canvas {
  width: 100%;
  height: 100%;
}
</style>

