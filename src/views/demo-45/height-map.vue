<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
// 参考引用：https://blog.csdn.net/qq_29814417/article/details/104911497
/* eslint-disable no-alert, no-console */
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo, resizeCanvasToDisplaySize } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createSphereVertices } from '../../utils/tools/primitives'
import Camera from '../../utils/classes/Webgl/Camera'
// import { makeStripeTexture, makeCheckerTexture, makeCircleTexture } from '../../utils/tools/texture'
const textureImg = './static/img/earth_1.jpg'
const textureHeightMapImg = './static/img/earth_1-height-map.jpg'

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
      precision mediump float; // 精度限制
      attribute vec4 a_position;
      attribute vec2 a_texcoord;
      varying vec4 v_color; // 用来存储当前顶点颜色
      varying vec2 v_uv; // UV
      uniform float u_height; // 生成的高度
      uniform float u_radius; // 半径
      uniform sampler2D u_heightMapTexture; // 高度图
      uniform mat4 u_modelViewMatrix;
      uniform mat4 u_projectionMatrix;
      // 插值计算
      float lerp(float x, float y, float t) {
        return (1.0 - t) * x + t * y;
      }
      // 获得当前向量与中心点的距离
      float glength(vec3 p) {
        return sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      }
      // 传入当前向量 需要返回的长度
      vec3 setLength(vec3 p, float length) {
        vec3 c_position = p;
        float scale = length / glength(c_position);
        c_position.x *= scale;
        c_position.y *= scale;
        c_position.z *= scale;
        return c_position;
      }
      void main() {
        v_uv = a_texcoord; // uv
        v_color = texture2D(u_heightMapTexture, a_texcoord); // 生成当前高度信息
        float c_height = v_color.r * u_height; // 生成当前的高度 当前的灰度 r 值 * 基础高度
        vec3 vposition = setLength(a_position.xyz, u_radius + c_height); // 生成新的向量 离中心距离为当前基础半径 + 生成的高度
        // 传递 position
        vec4 mPosition = u_modelViewMatrix * vec4(vposition, 1.0); 
        gl_Position = u_projectionMatrix * mPosition;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float; // 精度限制
      uniform float u_opacity; // 透明度
      uniform vec3 u_color; // 基础颜色
      varying vec2 v_uv; // UV
      uniform sampler2D u_mapTexture; // 基础材质
      void main() {
        gl_FragColor = vec4(u_color, u_opacity) * texture2D(u_mapTexture, v_uv);
      }
    `
    const createSphereBufferInfo = createBufferInfoFunc(createSphereVertices)
    const buffers = createSphereBufferInfo(gl, 1, 48, 32)

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    const mapTexture = gl.createTexture()
    const heightMapTexture = gl.createTexture()
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

    function loadImageForTexture (url, texture, gl) {
      AsynLoadImage(url, (img) => {
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
      })
    }

    loadImageForTexture(textureHeightMapImg, heightMapTexture, gl)
    loadImageForTexture(textureImg, mapTexture, gl)

    function degToRad (d) {
      return d * Math.PI / 180
    }

    function isPowerOf2 (value) {
      return (value & (value - 1)) === 0
    }

    const uniformsThatAreComputedForAll = {
      u_height: 0.2,
      u_radius: 1,
      u_heightMapTexture: heightMapTexture,
      u_opacity: 1.0,
      u_color: [1.0, 1.0, 1.0],
      u_mapTexture: mapTexture,
      u_modelViewMatrix: mat4.create(),
      u_projectionMatrix: mat4.create()
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

      // Compute the projection matrix
      uniformsThatAreComputedForAll.u_projectionMatrix = camera.projectionMatrix()
      uniformsThatAreComputedForAll.u_modelViewMatrix = camera.viewMatrix()

      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, buffers)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForAll)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, buffers)

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
    requestAnimationFrame(drawScene)
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
