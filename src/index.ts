import express = require('express')
import dsc = require('discord.js')

import config from './config'

const app = express()

app.get('/', (req, res) => {
  res.status(404).send('Error 404')
})

app.listen(config.port, () => console.log('server started'))

const client = new dsc.Client({
  intents: [
    dsc.Intents.FLAGS.GUILDS, dsc.Intents.FLAGS.GUILD_MESSAGES,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

client.on('ready', () => {
  console.log(`Ready`)
})

const genLikeButton = (count = 0): dsc.MessageButton => new dsc.MessageButton({
  style: 'SECONDARY',
  customId: 'like',
  label: String(count),
  emoji: '✅',
})

const genDislikeButton = (count = 0): dsc.MessageButton => new dsc.MessageButton({
  style: 'SECONDARY',
  customId: 'dislike',
  label: String(count),
  emoji: '❌',
})

const genVotersString = (voters: string[]): string => voters.join(', ')

const genInFavorMessage = (inFavor = ''): string => `**Voted in favor**: ${inFavor}\n`
const genAgainstMessage = (against = ''): string => `**Voted against**: ${against}\n`
const genMessageContent = (user: dsc.User, url: string): string => (
  `**Author**: ${genMention(user)}.
**Link**: ${url}.
${genInFavorMessage()}${genAgainstMessage()}
`
)

const updateMessageContent = (oldMessage: string[], inFavor: string[] = [], against: string[] = []): string => (
  `${oldMessage[0]}\n${oldMessage[1]}\n${genInFavorMessage(genVotersString(inFavor))}${genAgainstMessage(genVotersString(against))}`
)

const genButton = (id: 'like' | 'dislike', count: number): dsc.MessageButton => id === 'like' ? genLikeButton(count) : genDislikeButton(count)

const genMention = (user: dsc.User): string => `<@${user.id}>`

const changeButtonCount = (actionRow: dsc.MessageActionRow, offset: number, id: 'like' | 'dislike'): number | undefined => {
  const index = id === 'like' ? 0 : 1
  const oldButton = actionRow.components.at(index)
  if (oldButton?.type === 'BUTTON') {
    const votes = Number.parseInt(oldButton.label ?? '0', 10) + offset
    actionRow.spliceComponents(index, 1, genButton(id, votes))
    return votes
  }
}

const normMessage = (message: dsc.Message<boolean>): string[] => message.content.split('\n')

const extractVoters = (message: string[], id: 'like' | 'dislike'): Array<string> => {
  const line = message[id === 'like' ? 2 : 3]
  if (line) {
    return line
      .slice(line.indexOf(':') + 1)
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val !== '')
  }
  return []
}

const addRemoveVote = (username: string, voters: string[]): [offset: 1 | -1, voters: string[]] => {
  const userPos = voters.findIndex((val) => val === username)
  if (userPos === -1) {
    return [1, [...voters, username]]
  }
  return [-1, [...voters.slice(0, userPos), ...voters.slice(userPos + 1)]]
}

const assignRole = async (count: number, interaction: dsc.ButtonInteraction<dsc.CacheType>, normMessage: string[]) => {
  if (count >= config.votesThreshold) {
    const guild = await client.guilds.fetch(interaction.guildId)
    const authorLine = normMessage[0]
    const id = authorLine.slice(authorLine.indexOf('<') + 2, authorLine.indexOf('>'))
    const member = guild.members.cache.get(id)
    if (member) {
      await member.roles.add(config.awardedRoleId)
    }
  }
}

const canVote = async (interaction: dsc.ButtonInteraction<dsc.CacheType>) => {
  const guild = await client.guilds.fetch(interaction.guildId)
  const member = guild.members.cache.get(interaction.user.id)
  return member?.roles.cache.some((r) => config.allowedRoleIds.includes(r.id))
}

const processInteraction = async (interaction: dsc.ButtonInteraction<dsc.CacheType>): Promise<{ messageContent: string, actionRow: dsc.MessageActionRow } | null> => {
  // let role = guild.roles.cache.find(r => console.log(r.id, r.name))
  const isAllowedToVote = await canVote(interaction)

  if (!isAllowedToVote) return null

  const { customId: id, message: msg, user } = interaction
  const message = msg as dsc.Message<boolean>
  const actionRow = message.components?.at(0)

  if ((id === 'like' || id === 'dislike') && actionRow?.type === 'ACTION_ROW') {
    const norMessage = normMessage(message)
    const inFavor = extractVoters(norMessage, 'like')
    const against = extractVoters(norMessage, 'dislike')
    const oldVoters = id === 'like' ? inFavor : against

    if (id === 'like' && against.includes(user.tag) || id === 'dislike' && inFavor.includes(user.tag)) {
      const [offsetInFavor, inFavorNew] = addRemoveVote(user.tag, inFavor)
      const [offsetAgainst, againstNew] = addRemoveVote(user.tag, against)
      const count = changeButtonCount(actionRow, offsetInFavor, 'like')
      await assignRole(count ?? 0, interaction, norMessage)
      changeButtonCount(actionRow, offsetAgainst, 'dislike')
      const newMessage = updateMessageContent(norMessage, inFavorNew, againstNew)
      return { messageContent: newMessage, actionRow }
    }
    const [offset, voters] = addRemoveVote(user.tag, oldVoters)
    const newMessage = updateMessageContent(norMessage, id === 'like' ? voters : inFavor, id === 'dislike' ? voters : against)
    const count = changeButtonCount(actionRow, offset, id)
    if (id === 'like') {
      await assignRole(count ?? 0, interaction, norMessage)
    }
    return { messageContent: newMessage, actionRow }
  }
  return null
}

const escapeRegExp = (text = ''): string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

const extractUrl = (msg: dsc.Message<boolean>): string | null => {
  const res = msg.content.match(new RegExp(`(?:\\s|^)(${escapeRegExp('https://docs.google.com/document/d/')}[\\S]+?)(?:\\s|$)`, 'i'))
  if (res && res[1]) {
    return res[1]
  }
  return null
}

client.on('messageCreate', async (msg): Promise<void> => {
  try {
    if (!msg.author.bot) {
      const url = extractUrl(msg)
      if (url) {
        const actionRow = new dsc.MessageActionRow({
          components: [genLikeButton(), genDislikeButton()]
        })

        await msg.reply({
          content: genMessageContent(msg.author, url),
          components: [actionRow]
        })
      }
    }
  } catch (e) {
    console.log(e)
  }
})

client.on("interactionCreate", async (interaction): Promise<void> => {
  try {
    if (interaction.isButton()) {
      const { customId } = interaction
      if ((customId === 'like' || customId === 'dislike')) {
        const result = await processInteraction(interaction)

        if (result) {
          await interaction.update({
            content: result.messageContent,
            components: [result.actionRow],
          })
        } else {
          await interaction.update({})
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
})

client.login(config.token)
