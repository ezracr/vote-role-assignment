import wd from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'

import config from '../../config'
import { SelUtils } from './selUtils'

/* eslint-disable no-await-in-loop */

const screen = {
  width: 1500,
  height: 1000,
}

export const initDriver = async (): Promise<wd.WebDriver> => new Builder()
  .forBrowser('chrome')
  .setChromeOptions(new chrome.Options().windowSize(screen).headless())
  .build()

const messageContainer = '[data-list-id=chat-messages]'

type SendCommandArgsVal = string | { listItem: string }
type SendCommandOptArgs = Record<string, SendCommandArgsVal>
type SendCommandReqArgs = SendCommandArgsVal[]

export type SendCommandArgs = {
  opt?: SendCommandOptArgs;
  req?: SendCommandReqArgs;
}

export class CommUtils {
  private selUtils = new SelUtils(this.driver)

  constructor(private driver: wd.WebDriver) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  login = async (): Promise<void> => {
    if (config.testing.mail && config.testing.pass) {
      await this.driver.get('https://discord.com/login')
      const mail = await this.selUtils.findElementByCss('input[name=email]')
      await mail.sendKeys(config.testing.mail)
      const pass = await this.selUtils.findElementByCss('input[name=password]')
      await pass.sendKeys(config.testing.pass)
      const login = await this.selUtils.findElementByCss('button[type=submit]')
      await login.click()
    } else {
      throw new Error('Testing mail and password have not been specified.')
    }
  }

  openTestChannel1 = (): Promise<void> => this.driver.get(`https://discord.com/channels/${config.guildId}/${config.testing.testChannel1Id}`)
  openTestChannel2 = (): Promise<void> => this.driver.get(`https://discord.com/channels/${config.guildId}/${config.testing.testChannel2Id}`)

  sendEnable = (awardedRole: string, threashold: string, optArgs?: {  }): Promise<void> => (
    this.sendCommand(config.commands.enable.name, {
      req: [{ listItem: awardedRole }, threashold],
      opt: optArgs,
    })
  )
  sendAddRole1 = (): Promise<void> => this.sendCommand('test-add-role awarded-role-1')
  sendMigrate = (channelName: string): Promise<void> => (
    this.sendCommand('migrate', {
      req: [{ listItem: channelName }],
    })
  )
  sendInfo = (): Promise<void> => this.sendCommand('info')
  sendHelp = (): Promise<void> => this.sendCommand('help')

  findTextField = (): Promise<wd.WebElement> => this.driver.wait(wd.until.elementLocated(By.css('[data-slate-editor=true]')), 3000)

  findMessagesContainer = (): Promise<wd.WebElement> => this.selUtils.findElementByCss(messageContainer)

  waitToFinishProcessingInteraction = async (): Promise<void> => {
    try {
      const loadEl = await this.selUtils.findElementByCss(`${messageContainer} li svg`)
      await this.driver.wait(wd.until.stalenessOf(loadEl), 2000)
    } catch (e: unknown) { } // eslint-disable-line no-empty
  }

  findMessage = async (lastIndex = 1): Promise<wd.WebElement> => {
    return this.selUtils.findElementByCss(`${messageContainer} li:nth-last-of-type(${lastIndex})`)
  }

  expectMessageContainsText = async (text: string, lastIndex = 0): Promise<void> => {
    const msg = await this.findMessageText(lastIndex)
    expect(msg).toContain(text)
  }

  expectPinNotification = async (lastIndex = 1): Promise<void> => {
    const msg = await this.findMessage(lastIndex)
    await this.selUtils.expectContainsText(msg, 'pinned')
  }

  findMessageText = async (lastIndex = 0): Promise<string> => {
    const msg = await this.findMessage(lastIndex + 1)
    try {
      const msgBody = await this.selUtils.findElementByCss('h2+div', msg)
      return await msgBody.getText()
    } catch (e: unknown) { } // eslint-disable-line no-empty
    return msg.getText()
  }

  removeMessagesRoles = async (): Promise<void> => {
    await this.sendCommand('test-clean')
    await this.waitToFinishProcessingInteraction()
  }

  private processSendCommandOptArg = async (txtField: wd.WebElement, name: string, value: SendCommandArgsVal): Promise<void> => {
    await txtField.sendKeys(name)
    await txtField.sendKeys(Key.ENTER)
    if (typeof value === 'string') {
      await txtField.sendKeys(value)
    } else {
      await txtField.sendKeys(value.listItem)
      await txtField.sendKeys(Key.ENTER)
    }
  }

  private processSendCommandReqArg = async (txtField: wd.WebElement, value: SendCommandArgsVal, isLast: boolean): Promise<void> => {
    if (typeof value === 'string') {
      await txtField.sendKeys(value)
      if (!isLast) {
        await txtField.sendKeys(Key.ENTER)
      }
    } else {
      await txtField.sendKeys(value.listItem)
      await txtField.sendKeys(Key.ENTER)
    }
  }

  sendMessage = async (msg: string): Promise<void> => {
    const txtField = await this.findTextField()
    await txtField.sendKeys(msg)
    await txtField.sendKeys(Key.ENTER)
  }

  sendCommand = async (name: string, args?: SendCommandArgs): Promise<void> => {
    const txtField = await this.findTextField()
    await txtField.sendKeys(`/${name}`)
    await this.driver.wait(wd.until.elementLocated(By.css('[data-list-id=channel-autocomplete]')), 2000)
    await txtField.sendKeys(Key.ENTER)
    if (args?.req) {
      for (const [i, arg] of args.req.entries()) {
        await this.processSendCommandReqArg(txtField, arg, i === args.req.length - 1)
      }
    }
    if (args?.req && args.opt) {
      await txtField.sendKeys(Key.TAB)
    }
    if (args?.opt) {
      const keys = Object.keys(args.opt)
      for (const key of keys) {
        await this.processSendCommandOptArg(txtField, key, args.opt[key]!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
      }
    }
    await txtField.sendKeys(Key.ENTER)
    await this.waitToFinishProcessingInteraction()
  }

  expectChannelDisabled = async (): Promise<void> => {
    await this.sendInfo()
    await this.expectMessageContainsText(config.messages.wasNotEnabled)
  }
  expectInfo = async ({ numOfDocs }: { numOfDocs?: number }): Promise<void> => {
    await this.sendInfo()
    if (numOfDocs) {
      await this.expectMessageContainsText(`Saved documents: ${numOfDocs}`)
    }
  }
}
