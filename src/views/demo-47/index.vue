<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { mat4, vec3, vec2 } from 'gl-matrix'
import { createBufferInfoFromArrays, createProgramInfo, setBuffersAndAttributes, setUniforms, drawBufferInfo, resizeCanvasToDisplaySize } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createSphereVertices, createGridVertices, createCubeVertices, createTruncatedConeVertices } from '../../utils/tools/primitives'
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

    const pickFragmentShaderCode = `
      precision mediump float;
      
      uniform vec4 u_id;
      
      void main() {
        gl_FragColor = u_id;
      }
    `
    const createSphereBufferInfo = createBufferInfoFunc(createSphereVertices)
    const createPlaneBufferInfo = createBufferInfoFunc(createGridVertices)
    const createCubeBufferInfo = createBufferInfoFunc(createCubeVertices)
    const createConeBufferInfo = createBufferInfoFunc(createTruncatedConeVertices)
    const sphereBufferInfo = createSphereBufferInfo(gl, 1, 32, 24)
    const planeBufferInfo = createPlaneBufferInfo(
      gl,
      20,  // width
      20,  // height
      40,   // subdivisions across
      40,   // subdivisions down
    )
    const cubeBufferInfo = createCubeBufferInfo(
      gl,
      2,  // size
    )
    const truncatedConeBufferInfo = createConeBufferInfo(gl, 1, 0, 2, 12, 1, true, false)
    const coneBufferInfo = createConeBufferInfo(gl, 1, 1, 3, 12, 1, true, true)
    const axisArrays = {
      position: [
        8, 0, 0,
        -8, 0, 0,
        0, 8, 0,
        0, -8, 0,
        0, 0, 8,
        0, 0, -8,
      ],
      indices: [
        0, 1,
        2, 3,
        4, 5,
      ],
    }
    const axisBufferInfo = createBufferInfoFromArrays(gl, axisArrays)

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [colorVertexShaderCode, colorFragmentShaderCode])
    const pickingProgramInfo = createProgramInfo(gl, [colorVertexShaderCode, pickFragmentShaderCode])

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

    const uniformsThatAreComputedForLines = {
      u_view: null,
      u_projection: null,
      u_world: null,
      u_color: null
    }

    let tempMatrix = mat4.create()
    const geometries = [
      {
        bufferInfo: cubeBufferInfo,
        uniforms: {
          u_world: [...mat4.rotateY(tempMatrix, mat4.fromTranslation(tempMatrix, [1.5, 1, 0.5]), degToRad(45))],
          u_color: [1, 0.5, 0.5, 1],
          u_projection: mat4.create(),
          u_view: mat4.create(),
          u_id: [
            ((1 >> 0) & 0xFF) / 0xFF,
            ((1 >> 8) & 0xFF) / 0xFF,
            ((1 >> 16) & 0xFF) / 0xFF,
            ((1 >> 24) & 0xFF) / 0xFF
          ],
        },
        selected: false,
        hover: false
      },
      {
        bufferInfo: truncatedConeBufferInfo,
        uniforms: {
          u_world: [...mat4.rotateY(tempMatrix, mat4.fromTranslation(tempMatrix, [1.5, 1, -2]), degToRad(45))],
          u_color: [0.2, 0.8, 1, 1],
          u_projection: mat4.create(),
          u_view: mat4.create(),
          u_id: [
            ((2 >> 0) & 0xFF) / 0xFF,
            ((2 >> 8) & 0xFF) / 0xFF,
            ((2 >> 16) & 0xFF) / 0xFF,
            ((2 >> 24) & 0xFF) / 0xFF
          ],
        },
        selected: false,
        hover: false
      },
      {
        bufferInfo: coneBufferInfo,
        uniforms: {
          u_world: [...mat4.rotateY(tempMatrix, mat4.fromTranslation(tempMatrix, [-1.5, 1.5, -2]), degToRad(45))],
          u_color: [0.2, 0.2, 1, 1],
          u_projection: mat4.create(),
          u_view: mat4.create(),
          u_id: [
            ((3 >> 0) & 0xFF) / 0xFF,
            ((3 >> 8) & 0xFF) / 0xFF,
            ((3 >> 16) & 0xFF) / 0xFF,
            ((3 >> 24) & 0xFF) / 0xFF
          ],
        },
        selected: false,
        hover: false
      },
      {
        bufferInfo: sphereBufferInfo,
        uniforms: {
          u_world: [...mat4.fromTranslation(tempMatrix, [-1.5, 1, 0.5])],
          u_color: [0, 1, 0, 1],
          u_projection: mat4.create(),
          u_view: mat4.create(),
          u_id: [
            ((4 >> 0) & 0xFF) / 0xFF,
            ((4 >> 8) & 0xFF) / 0xFF,
            ((4 >> 16) & 0xFF) / 0xFF,
            ((4 >> 24) & 0xFF) / 0xFF
          ],
        },
        selected: false,
        hover: false
      }
    ]

    let dX = 0
    let dY = 0
    let mouseX = -1
    let mouseY = -1
    let oldMouseX = -1
    let oldMouseY = -1
    let drag = false
    let oldPickNdx = -1
    let pickNdx = -1
    let lastSelectedNdx = -1
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

    function setupPicker () {
      // Figure out what pixel is under the mouse and setup
      // a frustum to render just that pixel

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
      const viewMatrix = camera.viewMatrix()
      mat4.frustum(
        projectionMatrix,
        subLeft,
        subLeft + subWidth,
        subBottom,
        subBottom + subHeight,
        camera.zNear,
        camera.zFar)

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, 1, 1) // 1 像素离屏渲染，关键优化点


      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 0, 0) // 如果使用 1 像素离屏渲染，最好把颜色及透明度全部清 0 以免遗留透明度值导致计算 id 出错
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // draw the geometries
      gl.useProgram(pickingProgramInfo.program)
      geometries.forEach((item) => {
        item.uniforms.u_projection = projectionMatrix
        item.uniforms.u_view = viewMatrix
        setBuffersAndAttributes(gl, pickingProgramInfo, item.bufferInfo)
        setUniforms(pickingProgramInfo, item.uniforms)
        drawBufferInfo(gl, item.bufferInfo)
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
        const object = geometries[oldPickNdx]
        object && (object.hover = false)
        oldPickNdx = -1
      }

      // highlight object under mouse
      if (id > 0) {
        pickNdx = id - 1
        oldPickNdx = pickNdx
        const object = geometries[pickNdx]
        object && (object.hover = true)
      }
      // console.log(data)
    }
    // Draw the scene.
    function drawScene () {
      // time = time * 0.0001 + 5;
      // Tell WebGL how to convert from clip space to pixels
      resizeCanvasToDisplaySize(gl.canvas)
      setupPicker()
      // ------ Draw the objects to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

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

      // draw the geometries
      geometries.forEach((item) => {
        mat4.copy(item.uniforms.u_projection, uniformsThatAreComputedForLines.u_projection)
        mat4.copy(item.uniforms.u_view, uniformsThatAreComputedForLines.u_view)
        gl.useProgram(programInfo.program)
        setBuffersAndAttributes(gl, programInfo, item.bufferInfo)
        setUniforms(programInfo, item.uniforms)
        drawBufferInfo(gl, item.bufferInfo)
        if (item.selected) {
          let oldColor = [...item.uniforms.u_color]
          let oldWorld = [...item.uniforms.u_world]
          item.uniforms.u_color = [1, 1, 1, 1]
          mat4.scale(item.uniforms.u_world, item.uniforms.u_world, [1.005, 1.005, 1.005])
          gl.useProgram(programInfo.program)
          setBuffersAndAttributes(gl, programInfo, item.bufferInfo)
          setUniforms(programInfo, item.uniforms)
          drawBufferInfo(gl, item.bufferInfo, gl.LINES)
          // draw the Axies
          uniformsThatAreComputedForLines.u_color = [1, 1, 0, 1]
          uniformsThatAreComputedForLines.u_world = [...mat4.fromTranslation(tempMatrix, [oldWorld[12], oldWorld[13], oldWorld[14]])]
          setBuffersAndAttributes(gl, programInfo, axisBufferInfo)
          setUniforms(programInfo, uniformsThatAreComputedForLines)
          drawBufferInfo(gl, axisBufferInfo, gl.LINES)

          item.uniforms.u_color = oldColor
          item.uniforms.u_world = oldWorld
        }
      })

      animationID = requestAnimationFrame(drawScene)
    }

    function translateGeometry (obj, oldV2Pos, newV2Pos) {
      const speed = 20 * 0.002
      const target = vec2.create()
      vec2.subtract(target, newV2Pos, oldV2Pos)

      // console.log('target', target)
      const tempPositionArr = [0, 0, 0].concat(axisArrays.position)
      let axisPositions = []
      for (let i = 0; i < tempPositionArr.length; i += 3) {
        const tempPosition = vec3.create()
        axisPositions.push(vec3.normalize(tempPosition, [tempPositionArr[i], tempPositionArr[i + 1], tempPositionArr[i + 2]]))
      }

      const viewProjectonMatrix = mat4.create()
      mat4.multiply(viewProjectonMatrix, camera.projectionMatrix(), camera.viewMatrix())
      // 世界坐标转标准设备坐标
      axisPositions.forEach((point) => {
        vec3.transformMat4(point, point, viewProjectonMatrix)
      })

      // 标准设备坐标转屏幕坐标
      axisPositions = axisPositions.map((_) => {
        const ax = gl.canvas.clientWidth / 2
        const ay = gl.canvas.clientHeight / 2
        return [_[0] * ax + ax, -_[1] * ay + ay, _[2]]
      })

      // console.log('axisPositions', axisPositions)

      const axisDirections = axisPositions.slice(1).map((_) => {
        return [_[0] - axisPositions[0][0], _[1] - axisPositions[0][1]]
      })

      // console.log('axisDirections', axisDirections)

      const anglesOfAxisNTarget = axisDirections.map((_) => {
        return vec2.angle(_, target)
      })

      // console.log('anglesOfAxisNTarget', anglesOfAxisNTarget)
      const minAngle = Math.min(...anglesOfAxisNTarget)
      if (minAngle === anglesOfAxisNTarget[5]) {
        mat4.translate(obj.uniforms.u_world, obj.uniforms.u_world, [0, 0, -speed])
      } else if (minAngle === anglesOfAxisNTarget[4]) {
        mat4.translate(obj.uniforms.u_world, obj.uniforms.u_world, [0, 0, speed])
      } else if (minAngle === anglesOfAxisNTarget[3]) {
        mat4.translate(obj.uniforms.u_world, obj.uniforms.u_world, [0, -speed, 0])
      } else if (minAngle === anglesOfAxisNTarget[2]) {
        mat4.translate(obj.uniforms.u_world, obj.uniforms.u_world, [0, speed, 0])
      } else if (minAngle === anglesOfAxisNTarget[1]) {
        mat4.translate(obj.uniforms.u_world, obj.uniforms.u_world, [-speed, 0, 0])
      } else {
        mat4.translate(obj.uniforms.u_world, obj.uniforms.u_world, [speed, 0, 0])
      }
    }

    function updateCamera () {
      camera.updatePosition()
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
        oldMouseX = e.clientX - rect.left
        oldMouseY = e.clientY - rect.top
        pressedButton = e.button
      }

      const mouseUp = function () {
        endTime = (new Date()).getTime()
        if (endTime - startTime < 150) {
          havedClicked = true
        }
        drag = false
      }

      const mouseMove = function (e) {
        const rect = canvas.getBoundingClientRect()
        mouseX = e.clientX - rect.left
        mouseY = e.clientY - rect.top
        if (!drag) {
          return
        }
        e.preventDefault()
        dX = (e.pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
        dY = (e.pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
        oldX = e.pageX
        oldY = e.pageY
        if (pressedButton === 0) {
          const geometry = geometries[lastSelectedNdx]
          if (geometry && geometry.hover && geometry.selected) {
            translateGeometry(geometry, [oldMouseX, oldMouseY], [mouseX, mouseY])
          } else {
            camera.rotate(dX, dY)
            updateCamera()
          }
        } else if (pressedButton === 2) {
          camera.pan(dX, dY)
          updateCamera()
        }
        if (vec2.length([mouseX - oldMouseX, mouseY - oldMouseY]) > 2) { // 增加敏感度
          oldMouseX = mouseX
          oldMouseY = mouseY
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
        oldMouseX = mouseX
        oldMouseY = mouseY
      }

      const touchEnd = function () {
        endTime = (new Date()).getTime()
        if (endTime - startTime < 150) {
          havedClicked = true
        }
        drag = false
      }

      const touchMove = function (e) {
        const rect = canvas.getBoundingClientRect()
        mouseX = e.touches[0].pageX - rect.left
        mouseY = e.touches[0].pageY - rect.top
        if (!drag) return false
        e.preventDefault()
        if (event.touches[1] == undefined) { // 单点触控
          dX = (e.touches[0].pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
          dY = (e.touches[0].pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
          oldX = e.touches[0].pageX
          oldY = e.touches[0].pageY
          const geometry = geometries[lastSelectedNdx]
          if (geometry && geometry.hover && geometry.selected) {
            translateGeometry(geometry, [oldMouseX, oldMouseY], [mouseX, mouseY])
          } else {
            camera.rotate(dX, dY)
            updateCamera()
          }
        } else {
          currentDistance = Math.sqrt(Math.pow(e.touches[1].pageX - e.touches[0].pageX, 2) + Math.pow(e.touches[1].pageY - e.touches[0].pageY, 2))
          camera.zoomIn(startDistance - currentDistance)
          startDistance = currentDistance
          updateCamera()
        }
        if (vec2.length([mouseX - oldMouseX, mouseY - oldMouseY]) > 2) { // 增加敏感度
          oldMouseX = mouseX
          oldMouseY = mouseY
        }
      }

      canvas.addEventListener('touchstart', touchStart, false)
      canvas.addEventListener('touchend', touchEnd, false)
      canvas.addEventListener('touchmove', touchMove, false)
    }

    canvas.addEventListener('click', () => {
      if (havedClicked) {
        setTimeout(() => {
          geometries[lastSelectedNdx] && (geometries[lastSelectedNdx].selected = false)
          if (geometries[pickNdx] && geometries[pickNdx].hover) {
            geometries[pickNdx].selected = true
            lastSelectedNdx = pickNdx
          }
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