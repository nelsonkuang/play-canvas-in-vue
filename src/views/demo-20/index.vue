<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-drawing-multiple-things.html
import { mat4 } from 'gl-matrix'
import { createFlattenedFunc, createSphereVertices } from '../../utils/tools/primitives'
import { createProgramInfo, setBuffersAndAttributes, setUniforms } from '../../utils/tools/web-gl'
import VNode from '../../utils/classes/Webgl/VNode'
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
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec4 a_color;

      uniform mat4 u_matrix;

      varying vec4 v_color;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_matrix * a_position;

        // Pass the color to the fragment shader.
        v_color = a_color;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec4 v_color;

      uniform vec4 u_colorMult;
      uniform vec4 u_colorOffset;

      void main() {
        gl_FragColor = v_color * u_colorMult + u_colorOffset;
      }
    `

    const createSphereWithVertexColorsBufferInfo = createFlattenedFunc(createSphereVertices)

    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    const sphereBufferInfo = createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6)

    // setup GLSL programs
    const mainProgramInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // function rand (min, max) {
    //   if (max === undefined) {
    //     max = min
    //     min = 0
    //   }
    //   return min + Math.random() * (max - min)
    // }

    // function emod (x, n) {
    //   return x >= 0 ? (x % n) : ((n - (-x % n)) % n)
    // }

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    // const cameraHeight = 50

    // Let's make all the nodes
    const solarSystemNode = new VNode()
    const earthOrbitNode = new VNode()
    mat4.fromTranslation(earthOrbitNode.localMatrix, [100, 0, 0]) // earth orbit 100 units from the sun
    const moonOrbitNode = new VNode()
    mat4.fromTranslation(moonOrbitNode.localMatrix, [30, 0, 0]) // moon 30 units from the earth

    const sunNode = new VNode()
    mat4.fromScaling(sunNode.localMatrix, [5, 5, 5]) // sun a the center
    sunNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0, 1], // yellow
        u_colorMult: [0.4, 0.4, 0, 1],
        u_matrix: mat4.create()
      },
      programInfo: mainProgramInfo,
      bufferInfo: sphereBufferInfo,
    }

    const earthNode = new VNode()
    mat4.fromScaling(earthNode.localMatrix, [2, 2, 2])   // make the earth twice as large
    earthNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.5, 0.8, 1],  // blue-green
        u_colorMult: [0.8, 0.5, 0.2, 1],
        u_matrix: mat4.create()
      },
      programInfo: mainProgramInfo,
      bufferInfo: sphereBufferInfo,
    }

    const moonNode = new VNode()
    mat4.fromScaling(moonNode.localMatrix, [0.4, 0.4, 0.4])
    moonNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0.6, 1],  // gray
        u_colorMult: [0.1, 0.1, 0.1, 1],
        u_matrix: mat4.create()
      },
      programInfo: mainProgramInfo,
      bufferInfo: sphereBufferInfo,
    }

    // connect the celetial objects
    sunNode.setParent(solarSystemNode)
    earthOrbitNode.setParent(solarSystemNode)
    earthNode.setParent(earthOrbitNode)
    moonOrbitNode.setParent(earthOrbitNode)
    moonNode.setParent(moonOrbitNode)

    const objects = [
      sunNode,
      earthNode,
      moonNode,
    ]

    const objectsToDraw = [
      sunNode.drawInfo,
      earthNode.drawInfo,
      moonNode.drawInfo,
    ]

    drawScene()

    // Draw the scene.
    function drawScene () {
      // time *= 0.0005

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the camera's matrix
      const cameraPosition = [0, -200, 0]
      const target = [0, 0, 0]
      const up = [0, 0, 1]
      // 2. Compute the view's matrix using look at directly.
      let viewMatrix = mat4.create()
      mat4.lookAt(viewMatrix, cameraPosition, target, up)

      // Compute a view projection matrix
      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      // update the local matrices for each object.
      let out = mat4.create()
      mat4.multiply(earthOrbitNode.localMatrix, mat4.fromYRotation(out, 0.01), earthOrbitNode.localMatrix)
      mat4.multiply(moonOrbitNode.localMatrix, mat4.fromYRotation(out, 0.01), moonOrbitNode.localMatrix)
      
      // spin the sun
      mat4.multiply(sunNode.localMatrix, mat4.fromYRotation(out, 0.001), sunNode.localMatrix)
      // spin the earth
      mat4.multiply(earthNode.localMatrix, mat4.fromYRotation(out, 0.05), earthNode.localMatrix)
      // spin the moon
      mat4.multiply(moonNode.localMatrix, mat4.fromYRotation(out, -0.01), moonNode.localMatrix)

      // Update all world matrices in the scene graph
      solarSystemNode.updateWorldMatrix()

      // Compute all the matrices for rendering
      objects.forEach((object) => {
        mat4.multiply(object.drawInfo.uniforms.u_matrix, viewProjectionMatrix, object.worldMatrix)
      })

      // ------ Draw the objects --------

      let lastUsedProgramInfo = null
      let lastUsedBufferInfo = null

      objectsToDraw.forEach((object) => {
        const programInfo = object.programInfo
        const bufferInfo = object.bufferInfo
        let bindBuffers = false

        if (programInfo !== lastUsedProgramInfo) {
          lastUsedProgramInfo = programInfo
          gl.useProgram(programInfo.program)

          // We have to rebind buffers when changing programs because we
          // only bind buffers the program uses. So if 2 programs use the same
          // bufferInfo but the 1st one uses only positions the when the
          // we switch to the 2nd one some of the attributes will not be on.
          // 更换程序后要重新绑定缓冲，因为只需要绑定程序要用的缓冲。
          // 如果两个程序使用相同的bufferInfo但是第一个只用位置数据，
          // 当我们从第一个程序切换到第二个时，有些属性就不存在。
          bindBuffers = true
        }

        // Setup all the needed attributes.
        // 如果绘制的形状/几何体/顶点 是之前绘制过的，相同的参数就不必再设置一遍
        if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
          lastUsedBufferInfo = bufferInfo
          setBuffersAndAttributes(gl, programInfo, bufferInfo)
        }

        // Set the uniforms.
        setUniforms(programInfo, object.uniforms)

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements)
      })

      requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
