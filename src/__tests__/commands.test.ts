import wd from 'selenium-webdriver'

import config from '../config'
import { initDriver, CommUtils, SendCommandArgs } from './utils/commUtils'
import { SelUtils } from './utils/selUtils'
import cleanDb from './utils/cleanDb'

let driver: wd.WebDriver, commUtils: CommUtils, selUtils: SelUtils

beforeAll(async () => {
  driver = await initDriver()
  commUtils = new CommUtils(driver)
  selUtils = new SelUtils(driver) // eslint-disable-line @typescript-eslint/no-unused-vars
  await commUtils.login()
}, 20000)

beforeEach(async () => {
  await cleanDb()
  await commUtils.openTestChannel1()
})

afterAll(async () => {
  await driver.quit()
})

const testNonInit = async (commName: string, args?: SendCommandArgs): Promise<void> => {
  await commUtils.sendCommand(commName, args)
  const msgTxt = await commUtils.findMessageText()
  expect(msgTxt).toContain(config.messages.wasNotEnabled)
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
  await commUtils.sendEnable(config.testing.awardedRoleName1, '1')
  await commUtils.waitToFinishProcessingInteraction()
}

describe('/enable', () => {
  afterEach(async () => {
    await commUtils.removeMessagesRoles()
  })

  it('Returns an ephemeral message that it was enabled and pins the message with the link', async () => {
    await commUtils.sendEnable(config.testing.awardedRoleName1, '10')
    await commUtils.expectPinNotification()
    await commUtils.expectMessageContainsText(`/docs/${config.testing.testChannel1Id}`, 1)
    await commUtils.expectMessageContainsText(config.commands.enable.messages.enabled, 2)
  })

  it('Updates the settings when called again', async () => {
    await enableRole1()
    await commUtils.sendEnable(config.testing.awardedRoleName2, '5')
    await commUtils.expectMessageContainsText(config.commands.enable.messages.updated)
  })
})

describe('/migrate', () => {
  afterEach(async () => {
    await commUtils.removeMessagesRoles()
  })

  it('Allows to migrate documents to a non-initialized channel', async () => {
    await commUtils.sendEnable(config.testing.awardedRoleName1, '10')
    await commUtils.sendAddRole1()
    await commUtils.sendMessage('https://docs.google.com/document/d/1dr4w1C7whmPC0gBGdCamhzxGV88q4lelck7tGsZehS0/edit?usp=sharing')
    await commUtils.sendMigrate(config.testing.testChannel2Name)
    await commUtils.expectChannelDisabled()
    await commUtils.openTestChannel2()
    await commUtils.expectInfo({ numOfDocs: 1 })
  })

  it('Allows to migrate documents to already enabled channel', async () => {
    await commUtils.sendEnable(config.testing.awardedRoleName1, '10')
    await commUtils.sendAddRole1()
    await commUtils.sendMessage('https://docs.google.com/document/d/1dr4w1C7whmPC0gBGdCamhzxGV88q4lelck7tGsZehS0/edit?usp=sharing')
    await commUtils.openTestChannel2()
    await commUtils.sendEnable(config.testing.awardedRoleName1, '10')
    await commUtils.sendMessage('https://docs.google.com/spreadsheets/d/1QyCDY6KBjeg_ylGIdtkUi0E-hRPe5h_ech0n_kYO_rM/edit?usp=sharing')
    await commUtils.sendMigrate(config.testing.testChannel1Name)
    await commUtils.expectMessageContainsText(config.commands.migrate.messages.done)
  })
})
