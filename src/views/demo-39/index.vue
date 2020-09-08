<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: 
// https://webglfundamentals.org/webgl/lessons/webgl-ramp-textures.html
import { mat4, vec3 } from 'gl-matrix'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo, createBufferInfoFromArrays } from '../../utils/tools/web-gl'
import Camera from '../../utils/classes/Webgl/Camera'
import headData from '../../../static/models/headdata/headdata'

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
      attribute vec3 a_normal;

      uniform mat4 u_worldViewProjection;
      uniform mat4 u_worldInverseTranspose;

      varying vec3 v_normal;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_worldViewProjection * a_position;

        // orient the normals and pass to the fragment shader
        v_normal = mat3(u_worldInverseTranspose) * a_normal;
      }
    `

    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec3 v_normal;

      uniform vec3 u_reverseLightDirection;
      uniform vec4 u_color;
      uniform sampler2D u_ramp;
      uniform vec2 u_rampSize;
      uniform float u_linearAdjust; // 1.0 if linear, 0.0 if nearest

      void main() {
        // because v_normal is a varying it's interpolated
        // so it will not be a unit vector. Normalizing it
        // will make it a unit vector again
        vec3 normal = normalize(v_normal);

        float cosAngle = dot(normal, u_reverseLightDirection);

        // convert from -1 <-> 1 to 0 <-> 1
        float u = cosAngle * 0.5 + 0.5;

        // make a texture coordinate
        vec2 uv = vec2(u, 0.5);

        // scale to size of ramp
        vec2 texelRange = uv * (u_rampSize - u_linearAdjust);

        // offset by half a texel and convert to texture coordinate
        vec2 rampUV = (texelRange + u_linearAdjust * 0.5) / u_rampSize;

        // lookup a value from a 1d texture
        vec4 rampColor = texture2D(u_ramp, rampUV);

        gl_FragColor = u_color * rampColor;
      }
    `

    const arrays = {
      position: {
        numComponents: 3,
        data: headData.positions
      },
      normal: {
        numComponents: 3,
        data: headData.normals
      }
    }

    const bufferInfo = createBufferInfoFromArrays(gl, arrays)

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    // make a 256 array where elements 0 to 127
    // go from 64 to 191 and elements 128 to 255
    // are all 255.
    const smoothSolid = new Array(256).fill(255)
    for (let i = 0; i < 128; ++i) {
      smoothSolid[i] = 64 + i
    }

    const ramps = [
      {
        name: 'dark-white', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 255]
      },
      {
        name: 'dark-white-skewed', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 80, 80, 255, 255]
      },
      {
        name: 'normal', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: true,
        data: [0, 255]
      },
      {
        name: '3-step', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 160, 255]
      },
      {
        name: '4-step', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 140, 200, 255]
      },
      {
        name: '4-step skewed', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 80, 80, 80, 140, 200, 255]
      },
      {
        name: 'black-white-black', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 255, 80]
      },
      {
        name: 'stripes', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255]
      },
      {
        name: 'stripe', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
      },
      {
        name: 'smooth-solid', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
        data: smoothSolid
      },
      {
        name: 'rgb', color: [1, 1, 1, 1], format: gl.RGB, filter: true,
        data: [255, 0, 0, 0, 255, 0, 0, 0, 255]
      },
    ];

    const elementsForFormat = {}
    elementsForFormat[gl.LUMINANCE] = 1
    elementsForFormat[gl.RGB] = 3

    ramps.forEach((ramp) => {
      const {/* name, */ format, filter, data } = ramp
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      const width = data.length / elementsForFormat[format]
      gl.texImage2D(
        gl.TEXTURE_2D,     // target
        0,                 // mip level
        format,            // internal format
        width,
        1,                 // height
        0,                 // border
        format,            // format
        gl.UNSIGNED_BYTE,  // type
        new Uint8Array(data))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter ? gl.LINEAR : gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter ? gl.LINEAR : gl.NEAREST)
      ramp.texture = tex
      ramp.size = [width, 1]
    })

    function degToRad (d) {
      return d * Math.PI / 180
    }

    const uniformsThatAreComputed = {
      u_worldViewProjection: mat4.create(),
      u_worldInverseTranspose: mat4.create(),
      u_color: null,
      u_ramp: null,
      u_rampSize: null,
      u_linearAdjust: null,
      u_reverseLightDirection: null
    }

    let yRotation = degToRad(10)
    const rampIndex = 2 // 有 10 种阴影模式，0 开始，第 2 种为正常阴影

    let dX = 0
    let dY = 0
    let drag = false
    // let zoom = 1
    let pressedButton = null
    const camera = new Camera()
    camera.aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight
    // camera.zNear = 1
    // camera.zFar = 50
    // camera.target = [0, 0, 0]
    // camera.position = [0, 0, 20]
    camera.fitViewToScene([-12, -12, -12], [12, 12, 12])
    camera.rotate(0, degToRad(-45)) // 修改相机初始角度
    camera.updatePosition()
    const supportedTouch = window.hasOwnProperty('ontouchstart')

    // Draw the scene.
    function drawScene (time) {
      time = time * 0.0001 + 5;
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      // Clear the canvas AND the depth buffer.
      // gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Compute the projection matrix
      const projection = camera.projectionMatrix()
      const view = camera.viewMatrix()

      const viewProjection = mat4.create()
      mat4.multiply(viewProjection, projection, view)

      const world = mat4.create()
      yRotation = time
      mat4.fromYRotation(world, yRotation)

      mat4.multiply(uniformsThatAreComputed.u_worldViewProjection, viewProjection, world)

      const worldInverse = mat4.create()
      mat4.invert(worldInverse, world)

      mat4.transpose(uniformsThatAreComputed.u_worldInverseTranspose, worldInverse)

      {
        const { texture, color, size, filter } = ramps[rampIndex]
        uniformsThatAreComputed.u_color = color
        let v3 = vec3.create()
        vec3.normalize(v3, [-1.75, 0.7, 1])
        uniformsThatAreComputed.u_reverseLightDirection = v3
        uniformsThatAreComputed.u_ramp = texture
        uniformsThatAreComputed.u_rampSize = size
        uniformsThatAreComputed.u_linearAdjust = filter ? 1 : 0
      }

      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, bufferInfo)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputed)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, bufferInfo)
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
    requestAnimationFrame(drawScene)
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>