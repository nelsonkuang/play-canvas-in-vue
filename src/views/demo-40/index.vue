<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo } from '../../utils/tools/web-gl'
import { createFlattenedFunc, createSphereVertices, createPlaneVertices, createCubeVertices } from '../../utils/tools/primitives'
import Camera from '../../utils/classes/Webgl/Camera'

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

      uniform vec4 u_colorMult;
      void main() {
        gl_FragColor = v_color * u_colorMult;
      }
    `
    const createSphereBufferInfo = createFlattenedFunc(createSphereVertices)
    const createPlaneBufferInfo = createFlattenedFunc(createPlaneVertices)
    const createCubeBufferInfo = createFlattenedFunc(createCubeVertices)
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

    function rand (min, max) {
      if (max === undefined) {
        max = min
        min = 0
      }
      return min + Math.random() * (max - min)
    }

    const uniformsThatAreComputedForAll = {
      u_view: null,
      u_projection: null,
      u_world: null,
      u_colorMult: null
    }
    const baseColorVal = 255
    const colors = [
      [rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, 0.9],
      [rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, 0.9],
      [rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, 0.9]
    ]

    let dX = 0
    let dY = 0
    let drag = false
    // let zoom = 1
    let pressedButton = null
    const camera = new Camera()
    // camera.aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight
    camera.fitViewToScene([-3, -3, -3], [3, 3, 3])
    camera.rotate(0, degToRad(-20)) // 修改相机初始角度
    camera.target = [0, 1, 0]
    camera.position = [0, 2, 10]
    camera.aspectRatio = gl.canvas.clientWidth / 2 / gl.canvas.clientHeight
    const camera2 = new Camera()
    // camera.aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight
    camera2.fitViewToScene([-3, -3, -3], [3, 3, 3])
    camera2.rotate(0, degToRad(-20)) // 修改相机初始角度
    camera2.target = [0, 1, 0]
    camera2.position = [0, 2, 10]
    camera2.aspectRatio = gl.canvas.clientWidth / 2 / gl.canvas.clientHeight
    // camera.updatePosition()
    const supportedTouch = window.hasOwnProperty('ontouchstart')

    // Draw the scene.
    function drawScene (time) {
      time = time * 0.0001 + 5
      {
        camera.updatePosition()
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height)
        // Clear the canvas AND the depth buffer.
        // gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        // Compute the projection matrix
        uniformsThatAreComputedForAll.u_projection = camera.projectionMatrix()
        uniformsThatAreComputedForAll.u_view = camera.viewMatrix()

        // draw the plane

        uniformsThatAreComputedForAll.u_world = mat4.create()
        uniformsThatAreComputedForAll.u_colorMult = colors[0]
        gl.useProgram(programInfo.program)
        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, planeBufferInfo)

        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)

        // calls gl.drawArrays or gl.drawElements
        drawBufferInfo(gl, planeBufferInfo)

        // draw the sphere

        uniformsThatAreComputedForAll.u_world = mat4.create()
        uniformsThatAreComputedForAll.u_colorMult = colors[1]
        mat4.translate(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, [-1.3, 1.01, 0])
        mat4.rotateY(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, -time)
        gl.useProgram(programInfo.program)
        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, sphereBufferInfo)

        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)

        // calls gl.drawArrays or gl.drawElements
        drawBufferInfo(gl, sphereBufferInfo)

        // draw the cube

        uniformsThatAreComputedForAll.u_world = mat4.create()
        uniformsThatAreComputedForAll.u_colorMult = colors[2]
        mat4.translate(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, [1.3, 1.1, 0])
        mat4.rotateY(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, time)
        gl.useProgram(programInfo.program)
        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, cubeBufferInfo)

        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)

        // calls gl.drawArrays or gl.drawElements
        drawBufferInfo(gl, cubeBufferInfo)
      }
      {
        camera2.updatePosition()
        // Tell WebGL how to convert from clip space to pixels
        // 参考引用: http://www.jiazhengblog.com/blog/2017/05/05/3142/#comments
        gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height)
        // Clear the canvas AND the depth buffer.
        // gl.clearColor(0, 0, 0, 1)
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        // gl.enable(gl.CULL_FACE)
        // gl.enable(gl.DEPTH_TEST)

        // Compute the projection matrix
        uniformsThatAreComputedForAll.u_projection = camera2.projectionMatrix()
        uniformsThatAreComputedForAll.u_view = camera2.viewMatrix()

        // draw the plane

        uniformsThatAreComputedForAll.u_world = mat4.create()
        uniformsThatAreComputedForAll.u_colorMult = colors[0]
        gl.useProgram(programInfo.program)
        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, planeBufferInfo)

        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)

        // calls gl.drawArrays or gl.drawElements
        drawBufferInfo(gl, planeBufferInfo)

        // draw the sphere

        uniformsThatAreComputedForAll.u_world = mat4.create()
        uniformsThatAreComputedForAll.u_colorMult = colors[1]
        mat4.translate(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, [-1.3, 1.01, 0])
        mat4.rotateY(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, -time)
        gl.useProgram(programInfo.program)
        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, sphereBufferInfo)

        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)

        // calls gl.drawArrays or gl.drawElements
        drawBufferInfo(gl, sphereBufferInfo)

        // draw the cube

        uniformsThatAreComputedForAll.u_world = mat4.create()
        uniformsThatAreComputedForAll.u_colorMult = colors[2]
        mat4.translate(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, [1.3, 1.1, 0])
        mat4.rotateY(uniformsThatAreComputedForAll.u_world, uniformsThatAreComputedForAll.u_world, time)
        gl.useProgram(programInfo.program)
        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, programInfo, cubeBufferInfo)

        // Set the uniforms that are the same for all objects.
        setUniforms(programInfo, uniformsThatAreComputedForAll)

        // calls gl.drawArrays or gl.drawElements
        drawBufferInfo(gl, cubeBufferInfo)
      }
      animationID = requestAnimationFrame(drawScene)
    }


    function updateCamera () {
      camera.updatePosition()
      camera2.updatePosition()
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
          camera2.rotate(dX, dY)
        } else if (pressedButton === 2) {
          camera.pan(dX, dY)
          camera2.pan(dX, dY)
        }
        updateCamera()
      }
      const mouseWheel = function (e) {
        if (Math.abs(e.deltaY) < 1.0) {
          return
        }

        canvas.style.cursor = 'none'
        camera.zoomIn(e.deltaY)
        camera2.zoomIn(e.deltaY)
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
    drawScene(0)
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>