import path from 'path'
import express, { Application } from 'express'

const publicPath = 'build'
const normPubPath = path.resolve(process.cwd(), publicPath)

export default function apiMiddleware(app: Application): void {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(normPubPath, { maxAge: '12 hours' }))

    app.get('*', (req, res) => res.sendFile(path.join(normPubPath, 'index.html')))
  }
}
