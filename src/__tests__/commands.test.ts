import wd from 'selenium-webdriver'

import config from '../config'
import { initDriver, CommUtils, SendCommandArgs } from './utils/commUtils'
import { SelUtils } from './utils/selUtils'
import cleanDb from './utils/cleanDb'

let driver: wd.WebDriver, mainUtils: CommUtils, selUtils: SelUtils

beforeAll(async () => {
  driver = await initDriver()
  mainUtils = new CommUtils(driver)
  selUtils = new SelUtils(driver) // eslint-disable-line @typescript-eslint/no-unused-vars
  await mainUtils.login()
}, 20000)

beforeEach(async () => {
  await cleanDb()
  await mainUtils.openTestChannel1()
})

afterAll(async () => {
  await driver.quit()
})

const testNonInit = async (commName: string, args?: SendCommandArgs) => {
  await mainUtils.sendCommand(commName, args)
  const msgTxt = await mainUtils.findMessageText()
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

const enableRole1 = async () => {
  await mainUtils.sendCommand('enable', {
    req: [{ listItem: config.testing.awardedRoleName1 }, '1'],
  })
  await mainUtils.waitToFinishProcessingInteraction()
}

describe('/enable', () => {
  afterEach(async () => {
    await mainUtils.removeMessages()
  })

  it('Returns an ephemeral message that it was enabled and pins the message with the link', async () => {
    await mainUtils.sendCommand('enable', {
      req: [{ listItem: config.testing.awardedRoleName1 }, '10'],
    })
    await mainUtils.expectPinNotification()
    await mainUtils.expectMessageContainsText(`/docs/${config.testing.testChannel1Id}`, 1)
    await mainUtils.expectMessageContainsText(config.commands.enable.messages.enabled, 2)
  })

  it('Updates the settings when called again', async () => {
    await enableRole1()
    await mainUtils.sendCommand('enable', {
      req: [{ listItem: config.testing.awardedRoleName2 }, '5'],
    })
    await mainUtils.expectMessageContainsText(config.commands.enable.messages.updated)
  })
})
