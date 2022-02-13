const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  const proxy = createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
  })
  app.use('/api', proxy)
  app.use('/uploads', proxy)
}
