import config from '../config'
import { typeToTitleRecord } from '../eventHandlers/submissionTypes'
import { SendCommandArgs } from './utils/commUtils'
import Utils from './utils/Utils'

let utils: Utils

beforeAll(async () => {
  utils = await Utils.init()
  await utils.comm.login1()
})

beforeEach(async () => {
  await utils.comm.openTestChannel1()
})

afterEach(async () => {
  await utils.comm.removeMessagesAndRoles()
})

afterAll(async () => {
  await utils.driver.quit()
})

const { testing: {
  roleName1, roleName2, testChannel1Id, testChannel1Name, testChannel2Name,
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
  it('/update set', async () => {
    await testNonInit('update set', {
      opt: { 'voting-threshold': '1' },
    })
  })
})

describe('/enable', () => {
  it('Save values set during enable', async () => {
    await utils.comm.sendEnable(roleName1, {
      'message-color': '000000',
      'submitter-roles': roleName2,
    })
    await utils.comm.expectTestStats({
      chSett: {
        'message_color': '000000',
        'submitter_roles': [roleName2],
      }
    })
  })

  it('Returns an ephemeral message that it was enabled and pins the message with the link', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '10' })
    await utils.comm.expectTestStats({ numOfPins: 1 })
    await utils.comm.expectMessageContainsText(`/docs/${testChannel1Id}`, 1)
    await utils.comm.expectMessageContainsText(commands.enable.messages.enabled, 2)
  })

  it('Updates the settings when called again', async () => {
    await utils.comm.sendEnable(roleName2, { 'voting-threshold': '1' })
    await utils.comm.sendEnable(roleName2, { 'voting-threshold': '10' })
    await utils.comm.expectMessageContainsText(commands.enable.messages.updated)
  })

  it('Removes "pinned a message" messages', async () => {
    await utils.comm.sendEnable(roleName1)
    const msg = await utils.comm.findMessage()
    await utils.sel.expectNotContainsText(msg, 'pinned')
  })
})

describe('/update', () => {
  it('Save values updated with set', async () => {
    await utils.comm.sendEnable(roleName1)
    await utils.comm.sendUpdateSet({
      'message-color': '000000',
      'submitter-roles': roleName2,
    })
    await utils.comm.expectTestStats({
      chSett: {
        'message_color': '000000',
        'submitter_roles': [roleName2],
      }
    })
  })

  it('Saves values updated with add', async () => {
    await utils.comm.sendEnable(roleName1)
    await utils.comm.sendUpdateAdd({
      'submitter-roles': roleName2,
    })
    await utils.comm.expectTestStats({
      chSett: {
        'submitter_roles': [roleName2],
      }
    })
  })

  it('Saves values updated with remove', async () => {
    await utils.comm.sendEnable(roleName1, { 'submitter-roles': roleName2 })
    await utils.comm.sendUpdateDel({
      'submitter-roles': roleName2,
    })
    await utils.comm.expectTestStats({
      chSett: {
        'submitter_roles': [roleName2],
      }
    }, true)
  })
})

describe('Submission threshold', () => {
  it('Assings the role only when enough documents were sent', async () => {
    await utils.comm.sendEnable(roleName1, { 'submission-threshold': '2' })
    await utils.comm.sendDoc1()
    const msg = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteInFavor(msg)
    await utils.comm.expectTestStats({ roles: [roleName1.slice(1)] }, true)
    await utils.comm.sendSheet1()
    const msg1 = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteInFavor(msg1)
    await utils.comm.expectInfo({ numOfDocs: 2 })
    await utils.comm.expectTestStats({ roles: [roleName1.slice(1)] })
  })
})

describe('/migrate', () => {
  it('Allows to migrate submissions to a non-initialized channel', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '10' })
    await utils.comm.sendAddRole1()
    await utils.comm.sendDoc1()
    await utils.comm.sendMigrate(testChannel2Name)
    await utils.comm.expectChannelDisabled()
    await utils.comm.openTestChannel2()
    await utils.comm.expectInfo({ numOfDocs: 1 })
  })

  it('Allows to migrate submissions to already enabled channel', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '10' })
    await utils.comm.sendAddRole1()
    await utils.comm.sendDoc1()
    await utils.comm.openTestChannel2()
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '10' })
    await utils.comm.sendSheet1()
    await utils.comm.sendMigrate(testChannel1Name)
    await utils.comm.expectMessageContainsText(commands.migrate.messages.done)
  })
})

describe('/help', () => {
  it('Returns command descriptions', async () => {
    await utils.comm.sendHelp()
    await utils.comm.expectMessageContainsText(commands.info.description)
  })
})

describe('Voting', () => {
  it('Assigns the role after one vote when no threshold specified', async () => {
    await utils.comm.sendEnable(roleName1)
    await utils.comm.sendDoc1()
    const msg = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteInFavor(msg)
    await utils.comm.expectInfo({ numOfDocs: 1 })
  })

  it('Assigns the role when the threshold higher than in favor - against vote count', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendDoc1()
    const msg = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteAgainst(msg)
    await utils.reInit()
    await utils.comm.loginAnotherUser()
    await utils.comm.openTestChannel1()
    const msg1 = await utils.comm.findLatestBotMessage()
    await utils.comm.clickVoteInFavor(msg1)
    await utils.comm.expectInfo({ numOfDocs: 0 })
  })
})

describe('Approval', () => {
  it('Doesn\'t do anything when approval role/group is different', async () => {
    await utils.comm.sendEnable(roleName1, {
      'approver-users': utils.comm.anotherUser.name,
      'approver-roles': roleName2,
    })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectApprovedByToNotContain(utils.comm.currUser.nameAt, msgEl)
  })

  it('Assigns the role after one approval when no threshold specified', async () => {
    await utils.comm.sendEnable(roleName1, { 'approver-users': utils.comm.currUser.name })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectInfo({ numOfDocs: 1 })
  })

  it('Assigns the role after approval and vote requirements are met', async () => {
    await utils.comm.sendEnable(roleName1, {
      'approver-users': utils.comm.currUser.name, 'approval-threshold': '1', 'voting-threshold': '1',
    })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectInfo({ numOfDocs: 0 })
    await utils.comm.clickVoteInFavor(msgEl)
    await utils.comm.expectInfo({ numOfDocs: 1 })
  })

  it('Allows to undo an approval', async () => {
    await utils.comm.sendEnable(roleName1, { 'approver-roles': roleName2 })
    await utils.comm.sendAddRole2()
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectApprovedByToContain(utils.comm.currUser.nameAt, msgEl)
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectApprovedByToNotContain(utils.comm.currUser.nameAt, msgEl)
  })
})

describe('Dismissal', () => {
  it('Doesn\'t do anything when approval role/group is different', async () => {
    await utils.comm.sendEnable(roleName1, {
      'approver-users': utils.comm.anotherUser.name,
      'approver-roles': roleName2,
    })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickDismiss(msgEl)
    await utils.sel.expectIsDisplayed(msgEl)
  })

  it('Removes and unpins the post when the user has a permission', async () => {
    await utils.comm.sendEnable(roleName1, {
      'approver-users': utils.comm.currUser.name,
    })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickDismiss(msgEl)
    await utils.sel.expectNotDisplayed(msgEl)
  })
})

describe('Submission types', () => {
  it('Only allowed types are accepted', async () => {
    await utils.comm.sendEnable(roleName1, { 'submission-types': typeToTitleRecord.gdoc, 'voting-threshold': '1' })
    await utils.comm.sendUpdateAdd({ 'submission-types': typeToTitleRecord.tweet })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.expectMessageToBeVotingMessage(msgEl)
    await utils.comm.sendTweet1()
    const msg1El = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.expectMessageToBeVotingMessage(msg1El)
    await utils.comm.sendSheet1()
    await expect(utils.comm.findAboutToAppearBotEmbedMessageBody()).rejects.toThrow()
  })

  it('Normalizes link', async () => {
    await utils.comm.sendEnable(roleName1, { 'submission-types': typeToTitleRecord.gdoc, 'voting-threshold': '1' })
    await utils.comm.sendUpdateAdd({ 'submission-types': typeToTitleRecord.gsheet })
    await utils.comm.sendUpdateAdd({ 'submission-types': typeToTitleRecord.tweet })
    await utils.comm.sendUpdateAdd({ 'submission-types': typeToTitleRecord.ytvideo })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msgEl, utils.comm.doc1Url)
    await utils.sel.expectContainsText(msgEl, utils.comm.doc1Url.slice(0, -12))
    await utils.comm.sendDocPub1()
    const msg4El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg4El, utils.comm.docPub1Url)
    await utils.sel.expectContainsText(msg4El, utils.comm.docPub1Url.slice(0, -1))
    await utils.comm.sendSheet1()
    const msg1El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg1El, utils.comm.sheet1Url)
    await utils.sel.expectContainsText(msg1El, utils.comm.sheet1Url.slice(0, -12))
    await utils.comm.sendSheetPub1()
    const msg5El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg5El, utils.comm.sheetPub1Url)
    await utils.sel.expectContainsText(msg5El, utils.comm.sheetPub1Url.slice(0, -1))
    await utils.comm.sendTweet1()
    const msg2El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg2El, utils.comm.tweet1Url)
    await utils.sel.expectContainsText(msg2El, utils.comm.tweet1Url.slice(0, -12))
    await utils.comm.sendYtvideo1()
    const msg3El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg3El, utils.comm.tweet1Url)
    await utils.sel.expectContainsText(msg3El, utils.comm.ytvideo1Url.slice(0, -17))
  })

  it('If not set, allows any type to be sent', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.comm.expectMessageToBeVotingMessage(msgEl)
    await utils.comm.sendSheet1()
    const msg1El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.comm.expectMessageToBeVotingMessage(msg1El)
    await utils.comm.sendTweet1()
    const msg2El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.comm.expectMessageToBeVotingMessage(msg2El)
  })

  it('Does not store duplicated links and duplicated pins', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendDoc1()
    await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.comm.sendDoc1()
    await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.comm.expectInfo({ numOfCandidates: 1 })
    await utils.comm.expectTestStats({ numOfPins: 2 })
  })

  it('Unpins user\'s message when the role was awarded for another submission', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendDoc1()
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.sendAddRole1()
    await utils.comm.sendDoc1()
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.expectInfo({ numOfCandidates: 0, numOfDocs: 1 })
    await utils.comm.expectTestStats({ numOfPins: 1 })
  })
})

describe('Submitter roles', () => {
  it('Prevents from submitting new entries when does not have requred roles', async () => {
    await utils.comm.sendEnable(roleName1, { 'submitter-roles': roleName2 })
    await utils.comm.sendDoc1()
    await expect(utils.comm.findAboutToAppearBotEmbedMessageBody()).rejects.toThrow()
  })
})
