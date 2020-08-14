<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-drawimage.html
/* eslint-disable no-alert, no-console, no-debugger */
import { mat4 } from 'gl-matrix'
import { createProgram, loadShader } from '../../utils/tools/web-gl'
import fTextureImg from '../../assets/f-texture.jpg'
import vueImgJpg from '../../assets/logo.jpg'
import vueImgPng from '../../assets/logo.png'
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

    const _2dVertexShader = `
      attribute vec4 a_position;

      uniform mat4 u_matrix;
      uniform mat4 u_textureMatrix;

      varying vec2 v_texcoord;

      void main() {
        gl_Position = u_matrix * a_position;
        v_texcoord = (u_textureMatrix * a_position).xy;
      }
    `
    const _2dFragmentShader = `
      precision mediump float;

      varying vec2 v_texcoord;

      uniform sampler2D u_texture;

      void main() {
        if (v_texcoord.x < 0.0 ||
            v_texcoord.y < 0.0 ||
            v_texcoord.x > 1.0 ||
            v_texcoord.y > 1.0) {
          gl_FragColor = vec4(0, 0, 1, 1); // blue
          return;
        }
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `
    // setup a GLSL program
    const program = createProgram(gl, [loadShader(gl, _2dVertexShader, gl.VERTEX_SHADER), loadShader(gl, _2dFragmentShader, gl.FRAGMENT_SHADER)])
    gl.useProgram(program)

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, 'a_position')

    // lookup uniforms
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix')
    const textureMatrixLocation = gl.getUniformLocation(program, 'u_textureMatrix')
    const textureLocation = gl.getUniformLocation(program, 'u_texture')

    // Create a buffer.
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    // Put a unit quad in the buffer
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1]),
      gl.STATIC_DRAW)

    const textureInfos = [
      createImageTextureInfo(fTextureImg),
      createImageTextureInfo(vueImgJpg),
      createImageTextureInfo(vueImgPng)
    ]

    let drawInfos = []
    let numToDraw = 100
    let speed = [60, 60]
    for (let ii = 0; ii < numToDraw; ++ii) {
      const drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        xScale: Math.random() * 0.25 + 0.25,
        yScale: Math.random() * 0.25 + 0.25,
        offX: 0,
        offY: 0,
        zRotation: Math.random() * Math.PI * 2,
        deltaZRotation: (0.5 + Math.random() * 0.5) * (Math.random() > 0.5 ? -1 : 1),
        width: 1,
        height: 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      }
      drawInfos.push(drawInfo)
    }
    /*** 通用函数 ***/
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
    function createImageTextureInfo (url) {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      // Fill the texture with a 1x1 blue pixel.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]))
      // let's assume all images are not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      const textureInfo = {
        width: 1,   // we don't know the size until it loads
        height: 1,
        texture: tex,
      }
      AsynLoadImage(url, (img) => {
        textureInfo.width = img.width
        textureInfo.height = img.height
        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      })
      return textureInfo
    }
    function update (deltaTime) {
      drawInfos.forEach((drawInfo) => {
        drawInfo.x += drawInfo.dx * speed[0] * deltaTime
        drawInfo.y += drawInfo.dy * speed[1] * deltaTime
        if (drawInfo.x < 0) {
          drawInfo.dx = 1
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1
        }
        drawInfo.zRotation += drawInfo.deltaZRotation * deltaTime
      })
    }
    function draw () {
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      gl.clear(gl.COLOR_BUFFER_BIT)

      drawInfos.forEach((drawInfo) => {
        const dstX = drawInfo.x
        var dstY = drawInfo.y
        var dstWidth = drawInfo.textureInfo.width * drawInfo.xScale
        var dstHeight = drawInfo.textureInfo.height * drawInfo.yScale

        var srcX = drawInfo.textureInfo.width * drawInfo.offX
        var srcY = drawInfo.textureInfo.height * drawInfo.offY;
        var srcWidth = drawInfo.textureInfo.width * drawInfo.width
        var srcHeight = drawInfo.textureInfo.height * drawInfo.height

        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          srcX, srcY, srcWidth, srcHeight,
          dstX, dstY, dstWidth, dstHeight,
          drawInfo.zRotation)
      })
    }
    function drawImage (
      tex, texWidth, texHeight,
      srcX, srcY, srcWidth, srcHeight,
      dstX, dstY, dstWidth, dstHeight,
      srcZRotation) {
      if (dstX === undefined) {
        dstX = srcX
        srcX = 0
      }
      if (dstY === undefined) {
        dstY = srcY
        srcY = 0
      }
      if (srcWidth === undefined) {
        srcWidth = texWidth
      }
      if (srcHeight === undefined) {
        srcHeight = texHeight
      }
      if (dstWidth === undefined) {
        dstWidth = srcWidth
        srcWidth = texWidth
      }
      if (dstHeight === undefined) {
        dstHeight = srcHeight
        srcHeight = texHeight
      }
      if (srcZRotation === undefined) {
        srcZRotation = 0
      }

      gl.bindTexture(gl.TEXTURE_2D, tex)

      // Tell WebGL to use our shader program pair
      gl.useProgram(program)

      // Setup the attributes to pull data from our buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      // this matrix will convert from pixels to clip space
      let m4 = mat4.create()
      mat4.ortho(m4, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1)

      // this matrix will translate our quad to dstX, dstY
      mat4.translate(m4, m4, [dstX, dstY, 0])

      // this matrix will scale our 1 unit quad
      // from 1 unit to texWidth, texHeight units
      mat4.scale(m4, m4, [dstWidth, dstHeight, 1])

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, m4)

      // just like a 2d projection matrix except in texture space (0 to 1)
      // instead of clip space. This matrix puts us in pixel space.
      let texM4 = mat4.create()
      mat4.scale(texM4, texM4, [1 / texWidth, 1 / texHeight, 1])

      // We need to pick a place to rotate around
      // We'll move to the middle, rotate, then move back
      // 中心旋转
      mat4.translate(texM4, texM4, [texWidth * 0.5, texHeight * 0.5, 0])
      mat4.rotateZ(texM4, texM4, srcZRotation)
      mat4.translate(texM4, texM4, [texWidth * -0.5, texHeight * -0.5, 0])

      // because were in pixel space
      // the scale and translation are now in pixels
      mat4.translate(texM4, texM4, [srcX, srcY, 0])
      mat4.scale(texM4, texM4, [srcWidth, srcHeight, 1])

      // Set the texture matrix.
      gl.uniformMatrix4fv(textureMatrixLocation, false, texM4)

      // Tell the shader to get the texture from texture unit 0
      gl.uniform1i(textureLocation, 0)

      // draw the quad (2 triangles, 6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    let then = 0
    function render (time) {
      const now = time * 0.001
      const deltaTime = Math.min(0.1, now - then)
      then = now

      update(deltaTime)
      draw()

      animationID = requestAnimationFrame(render)
    }
    // 启动
    render(0)
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.canvas {
  background-color: #000;
}
</style>
