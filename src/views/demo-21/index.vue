<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-scene-graph.html
import { mat4 } from 'gl-matrix'
import { createFlattenedFunc, createCubeVertices } from '../../utils/tools/primitives'
import { createProgramInfo, setBuffersAndAttributes, setUniforms } from '../../utils/tools/web-gl'
import VNode from '../../utils/classes/Webgl/VNode'
import TRS from '../../utils/classes/Webgl/TRS'
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

      uniform vec4 u_colorMult;
      uniform vec4 u_colorOffset;

      void main() {
        gl_FragColor = v_color * u_colorMult + u_colorOffset;
      }
    `

    const createCubeWithVertexColorsBufferInfo = createFlattenedFunc(createCubeVertices)

    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    const cubeBufferInfo = createCubeWithVertexColorsBufferInfo(gl, 1)

    // setup GLSL programs
    const mainProgramInfo = createProgramInfo(gl, [vertexShaderCode, fragmentShaderCode])

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

    // const cameraAngleRadians = degToRad(0)
    const fieldOfViewRadians = degToRad(60)
    // const cameraHeight = 50

    const objectsToDraw = []
    const objects = []
    const nodeInfosByName = {}

    // Let's make all the nodes
    const blockGuyNodeDescriptions =
      {
        name: 'point between feet',
        draw: false,
        children: [
          {
            name: 'waist',
            translation: [0, 3, 0],
            children: [
              {
                name: 'torso',
                translation: [0, 2, 0],
                children: [
                  {
                    name: 'neck',
                    translation: [0, 1, 0],
                    children: [
                      {
                        name: 'head',
                        translation: [0, 1, 0],
                      },
                    ],
                  },
                  {
                    name: 'left-arm',
                    translation: [-1, 0, 0],
                    children: [
                      {
                        name: 'left-forearm',
                        translation: [-1, 0, 0],
                        children: [
                          {
                            name: 'left-hand',
                            translation: [-1, 0, 0],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    name: 'right-arm',
                    translation: [1, 0, 0],
                    children: [
                      {
                        name: 'right-forearm',
                        translation: [1, 0, 0],
                        children: [
                          {
                            name: 'right-hand',
                            translation: [1, 0, 0],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: 'left-leg',
                translation: [-1, -1, 0],
                children: [
                  {
                    name: 'left-calf',
                    translation: [0, -1, 0],
                    children: [
                      {
                        name: 'left-foot',
                        translation: [0, -1, 0],
                      },
                    ],
                  }
                ],
              },
              {
                name: 'right-leg',
                translation: [1, -1, 0],
                children: [
                  {
                    name: 'right-calf',
                    translation: [0, -1, 0],
                    children: [
                      {
                        name: 'right-foot',
                        translation: [0, -1, 0],
                      },
                    ],
                  }
                ],
              },
            ],
          },
        ],
      }

    function makeNode (nodeDescription) {
      const trs = new TRS()
      const node = new VNode(trs)
      nodeInfosByName[nodeDescription.name] = {
        trs: trs,
        node: node,
      }
      trs.translation = nodeDescription.translation || trs.translation
      if (nodeDescription.draw !== false) {
        node.drawInfo = {
          uniforms: {
            u_colorOffset: [0, 0, 0.6, 0],
            u_colorMult: [0.4, 0.4, 0.4, 1],
            u_matrix: mat4.create()
          },
          programInfo: mainProgramInfo,
          bufferInfo: cubeBufferInfo,
        }
        objectsToDraw.push(node.drawInfo)
        objects.push(node)
      }
      makeNodes(nodeDescription.children).forEach((child) => {
        child.setParent(node)
      })
      return node
    }

    function makeNodes (nodeDescriptions) {
      return nodeDescriptions ? nodeDescriptions.map(makeNode) : []
    }

    const scene = makeNode(blockGuyNodeDescriptions)

    drawScene(0)

    // Draw the scene.
    function drawScene (time) {
      time *= 0.001

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)

      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Compute the projection matrix
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
      const zNear = 1
      const zFar = 2000
      let projectionMatrix = mat4.create()
      mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

      // Compute the camera's matrix
      const cameraPosition = [4, 3.5, 10]
      const target = [0, 3.5, 0]
      const up = [0, 1, 0]
      // 2. Compute the view's matrix using look at directly.
      let viewMatrix = mat4.create()
      mat4.lookAt(viewMatrix, cameraPosition, target, up)

      // Compute a view projection matrix
      let viewProjectionMatrix = mat4.create()
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

      // update the local matrices for each object.
      scene.updateWorldMatrix()

      let adjust
      let speed = 3
      let c = time * speed

      adjust = Math.abs(Math.sin(c))
      nodeInfosByName['point between feet'].trs.translation[1] = adjust
      adjust = Math.sin(c)
      nodeInfosByName['left-leg'].trs.rotation[0] = adjust
      nodeInfosByName['right-leg'].trs.rotation[0] = -adjust
      adjust = Math.sin(c + 0.1) * 0.4
      nodeInfosByName['left-calf'].trs.rotation[0] = -adjust
      nodeInfosByName['right-calf'].trs.rotation[0] = adjust
      adjust = Math.sin(c + 0.1) * 0.4
      nodeInfosByName['left-foot'].trs.rotation[0] = -adjust
      nodeInfosByName['right-foot'].trs.rotation[0] = adjust

      adjust = Math.sin(c) * 0.4
      nodeInfosByName['left-arm'].trs.rotation[2] = adjust
      nodeInfosByName['right-arm'].trs.rotation[2] = adjust
      adjust = Math.sin(c + 0.1) * 0.4
      nodeInfosByName['left-forearm'].trs.rotation[2] = adjust
      nodeInfosByName['right-forearm'].trs.rotation[2] = adjust
      adjust = Math.sin(c - 0.1) * 0.4
      nodeInfosByName['left-hand'].trs.rotation[2] = adjust
      nodeInfosByName['right-hand'].trs.rotation[2] = adjust

      adjust = Math.sin(c) * 0.4
      nodeInfosByName['waist'].trs.rotation[1] = adjust
      adjust = Math.sin(c) * 0.4
      nodeInfosByName['torso'].trs.rotation[1] = adjust
      adjust = Math.sin(c + 0.25) * 0.4
      nodeInfosByName['neck'].trs.rotation[1] = adjust
      adjust = Math.sin(c + 0.5) * 0.4
      nodeInfosByName['head'].trs.rotation[1] = adjust
      adjust = Math.cos(c * 2) * 0.4
      nodeInfosByName['head'].trs.rotation[0] = adjust

      // Compute all the matrices for rendering
      objects.forEach((object) => {
        mat4.multiply(object.drawInfo.uniforms.u_matrix, viewProjectionMatrix, object.worldMatrix)
      })

      // ------ Draw the objects --------

      let lastUsedProgramInfo = null
      let lastUsedBufferInfo = null

      objectsToDraw.forEach((object) => {
        const programInfo = object.programInfo
        const bufferInfo = object.bufferInfo
        let bindBuffers = false

        if (programInfo !== lastUsedProgramInfo) {
          lastUsedProgramInfo = programInfo
          gl.useProgram(programInfo.program)

          // We have to rebind buffers when changing programs because we
          // only bind buffers the program uses. So if 2 programs use the same
          // bufferInfo but the 1st one uses only positions the when the
          // we switch to the 2nd one some of the attributes will not be on.
          // 更换程序后要重新绑定缓冲，因为只需要绑定程序要用的缓冲。
          // 如果两个程序使用相同的bufferInfo但是第一个只用位置数据，
          // 当我们从第一个程序切换到第二个时，有些属性就不存在。
          bindBuffers = true
        }

        // Setup all the needed attributes.
        // 如果绘制的形状/几何体/顶点 是之前绘制过的，相同的参数就不必再设置一遍
        if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
          lastUsedBufferInfo = bufferInfo
          setBuffersAndAttributes(gl, programInfo, bufferInfo)
        }

        // Set the uniforms.
        setUniforms(programInfo, object.uniforms)

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements)
      })

      requestAnimationFrame(drawScene)
    }
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
