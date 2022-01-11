const config = {
  port: 3000,
  token: process.env.DISCORD_TOKEN as string,
  connectionString: process.env.DB_CONNECTION_STRING,
  guildId: '922857571809894461', // server id
  permissions: [
    {
      id: '922859257785884682', // role id
      type: 'ROLE' as const,
      permission: true,
    },
  ],
  baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  commands: {
    enable: {
      name: 'enable',
      description: 'Initialize/update the bot in this channel/thread.',
      messages: {
        enabled: 'Enabled',
        updated: 'Updated',
        docLinkMsg: (link: string) => `The page with sent documents: ${link}.`
      },
    },
    info: {
      name: 'info',
      description: 'Show the settings of this channel/thread.',
      messages: {
        main: (settings: string, link: string, total: number) => `**Settings**:\n${settings}\n**Link**: ${link}\n**Saved documents**: ${total}`,
      },
    },
    disable: {
      name: 'disable',
      description: 'Disable the bot in this channel/thread.',
      messages: {
        done: 'Disabled.',
      },
    },
    migrate: {
      name: 'migrate',
      description: 'Migrate to a different channel/thread.',
      messages: {
        done: 'Done.',
        failed: 'Failed to migrate.',
      },
    },
    update: {
      name: 'update',
      description: 'Update individual fields of this channel/thread\'s config.',
      messages: {
        noArgs: 'At least one argument needed for this command.',
        done: 'Updated.',
        removedAllowedToVote: '`allowed-to-vote-role`s have been cleared.',
      },
    },
    help: {
      name: 'help',
      description: 'Show the list of commands.',
    },
  },
  messages: {
    wasNotEnabled: 'The bot was not enabled in this channel/thread',
  },
  testing: {
    isEnabled: process.env.NODE_ENV === 'test-vote-discord-bot',
    testChannel1Id: '923544676793999390',
    testChannel2Id: '929691426827141160',
    testChannel1Name: 'for-testing1',
    testChannel2Name: 'for-testing2',
    mail1: process.env.TEST_MAIL1,
    pass1: process.env.TEST_PASS1,
    mail2: process.env.TEST_MAIL2,
    pass2: process.env.TEST_PASS2,
    awardedRoleName1: '@T-Rex',
    awardedRoleName2: '@U-Rex',
  },
}

export default config
