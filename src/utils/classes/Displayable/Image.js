import DisplayableObject from './Object'

class DisplayableImage extends DisplayableObject {
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
    const m = this.getMatrix()
    const drawImage = (ctx, img) => {
      ctx.save()
      ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5])
      ctx.drawImage(img, x, y, width, height)
      ctx.restore()
    }
    if ($el) {
      drawImage(ctx, $el)
    } else {
      load(src, (img) => {
        drawImage(ctx, img)
      })
    }
  }
}

export default DisplayableImage