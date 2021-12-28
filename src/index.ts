import express = require('express')

import config from './config'
import client from './client'
import InteractionHandler from './eventHandlers/InteractionHandler'
import MessageCreateHandler from './eventHandlers/MessageCreateHandler'
import Managers from './db'
import { SettingsData } from './db/dbTypes'

const app = express()

app.get('/', (req, res) => {
  res.status(404).send('Error 404')
})

app.listen(config.port, () => console.log('server started'))

client.on('ready', () => {
  console.log(`Ready`)
})

const getChannelConfig = async (chlThId: string): Promise<SettingsData | undefined> => {
  const managers = await Managers.init()
  return managers.settings.getById(chlThId)
}

client.on('messageCreate', async (msg): Promise<void> => {
  try {
    const chConfig = await getChannelConfig(msg.channelId)
    if (chConfig) {
      const handler = new MessageCreateHandler(chConfig, msg)
      const result = handler.process()
      if (result) {
        const botMsg = await msg.reply({
          content: result.messageContent,
          components: [result.actionRow]
        })
        await botMsg.pin()
      }
    }
  } catch (e: unknown) {
    console.log(e)
  }
})

client.on("interactionCreate", async (interaction): Promise<void> => {
  try {
    if (interaction.isButton()) {
    const { customId } = interaction
      if ((customId === 'like' || customId === 'dislike')) {
        const chConfig = await getChannelConfig(interaction.channelId)
        if (chConfig) {
          const handler = new InteractionHandler(chConfig, interaction)

          const result = await handler.process()

          if (result) { // eslint-disable-line max-depth
            await interaction.update({
              content: result.messageContent,
              components: [result.actionRow],
            })
          } else {
            await interaction.update({})
          }
        }
      }
    }
  } catch (e: unknown) {
    console.log(e)
  }
})

client.login(config.token).catch((e: unknown) => console.log(e))
