// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skinning.html
import { setBuffersAndAttributes, setUniforms, drawBufferInfo } from '../../tools/web-gl'
import guid from '../../tools/guid'
class SkinRenderer {
  type = 'SkinRenderer'
  constructor(mesh, skin) {
    this.mesh = mesh
    this.skin = skin
    this.uid = guid()
  }
  render (gl, skinProgramInfo, node, projection, view, sharedUniforms) {
    const { skin, mesh } = this
    skin.update(node)
    gl.useProgram(skinProgramInfo.program)
    for (const primitive of mesh.primitives) {
      setBuffersAndAttributes(gl, skinProgramInfo, primitive.bufferInfo)
      setUniforms(skinProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
        u_jointTexture: skin.jointTexture,
        u_numJoints: skin.joints.length,
      })
      setUniforms(skinProgramInfo, primitive.material.uniforms)
      setUniforms(skinProgramInfo, sharedUniforms)
      drawBufferInfo(gl, primitive.bufferInfo)
    }
  }
}

export default SkinRenderer