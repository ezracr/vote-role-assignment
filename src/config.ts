const config = {
  port: 3000,
  token: process.env.DISCORD_TOKEN as string,
  connectionString: process.env.DB_CONNECTION_STRING,
  guildId: '922857571809894461', // server id
}

export default config
