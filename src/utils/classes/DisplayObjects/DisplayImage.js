import DisplayObject from './DisplayObject'

class DisplayImage extends DisplayObject {
  $el = null

  constructor(src, x, y, width, height, zIndex) {
    super(x, y, width, height, zIndex)
    this.src = src
  }

  set src (val) {
    if (val) {
      this.load(val)
    }
  }

  load (src, callback) {
    let img = new Image()
    img.src = src
    if (img.complete) {
      this.$el = img
      callback && callback(img)
      return
    }
    img.onload = () => {
      this.$el = img
      callback && callback(img)
    }
  }

  draw (ctx) {
    const { $el, x, y, width, height, src, load } = this
    if ($el) {
      ctx.drawImage($el, x, y, width, height)
    } else {
      load(src, (img) => {
        ctx.drawImage(img, x, y, width, height)
      })
    }
  }
}

export default DisplayImage