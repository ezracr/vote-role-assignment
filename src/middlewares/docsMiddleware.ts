import { Application } from 'express'

import Managers from '../db/managers'
import { Document, ChSetting } from '../db/dbTypes'

const renderRow = (doc: Document) => {
  const title = doc.title.trim()
  return `
<div class="row">
  <div class="author first-cell">${doc.user.tag}</div>
  <div class="link last-cell"><a href="${doc.link}">${title === '' ? 'link' : title}</a></div>
</div>`
}

const renderTemplate = (chSettings: ChSetting, docs: Document[]) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${chSettings.data.title}</title>
  <style>
    body {
      margin: 0 10px;
    }

    a {
      color: #144db5;
      text-decoration: none;
      font-weight: bold;
    }

    a:hover {
      text-decoration: underline;
    }

    .table {
      max-width: 280px;
    }

    .row {
      display: flex;
      padding: 5px 0;
    }

    .row:nth-of-type(2n) {
      background: #efefef;
      box-shadow: -5px 0 0 0 #efefef;
    }

    .title-row {
      font-weight: bold;
    }

    .first-cell {
      padding-right: 10px;
    }

    .last-cell {
      padding-left: 10px;
    }

    .author {
      flex-basis: 200px;
    }

    .link {
      flex-basis: 80px;
    }
  </style>
</head>
<body>
<h1>${chSettings.data.title}</h1>
<div class="table">
<div class="row title-row">
  <div class="author first-cell">Author</div>
  <div class="link last-cell">Document</div>
</div>
${docs.map((doc) => renderRow(doc))}
</div>
</body>
</html>
`

export default function docsMiddleware(app: Application) {
  app.get('/docs/:id', async (req, res, next) => {
    const managers = new Managers()
    const { id } = req.params
    if (id && id.length === 18) {
      const settings = await managers.settings.getByChId(id)
      const docs = await managers.documents.getByChannelId(id)
      if (settings && docs) {
        return res.send(renderTemplate(settings, docs))
      }
    }
    next()
  })
}
