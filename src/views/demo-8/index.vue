<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { mat4, vec4 } from 'gl-matrix'
import { createProgram, loadShader } from '../../utils/tools/web-gl'
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
      attribute vec4 a_color;

      uniform mat4 u_matrix;

      varying vec4 v_color;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_matrix * a_position;

        // Pass the color to the fragment shader.
        v_color = a_color;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec4 v_color;

      void main() {
        gl_FragColor = v_color;
      }
    `

    const program = createProgram(gl, [loadShader(gl, vertexShaderCode, gl.VERTEX_SHADER), loadShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER)])

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const colorLocation = gl.getAttribLocation(program, 'a_color')

    // lookup uniforms
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix')

    // Create a buffer to put positions in
    const positionBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    // Put geometry data into buffer
    setGeometry(gl)

    // Create a buffer to put colors in
    const colorBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    // Put color data into buffer
    setColors(gl)

    // let amorization = 0.95
    // let theta = 0
    // let phi = 0
    // let dX = 0
    // let dY = 0
    // let drag = false
    // /* ================= Mouse events ====================== */
    // function bindMouseEvents () {
    //   let oldX = 0
    //   let oldY = 0

    //   const mouseDown = function (e) {
    //     drag = true
    //     oldX = e.pageX
    //     oldY = e.pageY
    //     e.preventDefault()
    //     return false
    //   }

    //   const mouseUp = function () {
    //     drag = false
    //   }

    //   const mouseMove = function (e) {
    //     if (!drag) return false
    //     dX = (e.pageX - oldX) * 2 * Math.PI / cWidth
    //     dY = (e.pageY - oldY) * 2 * Math.PI / cHeight
    //     theta += dX
    //     phi += dY
    //     oldX = e.pageX
    //     oldY = e.pageY
    //     e.preventDefault()
    //   }

    //   canvas.addEventListener('mousedown', mouseDown, false)
    //   canvas.addEventListener('mouseup', mouseUp, false)
    //   canvas.addEventListener('mouseout', mouseUp, false)
    //   canvas.addEventListener('mousemove', mouseMove, false)
    // }

    /* =================== Drawing =================== */
    // const animate = function () {
    //   if (!drag) {
    //     dX *= amorization
    //     dY *= amorization
    //     theta += dX
    //     phi += dY
    //   }

    //   animationID = requestAnimationFrame(animate)
    // }
    // bindMouseEvents()
    // animate()

    /* =================== 通用函数 =================== */
    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // Fill the buffer with the values that define a letter 'F'.
    function setGeometry (gl) {
      var positions = new Float32Array([
        // left column front
        0, 0, 0,
        0, 150, 0,
        30, 0, 0,
        0, 150, 0,
        30, 150, 0,
        30, 0, 0,

        // top rung front
        30, 0, 0,
        30, 30, 0,
        100, 0, 0,
        30, 30, 0,
        100, 30, 0,
        100, 0, 0,

        // middle rung front
        30, 60, 0,
        30, 90, 0,
        67, 60, 0,
        30, 90, 0,
        67, 90, 0,
        67, 60, 0,

        // left column back
        0, 0, 30,
        30, 0, 30,
        0, 150, 30,
        0, 150, 30,
        30, 0, 30,
        30, 150, 30,

        // top rung back
        30, 0, 30,
        100, 0, 30,
        30, 30, 30,
        30, 30, 30,
        100, 0, 30,
        100, 30, 30,

        // middle rung back
        30, 60, 30,
        67, 60, 30,
        30, 90, 30,
        30, 90, 30,
        67, 60, 30,
        67, 90, 30,

        // top
        0, 0, 0,
        100, 0, 0,
        100, 0, 30,
        0, 0, 0,
        100, 0, 30,
        0, 0, 30,

        // top rung right
        100, 0, 0,
        100, 30, 0,
        100, 30, 30,
        100, 0, 0,
        100, 30, 30,
        100, 0, 30,

        // under top rung
        30, 30, 0,
        30, 30, 30,
        100, 30, 30,
        30, 30, 0,
        100, 30, 30,
        100, 30, 0,

        // between top rung and middle
        30, 30, 0,
        30, 60, 30,
        30, 30, 30,
        30, 30, 0,
        30, 60, 0,
        30, 60, 30,

        // top of middle rung
        30, 60, 0,
        67, 60, 30,
        30, 60, 30,
        30, 60, 0,
        67, 60, 0,
        67, 60, 30,

        // right of middle rung
        67, 60, 0,
        67, 90, 30,
        67, 60, 30,
        67, 60, 0,
        67, 90, 0,
        67, 90, 30,

        // bottom of middle rung.
        30, 90, 0,
        30, 90, 30,
        67, 90, 30,
        30, 90, 0,
        67, 90, 30,
        67, 90, 0,

        // right of bottom
        30, 90, 0,
        30, 150, 30,
        30, 90, 30,
        30, 90, 0,
        30, 150, 0,
        30, 150, 30,

        // bottom
        0, 150, 0,
        0, 150, 30,
        30, 150, 30,
        0, 150, 0,
        30, 150, 30,
        30, 150, 0,

        // left side
        0, 0, 0,
        0, 0, 30,
        0, 150, 30,
        0, 0, 0,
        0, 150, 30,
        0, 150, 0]);

      // Center the F around the origin and Flip it around. We do this because
      // we're in 3D now with and +Y is up where as before when we started with 2D
      // we had +Y as down.

      // We could do by changing all the values above but I'm lazy.
      // We could also do it with a matrix at draw time but you should
      // never do stuff at draw time if you can do it at init time.
      let matrix = mat4.create()
      mat4.rotateX(matrix, matrix, Math.PI)
      mat4.translate(matrix, matrix, [-50, -75, -15])

      for (let ii = 0; ii < positions.length; ii += 3) {
        let v4 = vec4.create()
        vec4.transformMat4(v4, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix)
        positions[ii + 0] = v4[0]
        positions[ii + 1] = v4[1]
        positions[ii + 2] = v4[2]
      }

      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }

    // Fill the buffer with colors for the 'F'.
    function setColors (gl) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
          // left column front
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,

          // top rung front
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,

          // middle rung front
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,
          200, 70, 120,

          // left column back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,

          // top rung back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,

          // middle rung back
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,
          80, 70, 200,

          // top
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,

          // top rung right
          200, 200, 70,
          200, 200, 70,
          200, 200, 70,
          200, 200, 70,
          200, 200, 70,
          200, 200, 70,

          // under top rung
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,
          210, 100, 70,

          // between top rung and middle
          210, 160, 70,
          210, 160, 70,
          210, 160, 70,
          210, 160, 70,
          210, 160, 70,
          210, 160, 70,

          // top of middle rung
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,

          // right of middle rung
          100, 70, 210,
          100, 70, 210,
          100, 70, 210,
          100, 70, 210,
          100, 70, 210,
          100, 70, 210,

          // bottom of middle rung.
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,

          // right of bottom
          140, 210, 80,
          140, 210, 80,
          140, 210, 80,
          140, 210, 80,
          140, 210, 80,
          140, 210, 80,

          // bottom
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,

          // left side
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220,
          160, 160, 220]),
        gl.STATIC_DRAW)
    }

    // Draw the scene.
    const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)

    drawScene()
    function drawScene () {
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight)

      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Turn on culling. By default backfacing triangles
      // will be culled.
      gl.enable(gl.CULL_FACE)

      // Enable the depth buffer
      gl.enable(gl.DEPTH_TEST)

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program)

      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation)

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      let size = 3          // 3 components per iteration
      let type = gl.FLOAT   // the data is 32bit floats
      let normalize = false // don't normalize the data
      let stride = 0        // 0 = move forward size * sizeof(type) each iteration to get the next position
      let offset = 0        // start at the beginning of the buffer
      gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset)

      // Turn on the color attribute
      gl.enableVertexAttribArray(colorLocation)

      // Bind the color buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)

      // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
      size = 3                 // 3 components per iteration
      type = gl.UNSIGNED_BYTE  // the data is 8bit unsigned values
      normalize = true         // normalize the data (convert from 0-255 to 0-1)
      stride = 0               // 0 = move forward size * sizeof(type) each iteration to get the next position
      offset = 0               // start at the beginning of the buffer
      gl.vertexAttribPointer(
        colorLocation, size, type, normalize, stride, offset);


      const numFs = 5
      const radius = 200

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the position of the first F
      const fPosition = [radius, 0, 0]

      // Use matrix math to compute a position on a circle where
      // the camera is
      let cameraMatrix = mat4.create()
      mat4.rotateY(cameraMatrix, cameraMatrix, cameraAngleRadians)
      mat4.translate(cameraMatrix, cameraMatrix, [0, 0, radius * 1.5])

      // Get the camera's position from the matrix we computed
      const cameraPosition = [
        cameraMatrix[12],
        cameraMatrix[13],
        cameraMatrix[14],
      ]

      const up = [0, 1, 0]

      // Compute the camera's matrix using look at.
      mat4.targetTo(cameraMatrix, cameraPosition, fPosition, up)

      // Make a view matrix from the camera matrix
      let viewMatrix = mat4.create()
      mat4.invert(viewMatrix, cameraMatrix)

      // Compute a view projection matrix
      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      for (var ii = 0; ii < numFs; ++ii) {
        const angle = ii * Math.PI * 2 / numFs
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        // starting with the view projection matrix
        // compute a matrix for the F
        let matrix = mat4.create()
        mat4.translate(matrix, viewProjectionMatrix, [x, 0, y])

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix)

        // Draw the geometry.
        const primitiveType = gl.TRIANGLES
        const offset = 0;
        const count = 16 * 6;
        gl.drawArrays(primitiveType, offset, count)
      }
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
