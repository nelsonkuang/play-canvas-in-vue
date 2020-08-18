<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-less-code-more-fun.html
import { mat4 } from 'gl-matrix'
import { createProgram, loadShader, createUniformSetters, createAttributeSetters, setBuffersAndAttributes, setUniforms, createBufferInfoFromArrays } from '../../utils/tools/web-gl'
import { makeStripeTexture, makeCheckerTexture, makeCircleTexture } from '../../utils/tools/texture'
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
      uniform mat4 u_worldViewProjection;
      uniform vec3 u_lightWorldPos;
      uniform mat4 u_world;
      uniform mat4 u_viewInverse;
      uniform mat4 u_worldInverseTranspose;

      attribute vec4 a_position;
      attribute vec3 a_normal;
      attribute vec2 a_texcoord;

      varying vec4 v_position;
      varying vec2 v_texCoord;
      varying vec3 v_normal;
      varying vec3 v_surfaceToLight;
      varying vec3 v_surfaceToView;

      void main() {
        v_texCoord = a_texcoord;
        v_position = (u_worldViewProjection * a_position);
        v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
        v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
        v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
        gl_Position = v_position;
      }
    `
    // 为片段着色器设计一个关于颜色的输入
    const fragmentShaderCode = `
      precision mediump float;

      varying vec4 v_position;
      varying vec2 v_texCoord;
      varying vec3 v_normal;
      varying vec3 v_surfaceToLight;
      varying vec3 v_surfaceToView;

      uniform vec4 u_lightColor;
      uniform vec4 u_colorMult;
      uniform sampler2D u_diffuse;
      uniform vec4 u_specular;
      uniform float u_shininess;
      uniform float u_specularFactor;

      vec4 lit(float l ,float h, float m) {
        return vec4(1.0,
                    abs(l),
                    (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                    1.0);
      }

      void main() {
        vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
        vec3 a_normal = normalize(v_normal);
        vec3 surfaceToLight = normalize(v_surfaceToLight);
        vec3 surfaceToView = normalize(v_surfaceToView);
        vec3 halfVector = normalize(surfaceToLight + surfaceToView);
        vec4 litR = lit(dot(a_normal, surfaceToLight),
                          dot(a_normal, halfVector), u_shininess);
        vec4 outColor = vec4((
        u_lightColor * (diffuseColor * litR.y * u_colorMult +
                      u_specular * litR.z * u_specularFactor)).rgb,
            diffuseColor.a);
        gl_FragColor = outColor;
      //  gl_FragColor = vec4(litR.yyy, 1);
      }
    `

    // a single triangle
    const arrays = {
      position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
      texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1], },
      normal: { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1], },
    }

    const bufferInfo = createBufferInfoFromArrays(gl, arrays)

    const program = createProgram(gl, [loadShader(gl, vertexShaderCode, gl.VERTEX_SHADER), loadShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER)])
    const uniformSetters = createUniformSetters(gl, program)
    const attribSetters = createAttributeSetters(gl, program)

    function degToRad (d) {
      return d * Math.PI / 180
    }

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    // const cameraHeight = 50

    const uniformsThatAreTheSameForAllObjects = {
      u_lightWorldPos: [-50, 30, 100],
      u_viewInverse: mat4.create(),
      u_lightColor: [1, 1, 1, 1],
    }

    const uniformsThatAreComputedForEachObject = {
      u_worldViewProjection: mat4.create(),
      u_world: mat4.create(),
      u_worldInverseTranspose: mat4.create(),
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
      setBuffersAndAttributes(gl, attribSetters, bufferInfo);

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
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements)
      })

      animationID = requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
