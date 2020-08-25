<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skybox.html
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes, createBufferInfoFromArrays } from '../../utils/tools/web-gl'
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
      attribute vec2 a_texcoord;

      uniform mat4 u_matrix;

      varying vec2 v_texcoord;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_matrix * a_position;

        // Pass the texcoord to the fragment shader.
        v_texcoord = a_texcoord;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec2 v_texcoord;

      // The texture.
      uniform sampler2D u_texture;
      uniform vec4 u_colorMult;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
      }
    `

    // a single triangle
    const arrays = {
      position: {
        numComponents: 3,
        data: [
          -0.5, -0.5, -0.5,
          -0.5, 0.5, -0.5,
          0.5, -0.5, -0.5,
          -0.5, 0.5, -0.5,
          0.5, 0.5, -0.5,
          0.5, -0.5, -0.5,

          -0.5, -0.5, 0.5,
          0.5, -0.5, 0.5,
          -0.5, 0.5, 0.5,
          -0.5, 0.5, 0.5,
          0.5, -0.5, 0.5,
          0.5, 0.5, 0.5,

          -0.5, 0.5, -0.5,
          -0.5, 0.5, 0.5,
          0.5, 0.5, -0.5,
          -0.5, 0.5, 0.5,
          0.5, 0.5, 0.5,
          0.5, 0.5, -0.5,

          -0.5, -0.5, -0.5,
          0.5, -0.5, -0.5,
          -0.5, -0.5, 0.5,
          -0.5, -0.5, 0.5,
          0.5, -0.5, -0.5,
          0.5, -0.5, 0.5,

          -0.5, -0.5, -0.5,
          -0.5, -0.5, 0.5,
          -0.5, 0.5, -0.5,
          -0.5, -0.5, 0.5,
          -0.5, 0.5, 0.5,
          -0.5, 0.5, -0.5,

          0.5, -0.5, -0.5,
          0.5, 0.5, -0.5,
          0.5, -0.5, 0.5,
          0.5, -0.5, 0.5,
          0.5, 0.5, -0.5,
          0.5, 0.5, 0.5,
        ]
      },
      texcoord: {
        numComponents: 2,
        data: [
          0, 0,
          0, 1,
          1, 0,
          0, 1,
          1, 1,
          1, 0,

          0, 0,
          0, 1,
          1, 0,
          1, 0,
          0, 1,
          1, 1,

          0, 0,
          0, 1,
          1, 0,
          0, 1,
          1, 1,
          1, 0,

          0, 0,
          0, 1,
          1, 0,
          1, 0,
          0, 1,
          1, 1,

          0, 0,
          0, 1,
          1, 0,
          0, 1,
          1, 1,
          1, 0,

          0, 0,
          0, 1,
          1, 0,
          1, 0,
          0, 1,
          1, 1,
        ]
      }
    }

    const bufferInfo = createBufferInfoFromArrays(gl, arrays)

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    {
      // fill texture with 3x2 pixels
      const level = 0
      const internalFormat = gl.LUMINANCE
      const width = 3
      const height = 2
      const border = 0
      const format = gl.LUMINANCE
      const type = gl.UNSIGNED_BYTE
      const data = new Uint8Array([
        128, 64, 128,
        0, 192, 0,
      ])
      const alignment = 1
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment)
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
        format, type, data)

      // set the filtering so we don't need mips and it's not filtered
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    // Create a texture to render to
    const targetTextureWidth = 256
    const targetTextureHeight = 256
    const targetTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, targetTexture)

    {
      // define size and format of level 0
      const level = 0
      const internalFormat = gl.RGBA
      const border = 0
      const format = gl.RGBA
      const type = gl.UNSIGNED_BYTE
      const data = null
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        targetTextureWidth, targetTextureHeight, border,
        format, type, data)

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0
    const level = 0
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level)

    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)

    // make a depth buffer and the same size as the targetTexture
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)

    const uniforms = {
      u_matrix: mat4.create(),
      u_texture: null,
      u_colorMult: [0, 0, 0, 0]
    }

    function degToRad (d) {
      return d * Math.PI / 180
    }
    // function isPowerOf2 (value) {
    //   return (value & (value - 1)) === 0
    // }

    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    // function randInt (range) {
    //   return Math.floor(Math.random() * range)
    // }

    const fieldOfViewRadians = degToRad(60)
    let modelXRotationRadians = degToRad(0)
    let modelYRotationRadians = degToRad(0)

    let then = 0

    drawScene(0)
    function drawCube (aspect, randerTexture) {
      // Compute the projection matrix
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the camera's matrix
      const cameraPosition = [0, 0, 2]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      // 2. Compute the view's matrix using look at directly.
      let viewMatrix = mat4.create()
      mat4.lookAt(viewMatrix, cameraPosition, target, up)

      // Compute a view projection matrix
      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      gl.useProgram(programInfo.program)

      for (let x = -1; x <= 1; ++x) {
        const modelMatrix = mat4.create()
        mat4.translate(modelMatrix, viewProjectionMatrix, [x * .9, 0, 0])
        mat4.rotateX(modelMatrix, modelMatrix, modelXRotationRadians * x)
        mat4.rotateY(modelMatrix, modelMatrix, modelYRotationRadians * x)
        mat4.copy(uniforms.u_matrix, modelMatrix)

        const c = x * .5 + .5
        uniforms.u_colorMult = [c, 1, 1 - c, 1]
        uniforms.u_texture = randerTexture

        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, bufferInfo)

        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniforms)

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 6 * 6)
      }
    }
    // Draw the scene.
    function drawScene (time) {
      // Convert to seconds
      time *= 0.001
      // Subtract the previous time from the current time
      const deltaTime = time - then

      // Remember the current time for the next frame.
      then = time

      // Animate the rotation
      modelYRotationRadians += -0.7 * deltaTime
      modelXRotationRadians += -0.4 * deltaTime

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      {
        // render to our targetTexture by binding the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

        // render cube with our 3x2 texture
        // gl.bindTexture(gl.TEXTURE_2D, texture)

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, targetTextureWidth, targetTextureHeight)

        // Clear the attachment(s).
        gl.clearColor(.5, .7, 1, 1)   // clear to blue
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        const aspect = targetTextureWidth / targetTextureHeight
        drawCube(aspect, texture)
      }

      {
        // render to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // render the cube with the texture we just rendered to
        // gl.bindTexture(gl.TEXTURE_2D, targetTexture)

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        // Clear the canvas AND the depth buffer.
        gl.clearColor(1, 1, 1, 1)   // clear to white
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)


        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        drawCube(aspect, targetTexture)
      }

      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
