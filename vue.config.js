'use strict'
module.exports = {
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: '', // The value can also be set to an empty string ('') or a relative path (./) so that all assets are linked using relative paths.
  outputDir: 'dist',
  assetsDir: 'static',
  productionSourceMap: false,
}