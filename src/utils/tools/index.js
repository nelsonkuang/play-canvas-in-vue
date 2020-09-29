/**
 * 获取 Dom 元素相对于 html / body 的 offSet
 *
 * @param {HTMLDivElement} el
 * @return {Object} offset { left, top }
 */
export function getDomOffset (el) {
  const box = el.getBoundingClientRect()
  return {
    top: box.top + window.pageYOffset - document.documentElement.clientTop,
    left: box.left + window.pageXOffset - document.documentElement.clientLeft
  }
}

/**
 * 求两个向量夹角
 * 参考：https://ld246.com/article/1590996307168
 * @param  {Vector} v1
 * @param  {Vector} v2
 * @return {number}
 */
export function vectorAngle (v1, v2) {
  let mV1 = Math.sqrt(v1.reduce((acc, n) => acc + Math.pow(n, 2), 0))
  let mV2 = Math.sqrt(v2.reduce((acc, n) => acc + Math.pow(n, 2), 0))
  return Math.acos(v1.reduce((acc, n, i) => acc + n * v2[i], 0) / (mV1 * mV2))
}