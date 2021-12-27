import dsc = require('discord.js')

const client = new dsc.Client({
  intents: [
    dsc.Intents.FLAGS.GUILDS, dsc.Intents.FLAGS.GUILD_MESSAGES,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

export default client
