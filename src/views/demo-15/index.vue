<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-lighting-spot.html
import { mat4, vec4 } from 'gl-matrix'
import { createProgram, loadShader, createUniformSetters, createAttributeSetters } from '../../utils/tools/web-gl'
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

    const program = createProgram(gl, [loadShader(gl, vertexShaderCode, gl.VERTEX_SHADER), loadShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER)])
    const uniformSetters = createUniformSetters(gl, program)
    const attribSetters  = createAttributeSetters(gl, program)
  },
  beforeDestroy () {
  }
}
</script>
