import express = require('express')
import drest = require('@discordjs/rest')
import dapi = require('discord-api-types/v9')

import config from './config'
import client from './client'
import InteractionHandler from './eventHandlers/InteractionHandler'
import MessageCreateHandler from './eventHandlers/MessageCreateHandler'
import Managers from './db/managers'
import { ChSettingsData } from './db/dbTypes'
import { enableCommand, enableCommandHandler } from './commands/enable'
import { disableCommand, disableCommandHandler } from './commands/disable'
import { updateCommand, updateCommandHandler } from './commands/update'
import { infoCommand, infoCommandHandler } from './commands/info'
import docsMiddleware from './middlewares/docsMiddleware'

const app = express().disable('x-powered-by')

docsMiddleware(app)

app.use((err: any, req: any, res: express.Response, next: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  res.status(404).send('Error 404')
})

app.listen(config.port, () => console.log('server started'))

const rest = new drest.REST({ version: '9' }).setToken(config.token)

client.on('ready', async () => {
  try {
    if (client.user?.id) {
      const res = await rest.put(
        dapi.Routes.applicationGuildCommands(client.user.id, config.guildId),
        { body: [enableCommand, disableCommand, updateCommand, infoCommand] },
      )
      const promCommands = (res as { id: string }[]).map((command) => client.guilds.cache.get(config.guildId)?.commands.fetch(command.id))
      const commands = await Promise.all(promCommands)
      const promPermSet = commands.map((command) => command?.permissions.set({ permissions: config.permissions }))
      await Promise.all(promPermSet)
    }
    console.log('Commands: ✅')
  } catch (e: unknown) {
    console.log('Commands: ❌')
    console.log(e)
  }
})

const getChannelConfig = async (managers: Managers, chlThId: string): Promise<ChSettingsData | undefined> => {
  const res = await managers.settings.getById(chlThId)
  return res?.data
}

client.on('messageCreate', async (msg): Promise<void> => {
  try {
    const managers = new Managers()
    const chConfig = await getChannelConfig(managers, msg.channelId)
    if (chConfig) {
      const handler = new MessageCreateHandler(chConfig, msg, managers)
      const result = await handler.process()
      if (result) {
        const botMsg = await msg.reply({
          content: result.messageContent,
          components: result.actionRow ? [result.actionRow] : [],
        })
        if (result.actionRow) {
          await botMsg.pin()
        }
      }
    }
  } catch (e: unknown) {
    console.log(e)
  }
})

client.on("interactionCreate", async (interaction): Promise<void> => {
  try {
    const managers = new Managers()
    if (interaction.isCommand()) {
      switch (interaction.commandName) { // eslint-disable-line default-case
        case 'enable':
          await enableCommandHandler(managers, interaction)
          break
        case 'disable':
          await disableCommandHandler(managers, interaction)
          break
        case 'update':
          await updateCommandHandler(managers, interaction)
          break
        case 'info':
          await infoCommandHandler(managers, interaction)
          break
      }
    }
    if (interaction.isButton()) {
      const { customId } = interaction
      if ((customId === 'like' || customId === 'dislike')) {
        const chConfig = await getChannelConfig(managers, interaction.channelId)
        if (chConfig) {
          const handler = new InteractionHandler(chConfig, interaction, managers)

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
