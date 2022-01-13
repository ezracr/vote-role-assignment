import wd from 'selenium-webdriver'
import config from '../../config'
import { SubmissionTypeTitles } from '../../eventHandlers/submissionTypes'
import { SelUtils } from './selUtils'


/* eslint-disable no-await-in-loop */

const messageContainer = '[data-list-id=chat-messages]'

type SendCommandArgsValListItem = { listItem: string }
type SendCommandArgsVal = string | SendCommandArgsValListItem
type SendCommandOptArgs = Record<string, SendCommandArgsVal>
type SendCommandReqArgs = SendCommandArgsVal[]

export type SendCommandArgs = {
  opt?: SendCommandOptArgs;
  req?: SendCommandReqArgs;
}

let isUser1LoggedIn: boolean

type SendUpdateArgs = { 'submission-types'?: SubmissionTypeTitles }

const convertToOptArg = (listItems: string[], input?: Record<string, string>): SendCommandOptArgs | undefined => (
  input
    ? Object.keys(input).reduce<SendCommandOptArgs>((acc, key) => {
      const val = input[key]
      if (val && listItems.includes(key)) {
        acc[key] = { listItem: val }
      }
      return acc
    }, {})
    : undefined
)

export class CommUtils {
  private selUtils = new SelUtils(this.driver)

  constructor(private driver: wd.WebDriver) { }

  login = async (mail?: string, pass?: string): Promise<void> => {
    if (mail && pass) {
      await this.driver.get('https://discord.com/login')
      const mailEl = await this.selUtils.findElementByCss('input[name=email]')
      await mailEl.sendKeys(mail)
      const passEl = await this.selUtils.findElementByCss('input[name=password]')
      await passEl.sendKeys(pass)
      const login = await this.selUtils.findElementByCss('button[type=submit]')
      await login.click()
      await this.driver.wait(wd.until.stalenessOf(login), 3000)
    } else {
      throw new Error('Testing mail and password have not been specified.')
    }
  }

  login1 = async (): Promise<void> => {
    await this.login(config.testing.mail1, config.testing.pass1)
    isUser1LoggedIn = true
  }

  login2 = async (): Promise<void> => {
    await this.login(config.testing.mail2, config.testing.pass2)
    isUser1LoggedIn = false
  }

  loginAnotherUser = async (): Promise<void> => {
    if (isUser1LoggedIn) {
      await this.login2()
    } else {
      await this.login1()
    }
  }

  openTestChannel1 = (): Promise<void> => this.driver.get(`https://discord.com/channels/${config.guildId}/${config.testing.testChannel1Id}`)
  openTestChannel2 = (): Promise<void> => this.driver.get(`https://discord.com/channels/${config.guildId}/${config.testing.testChannel2Id}`)

  sendEnable = (awardedRole: string, threashold: string, optArgs?: SendUpdateArgs): Promise<void> => (
    this.sendCommand(config.commands.enable.name, {
      req: [{ listItem: awardedRole }, threashold],
      opt: convertToOptArg(['submission-types'], optArgs),
    })
  )

  private sendUpdate = (subCommand: 'set' | 'add' | 'del', optArgs: SendUpdateArgs): Promise<void> => (
    this.sendCommand(`${config.commands.update.name} ${subCommand}`, {
      opt: convertToOptArg(['submission-types'], optArgs),
    })
  )
  sendUpdateAdd = (optArgs: SendUpdateArgs): Promise<void> => (
    this.sendUpdate('add', optArgs)
  )

  sendAddRole1 = (): Promise<void> => this.sendCommand('test-add-role awarded-role-1')
  sendMigrate = (channelName: string): Promise<void> => (
    this.sendCommand('migrate', {
      req: [{ listItem: channelName }],
    })
  )
  sendInfo = (): Promise<void> => this.sendCommand('info')
  sendHelp = (): Promise<void> => this.sendCommand('help')

  doc1Url = 'https://docs.google.com/document/d/1dr4w1C7whmPC0gBGdCamhzxGV88q4lelck7tGsZehS0/edit?usp=sharing'
  sheet1Url = 'https://docs.google.com/spreadsheets/d/1QyCDY6KBjeg_ylGIdtkUi0E-hRPe5h_ech0n_kYO_rM/edit?usp=sharing'
  tweet1Url = 'https://twitter.com/WAGMIcrypto/status/1481005302476681221?usp=sharing'
  ytvideo1Url = 'https://www.youtube.com/watch?v=S7xEQ6D2gjQ&feature=youtu.be'

  sendDoc1 = (): Promise<void> => this.sendMessage(this.doc1Url)
  sendSheet1 = (): Promise<void> => this.sendMessage(this.sheet1Url)
  sendTweet1 = (): Promise<void> => this.sendMessage(this.tweet1Url)
  sendYtvideo1 = (): Promise<void> => this.sendMessage(this.ytvideo1Url)
  // sendUnsupLink = (): Promise<void> => this.sendMessage('https://localhost:3000')

  findTextField = (): Promise<wd.WebElement> => this.driver.wait(wd.until.elementLocated(By.css('[data-slate-editor=true]')), 3000)

  findMessagesContainer = (): Promise<wd.WebElement> => {
    return this.driver.wait(wd.until.elementLocated(By.css(messageContainer)), 3000)
    // TODO wait for the messages to be fully populated
  }
  findMessageBody = (msg: wd.WebElement): Promise<wd.WebElement> => (
    this.selUtils.findElementByCss('div>div:nth-of-type(2)', msg)
  )

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

  removeMessagesAndRoles = async (): Promise<void> => {
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

  findAboutToAppearBotMessage = async (): Promise<wd.WebElement> => {
    for (let i = 0; i < 20 * 2; i++) {
      const msg = await this.findMessage() // TODO
      try {
        const header = await this.selUtils.findElementByCss(`h2`, msg)
        if ((await header.getText()).toLowerCase().includes('bot')) {
          return msg
        }
      } catch (e: unknown) { } // eslint-disable-line no-empty
      await this.driver.sleep(50)
    }
    throw new Error('Can\'t find the bot\'s message.')
  }

  findAboutToAppearBotMessageBody = async (): Promise<wd.WebElement> => (
    this.findMessageBody(await this.findAboutToAppearBotMessage())
  )

  findLatestBotMessage = async (): Promise<wd.WebElement> => {
    const cont = await this.findMessagesContainer()

    // :nth-last-of-type(-n + 10)
    const lastTenHeaders = await this.selUtils.findElementsByCss('li', cont)
    for (let i = lastTenHeaders.length - 1; i >= 0; i--) {
      const msg = lastTenHeaders[i]
      const text = (await msg?.getText())?.toLowerCase()
      if (msg && text && text.includes('bot') && text.includes('voted in favor')) {
        return msg
        // const message = await header.findElement(By.xpath('//parent::li'))
        // if (message) {
        //   return message
        // }
      }
    }
    throw new Error('Can\'t find the bot\'s message.')
  }

  voteInFavor = async (msg: wd.WebElement): Promise<void> => {
    const button = await this.selUtils.findElementByCss('button:nth-of-type(1)', msg)
    await this.selUtils.waitUntilClickable(button)
    await button.click()
  }

  voteAgainst = async (msg: wd.WebElement): Promise<void> => {
    const button = await this.selUtils.findElementByCss('button:nth-of-type(2)', msg)
    await this.selUtils.waitUntilClickable(button)
    await button.click()
  }

  expectChannelDisabled = async (): Promise<void> => {
    await this.sendInfo()
    await this.expectMessageContainsText(config.messages.wasNotEnabled)
  }
  expectInfo = async ({ numOfDocs }: { numOfDocs?: number }): Promise<void> => {
    await this.sendInfo()
    if (numOfDocs) {
      await this.expectMessageContainsText(`Saved submissions: ${numOfDocs}`)
    }
  }
  expectMessageToBeVotingMessage = async (msg: wd.WebElement): Promise<void> => {
    await this.selUtils.expectContainsText(msg, 'Voted in favor')
  }
  expectMessageToBeSubmissionRejection = async (msg: wd.WebElement, submTypes?: SubmissionTypeTitles[]): Promise<void> => {
    await this.selUtils.expectContainsText(msg, config.messages.messageCreateHandler.wrongUrl(submTypes?.join(', ') ?? ''))
  }
  expectMessageToNotBeSubmissionRejection = async (msg: wd.WebElement, submTypes?: SubmissionTypeTitles[]): Promise<void> => {
    await this.selUtils.expectNotContainsText(msg, config.messages.messageCreateHandler.wrongUrl(submTypes?.join(', ') ?? ''))
  }
}
