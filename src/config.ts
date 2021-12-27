const config = {
  port: 3000,
  token: process.env.DISCORD_TOKEN as string,
  channelSettings: [{
    channelThreadId: '924942843565457448',
    allowedRoleIds: ['924658307388571738'],
    awardedRoleId: '924660716454158386',
    votesThreshold: 10,
  }],
}

export default config
