<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-text-glyphs.html
import { mat4, vec3 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, create3DFVertices } from '../../utils/tools/primitives'
import fontImg from '../../assets/8x8-font.png'
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

      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `
    const fontInfo = {
      letterHeight: 8,
      spaceWidth: 8,
      spacing: -1,
      textureWidth: 64,
      textureHeight: 40,
      glyphInfos: {
        'a': { x: 0, y: 0, width: 8, },
        'b': { x: 8, y: 0, width: 8, },
        'c': { x: 16, y: 0, width: 8, },
        'd': { x: 24, y: 0, width: 8, },
        'e': { x: 32, y: 0, width: 8, },
        'f': { x: 40, y: 0, width: 8, },
        'g': { x: 48, y: 0, width: 8, },
        'h': { x: 56, y: 0, width: 8, },
        'i': { x: 0, y: 8, width: 8, },
        'j': { x: 8, y: 8, width: 8, },
        'k': { x: 16, y: 8, width: 8, },
        'l': { x: 24, y: 8, width: 8, },
        'm': { x: 32, y: 8, width: 8, },
        'n': { x: 40, y: 8, width: 8, },
        'o': { x: 48, y: 8, width: 8, },
        'p': { x: 56, y: 8, width: 8, },
        'q': { x: 0, y: 16, width: 8, },
        'r': { x: 8, y: 16, width: 8, },
        's': { x: 16, y: 16, width: 8, },
        't': { x: 24, y: 16, width: 8, },
        'u': { x: 32, y: 16, width: 8, },
        'v': { x: 40, y: 16, width: 8, },
        'w': { x: 48, y: 16, width: 8, },
        'x': { x: 56, y: 16, width: 8, },
        'y': { x: 0, y: 24, width: 8, },
        'z': { x: 8, y: 24, width: 8, },
        '0': { x: 16, y: 24, width: 8, },
        '1': { x: 24, y: 24, width: 8, },
        '2': { x: 32, y: 24, width: 8, },
        '3': { x: 40, y: 24, width: 8, },
        '4': { x: 48, y: 24, width: 8, },
        '5': { x: 56, y: 24, width: 8, },
        '6': { x: 0, y: 32, width: 8, },
        '7': { x: 8, y: 32, width: 8, },
        '8': { x: 16, y: 32, width: 8, },
        '9': { x: 24, y: 32, width: 8, },
        '-': { x: 32, y: 32, width: 8, },
        '*': { x: 40, y: 32, width: 8, },
        '!': { x: 48, y: 32, width: 8, },
        '?': { x: 56, y: 32, width: 8, },
      },
    }

    function makeVerticesForString (fontInfo, s) {
      const len = s.length
      const numVertices = len * 6
      const positions = new Float32Array(numVertices * 2)
      const texcoords = new Float32Array(numVertices * 2)
      let offset = 0
      let x = 0
      const maxX = fontInfo.textureWidth
      const maxY = fontInfo.textureHeight
      for (let ii = 0; ii < len; ++ii) {
        let letter = s[ii]
        let glyphInfo = fontInfo.glyphInfos[letter]
        if (glyphInfo) {
          let x2 = x + glyphInfo.width
          let u1 = glyphInfo.x / maxX
          let v1 = (glyphInfo.y + fontInfo.letterHeight - 1) / maxY
          let u2 = (glyphInfo.x + glyphInfo.width - 1) / maxX
          let v2 = glyphInfo.y / maxY

          // 6 vertices per letter
          positions[offset + 0] = x
          positions[offset + 1] = 0
          texcoords[offset + 0] = u1
          texcoords[offset + 1] = v1

          positions[offset + 2] = x2
          positions[offset + 3] = 0
          texcoords[offset + 2] = u2
          texcoords[offset + 3] = v1

          positions[offset + 4] = x
          positions[offset + 5] = fontInfo.letterHeight
          texcoords[offset + 4] = u1
          texcoords[offset + 5] = v2

          positions[offset + 6] = x
          positions[offset + 7] = fontInfo.letterHeight
          texcoords[offset + 6] = u1
          texcoords[offset + 7] = v2

          positions[offset + 8] = x2
          positions[offset + 9] = 0
          texcoords[offset + 8] = u2
          texcoords[offset + 9] = v1

          positions[offset + 10] = x2
          positions[offset + 11] = fontInfo.letterHeight
          texcoords[offset + 10] = u2
          texcoords[offset + 11] = v2

          x += glyphInfo.width + fontInfo.spacing
          offset += 12
        } else {
          // we don't have this character so just advance
          x += fontInfo.spaceWidth
        }
      }

      // return ArrayBufferViews for the portion of the TypedArrays
      // that were actually used.
      return {
        arrays: {
          position: new Float32Array(positions.buffer, 0, offset),
          texcoord: new Float32Array(texcoords.buffer, 0, offset),
        },
        numVertices: offset / 2
      }
    }

    const create3DFBufferInfo = createBufferInfoFunc(create3DFVertices)
    // Create data for 'F'
    const fBufferInfo = create3DFBufferInfo(gl)
    // Maunally create a bufferInfo
    const textBufferInfo = {
      attribs: {
        a_position: { buffer: gl.createBuffer(), numComponents: 2, },
        a_texcoord: { buffer: gl.createBuffer(), numComponents: 2, },
      },
      numElements: 0,
    }

    // setup GLSL programs
    const fProgramInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])
    const textProgramInfo = createProgramInfo(gl, [textVertexShaderCode, textFragmentShaderCode])
    // Create a texture.
    const glyphTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, glyphTex)
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]))

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

    AsynLoadImage(fontImg, (img) => {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, glyphTex)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    })

    const names = [
      'anna',   // 0
      'colin',  // 1
      'james',  // 2
      'danny',  // 3
      'kalin',  // 4
      'hiro',   // 5
      'eddie',  // 6
      'shu',    // 7
      'brian',  // 8
      'tami',   // 9
      'rick',   // 10
      'gene',   // 11
      'natalie',// 12,
      'evan',   // 13,
      'sakura', // 14,
      'kai',    // 15,
    ]

    const fUniforms = {
      u_matrix: mat4.create(),
    }

    const textUniforms = {
      u_matrix: mat4.create(),
      u_texture: glyphTex,
      u_color: [0, 0, 0, 1]
    }

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // function radToDeg (r) {
    //   return r * 180 / Math.PI
    // }

    // function randInt (range) {
    //   return Math.floor(Math.random() * range)
    // }

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
        const name = names[ndx]
        const s = name + ':' + pos[0].toFixed(0) + ',' + pos[1].toFixed(0) + ',' + pos[2].toFixed(0)
        const vertices = makeVerticesForString(fontInfo, s)

        // update the buffers
        textBufferInfo.attribs.a_position.numComponents = 2
        gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_position.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.position, gl.DYNAMIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_texcoord.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.texcoord, gl.DYNAMIC_DRAW)

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
        mat4.scale(textMatrix, textMatrix, [scale, scale, 1])
        mat4.copy(textUniforms.u_matrix, textMatrix)
        setUniforms(textProgramInfo, textUniforms)

        // Draw the text.
        gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices)
      })

      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
