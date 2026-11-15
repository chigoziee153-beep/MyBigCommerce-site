/**
 * Minimal Stencil config for TAC-USA 2026 blank theme (no webpack).
 */
module.exports = {
  watchOptions: {
    files: ['/templates', '/lang'],
    ignored: ['/assets/scss', '/assets/css', '/assets/dist'],
  },
  development: function (done) {
    done();
  },
  production: function (done) {
    done();
  },
};