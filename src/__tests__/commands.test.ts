import config from '../config'
import { SendCommandArgs } from './utils/commUtils'
import cleanDb from './utils/dbUtils'
import Utils from './utils/Utils'

let utils: Utils

beforeAll(async () => {
  utils = await Utils.init()
  await utils.comm.login1()
}, 20000)

beforeEach(async () => {
  await cleanDb()
  await utils.comm.openTestChannel1()
})

afterAll(async () => {
  await utils.driver.quit()
})

const { testing: {
  awardedRoleName1, awardedRoleName2, testChannel1Id, testChannel1Name, testChannel2Name
}, commands, messages } = config

const testNonInit = async (commName: string, args?: SendCommandArgs): Promise<void> => {
  await utils.comm.sendCommand(commName, args)
  const msgTxt = await utils.comm.findMessageText()
  expect(msgTxt).toContain(messages.wasNotEnabled)
}

describe('Returns non initilized message when the bot was not enabled in a channel', () => {
  it('/info', async () => {
    await testNonInit('info')
  })
  it('/disable', async () => {
    await testNonInit('disable')
  })
  it('/update remove-allowed-to-vote', async () => {
    await testNonInit('update remove-allowed-to-vote')
  })
  it('/update set', async () => {
    await testNonInit('update set', {
      opt: { 'voting-threshold': '1' },
    })
  })
})

const enableRole1 = async (): Promise<void> => {
  await utils.comm.sendEnable(config.testing.awardedRoleName1, '1')
  await utils.comm.waitToFinishProcessingInteraction()
}

describe('/enable', () => {
  afterEach(async () => {
    await utils.comm.removeMessagesAndRoles()
  })

  it('Returns an ephemeral message that it was enabled and pins the message with the link', async () => {
    await utils.comm.sendEnable(awardedRoleName1, '10')
    await utils.comm.expectPinNotification()
    await utils.comm.expectMessageContainsText(`/docs/${testChannel1Id}`, 1)
    await utils.comm.expectMessageContainsText(commands.enable.messages.enabled, 2)
  })

  it('Updates the settings when called again', async () => {
    await enableRole1()
    await utils.comm.sendEnable(awardedRoleName2, '5')
    await utils.comm.expectMessageContainsText(commands.enable.messages.updated)
  })
})

describe('/migrate', () => {
  afterEach(async () => {
    await utils.comm.removeMessagesAndRoles()
  })

  it('Allows to migrate documents to a non-initialized channel', async () => {
    await utils.comm.sendEnable(awardedRoleName1, '10')
    await utils.comm.sendAddRole1()
    await utils.comm.sendDoc1()
    await utils.comm.sendMigrate(testChannel2Name)
    await utils.comm.expectChannelDisabled()
    await utils.comm.openTestChannel2()
    await utils.comm.expectInfo({ numOfDocs: 1 })
  })

  it('Allows to migrate documents to already enabled channel', async () => {
    await utils.comm.sendEnable(awardedRoleName1, '10')
    await utils.comm.sendAddRole1()
    await utils.comm.sendDoc1()
    await utils.comm.openTestChannel2()
    await utils.comm.sendEnable(awardedRoleName1, '10')
    await utils.comm.sendSheet1()
    await utils.comm.sendMigrate(testChannel1Name)
    await utils.comm.expectMessageContainsText(commands.migrate.messages.done)
  })
})

describe('/help', () => {
  it('returns some command\'s description', async () => {
    await utils.comm.sendHelp()
    await utils.comm.expectMessageContainsText(commands.info.description)
  })
})

describe('Voting', () => {
  afterEach(async () => {
    await utils.comm.removeMessagesAndRoles()
  })

  it('Assigns the role when the threshold higher than in favor - against vote count', async () => {
    await utils.comm.sendEnable(awardedRoleName1, '1')
    await utils.comm.sendDoc1()
    const msg = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.voteAgainst(msg)
    await utils.driver.quit()
    await utils.reInit()
    await utils.comm.loginAnotherUser()
    await utils.comm.openTestChannel1()
    const msg1 = await utils.comm.findLatestBotMessage()
    await utils.comm.voteInFavor(msg1)
    await utils.comm.sendInfo()
    await utils.comm.expectInfo({ numOfDocs: 0 })
  })
})
