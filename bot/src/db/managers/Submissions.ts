import { PoolClient } from 'pg'
import { SetOptional } from 'type-fest'

import pool from '../pool'
import { Submission, ChSetting, PaginatedSubmissions } from '../dbTypes'
import Users from './Users'
import { helpers, format, formatUpsert, formatWhereAnd } from './manUtils'

type SumbissionOptional = SetOptional<
  Submission, 'title' | 'description' | 'message_id' | 'usr_message_id' | 'is_candidate' | 'submission_type' | 'hash'
>

type UpsertInput = Omit<SumbissionOptional, 'id' | 'ch_settings' | 'created'> & { ch_sett_id: string }
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

type DelFilter = Partial<Submission> & { ids?: string[] }

const genDelWehereSt = ({ ids, ...other }: DelFilter): string | null => {
  const query: string[] = []
  if (ids && ids.length > 0) {
    query.push(format(`ds."id" = ANY ($1::uuid[])`, [ids]))
  }
  if (Object.keys(other).length !== 0) {
    query.push(formatWhereAnd(other, 'ds'))
  }
  return query.length === 0 ? null : query.join(' AND ')
}

type GetManyFilter = Partial<Submission>
  & Partial<Pick<ChSetting, 'channel_id'>>
  & {
    olderThanDays?: number;
    after?: string;
    limit?: number;
  }

const encodeCursor = <T extends { id: string }>({
  limit, fieldName, nodes,
}: { limit: number, fieldName: keyof T, nodes: T[] }): string | null => {
  const lastItem = nodes[nodes.length - 1]
  if (nodes.length < limit || !lastItem) {
    return null
  }
  return Buffer.from(JSON.stringify({ id: lastItem.id, fld: lastItem[fieldName] })).toString('base64')
}

const decodeCursor = (cursor: string): { id: string, fld: string } | null => {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) // eslint-disable-line @typescript-eslint/no-unsafe-assignment
  if (decoded) {
    const { id, fld } = decoded // eslint-disable-line @typescript-eslint/no-unsafe-assignment
    if (typeof id === 'string' && typeof fld === 'string') {
      const idNorm = id.trim()
      const fldNorm = fld.trim() // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (idNorm.length === 36 && fldNorm) {
        return { id: idNorm, fld: fldNorm } // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      }
    }
  }
  return null
}

const genGetManyWhereSt = ({ channel_id, olderThanDays: interval, after, hash, ...other }: GetManyFilter): string => {
  const query: string[] = []
  if (channel_id) {
    query.push(format(`ds."ch_settings"->>'channel_id' = $1`, [channel_id]))
  }
  if (Object.keys(other).length !== 0) {
    query.push(formatWhereAnd(other, 'ds'))
  }
  if (typeof interval === 'number') {
    query.push(format(`ds."created" < NOW() - INTERVAL '$1 DAYS'`, [interval]))
  }
  if (after) {
    const decAfter = decodeCursor(after)
    if (decAfter) {
      query.push(format(`(ds."created", ds."id") < ($1, $2)`, [decAfter.fld, decAfter.id]))
    }
  }
  if (hash) {
    // `eulerto/pg_similarity` can be installed to improve performance, an indexable solution like `fake-name/pg-spgist_hamming`
    // would be even better, but `pg-spgist_hamming` looks abandoned
    return format('length(replace(($1::bit(64) # hash)::text, \'0\', \'\')) <= 5', [hash])
  }
  return query.length === 0 ? 'TRUE' : query.join(' AND ')
}

type GetManyOrderBy = {
  orderBy: 'created' | 'hash';
  isAsc?: boolean;
}

const defOrderBy = { orderBy: 'created', isAsc: false } as const

const genGetManyOrderSt = ({ orderBy, isAsc }: GetManyOrderBy = defOrderBy, filter?: GetManyFilter): string | null => {
  const direction = isAsc ? 'ASC' : 'DESC'
  if (orderBy === 'created') {
    return `ds."created" ${direction}, ds."id" ${direction}`
  }
  if (orderBy === 'hash' && filter?.hash) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
    return format(`length(replace(($1::bit(64) # hash)::text, '0', '')) ${direction}`, [filter.hash])
  }
  return null
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

  async getNumOfDocsPerChannel(
    input: { channel_id: ChSetting['channel_id'] } & Pick<Submission, 'is_candidate'>,
  ): Promise<{ total: number } | undefined> {
    const { rows: [row] } = await pool.query<{ total: number }>(`
      SELECT count(*) total
      FROM documents_full ds
      WHERE ds."ch_settings"->>'channel_id' = $1 AND ds."is_candidate" = $2
    `, [input.channel_id, input.is_candidate])
    return row
  }

  async getNumOfDocsPerUserId(
    input: { user_id: ChSetting['channel_id'] } & Pick<Submission, 'is_candidate'>,
  ): Promise<{ total: number } | undefined> {
    const { rows: [row] } = await pool.query<{ total: number }>(`
      SELECT count(*) total
      FROM documents_full ds
      WHERE ds."user_id" = $1 AND ds."is_candidate" = $2
    `, [input.user_id, input.is_candidate])
    return row
  }

  async getMany({ limit, ...filter }: GetManyFilter, orderBy?: GetManyOrderBy): Promise<Submission[]> {
    const whereSt = genGetManyWhereSt(filter)
    const orderSt = genGetManyOrderSt(orderBy)
    const { rows } = await pool.query<Submission>(`
      SELECT *
      FROM documents_full ds
      WHERE ${whereSt}
      ${orderSt ? `ORDER BY ${orderSt}` : ''}
      LIMIT $1
    `, [limit ?? 1])
    return rows
  }

  async getPaginated({ limit = 1, after, ...filter }: GetManyFilter): Promise<PaginatedSubmissions> {
    const whereSt = genGetManyWhereSt(filter)
    const nodes = await this.getMany({ limit, after, ...filter })
    const { rows: [countRes] } = await pool.query<{ count: number }>(`
      SELECT count(*) "count"
      FROM documents_full ds
      WHERE ${whereSt}
    `)

    return {
      cursor: encodeCursor<Submission>({ limit, fieldName: 'created', nodes }),
      count: countRes?.count ?? 0,
      nodes,
    }
  }

  async deleteByFilter(filter: DelFilter): Promise<Submission | undefined> {
    const whereSt = genDelWehereSt(filter)
    if (whereSt) {
      const { rows: [row] } = await pool.query<Submission>(`
        DELETE FROM documents ds WHERE ${whereSt} RETURNING *
      `)
      return row
    }
  }
}

export default Submissions
