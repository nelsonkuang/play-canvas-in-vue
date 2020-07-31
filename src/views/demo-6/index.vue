<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { rewriteGetContext, createProgram, loadShader } from '../../utils/tools/web-gl'
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
    const cWidth = window.innerWidth
    const cHeight = window.innerHeight
    canvas.setAttribute('width', `${cWidth}px`)
    canvas.setAttribute('height', `${cHeight}px`)
    // Get A WebGL context
    rewriteGetContext()
    const gl = canvas.getContext('webgl')
    const _2dVertexShader = `
    attribute vec2 a_position;

    uniform vec2 u_resolution;

    void main() {
      // convert the rectangle from pixels to 0.0 to 1.0
      vec2 zeroToOne = a_position / u_resolution;

      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;

      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;

      // gl_Position = vec4(clipSpace, 0, 1); // 矩阵位于底部边框
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); // 矩阵位于左上边框
    }
    `
    // 为片段着色器设计一个关于颜色的输入
    const _2dFragmentShader = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
    `
    // setup a GLSL program
    const program = createProgram(gl, [loadShader(gl, _2dVertexShader, gl.VERTEX_SHADER), loadShader(gl, _2dFragmentShader, gl.FRAGMENT_SHADER)])
    gl.useProgram(program)

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, 'a_position')

    // set the resolution
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    gl.uniform2f(resolutionLocation, cWidth, cHeight)

    const colorLocation = gl.getUniformLocation(program, 'u_color')

    // Create a buffer and put a single clipspace rectangle in
    // it (2 triangles)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // draw 50 random rectangles in random colors
    for (let ii = 0; ii < 50; ++ii) {
      // Setup a random rectangle
      setRectangle(gl, randomInt(400), randomInt(400), randomInt(600), randomInt(400))

      // Set a random color.
      gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1)

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt (range) {
      return Math.floor(Math.random() * range)
    }

    // Fills the buffer with the values that define a rectangle.
    function setRectangle (gl, x, y, width, height) {
      const x1 = x
      const x2 = x + width
      const y1 = y
      const y2 = y + height
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2]), gl.STATIC_DRAW)
    }

    // const update = () => {
    //   animationID = requestAnimationFrame(update)
    // }
    // update()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.canvas {
  background-color: #000;
}
</style>
