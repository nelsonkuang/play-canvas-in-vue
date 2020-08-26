// Reference from: https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-scene-graph.html
import { mat4 } from 'gl-matrix'
import guid from '../../tools/guid'

class VNode {
  type = 'VNode2'
  children = []
  drawables = []
  parent

  constructor(source, name) {
    this.localMatrix = mat4.create()
    this.worldMatrix = mat4.create()
    this.uid = guid()
    this.source = source
    this.name = name
  }

  setParent (parent) {
    // remove us from our parent
    if (this.parent) {
      this.parent.removeChild(this)
      this.parent = null
    }

    // Add us to our new parent
    if (parent) {
      parent.addChild(this)
      this.parent = parent
    }
  }

  updateWorldMatrix (parentWorldMatrix) {
    const source = this.source
    if (source) {
      source.getMatrix(this.localMatrix)
    }
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

  traverse (fn) {
    fn(this)
    for (const child of this.children) {
      child.traverse(fn)
    }
  }

  addChild (child) {
    this.children.push(child)
  }

  removeChild (child) {
    const ndx = this.children.indexOf(child)
    this.children.splice(ndx, 1)
  }
}
export default VNode
