<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-picking.html
import { mat4 } from 'gl-matrix'
import { createFlattenedFunc, createSphereVertices, createCubeVertices, createTruncatedConeVertices } from '../../utils/tools/primitives'
import { createProgramInfo, setBuffersAndAttributes, setUniforms } from '../../utils/tools/web-gl'
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

    gl.enable(gl.DEPTH_TEST)

    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec4 a_color;

      uniform mat4 u_viewProjection;
      uniform mat4 u_world;

      varying vec4 v_color;

      void main() {
        // Multiply the position by the matrices
        gl_Position = u_viewProjection * u_world * a_position;

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

      void main() {
        gl_FragColor = v_color * u_colorMult;
      }
    `

    const pickVertexShaderCode = `
      attribute vec4 a_position;
      
      uniform mat4 u_viewProjection;
      uniform mat4 u_world;
      
      void main() {
        // Multiply the position by the matrices
        gl_Position = u_viewProjection * u_world * a_position;
      }
    `
    const pickFragmentShaderCode = `
      precision mediump float;
      
      uniform vec4 u_id;
      
      void main() {
        gl_FragColor = u_id;
      }
    `

    const createSphereWithVertexColorsBufferInfo = createFlattenedFunc(createSphereVertices)
    const createCubeWithVertexColorsBufferInfo = createFlattenedFunc(createCubeVertices)
    const createTruncatedConeWithVertexColorsBufferInfo = createFlattenedFunc(createTruncatedConeVertices)

    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    const sphereBufferInfo = createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6)
    const cubeBufferInfo = createCubeWithVertexColorsBufferInfo(gl, 20)
    const coneBufferInfo = createTruncatedConeWithVertexColorsBufferInfo(gl, 10, 0, 20, 12, 1, true, false)

    const shapes = [
      sphereBufferInfo,
      cubeBufferInfo,
      coneBufferInfo,
    ]

    // setup GLSL programs
    const mainProgramInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])
    const pickingProgramInfo = createProgramInfo(gl, [pickVertexShaderCode, pickFragmentShaderCode])

    function degToRad (d) {
      return d * Math.PI / 180
    }

    function rand (min, max) {
      if (max === undefined) {
        max = min
        min = 0
      }
      return min + Math.random() * (max - min)
    }

    // function emod (x, n) {
    //   return x >= 0 ? (x % n) : ((n - (-x % n)) % n)
    // }

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    const near = 1
    const far = 2000
    // const cameraHeight = 50

    const objectsToDraw = []
    const objects = []
    const viewProjectionMatrix = mat4.create()

    // Make infos for each object for each object.
    const baseHue = rand(0, 360)
    const numObjects = 200
    for (let ii = 0; ii < numObjects; ++ii) {
      const id = ii + 1
      const object = {
        uniforms: {
          u_colorMult: [rand(baseHue) / baseHue, rand(baseHue) / baseHue, rand(baseHue) / baseHue, 1],
          u_world: mat4.create(),
          u_viewProjection: viewProjectionMatrix,
          u_id: [
            ((id >> 0) & 0xFF) / 0xFF,
            ((id >> 8) & 0xFF) / 0xFF,
            ((id >> 16) & 0xFF) / 0xFF,
            ((id >> 24) & 0xFF) / 0xFF
          ]
        },
        translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
        xRotationSpeed: rand(0.8, 1.2),
        yRotationSpeed: rand(0.8, 1.2),
      }
      objects.push(object)
      objectsToDraw.push({
        programInfo: mainProgramInfo,
        bufferInfo: shapes[ii % shapes.length],
        uniforms: object.uniforms,
      })
    }

    // Create a texture to render to
    const targetTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, targetTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)

    function setFramebufferAttachmentSizes (width, height) {
      gl.bindTexture(gl.TEXTURE_2D, targetTexture)
      // define size and format of level 0
      const level = 0
      const internalFormat = gl.RGBA
      const border = 0
      const format = gl.RGBA
      const type = gl.UNSIGNED_BYTE
      const data = null
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border,
        format, type, data)

      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    }
    setFramebufferAttachmentSizes(1, 1)

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0
    const level = 0
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level)

    // make a depth buffer and the same size as the targetTexture
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)

    function computeMatrix (translation, xRotation, yRotation) {
      const matrix = mat4.create()
      mat4.fromTranslation(matrix, translation)
      mat4.rotateX(matrix, matrix, xRotation)
      mat4.rotateY(matrix, matrix, yRotation)
      return matrix
    }

    drawScene(0)

    function drawObjects (objectsToDraw, overrideProgramInfo) {
      objectsToDraw.forEach((object) => {
        const programInfo = overrideProgramInfo || object.programInfo
        const bufferInfo = object.bufferInfo

        gl.useProgram(programInfo.program)

        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, bufferInfo)

        // Set the uniforms.
        setUniforms(programInfo, object.uniforms)

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements)
      })
    }

    let mouseX = -1
    let mouseY = -1
    let oldPickNdx = -1
    let oldPickColor
    let frameCount = 0

    // Draw the scene.
    function drawScene (time) {
      time *= 0.0005
      ++frameCount

      // Compute the camera's matrix
      const cameraPosition = [0, 0, 100]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      // 2. Compute the view's matrix using look at directly.
      let viewMatrix = mat4.create()
      mat4.lookAt(viewMatrix, cameraPosition, target, up)

      // Compute the matrices for each object.
      objects.forEach(function (object) {
        object.uniforms.u_world = computeMatrix(
          object.translation,
          object.xRotationSpeed * time,
          object.yRotationSpeed * time)
      })
      // ------ Draw the objects to the texture --------

      // Figure out what pixel is under the mouse and setup
      // a frustum to render just that pixel

      {
        // compute the rectangle the near plane of our frustum covers
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        const top = Math.tan(fieldOfViewRadians * 0.5) * near
        const bottom = -top
        const left = aspect * bottom
        const right = aspect * top
        const width = Math.abs(right - left)
        const height = Math.abs(top - bottom)

        // compute the portion of the near plane covers the 1 pixel
        // under the mouse.
        const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth
        const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1

        const subLeft = left + pixelX * width / gl.canvas.width
        const subBottom = bottom + pixelY * height / gl.canvas.height
        const subWidth = 1 / gl.canvas.width
        const subHeight = 1 / gl.canvas.height

        // make a frustum for that 1 pixel
        const projectionMatrix = mat4.create()
        mat4.frustum(
          projectionMatrix,
          subLeft,
          subLeft + subWidth,
          subBottom,
          subBottom + subHeight,
          near,
          far)
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, 1, 1) // 1 像素离屏渲染，关键优化点

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      drawObjects(objectsToDraw, pickingProgramInfo)
      // read the 1 pixel
      const data = new Uint8Array(4)
      gl.readPixels(
        0,                 // x
        0,                 // y
        1,                 // width
        1,                 // height
        gl.RGBA,           // format
        gl.UNSIGNED_BYTE,  // type
        data)             // typed array to hold result
      const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24)

      // restore the object's color
      if (oldPickNdx >= 0) {
        const object = objects[oldPickNdx]
        object.uniforms.u_colorMult = oldPickColor
        oldPickNdx = -1
      }

      // highlight object under mouse
      if (id > 0) {
        const pickNdx = id - 1
        oldPickNdx = pickNdx
        const object = objects[pickNdx]
        oldPickColor = object.uniforms.u_colorMult
        object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1]
      }

      // ------ Draw the objects to the canvas

      {
        // Compute the projection matrix
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        const projectionMatrix = mat4.create()
        mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, near, far)
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix, )
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      drawObjects(objectsToDraw)

      animationID = requestAnimationFrame(drawScene)
    }

    gl.canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    })
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
