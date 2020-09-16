<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo, resizeCanvasToDisplaySize } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createSphereVertices, createPlaneVertices } from '../../utils/tools/primitives'
import { countries } from '../../../static/js/world-data'
import { generateTextCanvas } from '../../utils/tools/texture'
import Camera from '../../utils/classes/Webgl/Camera'
// import { makeStripeTexture, makeCheckerTexture, makeCircleTexture } from '../../utils/tools/texture'
const textureImg = './static/img/earth.jpg'

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
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;
      varying vec2 v_texcoord;
      uniform mat4 v_matrix;
      uniform mat4 p_matrix;
      uniform mat4 m_matrix;
      void main(){
        gl_Position = p_matrix * v_matrix * m_matrix * a_position;
        // Pass the texture coord to the fragment shader.
        v_texcoord = a_texcoord;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float; // 精度限制
      varying vec2 v_texcoord;
      uniform sampler2D u_texture;
      void main(){
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `
    const createSphereBufferInfo = createBufferInfoFunc(createSphereVertices)
    const buffers = createSphereBufferInfo(gl, 1, 48, 32)

    // Create a unit quad for the 'text'
    const createPlaneBufferInfo = createBufferInfoFunc(createPlaneVertices)
    const matrix = mat4.create()
    mat4.rotateX(matrix, matrix, Math.PI / 2)
    const textBufferInfo = createPlaneBufferInfo(gl, 1, 1, 1, 1, matrix)
    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    const mapTexture = gl.createTexture()
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true) // 将纹理图片反转

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

    AsynLoadImage(textureImg, (img) => {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, mapTexture)
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      }

      drawScene()
    })

    // create text textures
    const textTextures = Object.keys(countries).map((text) => {
      const textCanvas = generateTextCanvas({
        text,
        width: 500,
        height: 50,
        fillStyle: '#ffffff',
        font: '700 22px "Hiragino Sans GB W3","Microsoft YaHe","宋体","sans-serif"'
      }, {
        shadowBlur: 5,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowColor: '#333',
      })
      const textWidth = textCanvas.width
      const textHeight = textCanvas.height
      const textTex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, textTex)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas)
      // make sure we can render it even if it's not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return {
        texture: textTex,
        width: textWidth,
        height: textHeight,
        longitude: countries[text][0],
        latitude: countries[text][1]
      }
    })

    function degToRad (d) {
      return d * Math.PI / 180
    }

    function isPowerOf2 (value) {
      return (value & (value - 1)) === 0
    }

    const uniformsThatAreComputedForAll = {
      v_matrix: mat4.create(),
      p_matrix: mat4.create(),
      m_matrix: null,
      u_texture: null
    }

    let dX = 0
    let dY = 0
    let drag = false
    // let zoom = 1
    let pressedButton = null
    const camera = new Camera()
    camera.aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight
    camera.fitViewToScene([-1.2, -1.2, -1.2], [1.2, 1.2, 1.2])
    camera.rotate(0, degToRad(0)) // 修改相机初始角度
    camera.updatePosition()
    const supportedTouch = window.hasOwnProperty('ontouchstart')

    // Draw the scene.
    function drawScene () {
      // time = time * 0.0001 + 5;
      // Tell WebGL how to convert from clip space to pixels
      resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)
      gl.depthMask(true)

      // Compute the projection matrix
      uniformsThatAreComputedForAll.p_matrix = camera.projectionMatrix()
      uniformsThatAreComputedForAll.v_matrix = camera.viewMatrix()
      uniformsThatAreComputedForAll.m_matrix = mat4.create()
      uniformsThatAreComputedForAll.u_texture = mapTexture

      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, buffers)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForAll)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, buffers)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.depthMask(false)

      // setup to draw the text.
      gl.useProgram(programInfo.program)

      setBuffersAndAttributes(gl, programInfo, textBufferInfo)

      textTextures.forEach((textTexture) => {
        const { texture, width, height, latitude, longitude } = textTexture
        const radius = 1
        const modelMatrix = mat4.create()
        let zRotation = longitude > 0 ? 180 : 0
        // webgl 的思维有点不一样，要反着来[关键点]：
        // 正常想法是１、文字移动到 [0, 0, radius] -> ２、绕 x 轴转纬度 -> ３、绕 y 轴转经度
        // 实际写法是３、绕 y 轴转经度 -> ２、绕 x 轴转纬度 -> １、文字移动到 [0, 0, radius]
        mat4.rotateY(modelMatrix, modelMatrix, degToRad(longitude - 90)) // 初始时文字是放在 90 度的位置（法向量 0, 0, 1），要转回 0 （本初子午线，英国附近）开始处，所以要减 90
        mat4.rotateX(modelMatrix, modelMatrix, degToRad(-latitude)) // 绕 x 轴，往里转为要减相应的 latitude，因此要加 “-” 号
        mat4.rotateZ(modelMatrix, modelMatrix, degToRad(zRotation)) // 经度为负的话内容看上去上反面倒过来了，要旋 180 度看上去才是正面
        mat4.translate(modelMatrix, modelMatrix, [0, 0, radius])
        // Get the text's position from the matrix we computed
        const desiredTextScale = modelMatrix[14] < 0 ? 1 / gl.canvas.height : -1 / gl.canvas.height // 使用坐标 z 的值来判断比例，实现 1 像素最优文字显示
        mat4.scale(modelMatrix, modelMatrix, [width * desiredTextScale, height * desiredTextScale, 1])
        uniformsThatAreComputedForAll.m_matrix = modelMatrix
        uniformsThatAreComputedForAll.u_texture = texture
        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)
        drawBufferInfo(gl, textBufferInfo)
      })

      // animationID = requestAnimationFrame(drawScene)
    }


    function updateCamera () {
      camera.updatePosition()

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
        pressedButton = e.button
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
        if (pressedButton === 0) {
          camera.rotate(dX, dY)
        } else if (pressedButton === 2) {
          camera.pan(dX, dY)
        }
        updateCamera()
      }
      const mouseWheel = function (e) {
        if (Math.abs(e.deltaY) < 1.0) {
          return
        }

        canvas.style.cursor = 'none'
        camera.zoomIn(e.deltaY)
        updateCamera()
      }

      canvas.addEventListener('mousedown', mouseDown, false)
      canvas.addEventListener('mouseup', mouseUp, false)
      canvas.addEventListener('mouseout', mouseUp, false)
      canvas.addEventListener('mousemove', mouseMove, false)
      canvas.addEventListener('wheel', mouseWheel, false)
      canvas.oncontextmenu = function (event) {
        event.preventDefault()
      }
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
          camera.rotate(dX, dY)
          updateCamera()
        } else {
          currentDistance = Math.sqrt(Math.pow(e.changedTouches[1].pageX - e.changedTouches[0].pageX, 2) + Math.pow(e.changedTouches[1].pageY - e.changedTouches[0].pageY, 2))
          camera.zoomIn(startDistance - currentDistance)
          startDistance = currentDistance
          updateCamera()
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
<style scoped>
.canvas {
  width: 100%;
  height: 100%;
  min-height: 99.99vh;
}
</style>
