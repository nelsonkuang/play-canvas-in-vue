// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-skinning.html
import { mat4 } from 'gl-matrix'
import guid from '../../tools/guid'
class TRS {
  type = 'TRS2'

  constructor(position = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
    this.position = position // [x, y, z] translation
    this.rotation = rotation // [x, y, z, w] quaternion rotation
    this.scale = scale
    this.uid = guid()
  }

  getMatrix = function (out) {
    out = out || new Float32Array(16)
    mat4.fromRotationTranslationScale(out, this.rotation, this.position, this.scale)
    return out
  }
}
export default TRS
