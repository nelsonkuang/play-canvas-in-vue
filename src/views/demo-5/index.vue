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

    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
    `
    const _2dFragmentShader = `
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1);  // green
    }
    `
    // setup a GLSL program
    const program = createProgram(gl, [loadShader(gl, _2dVertexShader, gl.VERTEX_SHADER), loadShader(gl, _2dFragmentShader, gl.FRAGMENT_SHADER)])
    gl.useProgram(program)

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, 'a_position')

    // Create a buffer and put a single clipspace rectangle in
    // it (2 triangles)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0]),
      gl.STATIC_DRAW)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, 6)

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
