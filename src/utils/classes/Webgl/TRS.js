// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-scene-graph.html
import { mat4 } from 'gl-matrix'
import guid from '../../tools/guid'
class TRS {
  type = 'TRS'

  constructor() {
    this.translation = [0, 0, 0]
    this.rotation = [0, 0, 0]
    this.scale = [1, 1, 1]
    this.uid = guid()
  }

  getMatrix = function (out) {
    out = out || new Float32Array(16)
    const r = this.rotation
    mat4.fromTranslation(out, this.translation)
    mat4.rotateX(out, out, r[0])
    mat4.rotateY(out, out, r[1])
    mat4.rotateZ(out, out, r[2])
    mat4.scale(out, out, this.scale)
    return out
  }
}
export default TRS
