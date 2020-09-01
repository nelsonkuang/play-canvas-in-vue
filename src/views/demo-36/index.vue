<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: 
// https://github.com/SunQiongqiong/panorama/blob/master/js/ballplay.js
// https://zhoyq.github.io/panoramic/panoramic.html
import { mat4 } from 'gl-matrix'
import { createProgram, loadShader, createUniformSetters, createAttributeSetters, setAttributes, setUniforms } from '../../utils/tools/web-gl'
import { createBufferFunc, createSphereVertices } from '../../utils/tools/primitives'
// import { makeStripeTexture, makeCheckerTexture, makeCircleTexture } from '../../utils/tools/texture'
const textureImg = './static/img/'

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
      attribute vec2 a_texcoord;
      varying vec2 v_texcoord;
      uniform mat4 v_matrix;
      uniform mat4 m_matrix;
      uniform mat4 p_matrix;
      void main(){
        gl_Position = p_matrix * v_matrix * m_matrix * a_position;
        // Pass the texture coord to the fragment shader.
        v_texcoord = a_texcoord;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float; // 精度限制
      varying vec2 v_texcoord;
      uniform sampler2D u_texture;
      void main(){
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `
    const createSphereBuffers = createBufferFunc(createSphereVertices)
    const buffers = createSphereBuffers(gl, 500, 48, 24)
    // setup GLSL programs
    const programInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

    const texture = gl.createTexture()
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true) // 将纹理图片反转

    gl.bindTexture(gl.TEXTURE_2D, texture)
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

    AsynLoadImage(textureImg, (img) => {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      // Check if the image is a power of 2 in both dimensions.
      if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D)
      } else {
        // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      }
    })

    function degToRad (d) {
      return d * Math.PI / 180
    }
    function isPowerOf2 (value) {
      return (value & (value - 1)) === 0
    }

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    // const cameraHeight = 50
    const sphereUniforms = {
      m_matrix: mat4.create(),
      v_matrix: mat4.create(),
      p_matrix: mat4.create(),
      u_texture: texture
    }

    function rand (min, max) {
      if (max === undefined) {
        max = min
        min = 0
      }
      return min + Math.random() * (max - min)
    }
    function randInt (range) {
      return Math.floor(Math.random() * range)
    }
    const textures = [
      makeStripeTexture(gl, { color1: '#FFF', color2: '#CCC', }),
      makeCheckerTexture(gl, { color1: '#FFF', color2: '#CCC', }),
      makeCircleTexture(gl, { color1: '#FFF', color2: '#CCC', }),
    ]
    const objects = []
    const numObjects = 100
    const baseColorVal = 240
    for (let ii = 0; ii < numObjects; ++ii) {
      objects.push({
        radius: rand(150),
        xRotation: rand(Math.PI * 2),
        yRotation: rand(Math.PI),
        materialUniforms: {
          u_colorMult: [rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, rand(baseColorVal) / baseColorVal, 1],
          u_diffuse: textures[randInt(textures.length)],
          u_specular: [1, 1, 1, 1],
          u_shininess: rand(500),
          u_specularFactor: rand(1),
        }
      })
    }
    drawScene(0)
    // Draw the scene.
    function drawScene (time) {
      time = time * 0.0001 + 5;
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)
      // Compute the camera's matrix
      const cameraPosition = [0, 0, 100]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      // 2. Compute the view's matrix using look at directly.
      let viewMatrix = mat4.create()
      mat4.lookAt(viewMatrix, cameraPosition, target, up)
      // Compute a view projection matrix
      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)
      gl.useProgram(program)
      // Setup all the needed attributes.
      setAttributes(attribSetters, attribs)
      // Bind the indices.
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
      // Set the uniforms that are the same for all objects.
      setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects)
      // Draw objects
      objects.forEach(function (object) {
        // Compute a position for this object based on the time.
        let worldMatrix = mat4.create()
        mat4.rotateX(worldMatrix, worldMatrix, object.xRotation * time)
        mat4.rotateY(worldMatrix, worldMatrix, object.yRotation * time)
        mat4.translate(worldMatrix, worldMatrix, [0, 0, object.radius])
        uniformsThatAreComputedForEachObject.u_world = worldMatrix
        // Multiply the matrices.
        mat4.multiply(uniformsThatAreComputedForEachObject.u_worldViewProjection, viewProjectionMatrix, worldMatrix)
        // 下面求逆加转置用于求物体各个面的方向向量
        let worldInverseMatrix = mat4.create()
        mat4.invert(worldInverseMatrix, worldMatrix) // 求逆
        mat4.transpose(uniformsThatAreComputedForEachObject.u_worldInverseTranspose, worldInverseMatrix)
        // Set the uniforms we just computed
        setUniforms(uniformSetters, uniformsThatAreComputedForEachObject)
        // Set the uniforms that are specific to the this object.
        setUniforms(uniformSetters, object.materialUniforms)
        // Draw the geometry.
        gl.drawElements(gl.TRIANGLES, buffers.numElements, gl.UNSIGNED_SHORT, 0)
      })
      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>