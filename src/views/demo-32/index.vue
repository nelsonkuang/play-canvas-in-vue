<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-shadows.html
import { mat4 } from 'gl-matrix'
import { createBufferInfoFunc, createSphereVertices, createPlaneVertices, createCubeVertices } from '../../utils/tools/primitives'
import { createProgramInfo, setBuffersAndAttributes, setUniforms, createBufferInfoFromArrays, drawBufferInfo } from '../../utils/tools/web-gl'
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

    if (!gl) {
      return
    }

    const ext = gl.getExtension('WEBGL_depth_texture')
    if (!ext) {
      return alert('need WEBGL_depth_texture')  // eslint-disable-line
    }

    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;
      attribute vec3 a_normal;

      uniform vec3 u_lightWorldPosition;
      uniform vec3 u_viewWorldPosition;

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_world;
      uniform mat4 u_textureMatrix;

      varying vec2 v_texcoord;
      varying vec4 v_projectedTexcoord;
      varying vec3 v_normal;

      varying vec3 v_surfaceToLight;
      varying vec3 v_surfaceToView;

      void main() {
        // Multiply the position by the matrix.
        vec4 worldPosition = u_world * a_position;

        gl_Position = u_projection * u_view * worldPosition;

        // Pass the texture coord to the fragment shader.
        v_texcoord = a_texcoord;

        v_projectedTexcoord = u_textureMatrix * worldPosition;

        // orient the normals and pass to the fragment shader
        v_normal = mat3(u_world) * a_normal;

        // compute the world position of the surface
        vec3 surfaceWorldPosition = (u_world * a_position).xyz;

        // compute the vector of the surface to the light
        // and pass it to the fragment shader
        v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

        // compute the vector of the surface to the view/camera
        // and pass it to the fragment shader
        v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      // Passed in from the vertex shader.
      varying vec2 v_texcoord;
      varying vec4 v_projectedTexcoord;
      varying vec3 v_normal;
      varying vec3 v_surfaceToLight;
      varying vec3 v_surfaceToView;

      uniform vec4 u_colorMult;
      uniform sampler2D u_texture;
      uniform sampler2D u_projectedTexture;
      uniform float u_bias;
      uniform float u_shininess;
      uniform vec3 u_lightDirection;
      uniform float u_innerLimit;          // in dot space
      uniform float u_outerLimit;          // in dot space

      void main() {
        // because v_normal is a varying it's interpolated
        // so it will not be a unit vector. Normalizing it
        // will make it a unit vector again
        vec3 normal = normalize(v_normal);

        vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
        vec3 surfaceToViewDirection = normalize(v_surfaceToView);
        vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

        float dotFromDirection = dot(surfaceToLightDirection,
                                    -u_lightDirection);
        float limitRange = u_innerLimit - u_outerLimit;
        float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
        float light = inLight * dot(normal, surfaceToLightDirection);
        float specular = inLight * pow(dot(normal, halfVector), u_shininess);

        vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
        float currentDepth = projectedTexcoord.z + u_bias;

        bool inRange =
            projectedTexcoord.x >= 0.0 &&
            projectedTexcoord.x <= 1.0 &&
            projectedTexcoord.y >= 0.0 &&
            projectedTexcoord.y <= 1.0;

        // the 'r' channel has the depth values
        float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
        float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

        vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
        gl_FragColor = vec4(
            texColor.rgb * light * shadowLight +
            specular * shadowLight,
            texColor.a);
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
    const createCubeBufferInfo = createBufferInfoFunc(createCubeVertices)

    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    const sphereBufferInfo = createSphereBufferInfo(
      gl,
      1,  // radius
      32, // subdivisions around
      24,  // subdivisions down
    )
    const planeBufferInfo = createPlaneBufferInfo(
      gl,
      20,  // width
      20,  // height
      1,   // subdivisions across
      1,   // subdivisions down
    )

    const cubeBufferInfo = createCubeBufferInfo(
      gl,
      2,  // size
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

    const depthTexture = gl.createTexture()
    const depthTextureSize = 512
    gl.bindTexture(gl.TEXTURE_2D, depthTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,      // target
      0,                  // mip level
      gl.DEPTH_COMPONENT, // internal format
      depthTextureSize,   // width
      depthTextureSize,   // height
      0,                  // border
      gl.DEPTH_COMPONENT, // format
      gl.UNSIGNED_INT,    // type
      null)               // data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const depthFramebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,       // target
      gl.DEPTH_ATTACHMENT,  // attachment point
      gl.TEXTURE_2D,        // texture target
      depthTexture,         // texture
      0)                    // mip level

    // create a color texture of the same size as the depth texture
    // see article why this is needed_
    const unusedTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, unusedTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      depthTextureSize,
      depthTextureSize,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // attach it to the framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,        // target
      gl.COLOR_ATTACHMENT0,  // attachment point
      gl.TEXTURE_2D,         // texture target
      unusedTexture,         // texture
      0)                     // mip level

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
      cameraX: 6,
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
      fieldOfView: 120,
      bias: -0.006,
    }

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    // const cameraHeight = 50

    // Uniforms for each object.
    const planeUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],  // lightblue
      u_color: [1, 0, 0, 1],
      u_texture: checkerboardTexture,
      u_world: mat4.create(),
    }
    const sphereUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],  // pink
      u_color: [0, 0, 1, 1],
      u_texture: checkerboardTexture,
      u_world: mat4.create(),
    }

    const cubeUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],  // lightgreen
      u_color: [0, 0, 1, 1],
      u_texture: checkerboardTexture,
      u_world: mat4.create(),
    }

    mat4.fromTranslation(sphereUniforms.u_world, [2, 3, 4])
    mat4.fromTranslation(cubeUniforms.u_world, [3, 1, 0])

    // Draw the scene.
    function drawScene (
      projectionMatrix,
      cameraMatrix,
      textureMatrix,
      lightWorldMatrix,
      programInfo) {
      // Make a view matrix from the camera matrix.
      const viewMatrix = mat4.create()
      mat4.invert(viewMatrix, cameraMatrix)

      gl.useProgram(programInfo.program)

      setUniforms(programInfo, {
        u_view: viewMatrix,
        u_projection: projectionMatrix,
        u_bias: settings.bias,
        u_textureMatrix: textureMatrix,
        u_projectedTexture: depthTexture,
        u_shininess: 150,
        u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
        u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
        u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
        u_lightWorldPosition: [settings.posX, settings.posY, settings.posZ],
        u_viewWorldPosition: cameraMatrix.slice(12, 15),
      })
      // ------ Draw the sphere --------

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo)

      // Set the uniforms unique to the sphere
      setUniforms(programInfo, sphereUniforms)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, sphereBufferInfo)

      // ------ Draw the cube --------

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, cubeBufferInfo)

      // Set the uniforms unique to the cube
      setUniforms(programInfo, cubeUniforms)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, cubeBufferInfo)

      // ------ Draw the plane --------

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, programInfo, planeBufferInfo)

      // Set the uniforms we just computed
      setUniforms(programInfo, planeUniforms)

      // calls gl.drawArrays or gl.drawElements
      drawBufferInfo(gl, planeBufferInfo)
    }

    // Draw the scene.
    function render () {
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // first draw from the POV of the light
      const lightWorldMatrix = mat4.create()
      mat4.targetTo(
        lightWorldMatrix,
        [settings.posX, settings.posY, settings.posZ],          // position
        [settings.targetX, settings.targetY, settings.targetZ], // target
        [0, 1, 0],                                              // up
      )

      const lightProjectionMatrix = mat4.create()
      if (settings.perspective) {
        mat4.perspective(lightProjectionMatrix, degToRad(settings.fieldOfView), settings.projWidth / settings.projHeight, 0.5, 10)
      } else {
        mat4.ortho(
          lightProjectionMatrix,
          -settings.projWidth / 2,   // left
          settings.projWidth / 2,   // right
          -settings.projHeight / 2,  // bottom
          settings.projHeight / 2,  // top
          0.5,                      // near
          10                     // far
        )
      }

      // draw to the depth texture
      gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer)
      gl.viewport(0, 0, depthTextureSize, depthTextureSize)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      drawScene(
        lightProjectionMatrix,
        lightWorldMatrix,
        mat4.create(),
        lightWorldMatrix,
        colorProgramInfo)

      // now draw scene to the canvas projecting the depth texture into the scene
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      let textureMatrix = mat4.create()
      mat4.translate(textureMatrix, textureMatrix, [0.5, 0.5, 0.5])
      mat4.scale(textureMatrix, textureMatrix, [0.5, 0.5, 0.5])
      mat4.multiply(textureMatrix, textureMatrix, lightProjectionMatrix)
      // use the inverse of this world matrix to make
      // a matrix that will transform other positions
      // to be relative this this world space.
      const lightWorldInverseMatrix = mat4.create()
      mat4.invert(lightWorldInverseMatrix, lightWorldMatrix)
      mat4.multiply(textureMatrix, textureMatrix, lightWorldInverseMatrix)


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

      drawScene(
        projectionMatrix,
        cameraMatrix,
        textureMatrix,
        lightWorldMatrix,
        textureProgramInfo)
      // ------ Draw the frustum ------
      {
        const viewMatrix = mat4.create()
        mat4.invert(viewMatrix, cameraMatrix)

        gl.useProgram(colorProgramInfo.program)

        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo)

        // scale the cube in Z so it's really long
        // to represent the texture is being projected to
        // infinity
        const m4 = mat4.create()
        mat4.invert(m4, lightProjectionMatrix)
        mat4.multiply(m4, lightWorldMatrix, m4)

        // Set the uniforms we just computed
        setUniforms(colorProgramInfo, {
          u_color: [1, 1, 1, 1],
          u_view: viewMatrix,
          u_projection: projectionMatrix,
          u_world: m4,
        })

        // calls gl.drawArrays or gl.drawElements
        drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES)
      }
    }
    render()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
