import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import config from '../../config'

/* eslint-disable max-len */

export const helpCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName(config.commands.help.name)
  .setDescription(config.commands.help.description)

const findMaxKeyLength = (): number => {
  const commKeys = Object.keys(config.commands).map((key) => key.length)
  return Math.max.apply(null, commKeys)
}

const handleCommand = async (): Promise<string> => {
  const padLength = findMaxKeyLength() + 3

  const res = (Object.keys(config.commands) as (keyof typeof config.commands)[]).sort().map((commName) => { // eslint-disable-line array-callback-return
    if (commName !== 'help') {
      return `${`/${commName}`.padEnd(padLength)}${config.commands[commName].description}`
    }
  }).filter((v) => v)

  return `
\`\`\`
${res.join('\n')}
\`\`\`
**Approvals/dismissals**
Either \`approver-roles\` or \`approver-users\` are needed to be set for the dismiss button to show up. In addition to these two, set \`approval-threshold\` if you want the submissions to be approvable.
**Modifying settings' fields**
Calling enable again will fully rewrite the settings (submissions will be unaffected). If you want to update an individual field, then \`update set\` and \`update unset\` will come in handy. To append or subtract an item from an array option, you can use \`update add\` and \`update subtract\` respectively.
`
}

export const helpCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand()
  await interaction.reply({ content: message, ephemeral: true })
}
