// reference from: https://github.com/ecomfe/zrender/blob/master/src/core/guid.js

let idStart = 0x1314

export default function () {
  return idStart++
}