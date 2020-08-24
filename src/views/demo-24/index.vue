<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-environment-maps.html
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes, createBufferInfoFromArrays } from '../../utils/tools/web-gl'
import negXImg from '../../assets/neg-x.jpg'
import negYImg from '../../assets/neg-y.jpg'
import negZImg from '../../assets/neg-z.jpg'
import posXImg from '../../assets/pos-x.jpg'
import posYImg from '../../assets/pos-y.jpg'
import posZImg from '../../assets/pos-z.jpg'
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

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_world;

      varying vec3 v_worldPosition;
      varying vec3 v_worldNormal;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_projection * u_view * u_world * a_position;

        // send the view position to the fragment shader
        v_worldPosition = (u_world * a_position).xyz;

        // orient the normals and pass to the fragment shader
        v_worldNormal = mat3(u_world) * a_normal;
}
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision highp float;

      // Passed in from the vertex shader.
      varying vec3 v_worldPosition;
      varying vec3 v_worldNormal;

      // The texture.
      uniform samplerCube u_texture;

      // The position of the camera
      uniform vec3 u_worldCameraPosition;

      void main() {
        vec3 worldNormal = normalize(v_worldNormal);
        vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
        vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

        gl_FragColor = textureCube(u_texture, direction);
      }
    `

    // a single triangle
    const arrays = {
      position: {
        numComponents: 3,
        data: [
          -0.5, -0.5, -0.5,
          -0.5, 0.5, -0.5,
          0.5, -0.5, -0.5,
          -0.5, 0.5, -0.5,
          0.5, 0.5, -0.5,
          0.5, -0.5, -0.5,

          -0.5, -0.5, 0.5,
          0.5, -0.5, 0.5,
          -0.5, 0.5, 0.5,
          -0.5, 0.5, 0.5,
          0.5, -0.5, 0.5,
          0.5, 0.5, 0.5,

          -0.5, 0.5, -0.5,
          -0.5, 0.5, 0.5,
          0.5, 0.5, -0.5,
          -0.5, 0.5, 0.5,
          0.5, 0.5, 0.5,
          0.5, 0.5, -0.5,

          -0.5, -0.5, -0.5,
          0.5, -0.5, -0.5,
          -0.5, -0.5, 0.5,
          -0.5, -0.5, 0.5,
          0.5, -0.5, -0.5,
          0.5, -0.5, 0.5,

          -0.5, -0.5, -0.5,
          -0.5, -0.5, 0.5,
          -0.5, 0.5, -0.5,
          -0.5, -0.5, 0.5,
          -0.5, 0.5, 0.5,
          -0.5, 0.5, -0.5,

          0.5, -0.5, -0.5,
          0.5, 0.5, -0.5,
          0.5, -0.5, 0.5,
          0.5, -0.5, 0.5,
          0.5, 0.5, -0.5,
          0.5, 0.5, 0.5
        ]
      },
      normal: {
        numComponents: 3,
        data: [
          // 选择左下图
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,

          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
        ]
      }
    }

    const bufferInfo = createBufferInfoFromArrays(gl, arrays)

    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    // Create a texture.
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

    const faceInfos = [
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        url: posXImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        url: negXImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        url: posYImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        url: negYImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        url: posZImg,
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        url: negZImg,
      },
    ]

    faceInfos.forEach((faceInfo) => {
      const { target, url } = faceInfo

      // Upload the canvas to the cubemap face.
      const level = 0
      const internalFormat = gl.RGBA
      const width = 512
      const height = 512
      const format = gl.RGBA
      const type = gl.UNSIGNED_BYTE

      // setup each face so it's immediately renderable
      gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null)

      // Asynchronously load an image
      AsynLoadImage(url, (image) => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
        gl.texImage2D(target, level, internalFormat, format, type, image)
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
      })
    })
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

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

    const uniformsThatAreComputedForTheBox = {
      u_projection: mat4.create(),
      u_view: mat4.create(),
      u_world: mat4.create(),
      u_texture: texture,
      u_worldCameraPosition: [0, 0, 0]
    }

    function degToRad (d) {
      return d * Math.PI / 180
    }
    // function isPowerOf2 (value) {
    //   return (value & (value - 1)) === 0
    // }

    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    // function randInt (range) {
    //   return Math.floor(Math.random() * range)
    // }

    const modelRotation = [degToRad(0), degToRad(0)]
    const fieldOfViewRadians = degToRad(60)
    // const cameraYRotation = degToRad(0)

    let then = 0

    drawScene(0)

    // Draw the scene.
    function drawScene (now) {
      // Convert to seconds
      now *= 0.0005
      // Subtract the previous time from the current time
      const deltaTime = now - then
      // Remember the current time for the next frame.
      then = now

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      // Every frame increase the rotation a little.
      modelRotation[1] += -0.7 * deltaTime
      modelRotation[0] += -0.4 * deltaTime

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      mat4.perspective(uniformsThatAreComputedForTheBox.u_projection, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the camera's matrix
      const cameraPosition = [0, 0, 2]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      // 2. Compute the view's matrix using look at directly.
      mat4.lookAt(uniformsThatAreComputedForTheBox.u_view, cameraPosition, target, up)

      mat4.fromXRotation(uniformsThatAreComputedForTheBox.u_world, modelRotation[0])
      mat4.rotateY(uniformsThatAreComputedForTheBox.u_world, uniformsThatAreComputedForTheBox.u_world, modelRotation[1])

      uniformsThatAreComputedForTheBox.u_worldCameraPosition = cameraPosition

      gl.useProgram(programInfo.program)

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, bufferInfo)

      // Set the uniforms that are the same for all objects.
      setUniforms(programInfo, uniformsThatAreComputedForTheBox)

      // Draw the geometry.
      gl.drawArrays(gl.TRIANGLES, 0, 6 * 6)

      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
