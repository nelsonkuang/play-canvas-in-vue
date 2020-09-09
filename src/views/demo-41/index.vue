<template>
  <div class="list-wrap">
    <canvas id="canvas" ref="canvas" class="canvas"></canvas>
    <div id="content"></div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-multiple-views.html
import { mat4 } from 'gl-matrix'
import { createBufferInfoFunc, createSphereVertices, createTruncatedConeVertices, createCubeVertices } from '../../utils/tools/primitives'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo } from '../../utils/tools/web-gl'
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
    const cWidth = canvas.clientWidth
    const cHeight = canvas.clientHeight
    canvas.setAttribute('width', `${cWidth}px`)
    canvas.setAttribute('height', `${cHeight}px`)
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl) {
      return
    }

    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec3 a_normal;

      uniform mat4 u_matrix;

      varying vec3 v_color;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_matrix * a_position;

        // Pass the normal as the color to the fragment shader.
        v_color = a_normal * .5 + .5;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec3 v_color;

      void main() {
        gl_FragColor = vec4(v_color, 1);
      }
    `
    const createSphereBufferInfo = createBufferInfoFunc(createSphereVertices)
    const createTruncatedConeBufferInfo = createBufferInfoFunc(createTruncatedConeVertices)
    const createCubeBufferInfo = createBufferInfoFunc(createCubeVertices)

    // create buffers and fill with data for various things.
    const bufferInfos = [
      createCubeBufferInfo(
        gl,
        1,  // width
        1,  // height
        1,  // depth
      ),
      createSphereBufferInfo(
        gl,
        0.5,  // radius
        8,    // subdivisions around
        6,    // subdivisions down
      ),
      createTruncatedConeBufferInfo(
        gl,
        0.5,  // bottom radius
        0,    // top radius
        1,    // height
        6,    // subdivisions around
        1,    // subdivisions down
      ),
    ]

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    function createElem (type, parent, className) {
      const elem = document.createElement(type)
      parent.appendChild(elem)
      if (className) {
        elem.className = className
      }
      return elem
    }

    function randArrayElement (array) {
      return array[Math.random() * array.length | 0]
    }

    function rand (min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min
    }

    const contentElem = document.querySelector('#content')
    const items = []
    const numItems = 100
    for (let i = 0; i < numItems; ++i) {
      const outerElem = createElem('div', contentElem, 'item')
      const viewElem = createElem('div', outerElem, 'view')
      const labelElem = createElem('div', outerElem, 'label')
      labelElem.textContent = `Item ${i + 1}`
      const bufferInfo = randArrayElement(bufferInfos)
      const color = [rand(1), rand(1), rand(1), 1]
      items.push({
        bufferInfo,
        color,
        element: viewElem,
      })
    }

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    // const cameraHeight = 50

    // Draw the scene.
    function drawScene (projectionMatrix, cameraMatrix, worldMatrix, bufferInfo) {
      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Make a view matrix from the camera matrix.
      const viewMatrix = mat4.create()
      mat4.invert(viewMatrix, cameraMatrix)

      const viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      const worldViewProjectionMatrix = mat4.create()
      mat4.multiply(worldViewProjectionMatrix, viewProjectionMatrix, worldMatrix)

      gl.useProgram(programInfo.program)

      // ------ Draw the bufferInfo --------

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, bufferInfo)

      // Set the uniform
      setUniforms(programInfo, {
        u_matrix: worldViewProjectionMatrix,
      })

      drawBufferInfo(gl, bufferInfo)
    }

    // Draw the scene.
    function render (time) {
      time *= 0.001

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.SCISSOR_TEST)

      // move the canvas to top of the current scroll position
      gl.canvas.style.transform = `translateY(${window.scrollY}px)`

      for (const { bufferInfo, element, color } of items) {
        const rect = element.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > gl.canvas.clientHeight ||
          rect.right < 0 || rect.left > gl.canvas.clientWidth) {
          continue  // it's off screen
        }

        const width = rect.right - rect.left
        const height = rect.bottom - rect.top
        const left = rect.left
        const bottom = gl.canvas.clientHeight - rect.bottom - 1

        gl.viewport(left, bottom, width, height)
        gl.scissor(left, bottom, width, height)
        gl.clearColor(...color)

        const aspect = width / height
        const near = 1
        const far = 2000

        // Compute a perspective projection matrix
        const projectionMatrix = mat4.create()
        mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, near, far)

        // Compute the camera's matrix using look at.
        const cameraPosition = [0, 0, -2]
        const target = [0, 0, 0]
        const up = [0, 1, 0]
        const cameraMatrix = mat4.create()
        mat4.targetTo(cameraMatrix, cameraPosition, target, up)

        // rotate the item
        const rTime = time * 0.2
        const worldMatrix = mat4.create()
        mat4.fromYRotation(worldMatrix, rTime)
        mat4.rotateX(worldMatrix, worldMatrix, rTime)

        drawScene(projectionMatrix, cameraMatrix, worldMatrix, bufferInfo)
      }
      animationID = requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
<style>
.list-wrap {
  width: 100vw;
  height: 100vh;
  position: relative;
}
#canvas {
  position: absolute;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  display: block;
}
.item {
  display: inline-block;
  margin: 1em;
  padding: 1em;
}
.label {
  margin-top: 0.5em;
}
.view {
  width: 250px;
  height: 250px;
  border: 1px solid black;
}
</style>

