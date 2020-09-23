<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-drawing-without-data.html
import { createProgramInfo, resizeCanvasToDisplaySize, createUniformSetters, createAttributeSetters, setAttributes, setUniforms } from '../../utils/tools/web-gl'
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
    // Get A WebGL context
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const vs = `
      attribute float vertexId; // 顶点 id 0 ~ 8 * 3 * 20 - 1
      uniform float numVerts; // 顶点数 8 * 3 * 20
      uniform vec2 resolution; // 分辨率 [x, y] 代表 [width, height]
      uniform float time;

      const float PI = radians(180.0); // 原本用预编译指令定义常量，但手机不支持

      const float numTrianglesPerCircle = 8.0; // 每个圈分成 8 份，即 8 个三角形
      const float numVertsPerCircle = numTrianglesPerCircle * 3.0; // 每个圈总共有 24 个点构成

      // hash function from https://www.shadertoy.com/view/4djSRW
      // given a value between 0 and 1
      // returns a value between 0 and 1 that *appears* kind of random
      float hash(float p) {
        vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
        p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
        return fract(p2.x * p2.y * 95.4337);
      }

      vec2 computeCircleTriangleVertex(float vertexId) { // 计算每个子圈顶点
        // 原本只需一个圈要处理 float angleU = triVertexNdx / numTrianglesPerCircle;
        // 但每个圈总共有 8 个三角形，即 24 个点构成，因此，float angleU = edge / numTrianglesPerCircle;  // 0.0 to 1.0
        float triangleId = floor(vertexId / 3.0); // 第几个三角形 0 ~ 8 * 20 - 1
        float triVertexNdx = mod(vertexId, 3.0); // 三角形的第几个顶点 0 1 2 0 1 2 ...
        // float edge = mod(triVertexNdx + triangleId, numTrianglesPerCircle); // 这样才能保证下面是 0.0 to 1.0，但没关系，不求余也可以，因为角度超过 360 度也会周期性计算，无所谓
        float edge = triVertexNdx + triangleId;
        float angleU = edge / numTrianglesPerCircle;  // 0.0 to 超过 1.0
        float angle = angleU * PI * 2.0; // 当前的角度
        float radius = step(triVertexNdx, 1.5); // 三角形顶点 0, 1, 2，顶点索引如果是 0, 1 半径为 1，顶点索引 2 为 0
        // => 
        // function step(a, b) {
        //   return a < b ? 1 : 0;
        // }
        return vec2(cos(angle), sin(angle)) * radius; 
        // vertexIndex 0, 1, ?2, 1, 2, ?3, 2, 3, ?4, ...
        // vertexId    0, 1, 2,  3, 4,  5, 6, 7, 8, 9, 10, 11
      }

      void main() {
        float circleId = floor(vertexId / numVertsPerCircle); // 第几个圈
        float numCircles = numVerts / numVertsPerCircle; // 总共有多少个圈

        float u = circleId / numCircles;    // goes from 0 to 1 // 20 分之 n，因为总共有 20 个圆
        float off = floor(time + u) / 1000.0;   // changes once per second per vertex
        float x = hash(u + off) * 2.0 - 1.0;    // random position
        float y = fract(time + u) * -2.0 + 1.0; // 1.0 ->  -1.0
        vec2 pos = vec2(x, y);

        vec2 triPos = computeCircleTriangleVertex(vertexId) * 0.01;
        
        float aspect = resolution.x / resolution.y;
        vec2 scale = vec2(aspect, 1);
        
        gl_Position = vec4((pos + triPos) * scale, 0, 1);
      }
    `
    const fs = `
      precision mediump float;

      void main() {
        gl_FragColor = vec4(0, 0, 1, 1);
      }
    `
    // setup a GLSL program
    const programInfo = createProgramInfo(gl, [vs, fs])
    const program = programInfo.program

    const numVerts = 8 * 3 * 100;
    const vertexIds = new Float32Array(numVerts)
    vertexIds.forEach((v, i) => {
      vertexIds[i] = i
    })

    const idBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertexIds, gl.STATIC_DRAW)

    const uniformSetters = createUniformSetters(gl, program)
    const attribSetters = createAttributeSetters(gl, program)
    const attribs = {
      vertexId: { buffer: idBuffer, numComponents: 1, }
    }

    const uniforms = {
      numVerts: numVerts,
      resolution: [gl.canvas.width, gl.canvas.height],
      time: 0
    }

    // draw
    function render (time) {
      time *= 0.001;  // convert to seconds
      resizeCanvasToDisplaySize(gl.canvas)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      gl.useProgram(program)

      setAttributes(attribSetters, attribs)

      uniforms.time = time
      setUniforms(uniformSetters, uniforms)

      const offset = 0
      gl.drawArrays(gl.TRIANGLES, offset, numVerts)

      animationID = requestAnimationFrame(render)
    }
    render(0)
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
  min-height: 99.99vh;
}
</style>