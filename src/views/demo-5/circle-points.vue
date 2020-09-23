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
      attribute float vertexId; // 顶点 id 0 ~ 8 * 3 * 20 - 1
      uniform float numVerts; // 顶点数 8 * 3 * 20
      uniform vec2 resolution; // 分辨率 [x, y] 代表 [width, height]

      #define PI radians(180.0) // 用预编译指令定义常量

      const float numTrianglesPerCircle = 8.0; // 每个圈分成 8 份，即 8 个三角形
      const float numVertsPerCircle = numTrianglesPerCircle * 3.0; // 每个圈总共有 24 个点构成

      vec2 computeCircleTriangleVertex(float vertexId) { // 计算每个子圈顶点
        // 原本只需一个圈要处理 float angleU = triVertexNdx / numTrianglesPerCircle;
        // 但每个圈总共有 8 个三角形，即 24 个点构成，因此，float angleU = edge / numTrianglesPerCircle;  // 0.0 to 1.0
        float triangleId = floor(vertexId / 3.0); // 第几个三角形 0 ~ 8 * 20 - 1
        float triVertexNdx = mod(vertexId, 3.0); // 三角形的第几个顶点 0 1 2 0 1 2 ...
        float edge = triVertexNdx + triangleId;
        float angleU = edge / numTrianglesPerCircle;  // 0.0 to 1.0
        float angle = angleU * PI * 2.0; // 当前的角度
        float radius = step(triVertexNdx, 1.5); // 三角形顶点 0, 1, 2，顶点索引如果是 0, 1 半径为 0，顶点索引 2 为 1
        // => 
        // function step(a, b) {
        //   return a < b ? 0 : 1;
        // }
        return vec2(cos(angle), sin(angle)) * radius; 
        // vertexIndex 0, 1, ?2, 1, 2, ?3, 2, 3, ?4, ...
        // vertexId    0, 1, 2,  3, 4,  5, 6, 7, 8
      }

      void main() {
        float circleId = floor(vertexId / numVertsPerCircle); // 第几个圈
        float numCircles = numVerts / numVertsPerCircle; // 总共有多少个圈

        float u = circleId / numCircles;    // goes from 0 to 1 // 20 分之 n，因为总共有 20 个圆
        float angle = u * PI * 2.0;         // goes from 0 to 2PI // 当前圈的角度
        float radius = 0.8; // 定义外部大圆的半径

        vec2 pos = vec2(cos(angle), sin(angle)) * radius; // 计算出每个圆的圆心位置

        vec2 triPos = computeCircleTriangleVertex(vertexId) * 0.05;
        
        float aspect = resolution.y / resolution.x;
        vec2 scale = vec2(aspect, 1);
        
        gl_Position = vec4((pos + triPos) * scale, 0, 1);
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

    const numVerts = 8 * 3 * 20;
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
    gl.drawArrays(gl.TRIANGLES, offset, numVerts)

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