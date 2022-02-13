import axios from 'axios'

import config from '../config'
import { typeToTitleRecord } from '../eventHandlers/submissionTypes'
import { SendCommandArgs } from './utils/commUtils'
import Utils from './utils/Utils'

let utils: Utils

beforeAll(async () => {
  utils = await Utils.init(true)
  await utils.comm.login1()
})

beforeEach(async () => {
  await utils.comm.openTestChannel1()
  await utils.comm.waitTillReady()
})

afterEach(async () => {
  await utils.comm.removeMessagesAndRoles()
})

afterAll(async () => {
  await utils.driver.quit()
})

const { testing: {
  roleName1, roleName2, testChannel1Name, testChannel2Name,
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

describe('Message creation', () => {
  it('Removes "saved to vault" message 2 seconds later', async () => {
    await utils.comm.sendEnable(roleName1)
    await utils.comm.sendAddRole1()
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.sel.expectContainsText(msgEl, messages.messageCreateHandler.saved)
    await utils.driver.sleep(2300)
    await utils.sel.expectNotDisplayed(msgEl)
    const usrMsgEl = await utils.comm.findMessage()
    await utils.sel.expectExists('[data-name=✅]', usrMsgEl)
  })
})

describe('/enable', () => {
  it('Save values set during enable', async () => {
    await utils.comm.sendEnable(roleName1, {
      'message-color': '000000',
      'submitter-roles': roleName2,
      'voting-against-threshold': '1',
    })
    await utils.comm.expectTestStats({
      chSett: {
        'message_color': '000000',
        'submitter_roles': [roleName2],
        'voting_against_threshold': 1,
      },
    })
  })

  it('Returns an ephemeral message that it was enabled', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '10' })
    await utils.comm.expectMessageContainsText(commands.enable.messages.enabled)
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

  it('Shows title after the first interaction', async () => {
    await utils.comm.sendEnable(roleName1)
    await utils.comm.sendDoc1(true)
    const msgEl = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.comm.clickVoteAgainst(msgEl)
    await utils.sel.expectContainsText(msgEl, 'Test Document')
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
      },
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
      },
    })
  })

  it('Saves values updated with subtract', async () => {
    await utils.comm.sendEnable(roleName1, { 'submitter-roles': roleName2 })
    await utils.comm.sendUpdateSubtract({
      'submitter-roles': roleName2,
    })
    await utils.comm.expectTestStats({
      chSett: {
        'submitter_roles': [roleName2],
      },
    }, { isNot: true })
  })

  it('Removes fields picked in `unset`', async () => {
    await utils.comm.sendEnable(roleName1, {
      'approval-threshold': '5',
      'voting-threshold': '6',
      'voting-against-threshold': '1',
    })
    await utils.comm.sendUpdateUnset('approval-threshold')
    await utils.comm.sendUpdateUnset('voting-against-threshold')
    await utils.comm.expectTestStats({
      chSett: {
        'approval_threshold': 5,
        'voting_against_threshold': 1,
      },
    }, { isNot: true })
    await utils.comm.expectTestStats({
      chSett: {
        'voting_threshold': 6,
      },
    }, { useLast: true })
  })
})

describe('Downvoting threshold', () => {
  it('Disables the buttons and removes a submission when reached', async () => {
    await utils.comm.sendEnable(roleName1, {
      'voting-against-threshold': '1', 'approver-roles': roleName2, 'approval-threshold': '1',
    })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteAgainst(msgEl)
    const inFavorEl = await utils.comm.findInFavorButton(msgEl)
    const againstEl = await utils.comm.findInFavorButton(msgEl)
    const approveEl = await utils.comm.findApproveButton(msgEl)
    const dismissEl = await utils.comm.findDismissButton(msgEl)
    expect(await inFavorEl.isEnabled()).toBeFalsy()
    expect(await againstEl.isEnabled()).toBeFalsy()
    expect(await approveEl.isEnabled()).toBeFalsy()
    expect(await dismissEl.isEnabled()).toBeFalsy()
    await utils.comm.expectToBeRejectedMessage(msgEl)
    await utils.comm.expectInfo({ numOfCandidates: 0 })
  })

  it('Subtracts upvotes from downvotes', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-against-threshold': '1' })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteInFavor(msgEl)
    await utils.reInit()
    await utils.comm.loginAnotherUser()
    await utils.comm.openTestChannel1()
    await utils.comm.waitTillReady()
    const msg1El = await utils.comm.findMessage()
    await utils.comm.clickVoteAgainst(msg1El)
    await utils.comm.expectNotToBeRejectedMessage(msg1El)
  })
})

describe('Submission threshold', () => {
  it('Assings the role only when enough documents were sent', async () => {
    await utils.comm.sendEnable(roleName1, { 'submission-threshold': '2' })
    await utils.comm.sendDoc1()
    const msg = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteInFavor(msg)
    await utils.comm.expectTestStats({ roles: [roleName1.slice(1)] }, { isNot: true })
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

  it('Assigns the role when the threshold higher than (in favor - against) vote count', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendDoc1()
    const msg = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickVoteAgainst(msg)
    await utils.reInit()
    await utils.comm.loginAnotherUser()
    await utils.comm.openTestChannel1()
    await utils.comm.waitTillReady()
    const msg1 = await utils.comm.findMessage()
    await utils.comm.clickVoteInFavor(msg1)
    await utils.comm.expectInfo({ numOfDocs: 0 })
  })
})

describe('Approval', () => {
  it('Does not show the approve button without `approval-threshold`', async () => {
    await utils.comm.sendEnable(roleName1, { 'approver-users': utils.comm.currUser.name, 'approver-roles': roleName1 })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.expectApproveButtonNotExists(msgEl)
    await utils.comm.clickVoteAgainst(msgEl)
    await utils.comm.expectApproveButtonNotExists(msgEl)
  })

  it('Doesn\'t do anything when approval role/group is different', async () => {
    await utils.comm.sendEnable(roleName1, {
      'approver-users': utils.comm.anotherUser.name,
      'approver-roles': roleName2,
      'approval-threshold': '1',
    })
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectApprovedByToNotContain(utils.comm.currUser.nameAt, msgEl)
  })

  it('Assigns the role after one approval when no threshold specified', async () => {
    await utils.comm.sendEnable(roleName1, { 'approver-users': utils.comm.currUser.name, 'approval-threshold': '1' })
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
    await utils.comm.sendEnable(roleName1, { 'approver-roles': roleName2, 'approval-threshold': '1' })
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
  it('Does not show the dismiss button without approver-roles or approver-users', async () => {
    await utils.comm.sendEnable(roleName1)
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.expectDismissButtonNotExists(msgEl)
    await utils.comm.clickVoteAgainst(msgEl)
    await utils.comm.expectDismissButtonNotExists(msgEl)
  })

  it('Makes the dismiss button dissapear when at least one approval', async () => {
    await utils.comm.sendEnable(roleName1, { 'approver-roles': roleName2, 'approval-threshold': '1' })
    await utils.comm.sendAddRole2()
    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectDismissButtonNotExists(msgEl)
    await utils.comm.clickApprove(msgEl)
    await utils.comm.expectDismissButtonExists(msgEl)
  })

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

  it('Removes dismissed images', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1', 'approver-roles': roleName2 })
    await utils.comm.sendAddRole2()
    await utils.comm.sendImg(utils.comm.img1Path)
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    const imgEl = await utils.sel.findElementByCss('a img', msgEl)
    const srcAttr = await imgEl.getAttribute('src')
    const lastQueryStart = srcAttr.lastIndexOf('?')
    const imgName = srcAttr.slice(srcAttr.lastIndexOf('/') + 1, lastQueryStart === -1 ? undefined : lastQueryStart)
    const imgUrl = `http://localhost:3000/uploads/${imgName}`
    const imgRes = await axios.get(imgUrl)
    expect(imgRes.status).toBe(200)
    await utils.comm.clickDismiss(msgEl)
    await expect(axios.get(imgUrl)).rejects.toThrow()
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

  it('Normalizes links, part 1', async () => {
    await utils.comm.sendEnable(roleName1, { 'submission-types': typeToTitleRecord.tweet, 'voting-threshold': '1' })
    await utils.comm.sendUpdateAdd({ 'submission-types': typeToTitleRecord.ytvideo })

    await utils.comm.sendTweet1()
    const msg2El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg2El, utils.comm.tweet1Url)
    await utils.sel.expectContainsText(msg2El, utils.comm.tweet1UrlNorm)
    await utils.comm.sendYtvideo1()
    const msg3El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg3El, utils.comm.tweet1Url)
    await utils.sel.expectContainsText(msg3El, utils.comm.ytvideo1UrlNorm)
  })

  it('Normalizes google sheet/doc links', async () => {
    await utils.comm.sendEnable(roleName1, { 'submission-types': typeToTitleRecord.gdoc, 'voting-threshold': '1' })
    await utils.comm.sendUpdateAdd({ 'submission-types': typeToTitleRecord.gsheet })

    await utils.comm.sendDoc1()
    const msgEl = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msgEl, utils.comm.doc1Url)
    await utils.sel.expectContainsText(msgEl, utils.comm.doc1UrlNorm)
    await utils.comm.sendDocPub1()
    const msg4El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg4El, utils.comm.docPub1Url)
    await utils.sel.expectContainsText(msg4El, utils.comm.docPub1UrlNorm)
    await utils.comm.sendSheet1()
    const msg1El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg1El, utils.comm.sheet1Url)
    await utils.sel.expectContainsText(msg1El, utils.comm.sheet1UrlNorm)
    await utils.comm.sendSheetPub1()
    const msg5El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg5El, utils.comm.sheetPub1Url)
    await utils.sel.expectContainsText(msg5El, utils.comm.sheetPub1UrlNorm)
  })

  it('Normalizes audio links', async () => {
    await utils.comm.sendEnable(roleName1, { 'submission-types': typeToTitleRecord.audio })

    await utils.comm.sendOpenCloud1()
    const msg6El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg6El, utils.comm.openCloudUrl)
    await utils.sel.expectContainsText(msg6El, utils.comm.openCloudUrlNorm)
    await utils.comm.sendOpenCloudShort1()
    const msg7El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg7El, utils.comm.openCloudShortUrl)
    await utils.sel.expectContainsText(msg7El, utils.comm.openCloudShortUrlNorm)
    await utils.comm.sendSpotify1()
    const msg8El = await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.sel.expectNotContainsText(msg8El, utils.comm.spotifyUrl)
    await utils.sel.expectContainsText(msg8El, utils.comm.spotifyUrlNorm)
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

  it('Does not create another voting message on re-submission', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendDoc1()
    await utils.comm.findAboutToAppearBotEmbedMessageBody()
    await utils.comm.sendDoc1()
    await utils.comm.expectNewVotingMessageToNotAppear()
    await utils.comm.expectInfo({ numOfCandidates: 1 })
    await utils.comm.expectTestStats({ numOfPins: 1 })
  })

  it('Unpins user\'s message when the role was awarded for another submission', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendDoc1()
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.sendAddRole1()
    await utils.comm.sendSheet1()
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.expectInfo({ numOfCandidates: 0, numOfDocs: 1 })
    await utils.comm.expectTestStats({ numOfPins: 0 })
  })

  it('Accepts jpg, png, gif, webp attachments', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendImg(utils.comm.img1Path)
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.sendImg(utils.comm.img2Path)
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.sendImg(utils.comm.img3Path)
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.sendImg(utils.comm.img4Path)
    await utils.comm.findAboutToAppearBotMessage()
  })

  it('Recognises duplicate image submissions', async () => {
    await utils.comm.sendEnable(roleName1, { 'voting-threshold': '1' })
    await utils.comm.sendImg(utils.comm.img1Path)
    await utils.comm.findAboutToAppearBotMessage()
    await utils.comm.sendImg(utils.comm.img2Path) // takes the first frame of a gif
    const msgEl = await utils.comm.findAboutToAppearBotMessage()
    const similarEl = await utils.comm.findSimilarEntriesField(msgEl)
    expect(await utils.sel.getInnerHtml(similarEl)).toContain(utils.comm.img1Name)
  })
})

describe('Submitter roles', () => {
  it('Prevents from submitting new entries when does not have requred roles', async () => {
    await utils.comm.sendEnable(roleName1, { 'submitter-roles': roleName2 })
    await utils.comm.sendDoc1()
    await utils.comm.expectNewVotingMessageToNotAppear()
  })
})
