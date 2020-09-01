<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: 
// https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skybox.html
// https://zhoyq.github.io/panoramic
import { mat4, vec3 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes, drawBufferInfo } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createCubeVertices } from '../../utils/tools/primitives'
const negXImg = './static/img/skybox/neg-x.jpg'
const negYImg = './static/img/skybox/neg-y.jpg'
const negZImg = './static/img/skybox/neg-z.jpg'
const posXImg = './static/img/skybox/pos-x.jpg'
const posYImg = './static/img/skybox/pos-y.jpg'
const posZImg = './static/img/skybox/pos-z.jpg'
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

    const imgs = []

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
        imgs.push(image)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
        gl.texImage2D(target, level, internalFormat, format, type, image)
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
        if (imgs.length === 6) {
          gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
          drawScene()
        }
      })
    })

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

    const originCameraPosition = vec3.fromValues(0, 0, 2)
    let cameraPosition = vec3.fromValues(0, 0, 2)
    const target = vec3.fromValues(0, 0, 0)
    const up = vec3.fromValues(0, 1, 0)
    const fieldOfViewRadians = degToRad(60)
    let theta = 0 // x 方向
    let phi = 0 // y 方向
    let dX = 0
    let dY = 0
    let drag = false
    let zoom = 1
    const supportedTouch = window.hasOwnProperty('ontouchstart')

    // Draw the scene.
    function drawScene () {

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Compute the projection matrix
      const projectionMatrix = mat4.create()
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the camera's matrix
      // 相机在以原点为圆心直径2个单位的圆上看向原点
      // const cameraPosition = [Math.cos(time) * 2, 0, Math.sin(time) * 2]
      // 2. Compute the view's matrix using look at directly.
      const viewDirectionMatrix = mat4.create()
      mat4.lookAt(viewDirectionMatrix, cameraPosition, target, up)

      // 我们只关心方向所以清除移动的部分
      // viewDirectionMatrix[12] = 0
      // viewDirectionMatrix[13] = 0
      // viewDirectionMatrix[14] = 0

      const viewDirectionProjectionMatrix = mat4.create()
      mat4.multiply(viewDirectionProjectionMatrix, projectionMatrix, viewDirectionMatrix)
      mat4.invert(skyboxUniforms.u_viewDirectionProjectionInverse, viewDirectionProjectionMatrix)

      // draw the skybox

      // let our quad pass the depth test at 1.0
      gl.depthFunc(gl.LEQUAL)

      gl.useProgram(skyboxProgramInfo.program)

      setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo)

      setUniforms(skyboxProgramInfo, skyboxUniforms)

      drawBufferInfo(gl, quadBufferInfo)

      // animationID = requestAnimationFrame(drawScene)
    }
    function zoomInCamera (delta) {
      if (delta > 0) {
        zoom *= 1.04
      } else {
        zoom /= 1.04
      }
    }
    function rotateCamera (dx, dy) {
      const phiMax = Math.PI / 2 - 0.01
      theta += dx
      phi += dy
      phi = Math.min(Math.max(phi, - Math.PI / 2), phiMax)
    }
    function updateCamera () {
      // modelRotation = [phi, theta]
      vec3.copy(cameraPosition, originCameraPosition)
      vec3.rotateX(cameraPosition, cameraPosition, target, phi)
      vec3.rotateY(cameraPosition, cameraPosition, target, theta)
      vec3.scale(cameraPosition, cameraPosition, zoom)

      drawScene()
    }
    /* ================= Mouse events ====================== */
    function bindMouseEvents () {
      let oldX = 0
      let oldY = 0

      const mouseDown = function (e) {
        e.preventDefault()
        drag = true
        oldX = e.pageX
        oldY = e.pageY
        return false
      }

      const mouseUp = function () {
        drag = false
      }

      const mouseMove = function (e) {
        if (!drag) {
          canvas.style.cursor = 'grab'
          return
        }
        e.preventDefault()
        dX = (e.pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
        dY = (e.pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
        oldX = e.pageX
        oldY = e.pageY
        rotateCamera(dX, dY)
        updateCamera()
      }
      const mouseWheel = function (e) {
        if (Math.abs(e.deltaY) < 1.0) {
          return
        }

        canvas.style.cursor = 'none'
        zoomInCamera(e.deltaY)
        updateCamera()
      }

      canvas.addEventListener('mousedown', mouseDown, false)
      canvas.addEventListener('mouseup', mouseUp, false)
      canvas.addEventListener('mouseout', mouseUp, false)
      canvas.addEventListener('mousemove', mouseMove, false)
      canvas.addEventListener('wheel', mouseWheel, false)
    }
    /* ================= Touch events ====================== */
    function bindTouchEvents () {
      let oldX = 0
      let oldY = 0
      let currentDistance = 0
      let startDistance = 0

      const touchStart = function (e) {
        drag = true
        oldX = e.changedTouches[0].pageX
        oldY = e.changedTouches[0].pageY
        e.preventDefault()
        return false
      }

      const touchEnd = function () {
        drag = false
      }

      const touchMove = function (e) {
        if (!drag) return false
        e.preventDefault()
        if (event.changedTouches[1] == undefined) {// 单点触控
          dX = (e.changedTouches[0].pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
          dY = (e.changedTouches[0].pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
          oldX = e.changedTouches[0].pageX
          oldY = e.changedTouches[0].pageY
          rotateCamera(dX, dY)
          updateCamera()
        } else {
          currentDistance = Math.sqrt(Math.pow(e.changedTouches[1].pageX - e.changedTouches[0].pageX, 2) + Math.pow(e.changedTouches[1].pageY - e.changedTouches[0].pageY, 2))
          zoomInCamera(startDistance - currentDistance)
          startDistance = currentDistance
        }
      }

      canvas.addEventListener('touchstart', touchStart, false)
      canvas.addEventListener('touchend', touchEnd, false)
      canvas.addEventListener('touchmove', touchMove, false)
    }

    supportedTouch ? bindTouchEvents() : bindMouseEvents()
  },
  beforeDestroy () {
    // animationID && cancelAnimationFrame(animationID)
  }
}
</script>
