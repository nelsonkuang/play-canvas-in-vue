<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import {  mat4, vec3/*, vec2  
  mat3 */} from 'gl-matrix'
import { createBufferInfoFromArrays, createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo, resizeCanvasToDisplaySize } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createGridVertices, createCubeVertices } from '../../utils/tools/primitives'
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
    let uid = 0
    let mathMin = Math.min
    let mathMax = Math.max
    canvas.setAttribute('width', `${cWidth}px`)
    canvas.setAttribute('height', `${cHeight}px`)
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const colorVertexShaderCode = `
      attribute vec4 a_position;

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_world;

      void main() {
        // Multiply the position by the matrices.
        gl_Position = u_projection * u_view * u_world * a_position;
      }
    `

    const colorFragmentShaderCode = `
      precision mediump float;

      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `

    const createPlaneBufferInfo = createBufferInfoFunc(createGridVertices)
    const createCubeBufferInfo = createBufferInfoFunc(createCubeVertices)
    const planeBufferInfo = createPlaneBufferInfo(
      gl,
      20,  // width
      20,  // height
      40,   // subdivisions across
      40,   // subdivisions down
    )
    const cubeBufferInfo = createCubeBufferInfo(
      gl,
      1,  // size
    )

    const geometries = [
      {
        uid: ++uid,
        bufferInfo: cubeBufferInfo,
        uniforms: {
          u_world: mat4.create(),
          u_color: [1, 0.5, 0.5, 1],
          u_projection: mat4.create(),
          u_view: mat4.create()
        },
        isSelected: false,
        boundingRect: function () {
          const k = 0.5
          let cornerVertices = [
            [-k, -k, -k],
            [+k, -k, -k],
            [-k, +k, -k],
            [+k, +k, -k],
            [-k, -k, +k],
            [+k, -k, +k],
            [-k, +k, +k],
            [+k, +k, +k],
          ]
          cornerVertices = cornerVertices.map((point) => {
            const mvpMatrix = mat4.create()
            mat4.multiply(mvpMatrix, this.uniforms.u_projection, this.uniforms.u_view)
            mat4.multiply(mvpMatrix, mvpMatrix, this.uniforms.u_world)
            vec3.transformMat4(point, point, mvpMatrix)
            return [point[0], point[1]]
          })
          let minX = Infinity
          let minY = Infinity
          let maxX = -Infinity
          let maxY = -Infinity
          cornerVertices.forEach((point) => {
            minX = mathMin(minX, point[0])
            minY = mathMin(minY, point[1])
            maxX = mathMax(maxX, point[0])
            maxY = mathMax(maxY, point[1])
          })
          return {
            topLeft: [minX, maxY],
            topRight: [maxX, maxY],
            bottomLeft: [minX, minY],
            bottomRight: [maxX, minX],
            minX,
            minY,
            maxX,
            maxY,
            contain: function (x, y) {
              console.log('point', [x, y])
              return x >= this.minX
                && x <= this.maxX
                && y >= this.minY
                && y <= this.maxY
            }
          }
        }
      }
    ]
    // console.log(geometries[0].computeBBox())

    const linesBufferInfo = []

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [colorVertexShaderCode, colorFragmentShaderCode])

    // function degToRad (d) {
    //   return d * Math.PI / 180
    // }
    const random = Math.random

    const uniformsThatAreComputedForLines = {
      u_view: null,
      u_projection: null,
      u_world: null,
      u_color: null
    }

    let currentLine = []
    let currentPoint = [-1, -1]

    let dX = 0
    let dY = 0
    let mouseX = -1
    let mouseY = -1
    // let oldMouseX = -1
    // let oldMouseY = -1
    let drag = false
    // let zoom = 1
    let pressedButton = null
    const camera = new Camera()
    camera.aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight
    // camera.fitViewToScene([-2, -2, -2], [2, 2, 2])
    // camera.rotate(0, degToRad(-20)) // 修改相机初始角度
    // camera.target = [0, 1, 0]
    // camera.position = [0, 2, 2]
    camera.updatePosition()
    const supportedTouch = window.hasOwnProperty('ontouchstart')

    function genLine (mx, my) {
      const coordFrom = vec3.fromValues(mx / gl.canvas.clientWidth * 2 - 1, -(my / gl.canvas.clientHeight) * 2 + 1, 1)
      const coordTo = vec3.create()
      const projectionMatrixInverse = mat4.create()
      const worldMatrix = camera.worldMatrix()
      mat4.invert(projectionMatrixInverse, camera.projectionMatrix())
      vec3.transformMat4(coordTo, coordFrom, projectionMatrixInverse)
      vec3.transformMat4(coordTo, coordTo, worldMatrix)
      // vec3.transformMat4(coordTo, coordTo, projectionMatrixInverse)
      // vec3.transformMat4(coordTo, coordTo, worldMatrix)

      currentLine = [
        ...coordTo,
        // ...coordTo
        0, 0, 0
      ]

      currentPoint = [coordFrom[0], coordFrom[1]]

      const lineArrs = {
        position: {
          numComponents: 3,
          data: currentLine
        },
        indices: {
          numComponents: 2,
          data: [
            0, 1
          ]
        },
      }
      linesBufferInfo.push(createBufferInfoFromArrays(gl, lineArrs))
    }
    function getInterseced () {
      geometries.forEach((item) => {
        item.isSelected = false
        const bRect = item.boundingRect()
        if (bRect.contain(currentPoint[0], currentPoint[1])) {
          item.isSelected = true
        }
        console.log('bRect', bRect)
      })
    }
    // Draw the scene.
    function drawScene () {
      // time = time * 0.0001 + 5;
      // Tell WebGL how to convert from clip space to pixels
      resizeCanvasToDisplaySize(gl.canvas)
      // ------ Draw the objects to the canvas
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.CULL_FACE)

      // Compute the projection matrix
      uniformsThatAreComputedForLines.u_projection = camera.projectionMatrix()
      uniformsThatAreComputedForLines.u_view = camera.viewMatrix()

      // draw the plane
      uniformsThatAreComputedForLines.u_world = mat4.create()
      uniformsThatAreComputedForLines.u_color = [0.8, 0.8, 0.8, 1]
      gl.useProgram(programInfo.program)
      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, planeBufferInfo)
      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForLines)
      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, planeBufferInfo, gl.LINES)

      uniformsThatAreComputedForLines.u_color = [random(), random(), random(), 1]
      linesBufferInfo.forEach((lineBufferInfo) => {
        // gl.useProgram(programInfo.program)
        setBuffersAndAttributes(gl, programInfo, lineBufferInfo)
        setUniforms(programInfo, uniformsThatAreComputedForLines)
        drawBufferInfo(gl, lineBufferInfo, gl.LINES)
      })

      // draw the geometries
      geometries.forEach((item) => {
        item.uniforms.u_color = item.isSelected ? [0.5, 0.25, 0.25, 1] : [1, 0.5, 0.5, 1]
        mat4.copy(item.uniforms.u_projection, uniformsThatAreComputedForLines.u_projection)
        mat4.copy(item.uniforms.u_view, uniformsThatAreComputedForLines.u_view)
        // gl.useProgram(programInfo.program)
        setBuffersAndAttributes(gl, programInfo, item.bufferInfo)
        setUniforms(programInfo, item.uniforms)
        drawBufferInfo(gl, item.bufferInfo)
      })

      animationID = requestAnimationFrame(drawScene)
    }

    function updateCamera () {
      camera.updatePosition()
    }
    function onClick () {
      genLine(mouseX, mouseY)
      getInterseced()
    }
    /* ================= Mouse events ====================== */
    let startTime = 0
    let endTime = 0
    let havedClicked = false
    function bindMouseEvents () {
      let oldX = 0
      let oldY = 0

      const mouseDown = function (e) {
        startTime = (new Date()).getTime()
        e.preventDefault()
        drag = true
        oldX = e.pageX
        oldY = e.pageY
        const rect = canvas.getBoundingClientRect()
        mouseX = e.clientX - rect.left
        mouseY = e.clientY - rect.top
        pressedButton = e.button
      }

      const mouseUp = function () {
        endTime = (new Date()).getTime()
        if (endTime - startTime < 150) {
          onClick()
          havedClicked = true
        }
        drag = false
      }

      const mouseMove = function (e) {
        // const rect = canvas.getBoundingClientRect()
        // mouseX = e.clientX - rect.left
        // mouseY = e.clientY - rect.top
        if (!drag) {
          return
        }
        e.preventDefault()
        dX = (e.pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
        dY = (e.pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
        oldX = e.pageX
        oldY = e.pageY
        if (pressedButton === 0) {
          camera.rotate(dX, dY)
          updateCamera()
        } else if (pressedButton === 2) {
          camera.pan(dX, dY)
          updateCamera()
        }
      }
      const mouseWheel = function (e) {
        if (Math.abs(e.deltaY) < 1.0) {
          return
        }

        // canvas.style.cursor = 'none'
        camera.zoomIn(e.deltaY)
        updateCamera()
      }

      canvas.addEventListener('mousedown', mouseDown, false)
      canvas.addEventListener('mouseup', mouseUp, false)
      canvas.addEventListener('mouseleave', mouseUp, false)
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
        startTime = (new Date()).getTime()
        drag = true
        oldX = e.touches[0].pageX
        oldY = e.touches[0].pageY
        const rect = canvas.getBoundingClientRect()
        mouseX = oldX - rect.left
        mouseY = oldY - rect.top
        // oldMouseX = mouseX
        // oldMouseY = mouseY
      }

      const touchEnd = function () {
        endTime = (new Date()).getTime()
        if (endTime - startTime < 150) {
          onClick()
          havedClicked = true
        }
        drag = false
      }

      const touchMove = function (e) {
        // const rect = canvas.getBoundingClientRect()
        // mouseX = e.touches[0].pageX - rect.left
        // mouseY = e.touches[0].pageY - rect.top
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

    canvas.addEventListener('click', () => {
      if (havedClicked) {
        setTimeout(() => {
          havedClicked = false
        }, 50) // 确保选中失败的情况
      }
    }, false)

    supportedTouch ? bindTouchEvents() : bindMouseEvents()
    drawScene()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>