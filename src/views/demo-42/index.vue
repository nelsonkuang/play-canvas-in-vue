<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-visualizing-the-camera.html
import { mat4 } from 'gl-matrix'
import { createProgramInfo, setUniforms, setBuffersAndAttributes, createBufferInfoFromArrays, drawBufferInfo } from '../../utils/tools/web-gl'
import { createBufferInfoFunc, create3DFVertices } from '../../utils/tools/primitives'
// let animationID = null
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

        // Pass the vertex color to the fragment shader.
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
    const solidColorShaderCode = `
      attribute vec4 a_position;

      uniform mat4 u_matrix;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = u_matrix * a_position;
      }
    `
    const solidColorFragmentShaderCode = `
      precision mediump float;

      uniform vec4 u_color;

      void main() {
        gl_FragColor = u_color;
      }
    `
    const create3DFBufferInfo = createBufferInfoFunc(create3DFVertices)
    // Create data for 'F'
    const fBufferInfo = create3DFBufferInfo(gl)

    function createClipspaceCubeBufferInfo (gl) {
      // first let's add a cube. It goes from 1 to 3
      // because cameras look down -Z so we want
      // the camera to start at Z = 0. We'll put a
      // a cone in front of this cube opening
      // toward -Z
      const positions = [
        -1, -1, -1,  // cube vertices
        1, -1, -1,
        -1, 1, -1,
        1, 1, -1,
        -1, -1, 1,
        1, -1, 1,
        -1, 1, 1,
        1, 1, 1,
      ];
      const indices = [
        0, 1, 1, 3, 3, 2, 2, 0, // cube indices
        4, 5, 5, 7, 7, 6, 6, 4,
        0, 4, 1, 5, 3, 7, 2, 6,
      ];
      return createBufferInfoFromArrays(gl, {
        position: positions,
        indices,
      })
    }

    // create geometry for a camera
    function createCameraBufferInfo (gl, scale = 1) {
      // first let's add a cube. It goes from 1 to 3
      // because cameras look down -Z so we want
      // the camera to start at Z = 0.
      // We'll put a cone in front of this cube opening
      // toward -Z
      const positions = [
        -1, -1, 1,  // cube vertices
        1, -1, 1,
        -1, 1, 1,
        1, 1, 1,
        -1, -1, 3,
        1, -1, 3,
        -1, 1, 3,
        1, 1, 3,
        0, 0, 1,  // cone tip
      ]
      const indices = [
        0, 1, 1, 3, 3, 2, 2, 0, // cube indices
        4, 5, 5, 7, 7, 6, 6, 4,
        0, 4, 1, 5, 3, 7, 2, 6,
      ]
      // add cone segments
      const numSegments = 6
      const coneBaseIndex = positions.length / 3
      const coneTipIndex = coneBaseIndex - 1
      for (let i = 0; i < numSegments; ++i) {
        const u = i / numSegments
        const angle = u * Math.PI * 2
        const x = Math.cos(angle)
        const y = Math.sin(angle)
        positions.push(x, y, 0)
        // line from tip to edge
        indices.push(coneTipIndex, coneBaseIndex + i)
        // line from point on edge to next point on edge
        indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments)
      }
      positions.forEach((v, ndx) => {
        positions[ndx] *= scale
      })
      return createBufferInfoFromArrays(gl, {
        position: positions,
        indices,
      })
    }

    const cameraScale = 20
    const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale)

    const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl)

    // setup GLSL programs
    const vertexColorProgramInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])
    const solidColorProgramInfo = createProgramInfo(gl, [solidColorShaderCode, solidColorFragmentShaderCode])

    function degToRad (d) {
      return d * Math.PI / 180
    }

    const settings = {
      rotation: 150,  // in degrees
      cam1FieldOfView: 60,  // in degrees
      cam1PosX: 0,
      cam1PosY: 0,
      cam1PosZ: -200,
      cam1Near: 30,
      cam1Far: 500,
    }

    function drawScene (projectionMatrix, cameraMatrix, worldMatrix) {
      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Make a view matrix from the camera matrix.
      const viewMatrix = mat4.create()
      mat4.invert(viewMatrix, cameraMatrix)

      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      let worldViewProjectionMatrix = mat4.create()
      mat4.multiply(worldViewProjectionMatrix, viewProjectionMatrix, worldMatrix);

      gl.useProgram(vertexColorProgramInfo.program);

      // ------ Draw the F --------

      // Setup all the needed attributes.
      setBuffersAndAttributes(gl, vertexColorProgramInfo, fBufferInfo);

      // Set the uniforms
      setUniforms(vertexColorProgramInfo, {
        u_matrix: worldViewProjectionMatrix,
      })

      drawBufferInfo(gl, fBufferInfo)
    }

    function render () {
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.SCISSOR_TEST)

      // we're going to split the view in 2
      const effectiveWidth = gl.canvas.clientWidth / 2
      const aspect = effectiveWidth / gl.canvas.clientHeight
      const near = 1
      const far = 2000

      // Compute a perspective projection matrix
      const perspectiveProjectionMatrix = mat4.create()
      mat4.perspective(perspectiveProjectionMatrix,
        degToRad(settings.cam1FieldOfView),
        aspect,
        settings.cam1Near,
        settings.cam1Far)

      // Compute the camera's matrix using look at.
      const cameraPosition = [
        settings.cam1PosX,
        settings.cam1PosY,
        settings.cam1PosZ,
      ]
      const target = [0, 0, 0]
      const up = [0, 1, 0]
      const cameraMatrix = mat4.create()
      mat4.targetTo(cameraMatrix, cameraPosition, target, up)

      let worldMatrix = mat4.create()
      mat4.fromYRotation(worldMatrix, degToRad(settings.rotation))
      mat4.rotateX(worldMatrix, worldMatrix, degToRad(settings.rotation))
      // center the 'F' around its origin
      worldMatrix = mat4.translate(worldMatrix, worldMatrix, [-35, -75, -5])

      const { width, height } = gl.canvas
      const leftWidth = width / 2 | 0

      // draw on the left with orthographic camera
      gl.viewport(0, 0, leftWidth, height)
      gl.scissor(0, 0, leftWidth, height)
      gl.clearColor(1, 0.8, 0.8, 1)

      drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix)

      // draw on right with perspective camera
      const rightWidth = width - leftWidth;
      gl.viewport(leftWidth, 0, rightWidth, height)
      gl.scissor(leftWidth, 0, rightWidth, height)
      gl.clearColor(0.8, 0.8, 1, 1)

      const perspectiveProjectionMatrix2 = mat4.create()
      mat4.perspective(perspectiveProjectionMatrix2, degToRad(60), aspect, near, far)

      // Compute the camera's matrix using look at.
      const cameraPosition2 = [-600, 400, -400]
      const target2 = [0, 0, 0]
      const cameraMatrix2 = mat4.create()
      mat4.targetTo(cameraMatrix2, cameraPosition2, target2, up)

      drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix)

      // draw object to represent first camera
      {
        // Make a view matrix from the camera matrix.
        const viewMatrix = mat4.create()
        mat4.invert(viewMatrix, cameraMatrix2)

        let viewProjectionMatrix = mat4.create()
        mat4.multiply(viewProjectionMatrix, perspectiveProjectionMatrix2, viewMatrix)
        // use the first's camera's matrix as the matrix to position
        // the camera's representative in the scene
        let cameraViewProjectionMatrix = mat4.create()
        mat4.multiply(cameraViewProjectionMatrix, viewProjectionMatrix, cameraMatrix)

        gl.useProgram(solidColorProgramInfo.program)

        // ------ Draw the Camera Representation --------

        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo)

        // Set the uniforms
        setUniforms(solidColorProgramInfo, {
          u_matrix: cameraViewProjectionMatrix,
          u_color: [0, 0, 0, 1],
        })

        drawBufferInfo(gl, cameraBufferInfo, gl.LINES)

        // ----- Draw the frustum -------
        let m4 = mat4.create()
        mat4.invert(m4, perspectiveProjectionMatrix)
        mat4.multiply(m4, cameraViewProjectionMatrix, m4)

        // Setup all the needed attributes.
        setBuffersAndAttributes(gl, solidColorProgramInfo, clipspaceCubeBufferInfo)

        // Set the uniforms
        setUniforms(solidColorProgramInfo, {
          u_matrix: m4,
          u_color: [0, 0, 0, 1],
        });

        drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES)
      }
    }
    render()
  },
  beforeDestroy () {
    // animationID && cancelAnimationFrame(animationID)
  }
}
</script>
