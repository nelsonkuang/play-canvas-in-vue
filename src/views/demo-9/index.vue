<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: 
// https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-camera.html
// https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-textures.html
import { mat4, vec4 } from 'gl-matrix'
import { createProgram, loadShader } from '../../utils/tools/web-gl'
import fTextureImg from '../../assets/f-texture.jpg'

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

      uniform mat4 u_matrix;

      varying vec2 v_texcoord;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_matrix * a_position;

        // Pass the texcoord to the fragment shader.
        v_texcoord = a_texcoord;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec2 v_texcoord;

      // The texture.
      uniform sampler2D u_texture;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `

    const program = createProgram(gl, [loadShader(gl, vertexShaderCode, gl.VERTEX_SHADER), loadShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER)])

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord')

    // lookup uniforms
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix')
    const textureLocation = gl.getUniformLocation(program, 'u_texture')

    // Create a buffer to put positions in
    const positionBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    // Put geometry data into buffer
    setGeometry(gl)

    // provide texture coordinates for the rectangle.
    const texcoordBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
    // Put color data into buffer
    setTexcoords(gl)

    // Create a texture.
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]))

    /* =================== 通用函数 =================== */
    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    function degToRad (d) {
      return d * Math.PI / 180
    }
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
      };
      img.onerror = function () {
        img.onerror = null
        cb(img)
      }
    }
    function isPowerOf2 (value) {
      return (value & (value - 1)) === 0
    }
    // Fill the buffer with the values that define a letter 'F'.
    function setGeometry (gl) {
      const fScale = 0.5
      const positions = new Float32Array([
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
        0, 150, 0].map(_ => _ * fScale))

      // Center the F around the origin and Flip it around. We do this because
      // we're in 3D now with and +Y is up where as before when we started with 2D
      // we had +Y as down.

      // We could do by changing all the values above but I'm lazy.
      // We could also do it with a matrix at draw time but you should
      // never do stuff at draw time if you can do it at init time.
      let matrix = mat4.create()
      mat4.rotateX(matrix, matrix, Math.PI)
      mat4.translate(matrix, matrix, [-50, -75, -15].map(_ => _ * fScale))

      for (let ii = 0; ii < positions.length; ii += 3) {
        let v4 = vec4.create()
        vec4.transformMat4(v4, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix)
        positions[ii + 0] = v4[0]
        positions[ii + 1] = v4[1]
        positions[ii + 2] = v4[2]
      }

      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }

    // Fill the buffer with texture coordinates the F.
    function setTexcoords (gl) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          // left column front
          0, 0,
          0, 1,
          1, 0,
          0, 1,
          1, 1,
          1, 0,

          // top rung front
          0, 0,
          0, 1,
          1, 0,
          0, 1,
          1, 1,
          1, 0,

          // middle rung front
          0, 0,
          0, 1,
          1, 0,
          0, 1,
          1, 1,
          1, 0,

          // left column back
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1,

          // top rung back
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1,

          // middle rung back
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1,

          // top
          0, 0,
          1, 0,
          1, 1,
          0, 0,
          1, 1,
          0, 1,

          // top rung right
          0, 0,
          1, 0,
          1, 1,
          0, 0,
          1, 1,
          0, 1,

          // under top rung
          0, 0,
          0, 1,
          1, 1,
          0, 0,
          1, 1,
          1, 0,

          // between top rung and middle
          0, 0,
          1, 1,
          0, 1,
          0, 0,
          1, 0,
          1, 1,

          // top of middle rung
          0, 0,
          1, 1,
          0, 1,
          0, 0,
          1, 0,
          1, 1,

          // right of middle rung
          0, 0,
          1, 1,
          0, 1,
          0, 0,
          1, 0,
          1, 1,

          // bottom of middle rung.
          0, 0,
          0, 1,
          1, 1,
          0, 0,
          1, 1,
          1, 0,

          // right of bottom
          0, 0,
          1, 1,
          0, 1,
          0, 0,
          1, 0,
          1, 1,

          // bottom
          0, 0,
          0, 1,
          1, 1,
          0, 0,
          1, 1,
          1, 0,

          // left side
          0, 0,
          0, 1,
          1, 1,
          0, 0,
          1, 1,
          1, 0]),
        gl.STATIC_DRAW)
    }

    // Draw the scene.
    let cameraAngleRadians = [degToRad(0), degToRad(270)]
    // let modelRotationRadian = [degToRad(0), degToRad(270)]
    let fieldOfViewRadians = degToRad(60) // 可控制缩放

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

      // Turn on the texcoord attribute
      gl.enableVertexAttribArray(texcoordLocation)

      // bind the texcoord buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)

      // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
      size = 2                 // 2 components per iteration
      type = gl.FLOAT  // the data is 32bit floats
      normalize = false         // don't normalize the data
      stride = 0               // 0 = move forward size * sizeof(type) each iteration to get the next position
      offset = 0               // start at the beginning of the buffer
      gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset)

      const numFs = 6
      const radius = 200

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the position of the first F
      // const fPosition = [radius, 0, 0]
      const centerPosition = [0, 0, 0]

      // Use matrix math to compute a position on a circle where
      // the camera is
      let cameraMatrix = mat4.create()
      mat4.rotateX(cameraMatrix, cameraMatrix, cameraAngleRadians[0])
      mat4.rotateY(cameraMatrix, cameraMatrix, cameraAngleRadians[1])
      mat4.translate(cameraMatrix, cameraMatrix, [0, 0, radius * 1.5])

      // Get the camera's position from the matrix we computed
      const cameraPosition = [
        cameraMatrix[12],
        cameraMatrix[13],
        cameraMatrix[14],
      ]

      const up = [0, 1, 0]

      // 两种方式求 viewMatrix，都可以
      // 1. Compute the camera's matrix using targetTo.
      // mat4.targetTo(cameraMatrix, cameraPosition, fPosition, up)

      // Make a view matrix from the camera matrix
      // let viewMatrix = mat4.create()
      // mat4.invert(viewMatrix, cameraMatrix)

      // 2. Compute the view's matrix using look at directly.
      let viewMatrix = mat4.create()
      // mat4.lookAt(viewMatrix, cameraPosition, fPosition, up)
      mat4.lookAt(viewMatrix, cameraPosition, centerPosition, up)

      // Compute a view projection matrix
      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      for (let ii = 0; ii < numFs; ++ii) {
        const angle = ii * Math.PI * 2 / numFs
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        // starting with the view projection matrix
        // compute a matrix for the F
        let matrix = mat4.create()
        mat4.translate(matrix, viewProjectionMatrix, [x, 0, z])
        mat4.rotateY(matrix, matrix, Math.PI - angle)

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix)

        // Tell the shader to use texture unit 0 for u_texture
        gl.uniform1i(textureLocation, 0)

        // Draw the geometry.
        const primitiveType = gl.TRIANGLES
        const offset = 0
        const count = 16 * 6
        gl.drawArrays(primitiveType, offset, count)
      }
    }

    function updateCameraAngle (theta, phi) {
      cameraAngleRadians = [phi, theta]
      drawScene()
    }

    // let amorization = 0.95
    let theta = cameraAngleRadians[1]
    let phi = cameraAngleRadians[0]
    let dX = 0
    let dY = 0
    let drag = false
    const supportedTouch = window.hasOwnProperty('ontouchstart')
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
        dX = (e.pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
        dY = (e.pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
        theta -= dX
        phi -= dY
        oldX = e.pageX
        oldY = e.pageY
        updateCameraAngle(theta, phi)
        e.preventDefault()
      }

      canvas.addEventListener('mousedown', mouseDown, false)
      canvas.addEventListener('mouseup', mouseUp, false)
      canvas.addEventListener('mouseout', mouseUp, false)
      canvas.addEventListener('mousemove', mouseMove, false)
    }
    /* ================= Touch events ====================== */
    function bindTouchEvents () {
      let oldX = 0
      let oldY = 0

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
        dX = (e.changedTouches[0].pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
        dY = (e.changedTouches[0].pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
        theta += dX
        phi += dY
        oldX = e.changedTouches[0].pageX
        oldY = e.changedTouches[0].pageY
        updateCameraAngle(theta, phi)
        e.preventDefault()
      }

      canvas.addEventListener('touchstart', touchStart, false)
      canvas.addEventListener('touchend', touchEnd, false)
      canvas.addEventListener('touchmove', touchMove, false)
    }

    supportedTouch ? bindTouchEvents() : bindMouseEvents()
    AsynLoadImage(fTextureImg, (image) => {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      // Check if the image is a power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D)
      } else {
        // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      }

      drawScene()
    })
  },
  beforeDestroy () {
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.canvas {
  background-color: #fff;
}
</style>

