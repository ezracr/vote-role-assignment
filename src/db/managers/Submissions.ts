import { PoolClient } from 'pg'
import { SetOptional } from 'type-fest'

import pool from '../pool'
import { Submission, ChSetting } from '../dbTypes'
import Users from './Users'
import { helpers, format, formatUpsert } from './manUtils'

type MessageIdReq = { message_id: NonNullable<Submission['message_id']> }

type SumbissionOptional = SetOptional<Submission, 'title' | 'message_id' | 'usr_message_id' | 'is_candidate' | 'submission_type'>

type UpsertInput = Omit<SumbissionOptional, 'id' | 'ch_settings'> & { ch_sett_id: string }
type UpsertOuput = Submission & { old_message_id: string | undefined }

type PatchFilter = Partial<Pick<Submission, 'message_id' | 'usr_message_id'>>

const genPatchWhereSt = (filter: PatchFilter): string => {
  const query: string[] = []
  if (filter.message_id) {
    query.push(format(`ds."message_id" = $1`, [filter.message_id]))
  }
  if (filter.usr_message_id) {
    query.push(format(`ds."usr_message_id" = $1`, [filter.usr_message_id]))
  }
  return query.length === 0 ? 'TRUE' : query.join(' AND ')
}

class Submissions {
  users = new Users()

  async upsert(data: UpsertInput): Promise<UpsertOuput | undefined> {
    const { user, ...submission } = data
    const upUser = await this.users.upsert(user)

    const { rows: [doc] } = await pool.query<UpsertOuput>(`
      ${formatUpsert({ ...submission, user_id: data.user.id }, ['link'], 'documents')}
      RETURNING *, (SELECT ds1."message_id" FROM documents ds1 WHERE ds1."link" = $1) "old_message_id"
    `, [data.link])

    if (doc && upUser) {
      doc.user = upUser
      return doc
    }
  }

  async patchByFilter(filter: PatchFilter, payload: Partial<Omit<Submission, 'message_id'>>): Promise<Submission | undefined> {
    const setSt = helpers.sets(payload)
    const { rows: [row] } = await pool.query<Submission>(`
      UPDATE documents ds SET ${setSt}
      WHERE ${genPatchWhereSt(filter)}
      RETURNING *
    `)
    return row
  }

  async updateManyChSettIdByChId(oldChId: string, newChSettId: string, client?: PoolClient): Promise<Submission[] | undefined> {
    const { rows } = await (client ?? pool).query<Submission>(`
      UPDATE documents ds SET "ch_sett_id" = $2
      WHERE ds."ch_sett_id" = (SELECT cs1."id" FROM channel_settings cs1 WHERE "channel_id" = $1)
      RETURNING *
    `, [oldChId, newChSettId])
    return rows
  }

  async getByMsgId(messageId: string): Promise<Submission | undefined> {
    const { rows: [row] } = await pool.query<Submission>(`
      SELECT *
      FROM documents_full ds
      WHERE ds."message_id" = $1
    `, [messageId])
    return row
  }

  async getNumOfDocsPerChannel(input: { channel_id: ChSetting['channel_id'] } & Pick<Submission, 'is_candidate'>): Promise<{ total: number } | undefined> {
    const { rows: [row] } = await pool.query<{ total: number }>(`
      SELECT count(*) total
      FROM documents_full ds
      WHERE ds."ch_settings"->>'channel_id' = $1 AND ds."is_candidate" = $2
    `, [input.channel_id, input.is_candidate])
    return row
  }

  async getNumOfDocsPerUserId(input: { user_id: ChSetting['channel_id'] } & Pick<Submission, 'is_candidate'>): Promise<{ total: number } | undefined> {
    const { rows: [row] } = await pool.query<{ total: number }>(`
      SELECT count(*) total
      FROM documents_full ds
      WHERE ds."user_id" = $1 AND ds."is_candidate" = $2
    `, [input.user_id, input.is_candidate])
    return row
  }

  async getManyByChannelId(input: Pick<Submission, 'is_candidate'> & { channel_id: ChSetting['channel_id'] }): Promise<Submission[] | undefined> {
    const { rows } = await pool.query<Submission>(`
      SELECT *
      FROM documents_full ds
      WHERE ds."ch_settings"->>'channel_id' = $1 AND ds."is_candidate" = $2
      ORDER BY ds."created" DESC, ds."id"
    `, [input.channel_id, input.is_candidate])
    return rows
  }

  async deleteByMessageId({ message_id }: MessageIdReq): Promise<string | undefined> {
    const { rows: [row] } = await pool.query<Pick<Submission, 'id'>>(`
      DELETE FROM documents ds WHERE ds."message_id" = $1 RETURNING "id"
    `, [message_id])
    return row?.id
  }
}

export default Submissions
