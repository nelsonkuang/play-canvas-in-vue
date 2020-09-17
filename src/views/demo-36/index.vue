<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: 
// https://github.com/SunQiongqiong/panorama/blob/master/js/ballplay.js
// https://zhoyq.github.io/panoramic/panoramic.html
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createSphereVertices } from '../../utils/tools/primitives'
import Camera from '../../utils/classes/Webgl/Camera'
// import { makeStripeTexture, makeCheckerTexture, makeCircleTexture } from '../../utils/tools/texture'
const textureImg = './static/img/helipad.jpg'

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
    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;
      varying vec2 v_texcoord;
      uniform mat4 v_matrix;
      uniform mat4 p_matrix;
      void main(){
        gl_Position = p_matrix * v_matrix * a_position;
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
    const buffers = createSphereBufferInfo(gl, 1, 32, 24)
    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    const texture = gl.createTexture()
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      }

      drawScene()
    })

    function degToRad (d) {
      return d * Math.PI / 180
    }

    function isPowerOf2 (value) {
      return (value & (value - 1)) === 0
    }

    const uniformsThatAreComputedForTheSphere = {
      v_matrix: mat4.create(),
      p_matrix: mat4.create(),
      u_texture: texture
    }

    let dX = 0
    let dY = 0
    let drag = false
    // let zoom = 1
    let pressedButton = null
    const camera = new Camera()
    camera.aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight
    camera.fitViewToScene([-2, -2, -2], [2, 2, 2])
    camera.rotate(0, degToRad(-60)) // 修改相机初始角度
    camera.updatePosition()
    const supportedTouch = window.hasOwnProperty('ontouchstart')

    // Draw the scene.
    function drawScene () {
      // time = time * 0.0001 + 5;
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Compute the projection matrix
      uniformsThatAreComputedForTheSphere.p_matrix = camera.projectionMatrix()
      uniformsThatAreComputedForTheSphere.v_matrix = camera.viewMatrix()

      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, buffers)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForTheSphere)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, buffers)

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
        if (event.touches[1] == undefined) {// 单点触控
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
    // animationID && cancelAnimationFrame(animationID)
  }
}
</script>