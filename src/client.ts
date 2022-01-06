import { Client, Intents } from 'discord.js'

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
  ],
  // partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

export default client
