/**
 * 获取 Dom 元素相对于 html / body 的 offSet
 *
 * @param {HTMLDivElement} el
 * @return {Object} offset { left, top }
 */
export function getDomOffset (el) {
  const box = el.getBoundingClientRect();
  return {
    top: box.top + window.pageYOffset - document.documentElement.clientTop,
    left: box.left + window.pageXOffset - document.documentElement.clientLeft
  };
}