<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { mat4 } from 'gl-matrix'
import { createProgram, loadShader, createBufferFromTypedArray } from '../../utils/tools/web-gl'
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
    const gl = canvas.getContext('experimental-webgl')

    /* ========== Defining and storing the geometry ========== */
    const vertices = [
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
      -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
      1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
      -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
      -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
    ]

    const colors = [
      5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
      1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
    ]

    const indices = [
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
    ]

    const vertexBuffer = createBufferFromTypedArray(gl, new Float32Array(vertices), gl.ARRAY_BUFFER)
    const colorBuffer = createBufferFromTypedArray(gl, new Float32Array(colors), gl.ARRAY_BUFFER)
    createBufferFromTypedArray(gl, new Uint16Array(indices), gl.ELEMENT_ARRAY_BUFFER)

    const vertexShaderCode = `
      attribute vec3 position;
      uniform mat4 pMatrix;
      uniform mat4 vMatrix;
      uniform mat4 mMatrix;
      attribute vec3 color;
      varying vec3 vColor;
      void main(void) { 
        gl_Position = pMatrix * vMatrix * mMatrix * vec4(position, 1.);
        vColor = color;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;
      varying vec3 vColor;
      void main(void) {
        gl_FragColor = vec4(vColor, 1.);
      }
    `

    const program = createProgram(gl, [loadShader(gl, vertexShaderCode, gl.VERTEX_SHADER), loadShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER)])

    /* ======== Associating attributes to vertex shader ===== */
    const _pMatrix = gl.getUniformLocation(program, 'pMatrix')
    const _vMatrix = gl.getUniformLocation(program, 'vMatrix')
    const _mMatrix = gl.getUniformLocation(program, 'mMatrix')

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer) // 使用 gl.getAttribLocation 前，必需 bind 一下，才可以使用？
    const _position = gl.getAttribLocation(program, 'position')
    gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(_position)

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer) // 使用 gl.getAttribLocation 前，必需 bind 一下，才可以使用？
    const _color = gl.getAttribLocation(program, 'color')
    gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(_color)

    gl.useProgram(program)

    let pMatrix = []
    mat4.perspective(pMatrix, 40 * Math.PI / 180, cWidth / cHeight, 1, 100)
    let mMatrix = mat4.create()
    let vMatrix = mat4.create()

    vMatrix[14] = vMatrix[14] - 6

    let amorization = 0.95
    let theta = 0
    let phi = 0
    let dX = 0
    let dY = 0
    let drag = false
    /* ================= Mouse events ====================== */
    function bindMouseEvents () {
      let oldX = 0
      let oldY = 0

      const mouseDown = function (e) {
        drag = true
        oldX = e.pageX
        oldY = e.pageY
        e.preventDefault()
        return false
      }

      const mouseUp = function () {
        drag = false
      }

      const mouseMove = function (e) {
        if (!drag) return false
        dX = (e.pageX - oldX) * 2 * Math.PI / cWidth
        dY = (e.pageY - oldY) * 2 * Math.PI / cHeight
        theta += dX
        phi += dY
        oldX = e.pageX
        oldY = e.pageY
        e.preventDefault()
      }

      canvas.addEventListener('mousedown', mouseDown, false)
      canvas.addEventListener('mouseup', mouseUp, false)
      canvas.addEventListener('mouseout', mouseUp, false)
      canvas.addEventListener('mousemove', mouseMove, false)
    }

    /* =================== Drawing =================== */
    const animate = function () {
      if (!drag) {
        dX *= amorization
        dY *= amorization
        theta += dX
        phi += dY
      }

      //set model matrix to I4
      mat4.identity(mMatrix)
      mat4.rotateY(mMatrix, mMatrix, theta)
      mat4.rotateX(mMatrix, mMatrix, phi)

      gl.enable(gl.DEPTH_TEST);

      // gl.depthFunc(gl.LEQUAL);

      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.clearDepth(1.0);
      gl.viewport(0.0, 0.0, cWidth, cHeight)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      gl.uniformMatrix4fv(_pMatrix, false, pMatrix)
      gl.uniformMatrix4fv(_vMatrix, false, vMatrix)
      gl.uniformMatrix4fv(_mMatrix, false, mMatrix)

      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer) // 必需 bind 一下，才可以使用？
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

      animationID = requestAnimationFrame(animate)
    }
    bindMouseEvents()
    animate()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
