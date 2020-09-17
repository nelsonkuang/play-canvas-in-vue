<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-lighting-directional.html
import { mat4, vec4, vec3 } from 'gl-matrix'
import { createProgram, loadShader } from '../../utils/tools/web-gl'
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
      attribute vec3 a_normal;

      uniform mat4 u_worldViewProjection;
      uniform mat4 u_worldInverseTranspose;
      // uniform mat4 u_world;

      varying vec3 v_normal;
      varying vec4 v_color;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_worldViewProjection * a_position;

        // 重定向法向量并传递给片断着色器。法向量是方向所以不用关心位移， 矩阵的左上 3x3 部分才是控制姿态
        // v_normal = mat3(u_world) * a_normal;

        // 这里有一个问题我不知道如何表述所以就用图解展示。 我们用 normal 和 u_world 相乘去重定向法向量， 如果世界矩阵被缩放了怎么办？事实是会得到错误的法向量。
        // orient the normals and pass to the fragment shader
        v_normal = mat3(u_worldInverseTranspose) * a_normal; // 求逆再转置，与上面直接相乘效果是一样的，但避免了缩放带来的影响
        // 或者
        // v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz; // 这可能是更常用的方式

        // Pass the color to the fragment shader.
        v_color = a_color;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec3 v_normal;

      uniform vec3 u_reverseLightDirection;
      varying vec4 v_color;

      void main() {
        // because v_normal is a varying it's interpolated
        // so it will not be a unit vector. Normalizing it
        // will make it a unit vector again
        vec3 normal = normalize(v_normal);

        float light = dot(normal, u_reverseLightDirection); // 面方向向量与光的方向向量点积得到一个标量，表示归一化的投影，根据余弦定理，90 度，投影则成一点，但最亮。

        gl_FragColor = v_color;

        // Lets multiply just the color portion (not the alpha)
        // by the light
        gl_FragColor.rgb *= light;
      }
    `

    const program = createProgram(gl, [loadShader(gl, vertexShaderCode, gl.VERTEX_SHADER), loadShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER)])

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const normalLocation = gl.getAttribLocation(program, 'a_normal')
    const colorLocation = gl.getAttribLocation(program, 'a_color')

    // lookup uniforms
    const worldViewProjectionLocation = gl.getUniformLocation(program, 'u_worldViewProjection')
    const worldInverseTransposeLocation = gl.getUniformLocation(program, 'u_worldInverseTranspose')
    const reverseLightDirectionLocation = gl.getUniformLocation(program, 'u_reverseLightDirection')

    // Create a buffer to put positions in
    const positionBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    // Put geometry data into buffer
    setGeometry(gl)

    // Create a buffer to put normals in
    const normalBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    // Put normals data into buffer
    // 将法向量存入缓冲
    setNormals(gl)

    // Create a buffer to put colors in
    const colorBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    // Put color data into buffer
    setColors(gl)

    /* =================== 通用函数 =================== */
    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // Fill the buffer with the values that define a letter 'F'.
    function setGeometry (gl) {
      const fScale = 0.8
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

    function setNormals (gl) {
      // 在三维图形学中法向量就是描述面的朝向的单位向量
      // F 添加法向量。 由于 F 非常规则并且朝向都是 x, y, z轴，所以非常简单。正面的的部分法向量为 0, 0, 1， 背面的部分法向量为 0, 0, -1，左面为 -1, 0, 0，右面为 1, 0, 0，上面为 0, 1, 0， 然后底面为 0, -1, 0。
      const normals = new Float32Array([
        // left column front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // top rung front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // middle rung front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // left column back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // top rung back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // middle rung back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // top rung right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // under top rung
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // between top rung and middle
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // top of middle rung
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // right of middle rung
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // bottom of middle rung.
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // right of bottom
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // left side
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0])
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
    }

    // Draw the scene.
    let fAngleRadians = [degToRad(0), degToRad(0)]
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
        colorLocation, size, type, normalize, stride, offset)

      // Turn on the normal attribute
      gl.enableVertexAttribArray(normalLocation)

      // Bind the normal buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)

      // Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
      size = 3                 // 3 components per iteration
      type = gl.FLOAT  // the data is 32bit floating point values
      normalize = false         // normalize the data (convert from 0-255 to 0-1)
      stride = 0               // 0 = move forward size * sizeof(type) each iteration to get the next position
      offset = 0               // start at the beginning of the buffer
      gl.vertexAttribPointer(
        normalLocation, size, type, normalize, stride, offset)

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)


      // Compute the camera's matrix
      const camera = [100, 150, 200]
      const target = [0, 35, 0]
      const up = [0, 1, 0]

      // 两种方式求 viewMatrix，都可以
      // 1. Compute the camera's matrix using targetTo.
      // mat4.targetTo(cameraMatrix, cameraPosition, fPosition, up)

      // Make a view matrix from the camera matrix
      // let viewMatrix = mat4.create()
      // mat4.invert(viewMatrix, cameraMatrix)

      // 2. Compute the view's matrix using look at directly.
      let viewMatrix = mat4.create()
      mat4.lookAt(viewMatrix, camera, target, up)

      // Compute a view projection matrix
      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      // Draw a F at the origin
      let worldMatrix = mat4.create()
      mat4.rotateY(worldMatrix, worldMatrix, fAngleRadians[1])
      mat4.rotateX(worldMatrix, worldMatrix, fAngleRadians[0])

      // Multiply the matrices.
      let worldViewProjectionMatrix = mat4.create()
      mat4.multiply(worldViewProjectionMatrix, viewProjectionMatrix, worldMatrix)
      // 下面求逆加转置用于求物体各个面的方向向量
      let worldInverseMatrix = mat4.create()
      mat4.invert(worldInverseMatrix, worldMatrix) // 求逆
      let worldInverseTransposeMatrix = mat4.create()
      mat4.transpose(worldInverseTransposeMatrix, worldInverseMatrix) // 转置

      // Set the matrices
      gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix)
      gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix)

      // set the light direction.
      let v3 = vec3.fromValues(0.5, 0.7, 1)
      vec3.normalize(v3, v3)
      gl.uniform3fv(reverseLightDirectionLocation, v3)

      const primitiveType = gl.TRIANGLES
      offset = 0
      const count = 16 * 6
      gl.drawArrays(primitiveType, offset, count)
    }

    function updateCameraAngle (theta, phi) {
      fAngleRadians = [phi, theta]
      drawScene()
    }

    // let amorization = 0.95
    let theta = fAngleRadians[1]
    let phi = fAngleRadians[0]
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
        theta += dX
        phi += dY
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
        dX = (e.touches[0].pageX - oldX) * 2 * Math.PI / gl.canvas.clientWidth
        dY = (e.touches[0].pageY - oldY) * 2 * Math.PI / gl.canvas.clientHeight
        theta += dX
        phi += dY
        oldX = e.touches[0].pageX
        oldY = e.touches[0].pageY
        updateCameraAngle(theta, phi)
        e.preventDefault()
      }

      canvas.addEventListener('touchstart', touchStart, false)
      canvas.addEventListener('touchend', touchEnd, false)
      canvas.addEventListener('touchmove', touchMove, false)
    }

    drawScene()
    supportedTouch ? bindTouchEvents() : bindMouseEvents()
  },
  beforeDestroy () {
  }
}
</script>
