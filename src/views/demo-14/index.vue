<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-matrix-stack.html
/* eslint-disable no-alert, no-console, no-debugger */
import { mat4 } from 'gl-matrix'
import { createProgram, loadShader } from '../../utils/tools/web-gl'
import MatrixStack from '../../utils/classes/Webgl/MatrixStack'
// import fTextureImg from '../../assets/f-texture.jpg'
import vueImgJpg from '../../assets/logo.jpg'
// import vueImgPng from '../../assets/logo.png'
let animationID = null
export default {
  data () {
    return {
    }
  },
  computed: {
  },
  mounted () {
    const matrixStack = new MatrixStack()
    const canvas = this.$refs.canvas
    const cWidth = window.innerWidth
    const cHeight = window.innerHeight
    canvas.setAttribute('width', `${cWidth}px`)
    canvas.setAttribute('height', `${cHeight}px`)
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    const _2dVertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;

      uniform mat4 u_matrix;
      uniform mat4 u_textureMatrix;

      varying vec2 v_texcoord;

      void main() {
        gl_Position = u_matrix * a_position;
        v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
      }
    `
    const _2dFragmentShader = `
      precision mediump float;

      varying vec2 v_texcoord;

      uniform sampler2D texture;

      void main() {
        gl_FragColor = texture2D(texture, v_texcoord);
      }
    `
    // setup a GLSL program
    const program = createProgram(gl, [loadShader(gl, _2dVertexShader, gl.VERTEX_SHADER), loadShader(gl, _2dFragmentShader, gl.FRAGMENT_SHADER)])
    gl.useProgram(program)

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord')

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

    // Create a buffer for texture coords.
    const texcoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
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

    const textureInfo = createImageTextureInfo(vueImgJpg)

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

    function draw (time) {
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      gl.clear(gl.COLOR_BUFFER_BIT)

      matrixStack.save()
      matrixStack.translate([gl.canvas.width / 2, gl.canvas.height / 2, 0])
      matrixStack.rotateZ(time)

      matrixStack.save()
      matrixStack.translate([textureInfo.width / -2, textureInfo.height / -2, 0])
      drawImage(
        textureInfo.texture,
        textureInfo.width,
        textureInfo.height,
        0, 0)
      matrixStack.restore()

      matrixStack.save()
      // We're at the center of the center image so go to the top/left corner
      matrixStack.translate([textureInfo.width / -2, textureInfo.height / -2, 0])
      matrixStack.rotateZ(Math.sin(time * 2.2))
      matrixStack.scale([0.2, 0.2, 1])
      // Now we want the bottom/right corner of the image we're about to draw
      matrixStack.translate([-textureInfo.width, -textureInfo.height, 0])
      drawImage(
        textureInfo.texture,
        textureInfo.width,
        textureInfo.height,
        0, 0)
      matrixStack.restore()

      matrixStack.save()
      // We're at the center of the center image so go to the top/right corner
      matrixStack.translate([textureInfo.width / 2, textureInfo.height / -2, 0])
      matrixStack.rotateZ(Math.sin(time * 2.3))
      matrixStack.scale([0.2, 0.2, 1])
      // Now we want the bottom/right corner of the image we're about to draw
      matrixStack.translate([0, -textureInfo.height, 0])
      drawImage(
        textureInfo.texture,
        textureInfo.width,
        textureInfo.height,
        0, 0)
      matrixStack.restore()

      matrixStack.save()
      // We're at the center of the center image so go to the bottom/left corner
      matrixStack.translate([textureInfo.width / -2, textureInfo.height / 2, 0])
      matrixStack.rotateZ(Math.sin(time * 2.4))
      matrixStack.scale([0.2, 0.2, 1])
      // Now we want the top/right corner of the image we're about to draw
      matrixStack.translate([-textureInfo.width, 0, 0])
      drawImage(
        textureInfo.texture,
        textureInfo.width,
        textureInfo.height,
        0, 0)
      matrixStack.restore()

      matrixStack.save()
      // We're at the center of the center image so go to the bottom/right corner
      matrixStack.translate([textureInfo.width / 2, textureInfo.height / 2, 0])
      matrixStack.rotateZ(Math.sin(time * 2.5))
      matrixStack.scale([0.2, 0.2, 1])
      // Now we want the top/left corner of the image we're about to draw
      matrixStack.translate([0, 0, 0])  // 0,0 means this line is not really doing anything

      drawImage(
        textureInfo.texture,
        textureInfo.width,
        textureInfo.height,
        0, 0)
      matrixStack.restore()

      matrixStack.restore()
    }
    function drawImage (
      tex, texWidth, texHeight,
      srcX, srcY, srcWidth, srcHeight,
      dstX, dstY, dstWidth, dstHeight) {
      if (dstX === undefined) {
        dstX = srcX
      }
      if (dstY === undefined) {
        dstY = srcY
      }
      if (srcWidth === undefined) {
        srcWidth = texWidth
      }
      if (srcHeight === undefined) {
        srcHeight = texHeight
      }
      if (dstWidth === undefined) {
        dstWidth = srcWidth
      }
      if (dstHeight === undefined) {
        dstHeight = srcHeight
      }

      gl.bindTexture(gl.TEXTURE_2D, tex)

      // Tell WebGL to use our shader program pair
      gl.useProgram(program)

      // Setup the attributes to pull data from our buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
      gl.enableVertexAttribArray(texcoordLocation)
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0)

      // this matrix will convert from pixels to clip space
      let m4 = mat4.create()
      mat4.ortho(m4, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1)

      // this matrix moves the origin to the one represented by
      // the current matrix stack.
      mat4.multiply(m4, m4, matrixStack.getCurrentMatrix())

      // this matrix will translate our quad to dstX, dstY
      mat4.translate(m4, m4, [dstX, dstY, 0])

      // this matrix will scale our 1 unit quad
      // from 1 unit to texWidth, texHeight units
      mat4.scale(m4, m4, [dstWidth, dstHeight, 1])

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, m4)

      // Because texture coordinates go from 0 to 1
      // and because our texture coordinates are already a unit quad
      // we can select an area of the texture by scaling the unit quad
      // down
      let texM4 = mat4.create()
      mat4.translate(texM4, texM4, [srcX / texWidth, srcY / texHeight, 0])
      mat4.scale(texM4, texM4, [srcWidth / texWidth, srcHeight / texHeight, 1])

      // Set the texture matrix.
      gl.uniformMatrix4fv(textureMatrixLocation, false, texM4)

      // Tell the shader to get the texture from texture unit 0
      gl.uniform1i(textureLocation, 0)

      // draw the quad (2 triangles, 6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    // let then = 0
    function render (time) {
      // const now = time * 0.001
      // const deltaTime = Math.min(0.1, now - then)
      // then = now
      draw(time * 0.001)

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
