// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-scene-graph.html
import { mat4 } from 'gl-matrix'
import guid from '../../tools/guid'
class VNode {
  type = 'VNode'
  children = []

  constructor() {
    this.localMatrix = mat4.create()
    this.worldMatrix = mat4.create()
    this.uid = guid()
  }

  setParent (parent) {
    // remove us from our parent
    if (this.parent) {
      const ndx = this.parent.children.indexOf(this)
      if (ndx >= 0) {
        this.parent.children.splice(ndx, 1)
      }
    }

    // Add us to our new parent
    if (parent) {
      parent.children.push(this);
    }
    this.parent = parent
  }

  updateWorldMatrix (parentWorldMatrix) {
    if (parentWorldMatrix) {
      // a matrix was passed in so do the math
      mat4.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix)
    } else {
      // no matrix was passed in so just copy local to world
      mat4.copy(this.worldMatrix, this.localMatrix)
    }

    // now process all the children
    const worldMatrix = this.worldMatrix
    this.children.forEach((child) => {
      child.updateWorldMatrix(worldMatrix)
    })
  }
}
export default VNode
