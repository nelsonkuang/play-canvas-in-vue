<template>
  <canvas id="canvas" ref="canvas" class="canvas"></canvas>
</template>

<script>
/* eslint-disable no-alert, no-console */
// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skinning.html
import { mat4, vec3 } from 'gl-matrix'
import { createProgramInfo } from '../../utils/tools/web-gl'
import Node from '../../utils/classes/Webgl/VNode2'
import TRS from '../../utils/classes/Webgl/TRS2'
import SkinRenderer from '../../utils/classes/Webgl/SkinRenderer'
import MeshRenderer from '../../utils/classes/Webgl/MeshRenderer'
import Skin from '../../utils/classes/Webgl/Skin'
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
      const cWidth = 398 // window.innerWidth
      const cHeight = 298 // window.innerHeight
      canvas.setAttribute('width', `${cWidth}px`)
      canvas.setAttribute('height', `${cHeight}px`)
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const ext = gl.getExtension('OES_texture_float')
      if (!ext) {
        return  // the extension doesn't exist on this device
      }
      const skinVSCode = `
        attribute vec4 a_POSITION;
        attribute vec3 a_NORMAL;
        attribute vec4 a_WEIGHTS_0;
        attribute vec4 a_JOINTS_0;

        uniform mat4 u_projection;
        uniform mat4 u_view;
        uniform mat4 u_world;
        uniform sampler2D u_jointTexture;
        uniform float u_numJoints;

        varying vec3 v_normal;

        // these offsets assume the texture is 4 pixels across
        #define ROW0_U ((0.5 + 0.0) / 4.)
        #define ROW1_U ((0.5 + 1.0) / 4.)
        #define ROW2_U ((0.5 + 2.0) / 4.)
        #define ROW3_U ((0.5 + 3.0) / 4.)

        mat4 getBoneMatrix(float jointNdx) {
          float v = (jointNdx + 0.5) / u_numJoints;
          return mat4(
            texture2D(u_jointTexture, vec2(ROW0_U, v)),
            texture2D(u_jointTexture, vec2(ROW1_U, v)),
            texture2D(u_jointTexture, vec2(ROW2_U, v)),
            texture2D(u_jointTexture, vec2(ROW3_U, v)));
        }

        void main() {
          mat4 skinMatrix = getBoneMatrix(a_JOINTS_0[0]) * a_WEIGHTS_0[0] +
                            getBoneMatrix(a_JOINTS_0[1]) * a_WEIGHTS_0[1] +
                            getBoneMatrix(a_JOINTS_0[2]) * a_WEIGHTS_0[2] +
                            getBoneMatrix(a_JOINTS_0[3]) * a_WEIGHTS_0[3];
          mat4 world = u_world * skinMatrix;
          gl_Position = u_projection * u_view * world * a_POSITION;
          v_normal = mat3(world) * a_NORMAL;

          // for debugging .. see article
          //gl_Position = u_projection * u_view *  a_POSITION;
          //v_normal = a_NORMAL;
          //v_normal = a_WEIGHTS_0.xyz * 2. - 1.;
          //v_normal = a_JOINTS_0.xyz / (u_numJoints - 1.) * 2. - 1.;
        }
     `
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

          // for debugging .. see article
          //gl_FragColor = vec4(1, 0, 0, 1);
          //gl_FragColor = vec4(v_normal * .5 + .5, 1);
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
      const skinProgramInfo = createProgramInfo(gl, [skinVSCode, fragmentShaderCode])
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

      const glTypeToTypedArrayMap = {
        '5120': Int8Array,    // gl.BYTE
        '5121': Uint8Array,   // gl.UNSIGNED_BYTE
        '5122': Int16Array,   // gl.SHORT
        '5123': Uint16Array,  // gl.UNSIGNED_SHORT
        '5124': Int32Array,   // gl.INT
        '5125': Uint32Array,  // gl.UNSIGNED_INT
        '5126': Float32Array, // gl.FLOAT
      }

      // Given a GL type return the TypedArray needed
      function glTypeToTypedArray (type) {
        return glTypeToTypedArrayMap[type] || throwNoKey(type)
      }

      // given an accessor index return both the accessor and
      // a TypedArray for the correct portion of the buffer
      function getAccessorTypedArrayAndStride (gl, gltf, accessorIndex) {
        const accessor = gltf.accessors[accessorIndex]
        const bufferView = gltf.bufferViews[accessor.bufferView]
        const TypedArray = glTypeToTypedArray(accessor.componentType)
        const buffer = gltf.buffers[bufferView.buffer]
        return {
          accessor,
          array: new TypedArray(
            buffer,
            bufferView.byteOffset + (accessor.byteOffset || 0),
            accessor.count * accessorTypeToNumComponents(accessor.type)),
          stride: bufferView.byteStride || 0,
        }
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

        const skinNodes = []
        const origNodes = gltf.nodes
        gltf.nodes = gltf.nodes.map((n) => {
          const { name, skin, mesh, translation, rotation, scale } = n
          const trs = new TRS(translation, rotation, scale)
          const node = new Node(trs, name)
          const realMesh = gltf.meshes[mesh]
          if (skin !== undefined) {
            skinNodes.push({ node, mesh: realMesh, skinNdx: skin })
          } else if (realMesh) {
            node.drawables.push(new MeshRenderer(realMesh))
          }
          return node
        })

        // setup skins
        gltf.skins = gltf.skins.map((skin) => {
          const joints = skin.joints.map(ndx => gltf.nodes[ndx])
          const { array } = getAccessorTypedArrayAndStride(gl, gltf, skin.inverseBindMatrices)
          return new Skin(gl, joints, array)
        })

        // Add SkinRenderers to nodes with skins
        for (const { node, mesh, skinNdx } of skinNodes) {
          node.drawables.push(new SkinRenderer(mesh, gltf.skins[skinNdx]))
        }

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

      const origMatrices = new Map()
      function animSkin (skin, a) { // 注意animSkin不是通常的做法。理想情况下，我们会加载一些艺术家制作的动画或者我们知道我们想要以某种方式在代码中操作某个特定关节。在这个例子里，我们只是看看蒙皮是否有效，这似乎是一种简单的方法。
        for (let i = 0; i < skin.joints.length; ++i) {
          const joint = skin.joints[i]
          // if there is no matrix saved for this joint
          if (!origMatrices.has(joint)) {
            // save a matrix for joint
            origMatrices.set(joint, joint.source.getMatrix())
          }
          // get the original matrix
          const origMatrix = origMatrices.get(joint)
          // rotate it
          const m = mat4.create()
          mat4.rotateX(m, origMatrix, a)
          // decompose it back into position, rotation, scale
          // into the joint
          // decompose(m, joint.source.position, joint.source.rotation, joint.source.scale)
          mat4.getTranslation(joint.source.position, m)
          mat4.getRotation(joint.source.rotation, m)
          mat4.getScaling(joint.source.scale, m)
          // console.log(joint.source)
          // console.log('joint.source')
        }
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

      animationID = requestAnimationFrame(drawScene)

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
        const cameraPosition = [10, 0, -5]
        const target = [0, 0, -10]
        const up = [0, 1, 0]
        // for debugging .. see article
        // const cameraPosition = [5, 0, 5]
        // const target = [0, 5, 0]
        // 2. Compute the view's matrix using look at directly.
        let viewMatrix = mat4.create()
        mat4.lookAt(viewMatrix, cameraPosition, target, up)

        animSkin(gltf.skins[0], Math.sin(time) * .5)

        const sharedUniforms = {
          u_lightDirection: vec3.create(),
        }
        vec3.normalize(sharedUniforms.u_lightDirection, [-1, 3, 5])

        function renderDrawables (node) {
          for (const drawable of node.drawables) {
            const programInfo = drawable.type === 'SkinRenderer' ? skinProgramInfo : meshProgramInfo
            drawable.render(gl, programInfo, node, projectionMatrix, viewMatrix, sharedUniforms)
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
