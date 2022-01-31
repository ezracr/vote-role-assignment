import { Application } from 'express'

import Managers from '../db/managers'

export default function apiMiddleware(app: Application): void {
  app.get('/api/categories/:chId', async (req, res) => {
    try {
      const managers = new Managers()
      const setting = await managers.settings.getByChId(req.params.chId)
      res.json(setting ?? null)
    } catch (e: unknown) {
      console.log(e) // eslint-disable-line no-console
      res.json(null)
    }
  })

  app.get('/api/categories', async (req, res) => {
    try {
      const managers = new Managers()
      const settings = await managers.settings.getMany()
      res.json(settings)
    } catch (e: unknown) {
      console.log(e) // eslint-disable-line no-console
      res.json(null)
    }
  })

  app.get('/api/submissions/:chId', async (req, res) => {
    try {
      const managers = new Managers()
      const subm = await managers.submissions.getManyByChannelId({
        channel_id: req.params.chId,
        is_candidate: Boolean(req.query.is_candidate),
      })
      res.json(subm ?? null)
    } catch (e: unknown) {
      console.log(e) // eslint-disable-line no-console
      res.json(null)
    }
  })
}
