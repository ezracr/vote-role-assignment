import path from 'path'
import express, { Application } from 'express'

const publicPath = 'uploads'
const normPubPath = path.resolve(process.cwd(), publicPath)

export default function devMiddleware(app: Application): void {
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Methods', 'GET')
      res.setHeader('Access-Control-Allow-Origin', '*')

      next()
    })
    app.use('/uploads', express.static(normPubPath, { maxAge: 0 }))
  }
}
