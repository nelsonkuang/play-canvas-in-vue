<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: 
// https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skybox.html
// https://zhoyq.github.io/panoramic
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes, drawBufferInfo } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createCubeVertices } from '../../utils/tools/primitives'
const negXImg = './static/img/skybox/neg-x.jpg'
const negYImg = './static/img/skybox/neg-y.jpg'
const negZImg = './static/img/skybox/neg-z.jpg'
const posXImg = './static/img/skybox/pos-x.jpg'
const posYImg = './static/img/skybox/pos-y.jpg'
const posZImg = './static/img/skybox/pos-z.jpg'
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

    const skyboxVertexShaderCode = `
      attribute vec4 a_position;
      varying vec4 v_position;
      void main() {
        v_position = a_position;
        gl_Position = vec4(a_position.xy, 1, 1);
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const skyboxFragmentShaderCode = `
      precision mediump float;

      uniform samplerCube u_skybox;
      uniform mat4 u_viewDirectionProjectionInverse;

      varying vec4 v_position;
      void main() {
        vec4 t = u_viewDirectionProjectionInverse * v_position;
        gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
      }
    `

    // setup GLSL programs
    const skyboxProgramInfo = createProgramInfo(gl, [skyboxVertexShaderCode, skyboxFragmentShaderCode])

    // create buffers and fill with vertex data
    const createCubeBufferInfo = createBufferInfoFunc(createCubeVertices)
    const quadBufferInfo = createCubeBufferInfo(gl, 2)

    // Create a texture.
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

    const faceInfos = [
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        url: posXImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        url: negXImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        url: posYImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        url: negYImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        url: posZImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        url: negZImg,
      },
    ]

    faceInfos.forEach((faceInfo) => {
      const { target, url } = faceInfo

      // Upload the canvas to the cubemap face.
      const level = 0
      const internalFormat = gl.RGBA
      const width = 1024
      const height = 1024
      const format = gl.RGBA
      const type = gl.UNSIGNED_BYTE

      // setup each face so it's immediately renderable
      gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null)

      // Asynchronously load an image
      AsynLoadImage(url, (image) => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
        gl.texImage2D(target, level, internalFormat, format, type, image)
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
      })
    })
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

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

    const skyboxUniforms = {
      u_viewDirectionProjectionInverse: mat4.create(),
      u_skybox: texture
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
    // const cameraYRotation = degToRad(0)

    // let then = 0

    drawScene(0)

    // Draw the scene.
    function drawScene (time) {
      // Convert to seconds
      time *= 0.0001

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Compute the projection matrix
      const projectionMatrix = mat4.create()
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the camera's matrix
      // 相机在以原点为圆心直径2个单位的圆上看向原点
      const cameraPosition = [Math.cos(time) * 2, 0, Math.sin(time) * 2]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      // 2. Compute the view's matrix using look at directly.
      const viewDirectionMatrix = mat4.create()
      mat4.lookAt(viewDirectionMatrix, cameraPosition, target, up)

      // 我们只关心方向所以清除移动的部分
      viewDirectionMatrix[12] = 0
      viewDirectionMatrix[13] = 0
      viewDirectionMatrix[14] = 0

      const viewDirectionProjectionMatrix = mat4.create()
      mat4.multiply(viewDirectionProjectionMatrix,
        projectionMatrix, viewDirectionMatrix)
      mat4.invert(skyboxUniforms.u_viewDirectionProjectionInverse, viewDirectionProjectionMatrix)

      // draw the skybox

      // let our quad pass the depth test at 1.0
      gl.depthFunc(gl.LEQUAL)

      gl.useProgram(skyboxProgramInfo.program)

      setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo)

      setUniforms(skyboxProgramInfo, skyboxUniforms)

      drawBufferInfo(gl, quadBufferInfo)

      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
