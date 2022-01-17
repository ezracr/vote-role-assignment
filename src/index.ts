import express from 'express'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'

import config from './config'
import client from './client'
import VoteInteractionHandler from './eventHandlers/VoteInteractionHandler'
import MessageCreateHandler from './eventHandlers/MessageCreateHandler'
import Managers from './db/managers'
import { ChSettingsData } from './db/dbTypes'
import { enableCommand, enableCommandHandler } from './eventHandlers/commands/enable'
import { disableCommand, disableCommandHandler } from './eventHandlers/commands/disable'
import { updateCommand, updateCommandHandler } from './eventHandlers/commands/update'
import { infoCommand, infoCommandHandler } from './eventHandlers/commands/info'
import { migrateCommand, migrateCommandHandler } from './eventHandlers/commands/migrate'
import { helpCommand, helpCommandHandler } from './eventHandlers/commands/help'
import { testCommand, testCommandHandler } from './__tests__/utils/commands/test'
import docsMiddleware from './middlewares/docsMiddleware'

const app = express().disable('x-powered-by')

docsMiddleware(app)

app.use((err: any, req: any, res: express.Response, next: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  res.status(404).send('Error 404')
})

app.listen(config.port, () => console.log('Express server: ✅'))

const rest = new REST({ version: '9' }).setToken(config.token)

client.on('ready', async () => {
  try {
    if (client.user?.id) {
      const commArr = [enableCommand, disableCommand, updateCommand, infoCommand, migrateCommand, helpCommand]
      if (config.testing.isEnabled) {
        commArr.push(testCommand)
      }
      const res = await rest.put(
        Routes.applicationGuildCommands(client.user.id, config.guildId),
        { body: commArr },
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
  const res = await managers.settings.getByChId(chlThId)
  return res?.data
}

client.on('messageCreate', async (msg): Promise<void> => {
  try {
    if (msg.type === 'CHANNEL_PINNED_MESSAGE' && msg.author.bot) {
      await msg.delete()
    }
    const managers = new Managers()
    const chConfig = await getChannelConfig(managers, msg.channelId)
    if (chConfig) {
      const handler = new MessageCreateHandler(chConfig, msg, managers)
      await handler.process()
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
        case config.commands.enable.name:
          await enableCommandHandler(managers, interaction)
          break
        case config.commands.disable.name:
          await disableCommandHandler(managers, interaction)
          break
        case config.commands.update.name:
          await updateCommandHandler(managers, interaction)
          break
        case config.commands.info.name:
          await infoCommandHandler(managers, interaction)
          break
        case config.commands.migrate.name:
          await migrateCommandHandler(managers, interaction)
          break
        case config.commands.help.name:
          await helpCommandHandler(managers, interaction)
          break
        case 'test':
          if (config.testing.isEnabled) {
            await testCommandHandler(managers, interaction)
          }
          break
      }
    }
    if (interaction.isButton()) {
      const { customId } = interaction
      if ((customId === 'like' || customId === 'dislike' || customId === 'approve' || customId === 'dismiss')) {
        const chConfig = await getChannelConfig(managers, interaction.channelId)
        if (chConfig) {
          const handler = new VoteInteractionHandler(chConfig, interaction, managers)

          const result = await handler.process()

          if (result) { // eslint-disable-line max-depth
            await interaction.update(result)
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
