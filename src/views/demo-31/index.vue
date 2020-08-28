<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-planar-projection-mapping.html
// 投影匹配（像放电影，但不单单投到平面、可能投影到球面、柱面等）
// 如果投影机对准屏幕就是长方形，如果投不准、有角度就变成梯形（类似于投影仪的使用）
import { mat4 } from 'gl-matrix'
import { createBufferInfoFunc, createSphereVertices, createPlaneVertices } from '../../utils/tools/primitives'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, createBufferInfoFromArrays, drawBufferInfo } from '../../utils/tools/web-gl'
import fImg from '../../assets/f-texture.png'
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

    gl.enable(gl.DEPTH_TEST)

    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_world;
      uniform mat4 u_textureMatrix;

      varying vec2 v_texcoord;
      varying vec4 v_projectedTexcoord;

      void main() {
        // Multiply the position by the matrix.
        vec4 worldPosition = u_world * a_position;

        gl_Position = u_projection * u_view * worldPosition;

        // Pass the texture coord to the fragment shader.
        v_texcoord = a_texcoord;

        v_projectedTexcoord = u_textureMatrix * worldPosition;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec2 v_texcoord;
      varying vec4 v_projectedTexcoord;

      uniform vec4 u_colorMult;
      uniform sampler2D u_texture;
      uniform sampler2D u_projectedTexture;

      void main() {
        vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
        bool inRange = 
            projectedTexcoord.x >= 0.0 &&
            projectedTexcoord.x <= 1.0 &&
            projectedTexcoord.y >= 0.0 &&
            projectedTexcoord.y <= 1.0;
        vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
        vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
        float projectedAmount = inRange ? 1.0 : 0.0;
        gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
      }
    `

    const colorVertexShaderCode = `
      attribute vec4 a_position;

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_world;

      void main() {
        // Multiply the position by the matrices.
        gl_Position = u_projection * u_view * u_world * a_position;
      }
    `

    const colorFragmentShaderCode = `
      precision mediump float;

      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `

    const createSphereBufferInfo = createBufferInfoFunc(createSphereVertices)
    const createPlaneBufferInfo = createBufferInfoFunc(createPlaneVertices)

    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    const sphereBufferInfo = createSphereBufferInfo(
      gl,
      1,  // radius
      12, // subdivisions around
      6,  // subdivisions down
    )
    const planeBufferInfo = createPlaneBufferInfo(
      gl,
      20,  // width
      20,  // height
      1,   // subdivisions across
      1,   // subdivisions down
    )

    const cubeLinesBufferInfo = createBufferInfoFromArrays(gl, {
      position: [
        -1, -1, -1,
        1, -1, -1,
        -1, 1, -1,
        1, 1, -1,
        -1, -1, 1,
        1, -1, 1,
        -1, 1, 1,
        1, 1, 1,
      ],
      indices: [
        0, 1,
        1, 3,
        3, 2,
        2, 0,

        4, 5,
        5, 7,
        7, 6,
        6, 4,

        0, 4,
        1, 5,
        3, 7,
        2, 6,
      ],
    })

    // setup GLSL programs
    const textureProgramInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])
    const colorProgramInfo = createProgramInfo(gl, [colorVertexShaderCode, colorFragmentShaderCode])

    // make a 8x8 checkerboard texture
    const checkerboardTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,                // mip level
      gl.LUMINANCE,     // internal format
      8,                // width
      8,                // height
      0,                // border
      gl.LUMINANCE,     // format
      gl.UNSIGNED_BYTE, // type
      new Uint8Array([  // data
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      ]))
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    function loadImageTexture (url) {
      // Create a texture.
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      // Fill the texture with a 1x1 blue pixel.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]))
      // Asynchronously load an image
      AsynLoadImage(url, (image) => {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        // assumes this texture is a power of 2
        gl.generateMipmap(gl.TEXTURE_2D)
        render()
      })
      return texture
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
      }
      img.onerror = function () {
        img.onerror = null
        cb(img)
      }
    }

    const imageTexture = loadImageTexture(fImg)

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // function rand (min, max) {
    //   if (max === undefined) {
    //     max = min
    //     min = 0
    //   }
    //   return min + Math.random() * (max - min)
    // }

    // function emod (x, n) {
    //   return x >= 0 ? (x % n) : ((n - (-x % n)) % n)
    // }

    const settings = {
      cameraX: 2.75,
      cameraY: 5,
      posX: 2.5,
      posY: 4.8,
      posZ: 4.3,
      targetX: 2.5,
      targetY: 0,
      targetZ: 3.5,
      projWidth: 1,
      projHeight: 1,
      perspective: true,
      fieldOfView: 45,
    }

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    // const cameraHeight = 50

    // Uniforms for each object.
    const planeUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],  // lightblue
      u_texture: checkerboardTexture,
      u_world: mat4.create(),
    }
    const sphereUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],  // pink
      u_texture: checkerboardTexture,
      u_world: mat4.create(),
    }
    mat4.fromTranslation(sphereUniforms.u_world, [2, 3, 4])
    // Draw the scene.
    function drawScene (projectionMatrix, cameraMatrix) {
      // Make a view matrix from the camera matrix.
      const viewMatrix = mat4.create()
      mat4.invert(viewMatrix, cameraMatrix)

      const textureWorldMatrix = mat4.create()
      mat4.targetTo(
        textureWorldMatrix,
        [settings.posX, settings.posY, settings.posZ],          // position
        [settings.targetX, settings.targetY, settings.targetZ], // target
        [0, 1, 0],                                              // up
      )

      const textureProjectionMatrix = mat4.create()
      if (settings.perspective) {
        mat4.perspective(textureProjectionMatrix, degToRad(settings.fieldOfView), settings.projWidth / settings.projHeight, 0.1, 200)
      } else {
        mat4.ortho(
          textureProjectionMatrix,
          -settings.projWidth / 2,   // left
          settings.projWidth / 2,   // right
          -settings.projHeight / 2,  // bottom
          settings.projHeight / 2,  // top
          0.1,                      // near
          200                     // far
        )
      }

      let textureMatrix = mat4.create()
      mat4.translate(textureMatrix, textureMatrix, [0.5, 0.5, 0.5])
      mat4.scale(textureMatrix, textureMatrix, [0.5, 0.5, 0.5])
      mat4.multiply(textureMatrix, textureMatrix, textureProjectionMatrix)

      // use the inverse of this world matrix to make
      // a matrix that will transform other positions
      // to be relative this this world space.
      let textureWorldInverseMatrix = mat4.create()
      mat4.invert(textureWorldInverseMatrix, textureWorldMatrix)
      mat4.multiply(
        textureMatrix,
        textureMatrix,
        textureWorldInverseMatrix
      )

      gl.useProgram(textureProgramInfo.program)

      setUniforms(textureProgramInfo, {
        u_view: viewMatrix,
        u_projection: projectionMatrix,
        u_textureMatrix: textureMatrix,
        u_projectedTexture: imageTexture,
      })

      // ------ Draw the sphere --------

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo)

      // Set the uniforms unique to the sphere
      setUniforms(textureProgramInfo, sphereUniforms)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, sphereBufferInfo)

      // ------ Draw the plane --------

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo)

      // Set the uniforms we just computed
      setUniforms(textureProgramInfo, planeUniforms)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, planeBufferInfo)

      // ------ Draw the cube ------

      gl.useProgram(colorProgramInfo.program)

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo)


      // scale the cube in Z so it's really long
      // to represent the texture is being projected to
      // infinity
      let temM4 = mat4.create()
      mat4.invert(temM4, textureProjectionMatrix)
      mat4.multiply(temM4, textureWorldMatrix, temM4)

      // Set the uniforms we just computed
      setUniforms(colorProgramInfo, {
        u_color: [0, 0, 0, 1],
        u_view: viewMatrix,
        u_projection: projectionMatrix,
        u_world: temM4,
      })

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES)
    }

    // Draw the scene.
    function render () {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)
      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, 1, 2000)

      // Compute the camera's matrix using look at.
      const cameraPosition = [settings.cameraX, settings.cameraY, 7]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      const cameraMatrix = mat4.create()
      mat4.targetTo(cameraMatrix, cameraPosition, target, up)

      drawScene(projectionMatrix, cameraMatrix)
    }
    render()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
