<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createSphereVertices, createGridVertices, createCubeVertices } from '../../utils/tools/primitives'
import Camera from '../../utils/classes/Webgl/Camera'

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
    const colorVertexShaderCode = `
      attribute vec4 a_position;
      attribute vec4 a_color;

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_world;

      varying vec4 v_color;

      void main() {
        // Multiply the position by the matrices.
        gl_Position = u_projection * u_view * u_world * a_position;
        v_color = a_color;
      }
    `

    const colorFragmentShaderCode = `
      precision mediump float;

      varying vec4 v_color;
      void main() {
        gl_FragColor = v_color;
      }
    `
    const createSphereBufferInfo = createBufferInfoFunc(createSphereVertices)
    const createPlaneBufferInfo = createBufferInfoFunc(createGridVertices)
    const createCubeBufferInfo = createBufferInfoFunc(createCubeVertices)
    const sphereBufferInfo = createSphereBufferInfo(gl, 1, 32, 24)
    const planeBufferInfo = createPlaneBufferInfo(
      gl,
      10,  // width
      10,  // height
      20,   // subdivisions across
      20,   // subdivisions down
    )
    const cubeBufferInfo = createCubeBufferInfo(
      gl,
      2,  // size
    )
    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [colorVertexShaderCode, colorFragmentShaderCode])

    function degToRad (d) {
      return d * Math.PI / 180
    }

    const uniformsThatAreComputedForAll = {
      u_view: null,
      u_projection: null,
      u_world: null
    }

    let dX = 0
    let dY = 0
    let drag = false
    // let zoom = 1
    let pressedButton = null
    const camera = new Camera()
    camera.aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight
    camera.fitViewToScene([-2, -2, -2], [2, 2, 2])
    camera.rotate(0, degToRad(-20)) // 修改相机初始角度
    camera.target = [0, 1, 0]
    camera.position = [0, 2, 2]
    camera.updatePosition()
    const supportedTouch = window.hasOwnProperty('ontouchstart')

    // Draw the scene.
    function drawScene () {
      // time = time * 0.0001 + 5;
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Compute the projection matrix
      uniformsThatAreComputedForAll.u_projection = camera.projectionMatrix()
      uniformsThatAreComputedForAll.u_view = camera.viewMatrix()
      
      // draw the plane

      uniformsThatAreComputedForAll.u_world = mat4.create()
      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, planeBufferInfo)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForAll)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, planeBufferInfo)

      // draw the sphere

      uniformsThatAreComputedForAll.u_world = mat4.create()
      mat4.translate(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, [-1.5, 1, 0])
      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, sphereBufferInfo)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForAll)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, sphereBufferInfo)
      
      // draw the cube

      uniformsThatAreComputedForAll.u_world = mat4.create()
      mat4.translate(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, [1.5, 1, 0])
      mat4.rotateY(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, degToRad(45))
      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, cubeBufferInfo)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForAll)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, cubeBufferInfo)

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
    drawScene()
  },
  beforeDestroy () {
    // animationID && cancelAnimationFrame(animationID)
  }
}
</script>