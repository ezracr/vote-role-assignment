const config = {
  baseUrl: process.env.PUBLIC_URL,
  uploadsUrl: process.env.UPLOADS_URL ?? '/uploads',
  guildId: process.env.REACT_APP_GUILD_ID as string,
}

export default config
