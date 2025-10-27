export default {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
  },
  mangle: {
    safari10: true
  },
  format: {
    comments: false
  }
}