import { Application } from 'express'

import Managers from '../db/managers'
import { Submission, ChSetting } from '../db/dbTypes'
import config from '../config'

const renderRow = (chId: string, sumb: Submission, isVoteShown = false): string => {
  const title = sumb.title?.trim()
  return `
<div class="row">
  <div class="link text-overflow first-cell"><a href="${sumb.link}">${title ? title : sumb.link}</a></div>
  <div class="author text-overflow last-cell">${sumb.user.tag}</div>
  ${isVoteShown ? `<div class="message last-cell">${sumb.message_id && `<a href="https://discord.com/channels/${config.guildId}/${chId}/${sumb.message_id}">message</a>`}</div>` : ''}
</div>`
}

const renderRows = (chId: string, title: string, docs: Submission[], isVoteShown = false): string => `
<section>
  <h2>${title}</h2>
  <div class="table">
  <div class="row title-row">
  <div class="link first-cell">Document</div>
  <div class="author last-cell">Author</div>
  ${isVoteShown ? '<div class="message last-cell"></div>' : ''}
  </div>
  ${docs.map((doc) => renderRow(chId, doc, isVoteShown)).join('')}
  </div>
</section>
`

const renderTemplate = (chId: string, chSettings: ChSetting, approved: Submission[], candidates?: Submission[]): string => `<!DOCTYPE html>
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
      max-width: 600px;
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

    .message {
      flex-basis: 70px;
    }

    .link {
      flex-basis: 150px;
      flex-grow: 1;
    }

    .text-overflow {
      white-space: pre;
      text-overflow: ellipsis;
      min-width: 0;
      flex-shrink: 1;
      overflow: hidden;
    }
  </style>
</head>
<body>
<h1>${chSettings.data.title}</h1>
${candidates && candidates.length > 0 ? renderRows(chId, 'Candidates', candidates) : ''}
${renderRows(chId, 'Accepted submissions', approved, true)}
</body>
</html>
`

export default function docsMiddleware(app: Application): void {
  app.get('/docs/:id', async (req, res, next) => {
    const managers = new Managers()
    const { id } = req.params
    if (id && id.length === 18) {
      const settings = await managers.settings.getByChId(id)
      const subms = await managers.documents.getByChannelId({ channel_id: id, is_candidate: false })
      const candidates = await managers.documents.getByChannelId({ channel_id: id, is_candidate: true })
      if (settings && subms) {
        return res.send(renderTemplate(id, settings, subms, candidates))
      }
    }
    next()
  })
}
