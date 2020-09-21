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

    const pickVertexShaderCode = `
      attribute vec4 a_position;
      
      uniform mat4 v_matrix;
      uniform mat4 p_matrix;
      uniform mat4 m_matrix;
      
      void main() {
        gl_Position = p_matrix * v_matrix * m_matrix * a_position;
      }
    `
    const pickFragmentShaderCode = `
      precision mediump float;
      
      uniform vec4 u_id;
      
      void main() {
        gl_FragColor = u_id;
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
    const pickingProgramInfo = createProgramInfo(gl, [pickVertexShaderCode, pickFragmentShaderCode])

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
    const textTextures = Object.keys(countries).map((text, index) => {
      const id = index + 1
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
        latitude: countries[text][1],
        id: [
          ((id >> 0) & 0xFF) / 0xFF,
          ((id >> 8) & 0xFF) / 0xFF,
          ((id >> 16) & 0xFF) / 0xFF,
          ((id >> 24) & 0xFF) / 0xFF
        ],
        mouseOver: false
      }
    })

    // console.log(textTextures)

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
      u_texture: null,
      u_id: null
    }

    let dX = 0
    let dY = 0
    let mouseX = -1
    let mouseY = -1
    let drag = false
    let oldPickNdx = -1
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

      // Figure out what pixel is under the mouse and setup
      // a frustum to render just that pixel

      {
        // compute the rectangle the near plane of our frustum covers
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        const top = Math.tan(camera.yFov * 0.5) * camera.zNear
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
          camera.zNear,
          camera.zFar)
        uniformsThatAreComputedForAll.p_matrix = projectionMatrix
        uniformsThatAreComputedForAll.v_matrix = camera.viewMatrix()
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, 1, 1) // 1 像素离屏渲染，关键优化点


      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 0, 0) // 如果使用 1 像素离屏渲染，最好把颜色及透明度全部清 0 以免遗留透明度值导致计算 id 出错
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // setup to draw the text.
      gl.useProgram(pickingProgramInfo.program)

      setBuffersAndAttributes(gl, pickingProgramInfo, textBufferInfo)

      textTextures.forEach((textTexture) => {
        const { id, width, height, latitude, longitude } = textTexture
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
        uniformsThatAreComputedForAll.u_id = id
        // Set the uniforms that are the same for all objects.
        setUniforms(pickingProgramInfo, uniformsThatAreComputedForAll)
        drawBufferInfo(gl, textBufferInfo)
      })

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
        const object = textTextures[oldPickNdx]
        object && (object.mouseOver = false)
        oldPickNdx = -1
      }

      // highlight object under mouse
      if (id > 0) {
        const pickNdx = id - 1
        oldPickNdx = pickNdx
        const object = textTextures[pickNdx]
        object && (object.mouseOver = true)
      }

      // ------ Draw the objects to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
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
        const { texture, width, height, latitude, longitude, mouseOver } = textTexture
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
        let desiredTextScale = modelMatrix[14] < 0 ? 1 / gl.canvas.height : -1 / gl.canvas.height // 使用坐标 z 的值来判断比例，实现 1 像素最优文字显示
        desiredTextScale = mouseOver ? desiredTextScale * 2 : desiredTextScale
        mat4.scale(modelMatrix, modelMatrix, [width * desiredTextScale, height * desiredTextScale, 1])
        uniformsThatAreComputedForAll.m_matrix = modelMatrix
        uniformsThatAreComputedForAll.u_texture = texture
        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)
        drawBufferInfo(gl, textBufferInfo)
      })

      animationID = requestAnimationFrame(drawScene)
    }


    function updateCamera () {
      camera.updatePosition()

      // drawScene()
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
        const rect = canvas.getBoundingClientRect()
        mouseX = e.clientX - rect.left
        mouseY = e.clientY - rect.top
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
        oldX = e.touches[0].pageX
        oldY = e.touches[0].pageY
        e.preventDefault()
        return false
      }

      const touchEnd = function () {
        drag = false
      }

      const touchMove = function (e) {
        if (!drag) return false
        e.preventDefault()
        if (event.touches[1] == undefined) { // 单点触控
          dX = (e.touches[0].pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
          dY = (e.touches[0].pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
          oldX = e.touches[0].pageX
          oldY = e.touches[0].pageY
          camera.rotate(dX, dY)
          updateCamera()
        } else {
          currentDistance = Math.sqrt(Math.pow(e.touches[1].pageX - e.touches[0].pageX, 2) + Math.pow(e.touches[1].pageY - e.touches[0].pageY, 2))
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
