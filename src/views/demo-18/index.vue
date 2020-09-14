<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-less-code-more-fun.html
import { mat4, vec3 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, createPlaneVertices, create3DFVertices } from '../../utils/tools/primitives'
import { generateTextCanvas } from '../../utils/tools/texture'
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
    const textVertexShaderCode = `
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
    const textFragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec2 v_texcoord;

      uniform sampler2D u_texture;
      uniform vec4 u_color;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord) * u_color;
      }
    `
    const create3DFBufferInfo = createBufferInfoFunc(create3DFVertices)
    const createPlaneBufferInfo = createBufferInfoFunc(createPlaneVertices)
    // Create data for 'F'
    const fBufferInfo = create3DFBufferInfo(gl)
    // Create a unit quad for the 'text'
    const matrix = mat4.create()
    mat4.rotateX(matrix, matrix, Math.PI / 2)
    const textBufferInfo = createPlaneBufferInfo(gl, 1, 1, 1, 1, matrix)

    // setup GLSL programs
    const fProgramInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])
    const textProgramInfo = createProgramInfo(gl, [textVertexShaderCode, textFragmentShaderCode])

    // colors, 1 for each F
    const colors = [
      [0.0, 0.0, 0.0, 1], // 0
      [1.0, 0.0, 0.0, 1], // 1
      [0.0, 1.0, 0.0, 1], // 2
      [1.0, 1.0, 0.0, 1], // 3
      [0.0, 0.0, 1.0, 1], // 4
      [1.0, 0.0, 1.0, 1], // 5
      [0.0, 1.0, 1.0, 1], // 6
      [0.5, 0.5, 0.5, 1], // 7
      [0.5, 0.0, 0.0, 1], // 8
      [0.0, 0.0, 0.0, 1], // 9
      [0.5, 5.0, 0.0, 1], // 10
      [0.0, 5.0, 0.0, 1], // 11
      [0.5, 0.0, 5.0, 1], // 12,
      [0.0, 0.0, 5.0, 1], // 13,
      [0.5, 5.0, 5.0, 1], // 14,
      [0.0, 5.0, 5.0, 1], // 15,
    ]

    // create text textures, one for each F
    const textTextures = [
      '张伟',   // 0
      '王伟',  // 1
      '王芳',  // 2
      '李伟',  // 3
      '王秀英',  // 4
      '李秀英',   // 5
      '李娜',  // 6
      '张秀英',    // 7
      '刘伟',  // 8
      '张敏',   // 9
      '李静',   // 10
      '张丽',   // 11
      '王静',// 12,
      '王丽',   // 13,
      '李强', // 14,
      '张静',    // 15,
    ].map((text) => {
      const textCanvas = generateTextCanvas({
        text,
        width: 100,
        height: 26,
        fillStyle: `rgb(${randInt(255)},${randInt(255)},${randInt(255)})`,
        font: '700 28px "Hiragino Sans GB W3","Microsoft YaHe","宋体","sans-serif"'
      })
      const textWidth = textCanvas.width
      const textHeight = textCanvas.height
      const textTex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, textTex)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas)
      // make sure we can render it even if it's not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return {
        texture: textTex,
        width: textWidth,
        height: textHeight
      }
    })

    const fUniforms = {
      u_matrix: mat4.create(),
    }

    const textUniforms = {
      u_matrix: mat4.create(),
      u_texture: null,
    }

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    function randInt (range) {
      return Math.floor(Math.random() * range)
    }

    const translation = [0, 30, 0]
    const rotation = [degToRad(190), degToRad(0), degToRad(0)]
    const scale = [1, 1, 1]
    const fieldOfViewRadians = degToRad(60)
    const rotationSpeed = 1.2

    let then = 0

    drawScene(0)

    // Draw the scene.
    function drawScene (now) {
      // Convert to seconds
      now *= 0.001
      // Subtract the previous time from the current time
      const deltaTime = now - then
      // Remember the current time for the next frame.
      then = now

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      // Every frame increase the rotation a little.
      rotation[1] += rotationSpeed * deltaTime

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)
      gl.depthMask(true)

      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the camera's matrix using look at.
      const cameraRadius = 360
      const cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      let viewMatrix = mat4.create()
      mat4.lookAt(viewMatrix, cameraPosition, target, up)

      const textPositions = []

      // setup to draw the 'F'
      gl.useProgram(fProgramInfo.program)

      setBuffersAndAttributes(gl, fProgramInfo, fBufferInfo)

      // draw the Fs.
      let spread = 170
      for (let yy = -1; yy <= 1; ++yy) {
        for (let xx = -2; xx <= 2; ++xx) {
          const fViewMatrix = mat4.create()
          mat4.translate(fViewMatrix, viewMatrix, [translation[0] + xx * spread, translation[1] + yy * spread, translation[2]])
          mat4.rotateX(fViewMatrix, fViewMatrix, rotation[0])
          mat4.rotateY(fViewMatrix, fViewMatrix, rotation[1] + yy * xx * 0.2)
          mat4.rotateZ(fViewMatrix, fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1)
          mat4.scale(fViewMatrix, fViewMatrix, scale)
          mat4.translate(fViewMatrix, fViewMatrix, [-50, -75, 0])
          textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]])

          mat4.multiply(fUniforms.u_matrix, projectionMatrix, fViewMatrix)

          setUniforms(fProgramInfo, fUniforms)

          // Draw the geometry.
          gl.drawElements(gl.TRIANGLES, fBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

        }
      }

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.depthMask(false)

      // setup to draw the text.
      gl.useProgram(textProgramInfo.program)

      setBuffersAndAttributes(gl, textProgramInfo, textBufferInfo)

      textPositions.forEach(function (pos, ndx) {
        // draw the text

        // select a texture
        const tex = textTextures[ndx]

        // use just the view position of the 'F' for the text

        // because pos is in view space that means it's a vector from the eye to
        // some position. So translate along that vector back toward the eye some distance
        const fromEye = vec3.create()
        vec3.normalize(fromEye, pos)
        const amountToMoveTowardEye = 150  // because the F is 150 units long
        const viewX = pos[0] - fromEye[0] * amountToMoveTowardEye
        const viewY = pos[1] - fromEye[1] * amountToMoveTowardEye
        const viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye
        const desiredTextScale = -1 / gl.canvas.height  // 1x1 pixels
        const scale = viewZ * desiredTextScale
        const textMatrix = mat4.create()
        mat4.translate(textMatrix, projectionMatrix, [viewX, viewY, viewZ])
        // scale the F to the size we need it.
        mat4.scale(textMatrix, textMatrix, [tex.width * scale, tex.height * scale, 1])
        mat4.copy(textUniforms.u_matrix, textMatrix)
        textUniforms.u_texture = tex.texture
        textUniforms.u_color = colors[ndx]
        setUniforms(textProgramInfo, textUniforms)

        // Draw the text.
        gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0)
      })

      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
