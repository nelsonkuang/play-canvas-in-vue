// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skinning.html
import { mat4 } from 'gl-matrix'
import guid from '../../tools/guid'
class Skin {
  type = 'Skin'
  constructor(gl, joints, inverseBindMatrixData) {
    this.uid = guid()
    this.gl = gl
    this.joints = joints
    this.inverseBindMatrices = []
    this.jointMatrices = []
    // allocate enough space for one matrix per joint
    this.jointData = new Float32Array(joints.length * 16)
    // create views for each joint and inverseBindMatrix
    for (let i = 0; i < joints.length; ++i) {
      this.inverseBindMatrices.push(new Float32Array(
        inverseBindMatrixData.buffer,
        inverseBindMatrixData.byteOffset + Float32Array.BYTES_PER_ELEMENT * 16 * i,
        16))
      this.jointMatrices.push(new Float32Array(
        this.jointData.buffer,
        Float32Array.BYTES_PER_ELEMENT * 16 * i,
        16))
    }
    // create a texture to hold the joint matrices
    this.jointTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }
  update (node) {
    const gl = this.gl
    const globalWorldInverse = mat4.create()
    mat4.invert(globalWorldInverse, node.worldMatrix)
    // go through each joint and get its current worldMatrix
    // apply the inverse bind matrices and store the
    // entire result in the texture
    for (let j = 0; j < this.joints.length; ++j) {
      const joint = this.joints[j]
      const dst = this.jointMatrices[j]
      mat4.multiply(dst, globalWorldInverse, joint.worldMatrix)
      mat4.multiply(dst, this.inverseBindMatrices[j], dst)
    }
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, this.joints.length, 0,
      gl.RGBA, gl.FLOAT, this.jointData)
  }
}

export default Skin