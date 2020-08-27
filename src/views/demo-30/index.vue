<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-scene-graph.html
import { mat4, vec3 } from 'gl-matrix'
import { createProgramInfo, /* compose, */ /* setBuffersAndAttributes, setUniforms, drawBufferInfo */ /* decompose */ } from '../../utils/tools/web-gl'
import Node from '../../utils/classes/Webgl/VNode2'
import TRS from '../../utils/classes/Webgl/TRS2'
import MeshRenderer from '../../utils/classes/Webgl/MeshRenderer'
let animationID = null
export default {
  data () {
    return {
    }
  },
  computed: {
  },
  mounted () {
    const This = this
    async function main () {
      const canvas = This.$refs.canvas
      const cWidth = window.innerWidth
      const cHeight = window.innerHeight
      canvas.setAttribute('width', `${cWidth}px`)
      canvas.setAttribute('height', `${cHeight}px`)
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const ext = gl.getExtension('OES_texture_float')
      if (!ext) {
        return  // the extension doesn't exist on this device
      }
      // 为片段着色器设计一个关于颜色的输入
      const fragmentShaderCode = `
        precision mediump float;

        varying vec3 v_normal;

        uniform vec4 u_diffuse;
        uniform vec3 u_lightDirection;

        void main () {
          vec3 normal = normalize(v_normal);
          float light = dot(u_lightDirection, normal) * .5 + .5;
          gl_FragColor = vec4(u_diffuse.rgb * light, u_diffuse.a);
        }
      `

      const meshVSCode = `
        attribute vec4 a_POSITION;
        attribute vec3 a_NORMAL;

        uniform mat4 u_projection;
        uniform mat4 u_view;
        uniform mat4 u_world;

        varying vec3 v_normal;

        void main() {
          gl_Position = u_projection * u_view * u_world * a_POSITION;
          v_normal = mat3(u_world) * a_NORMAL;
        }
      `

      // setup GLSL programs
      // compiles and links the shaders, looks up attribute and uniform locations
      const meshProgramInfo = createProgramInfo(gl, [meshVSCode, fragmentShaderCode])

      function throwNoKey (key) {
        throw new Error(`no key: ${key}`)
      }

      const accessorTypeToNumComponentsMap = {
        'SCALAR': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4,
        'MAT2': 4,
        'MAT3': 9,
        'MAT4': 16,
      }

      function degToRad (d) {
        return d * Math.PI / 180
      }

      function accessorTypeToNumComponents (type) {
        return accessorTypeToNumComponentsMap[type] || throwNoKey(type)
      }

      // Given an accessor index return a WebGLBuffer and a stride
      function getAccessorAndWebGLBuffer (gl, gltf, accessorIndex) {
        const accessor = gltf.accessors[accessorIndex]
        const bufferView = gltf.bufferViews[accessor.bufferView]
        if (!bufferView.webglBuffer) {
          const buffer = gl.createBuffer()
          const target = bufferView.target || gl.ARRAY_BUFFER
          const arrayBuffer = gltf.buffers[bufferView.buffer]
          const data = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength)
          gl.bindBuffer(target, buffer)
          gl.bufferData(target, data, gl.STATIC_DRAW)
          bufferView.webglBuffer = buffer
        }
        return {
          accessor,
          buffer: bufferView.webglBuffer,
          stride: bufferView.stride || 0,
        }
      }

      async function loadGLTF (url) {
        const gltf = await loadJSON(url)

        // load all the referenced files relative to the gltf file
        const baseURL = new URL(url, location.href)
        gltf.buffers = await Promise.all(gltf.buffers.map((buffer) => {
          const url = new URL(buffer.uri, baseURL.href)
          return loadBinary(url.href)
        }))

        const defaultMaterial = {
          uniforms: {
            u_diffuse: [.5, .8, 1, 1],
          },
        }

        // setup meshes
        gltf.meshes.forEach((mesh) => {
          mesh.primitives.forEach((primitive) => {
            const attribs = {}
            let numElements
            for (const [attribName, index] of Object.entries(primitive.attributes)) {
              const { accessor, buffer, stride } = getAccessorAndWebGLBuffer(gl, gltf, index)
              numElements = accessor.count
              attribs[`a_${attribName}`] = {
                buffer,
                type: accessor.componentType,
                numComponents: accessorTypeToNumComponents(accessor.type),
                stride,
                offset: accessor.byteOffset | 0,
              }
            }

            const bufferInfo = {
              attribs,
              numElements,
            }

            if (primitive.indices !== undefined) {
              const { accessor, buffer } = getAccessorAndWebGLBuffer(gl, gltf, primitive.indices)
              bufferInfo.numElements = accessor.count
              bufferInfo.indices = buffer
              bufferInfo.elementType = accessor.componentType
            }

            primitive.bufferInfo = bufferInfo

            // save the material info for this primitive
            primitive.material = gltf.materials && gltf.materials[primitive.material] || defaultMaterial
          })
        })

        const origNodes = gltf.nodes
        gltf.nodes = gltf.nodes.map((n) => {
          const { name, mesh, translation, rotation, scale } = n
          const trs = new TRS(translation, rotation, scale)
          const node = new Node(trs, name)
          const realMesh = gltf.meshes[mesh]
          if (realMesh) {
            node.drawables.push(new MeshRenderer(realMesh))
          }
          return node
        })

        // arrange nodes into graph
        gltf.nodes.forEach((node, ndx) => {
          const children = origNodes[ndx].children
          if (children) {
            addChildren(gltf.nodes, node, children)
          }
        })

        // setup scenes
        for (const scene of gltf.scenes) {
          scene.root = new Node(new TRS(), scene.name)
          addChildren(gltf.nodes, scene.root, scene.nodes)
        }

        return gltf
      }

      function addChildren (nodes, node, childIndices) {
        childIndices.forEach((childNdx) => {
          const child = nodes[childNdx]
          child.setParent(node)
        })
      }

      async function loadFile (url, typeFunc) {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`could not load: ${url}`)
        }
        return await response[typeFunc]()
      }

      async function loadBinary (url) {
        return loadFile(url, 'arrayBuffer')
      }

      async function loadJSON (url) {
        return loadFile(url, 'json')
      }

      const gltf = await loadGLTF('./static/models/killer_whale/whale.CYCLES.gltf')

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

      drawScene(0)

      // Draw the scene.
      function drawScene (time) {
        time *= 0.001

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        gl.enable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)

        // Clear the canvas AND the depth buffer.
        gl.clearColor(.1, .1, .1, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // Compute the projection matrix
        const fieldOfViewRadians = degToRad(60)
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        const zNear = 1
        const zFar = 2000
        let projectionMatrix = mat4.create()
        mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)

        // Compute the camera's matrix
        // const cameraPosition = [10, 0, -5]
        // const target = [0, 0, -10]
        const cameraRadius = 10
        const up = [0, 1, 0]
        // for debugging .. see article
        const cameraPosition = [Math.cos(time * .1) * cameraRadius, 0, Math.sin(time * .1) * cameraRadius]
        const target = [0, 0, -2]
        // 2. Compute the view's matrix using look at directly.
        let viewMatrix = mat4.create()
        mat4.lookAt(viewMatrix, cameraPosition, target, up)

        const sharedUniforms = {
          u_lightDirection: vec3.create(),
        }
        vec3.normalize(sharedUniforms.u_lightDirection, [-1, 3, 5])

        function renderDrawables (node) {
          for (const drawable of node.drawables) {
            drawable.render(gl, meshProgramInfo, node, projectionMatrix, viewMatrix, sharedUniforms)
          }
        }

        for (const scene of gltf.scenes) {
          // update all world matices in the scene.
          scene.root.updateWorldMatrix()
          // walk the scene and render all renderables
          scene.root.traverse(renderDrawables)
        }

        animationID = requestAnimationFrame(drawScene)
      }
    }
    main()
  },
  beforeDestroy () {
    animationID && cancelAnimationFrame(animationID)
  }
}
</script>
