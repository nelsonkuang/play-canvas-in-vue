<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-drawing-without-data.html
import { createProgram, loadShader, resizeCanvasToDisplaySize } from '../../utils/tools/web-gl'
// let animationID = null
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
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const vs = `
      attribute float vertexId;
      uniform float numVerts;
      uniform vec2 resolution;

      #define PI radians(180.0)

      void main() {
        float u = vertexId / numVerts;      // goes from 0 to 1
        float angle = u * PI * 2.0;         // goes from 0 to 2PI
        float radius = 0.8;

        vec2 pos = vec2(cos(angle), sin(angle)) * radius;
        
        float aspect = resolution.y / resolution.x;
        vec2 scale = vec2(aspect, 1);
        
        gl_Position = vec4(pos * scale, 0, 1);
        gl_PointSize = 5.0;
      }
    `
    const fs = `
      precision mediump float;

      void main() {
        gl_FragColor = vec4(1, 0, 0, 1);
      }
    `
    // setup a GLSL program
    const program = createProgram(gl, [loadShader(gl, vs, gl.VERTEX_SHADER), loadShader(gl, fs, gl.FRAGMENT_SHADER)])
    const vertexIdLoc = gl.getAttribLocation(program, 'vertexId')
    const numVertsLoc = gl.getUniformLocation(program, 'numVerts')
    const resolutionLoc = gl.getUniformLocation(program, 'resolution')

    // Make a buffer with just a count in it.

    const numVerts = 20
    const vertexIds = new Float32Array(numVerts)
    vertexIds.forEach((v, i) => {
      vertexIds[i] = i
    })

    const idBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertexIds, gl.STATIC_DRAW)

    // draw
    resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.useProgram(program)

    {
      // Turn on the attribute
      gl.enableVertexAttribArray(vertexIdLoc)

      // Bind the id buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer)

      // Tell the attribute how to get data out of idBuffer (ARRAY_BUFFER)
      const size = 1          // 1 components per iteration
      const type = gl.FLOAT   // the data is 32bit floats
      const normalize = false // don't normalize the data
      const stride = 0        // 0 = move forward size * sizeof(type) each iteration to get the next position
      const offset = 0        // start at the beginning of the buffer
      gl.vertexAttribPointer(
        vertexIdLoc, size, type, normalize, stride, offset)
    }

    // tell the shader the number of verts
    gl.uniform1f(numVertsLoc, numVerts)
    // tell the shader the resolution
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height)

    const offset = 0
    gl.drawArrays(gl.POINTS, offset, numVerts)

    // const update = () => {
    //   animationID = requestAnimationFrame(update)
    // }
    // update()
  },
  beforeDestroy () {
    // animationID && cancelAnimationFrame(animationID)
  }
}
</script>