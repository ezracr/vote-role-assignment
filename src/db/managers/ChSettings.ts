import pool from '../pool'

import { ChSettingsData, ChSetting } from '../dbTypes'
import { ReportableError } from './manUtils'

type InsSetting = ChSetting & { inserted: boolean }

class ChSettings {
  async getByChId(channelId: string): Promise<ChSetting | undefined> {
    const { rows } = await pool.query<ChSetting>(`
      SELECT sts."data"
      FROM channel_settings sts
      WHERE sts."channel_id" = $1 AND sts."is_disabled" = FALSE
    `, [channelId])
    return rows[0]
  }

  async upsert(channelId: string, data: ChSettingsData): Promise<InsSetting> {
    try {
      const { rows } = await pool.query<InsSetting>(`
        INSERT INTO channel_settings ("channel_id", "data") VALUES ($1, $2)
        ON CONFLICT ("channel_id") DO UPDATE SET "data" = EXCLUDED.data, "is_disabled" = FALSE
        RETURNING *, (xmax = 0) inserted
      `, [channelId, data])
      return rows[0]
    } catch (e: unknown) {
      console.log(e)
      throw new ReportableError('Failed to save settings')
    }
  }

  async updateChIdByChId(channelId: string, newChannelId: string): Promise<ChSetting | undefined> { // TODO Turn into patch and merge with `updateAnySettingsFieldByChId`
    const { rows: [row] } = await pool.query<ChSetting>(`
      UPDATE channel_settings sts SET "channel_id" = $2
      WHERE sts."channel_id" = $1 AND sts."is_disabled" = FALSE
      RETURNING *
    `, [channelId, newChannelId])
    return row
  }

  async deleteByChId(channelId: string): Promise<string | undefined> {
    try {
      const { rows: [row] } = await pool.query<Pick<ChSetting, 'id'>>(`
        DELETE FROM channel_settings sts WHERE sts."channel_id" = $1 RETURNING "id"
      `, [channelId])
      return row.id
    } catch (e: unknown) {
      const { rows: [row] } = await pool.query<Pick<ChSetting, 'id'>>(`
        UPDATE channel_settings sts SET "is_disabled" = TRUE
        WHERE sts."channel_id" = $1 RETURNING "id"
      `, [channelId])
      return row.id
    }
  }

  async patchDataByChId(channelId: string, data: Partial<ChSettingsData>): Promise<ChSetting | undefined> {
    const { rows } = await pool.query<ChSetting>(`
      UPDATE channel_settings sts SET "data" = (
        SELECT "data" FROM channel_settings sts1 WHERE sts1."channel_id" = $1
      ) || $2
      WHERE sts."channel_id" = $1 AND sts."is_disabled" = FALSE
      RETURNING *
    `, [channelId, data])
    return rows[0]
  }
}

export default ChSettings
