<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-textures.html
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes, createBufferInfoFromArrays } from '../../utils/tools/web-gl'
import boxTextureImg from '../../assets/box-texture.jpg'
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

      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
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
          0.5, 0.5, 0.5
        ]
      },
      texcoord: {
        numComponents: 2,
        data: [
          // 选择左下图
          0, 0,
          0, 0.5,
          0.25, 0,
          0, 0.5,
          0.25, 0.5,
          0.25, 0,
          // 选择中下图
          0.25, 0,
          0.5, 0,
          0.25, 0.5,
          0.25, 0.5,
          0.5, 0,
          0.5, 0.5,
          // 选择中右图
          0.5, 0,
          0.5, 0.5,
          0.75, 0,
          0.5, 0.5,
          0.75, 0.5,
          0.75, 0,
          // 选择左上图
          0, 0.5,
          0.25, 0.5,
          0, 1,
          0, 1,
          0.25, 0.5,
          0.25, 1,
          // 选择中上图
          0.25, 0.5,
          0.25, 1,
          0.5, 0.5,
          0.25, 1,
          0.5, 1,
          0.5, 0.5,
          // 选择右上图
          0.5, 0.5,
          0.75, 0.5,
          0.5, 1,
          0.5, 1,
          0.75, 0.5,
          0.75, 1
        ]
      }
    }

    const bufferInfo = createBufferInfoFromArrays(gl, arrays)

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])
    // Create a texture.
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]))

    function AsynLoadImage (url, cb) {
      const img = new Image()
      img.src = url
      if (img.complete) {
        cb(img)
        return
      }
      img.onload = function () {
        img.onload = null
        cb(img)
        return
      }
      img.onerror = function () {
        img.onerror = null
        cb(img)
      }
    }

    AsynLoadImage(boxTextureImg, (img) => {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      // Check if the image is a power of 2 in both dimensions.
      if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D)
      } else {
        // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      }
    })

    const uniformsThatAreComputedForTheBox = {
      u_matrix: mat4.create(),
      u_texture: texture
    }

    function degToRad (d) {
      return d * Math.PI / 180
    }
    function isPowerOf2 (value) {
      return (value & (value - 1)) === 0
    }

    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    // function randInt (range) {
    //   return Math.floor(Math.random() * range)
    // }

    const rotation = [degToRad(0), degToRad(0)]
    const fieldOfViewRadians = degToRad(60)

    let then = 0

    drawScene(0)

    // Draw the scene.
    function drawScene (now) {
      // Convert to seconds
      now *= 0.001
      // Subtract the previous time from the current time
      const deltaTime = now - then
      // Remember the current time for the next frame.
      then = now

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      // Every frame increase the rotation a little.
      rotation[1] += -0.7 * deltaTime
      rotation[0] += -0.4 * deltaTime

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)
      gl.depthMask(true)

      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
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

      const matrix = mat4.create()
      mat4.rotateX(matrix, viewProjectionMatrix, rotation[0])
      mat4.rotateY(matrix, matrix, rotation[1])
      mat4.copy(uniformsThatAreComputedForTheBox.u_matrix, matrix)

      gl.useProgram(programInfo.program)

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, bufferInfo)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForTheBox)

      // Draw the geometry.
      gl.drawArrays(gl.TRIANGLES, 0, 6 * 6)

      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
