<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html
import { mat4 } from 'gl-matrix'
import { createProgram, loadShader, resizeCanvasToDisplaySize } from '../../utils/tools/web-gl'
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
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
      return alert('need ANGLE_instanced_arrays');  // eslint-disable-line
    }

    const vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec4 color;
      attribute mat4 matrix;
      uniform mat4 projection;
      uniform mat4 view;

      varying vec4 v_color;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = projection * view * matrix * a_position;

        // Pass the vertex color to the fragment shader.
        v_color = color;
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

    const program = createProgram(gl, [loadShader(gl, vertexShaderCode, gl.VERTEX_SHADER), loadShader(gl, fragmentShaderCode, gl.FRAGMENT_SHADER)])

    // look up where the vertex data needs to go.
    const positionLoc = gl.getAttribLocation(program, 'a_position')
    const colorLoc = gl.getAttribLocation(program, 'color')
    const matrixLoc = gl.getAttribLocation(program, 'matrix')

    // lookup uniforms
    const projectionLoc = gl.getUniformLocation(program, 'projection')
    const viewLoc = gl.getUniformLocation(program, 'view')

    // Create a buffer to put positions in
    const positionBuffer = gl.createBuffer()
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -0.1, 0.4,
      -0.1, -0.4,
      0.1, -0.4,
      0.1, -0.4,
      -0.1, 0.4,
      0.1, 0.4,
      0.4, -0.1,
      -0.4, -0.1,
      -0.4, 0.1,
      -0.4, 0.1,
      0.4, -0.1,
      0.4, 0.1,
    ]), gl.STATIC_DRAW)

    const numVertices = 12
    // setup matrixes, one per instance
    const numInstances = 5
    // make a typed array with one view per matrix
    const matrixData = new Float32Array(numInstances * 16);
    const matrices = [];
    for (let i = 0; i < numInstances; ++i) {
      const byteOffsetToMatrix = i * 16 * 4;
      const numFloatsForView = 16;
      matrices.push(new Float32Array(
        matrixData.buffer,
        byteOffsetToMatrix,
        numFloatsForView));
    }

    const matrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);

    // setup colors, one per instance
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([
        1, 0, 0, 1,  // red
        0, 1, 0, 1,  // green
        0, 0, 1, 1,  // blue
        1, 0, 1, 1,  // magenta
        0, 1, 1, 1,  // cyan
      ]),
      gl.STATIC_DRAW)

    function render (time) {
      time *= 0.001; // seconds
      resizeCanvasToDisplaySize(gl.canvas);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.useProgram(program);

      // set the view and projection matrices since
      // they are shared by all instances
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const projection = mat4.create()
      const view = mat4.create()
      mat4.ortho(projection, -aspect, aspect, -1, 1, -1, 1)
      mat4.fromZRotation(view, time * .1)
      gl.uniformMatrix4fv(projectionLoc, false,
        projection)
      gl.uniformMatrix4fv(viewLoc, false, view)

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

      // update all the matrices
      matrices.forEach((mat, ndx) => {
        mat4.fromTranslation(mat, [-0.5 + ndx * 0.25, 0, 0])
        mat4.rotateZ(mat, mat, time * (0.1 + 0.1 * ndx))
      })

      // upload the new matrix data
      gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData)

      // set all 4 attributes for matrix
      const bytesPerMatrix = 4 * 16;
      for (let i = 0; i < 4; ++i) {
        const loc = matrixLoc + i;
        gl.enableVertexAttribArray(loc)
        // note the stride and offset
        const offset = i * 16;  // 4 floats per row, 4 bytes per float
        gl.vertexAttribPointer(
          loc,              // location
          4,                // size (num values to pull from buffer per iteration)
          gl.FLOAT,         // type of data in buffer
          false,            // normalize
          bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
          offset,           // offset in buffer
        );
        // this line says this attribute only changes for each 1 instance
        ext.vertexAttribDivisorANGLE(loc, 1)
      }

      // set attribute for color
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
      // this line says this attribute only changes for each 1 instance
      ext.vertexAttribDivisorANGLE(colorLoc, 1);

      ext.drawArraysInstancedANGLE(
        gl.TRIANGLES,
        0,             // offset
        numVertices,   // num vertices per instance
        numInstances,  // num instances
      );
      requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
