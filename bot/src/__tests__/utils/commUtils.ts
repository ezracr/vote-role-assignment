import wd from 'selenium-webdriver'

import config from '../../config'
import { ChSettingsData } from '../../db/dbTypes'
import { SubmissionTypeTitles } from '../../eventHandlers/submissionTypes'
import { SelUtils } from './selUtils'

/* eslint-disable no-await-in-loop, @typescript-eslint/no-unsafe-member-access, no-empty, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */

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

type TestUser = {
  id: string;
  name: string;
  nameAt: string;
}

type AddRemoveArgs = {
  'submission-types'?: SubmissionTypeTitles,
  'approver-roles'?: string,
  'approver-users'?: string,
  'submitter-roles'?: string,
}
type SetArgs = {
  'voting-threshold'?: string;
  'approval-threshold'?: string;
  'submission-threshold'?: string;
  'message-color'?: string;
} & AddRemoveArgs
type EnableOptionalArgs = SetArgs

type TestStatsArg = { numOfPins?: number, roles?: string[], chSett?: Partial<ChSettingsData> }

const lsItems = ['submission-types', 'approver-roles', 'approver-users', 'submitter-roles']

const { testing: { userName2, userName1, user1Id, user2Id } } = config

const transformToListArg = (input?: Record<string, string>): SendCommandOptArgs | undefined => (
  input
    ? Object.keys(input).reduce<SendCommandOptArgs>((acc, key) => {
      const val = input[key]
      if (val) {
        if (lsItems.includes(key)) {
          acc[key] = { listItem: val }
        } else {
          acc[key] = val
        }
      }
      return acc
    }, {})
    : undefined
)

const msgContainerCss = 'div>div:nth-of-type(2)'

const replaceNewLinesWithWhiteSpaces = (msgTxt: string): string => msgTxt.replaceAll(/[\r\n]+/g, ' ')

type ExpectOrNotRet<T extends boolean> = T extends true ? jest.Matchers<void, unknown> : jest.JestMatchers<unknown>;

function expectOrNot<T extends boolean>(isNot: T, ...args: Parameters<jest.Expect>): ExpectOrNotRet<T>;
function expectOrNot(isNot: boolean, ...args: Parameters<jest.Expect>): jest.Matchers<void, unknown> | jest.JestMatchers<unknown> {
  return isNot ? expect(...args).not : expect(...args) // eslint-disable-line jest/valid-expect
}

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
      await this.driver.wait(wd.until.stalenessOf(login), 5000)
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

  get currUser(): TestUser {
    return {
      id: isUser1LoggedIn ? user1Id : user2Id,
      name: isUser1LoggedIn ? userName1! : userName2!,
      nameAt: isUser1LoggedIn ? `@${userName1}` : `@${userName2}`,
    }
  }

  get anotherUser(): TestUser {
    return {
      id: isUser1LoggedIn ? user2Id : user1Id,
      name: isUser1LoggedIn ? userName2! : userName1!,
      nameAt: isUser1LoggedIn ? `@${userName2}` : `@${userName1}`,
    }
  }

  openTestChannel1 = (): Promise<void> => this.driver.get(`https://discord.com/channels/${config.guildId}/${config.testing.testChannel1Id}`)
  openTestChannel2 = (): Promise<void> => this.driver.get(`https://discord.com/channels/${config.guildId}/${config.testing.testChannel2Id}`)

  sendEnable = (awardedRole: string, optArgs?: EnableOptionalArgs): Promise<void> => (
    this.sendCommand(config.commands.enable.name, {
      req: [{ listItem: awardedRole }],
      opt: transformToListArg(optArgs),
    })
  )

  private sendUpdate = (subCommand: 'set' | 'add' | 'del', optArgs: AddRemoveArgs): Promise<void> => (
    this.sendCommand(`${config.commands.update.name} ${subCommand}`, {
      opt: transformToListArg(optArgs),
    })
  )
  sendUpdateAdd = (optArgs: AddRemoveArgs): Promise<void> => (
    this.sendUpdate('add', optArgs)
  )

  sendUpdateSet = (optArgs: SetArgs): Promise<void> => (
    this.sendUpdate('set', optArgs)
  )

  sendUpdateDel = (optArgs: SetArgs): Promise<void> => (
    this.sendUpdate('del', optArgs)
  )

  sendAddRole1 = (): Promise<void> => this.sendCommand('test add-role-1')
  sendAddRole2 = (): Promise<void> => this.sendCommand('test add-role-2')
  sendTestStats = (): Promise<void> => this.sendCommand('test stats')
  sendMigrate = (channelName: string): Promise<void> => (
    this.sendCommand('migrate', {
      req: [{ listItem: channelName }],
    })
  )
  sendInfo = (): Promise<void> => this.sendCommand('info')
  sendHelp = (): Promise<void> => this.sendCommand('help')

  doc1Url = 'https://docs.google.com/document/d/1dr4w1C7whmPC0gBGdCamhzxGV88q4lelck7tGsZehS0/edit?usp=sharing'
  docPub1Url = 'https://docs.google.com/document/d/e/2PACX-1vTV7TGOMu2p8UP9VNAt2PEK3qUuNpXFStfS_yZ-s9GdqMhpat0ybx_kBQtWdDW76uMRJ7xzA7DSs0tW/pub#'
  sheet1Url = 'https://docs.google.com/spreadsheets/d/1QyCDY6KBjeg_ylGIdtkUi0E-hRPe5h_ech0n_kYO_rM/edit?usp=sharing'
  sheetPub1Url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSG650HQvJXyLhdmxiFuEPXerpB5C9WP9VqVSyRnmPNl8Ez0UYzBEhed1aAs2r0YCjS6YX1j5HT3HQ9/pubhtml#'
  tweet1Url = 'https://twitter.com/WAGMIcrypto/status/1481005302476681221?usp=sharing'
  ytvideo1Url = 'https://www.youtube.com/watch?v=zqpFqfeXHnM&feature=youtu.be'

  sendDoc1 = (isUniqueQuery = false): Promise<void> => this.sendMessage(`${this.doc1Url}${isUniqueQuery ? Date.now() : ''}`)
  sendDocPub1 = (): Promise<void> => this.sendMessage(this.docPub1Url)
  sendSheet1 = (): Promise<void> => this.sendMessage(this.sheet1Url)
  sendSheetPub1 = (): Promise<void> => this.sendMessage(this.sheetPub1Url)
  sendTweet1 = (): Promise<void> => this.sendMessage(this.tweet1Url)
  sendYtvideo1 = (): Promise<void> => this.sendMessage(this.ytvideo1Url)
  // sendUnsupLink = (): Promise<void> => this.sendMessage('https://localhost:3000')

  findTextField = (): Promise<wd.WebElement> => this.driver.wait(wd.until.elementLocated(By.css('[data-slate-editor=true]')), 5000)

  findMessagesContainer = (): Promise<wd.WebElement> => {
    return this.driver.wait(wd.until.elementLocated(By.css(messageContainer)), 5000)
    // TODO wait for the messages to be fully populated
  }
  findReplyMessageContainer = (msg: wd.WebElement): Promise<wd.WebElement> => (
    this.selUtils.findElementByCss(msgContainerCss, msg)
  )

  findMessageWithTitleBody = (msg: wd.WebElement): Promise<wd.WebElement> => (
    this.selUtils.findElementByCss(`h2+div`, msg)
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

  expectMessageContainsText = async (text: string, lastIndex: number | wd.WebElement = 0): Promise<void> => {
    const msgTxt = await this.findMessageText(lastIndex)
    expect(msgTxt).toContain(text)
  }

  expectMessageNotContainsText = async (text: string, lastIndex: number | wd.WebElement = 0): Promise<void> => {
    const msgText = await this.findMessageText(lastIndex)
    expect(msgText).not.toContain(text)
  }

  expectMessageAccessoriesContainText = async (text: string, lastIndex: number | wd.WebElement = 0): Promise<void> => {
    const msgTxt = await this.findMessageAccessoriesText(lastIndex)
    expect(msgTxt).toContain(text)
  }

  expectMessageAccessoriesNotContainText = async (text: string, lastIndex: number | wd.WebElement = 0): Promise<void> => {
    const msgTxt = await this.findMessageAccessoriesText(lastIndex)
    expect(msgTxt).not.toContain(text)
  }

  expectApprovedByToNotContain = (text: string, lastIndex: number | wd.WebElement = 0): Promise<void> => (
    this.expectMessageAccessoriesNotContainText(`Approved by ${text}`, lastIndex)
  )

  expectApprovedByToContain = (text: string, lastIndex: number | wd.WebElement = 0): Promise<void> => (
    this.expectMessageAccessoriesContainText(`Approved by ${text}`, lastIndex)
  )

  findMessageText = async (lastIndex: number | wd.WebElement = 0): Promise<string> => {
    const msg = typeof lastIndex === 'number' ? await this.findMessage(lastIndex + 1) : lastIndex
    try {
      const msgBody = await this.selUtils.findElementByCss('h2+div', msg)
      return await msgBody.getText()
    } catch (e: unknown) { }
    return msg.getText()
  }

  findMessageAccessoriesText = async (lastIndex: number | wd.WebElement = 0): Promise<string> => {
    const msgEl = typeof lastIndex === 'number' ? await this.findMessage(lastIndex + 1) : lastIndex
    try {
      const accEl = await this.selUtils.findElementByCss('[id^=message-accessories]', msgEl)
      return replaceNewLinesWithWhiteSpaces(await accEl.getText())
    } catch (e: unknown) { }
    return msgEl.getText()
  }

  removeMessagesAndRoles = async (): Promise<void> => {
    await this.sendCommand('test clean')
    await this.waitToFinishProcessingInteraction()
  }

  private processSendCommandOptArg = async (txtField: wd.WebElement, name: string, value: SendCommandArgsVal): Promise<void> => {
    await txtField.sendKeys(name)
    await txtField.sendKeys(Key.ENTER)
    if (typeof value === 'string') {
      await txtField.sendKeys(value)
      await txtField.sendKeys(Key.TAB)
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
    await this.driver.wait(wd.until.elementLocated(By.css('[data-list-id=channel-autocomplete]')), 5000)
    await txtField.sendKeys(Key.ENTER)
    if (args?.req) {
      for (const [i, arg] of args.req.entries()) {
        await this.processSendCommandReqArg(txtField, arg, i === args.req.length - 1)
      }
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

  private waitForWasPinnedByMessageToDissapear = async (): Promise<void> => {
    try {
      const msgEl = await this.driver.wait(wd.until.elementLocated(
        By.xpath('//li/*[@aria-roledescription=\'Message\']//*[contains(text(), \'pinned\')]'),
      ), 200)
      await this.driver.wait(wd.until.stalenessOf(msgEl), 200)
    } catch (e: unknown) { }
  }

  findAboutToAppearBotMessage = async (): Promise<wd.WebElement> => {
    for (let i = 0; i < 50 * 1; i++) {
      const msg = await this.findMessage() // TODO
      try {
        const header = await this.selUtils.findElementByCss(`h2`, msg)
        if ((await header.getText()).toLowerCase().includes('bot')) {
          await this.waitForWasPinnedByMessageToDissapear()
          return msg
        }
      } catch (e: unknown) { }
      await this.driver.sleep(20)
    }
    throw new Error('Can\'t find the bot\'s message.')
  }

  findAboutToAppearBotEmbedMessageBody = async (): Promise<wd.WebElement> => (
    this.selUtils.findElementByCss('[id^=message-accessories]', await this.findAboutToAppearBotMessage())
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

  clickVoteInFavor = async (msg: wd.WebElement): Promise<void> => {
    const button = await this.selUtils.findElementByCss('button:nth-of-type(1)', msg)
    await button.click()
    await this.waitToFinishProcessingInteraction()
  }

  clickApprove = async (msg: wd.WebElement): Promise<void> => {
    const button = await this.selUtils.findElementByCss('button:nth-of-type(3)', msg)
    await button.click()
    await this.waitToFinishProcessingInteraction()
  }

  clickDismiss = async (msg: wd.WebElement): Promise<void> => {
    const button = await this.selUtils.findElementByCss('button:nth-of-type(4)', msg)
    await button.click()
    await this.waitToFinishProcessingInteraction()
  }

  expectDismissButtonNotExists = async (msg: wd.WebElement): Promise<void> => {
    await this.selUtils.expectNotExists('button:nth-of-type(4)', msg)
  }

  expectDismissButtonExists = async (msg: wd.WebElement): Promise<void> => {
    await this.selUtils.expectExists('button:nth-of-type(4)', msg)
  }

  expectNewVotingMessageToNotAppear = async (): Promise<void> => {
    await expect(this.findAboutToAppearBotEmbedMessageBody()).rejects.toThrow()
  }

  clickVoteAgainst = async (msg: wd.WebElement): Promise<void> => {
    const button = await this.selUtils.findElementByCss('button:nth-of-type(2)', msg)
    await button.click()
    await this.waitToFinishProcessingInteraction()
  }

  expectChannelDisabled = async (): Promise<void> => {
    await this.sendInfo()
    await this.expectMessageContainsText(config.messages.wasNotEnabled)
  }

  expectInfo = async (
    { numOfDocs, numOfCandidates, ...args }: { numOfDocs?: number, numOfCandidates?: number } & SetArgs, isNot = false,
  ): Promise<void> => {
    await this.sendInfo()
    const msgTxt = await this.findMessageText()
    const normExpect = isNot ? expect(msgTxt).not : expect(msgTxt) // eslint-disable-line jest/valid-expect
    if (numOfDocs) {
      normExpect.toContain(`Saved submissions: ${numOfDocs}`)
    }
    if (numOfCandidates) {
      normExpect.toContain(`Candidates: ${numOfCandidates}`)
    }
    if (args['message-color']) {
      normExpect.toContain(`message-color: "${args['message-color']}"`)
    }
    if (args['submitter-roles']) {
      normExpect.toContain(`submitter-roles: ${args['submitter-roles']}`)
    }
  }

  private parseTestStats = async (): Promise<any> => {
    const msg = await this.findMessage()
    const body = await this.findMessageWithTitleBody(msg)
    const text = await body.getText()
    return JSON.parse(text)
  }

  expectTestStats = async ({ numOfPins, roles, chSett }: TestStatsArg, isNot = false): Promise<void> => {
    await this.sendTestStats()
    const stats = await this.parseTestStats()
    if (numOfPins) {
      expectOrNot(isNot, stats.numOfPins).toEqual(numOfPins)
    }
    if (roles) {
      expectOrNot(isNot, stats.roles).toEqual(expect.arrayContaining(roles))
    }
    if (chSett) {
      expectOrNot(isNot, stats.chSett).toEqual(expect.objectContaining({
        ...chSett,
        submitter_roles: expect.arrayContaining(chSett.submitter_roles ?? []),
      }))
    }
  }

  expectMessageToBeVotingMessage = async (msg: wd.WebElement): Promise<void> => {
    await this.selUtils.expectContainsText(msg, 'Voted in favor')
  }
}
