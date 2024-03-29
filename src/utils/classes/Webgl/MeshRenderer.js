// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skinning.html
import { setBuffersAndAttributes, setUniforms, drawBufferInfo } from '../../tools/web-gl'
import guid from '../../tools/guid'
class MeshRenderer {
  type = 'MeshRenderer'
  constructor(mesh) {
    this.mesh = mesh
    this.uid = guid()
  }
  render (gl, meshProgramInfo, node, projection, view, sharedUniforms) {
    const { mesh } = this
    gl.useProgram(meshProgramInfo.program)
    for (const primitive of mesh.primitives) {
      setBuffersAndAttributes(gl, meshProgramInfo, primitive.bufferInfo)
      setUniforms(meshProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
      })
      setUniforms(meshProgramInfo, primitive.material.uniforms)
      setUniforms(meshProgramInfo, sharedUniforms)
      drawBufferInfo(gl, primitive.bufferInfo)
    }
  }
}

export default MeshRenderer