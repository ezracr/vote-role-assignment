import { PoolClient } from 'pg'

import { ChSettingsData, ChSetting } from '../dbTypes'
import { ReportableError } from './manUtils'

type InsSetting = ChSetting & { inserted: boolean }

class ChSettings {
  public constructor(private db: PoolClient) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  async getById(id: string): Promise<ChSetting | undefined> {
    const { rows } = await this.db.query<ChSetting>(`
      SELECT sts."data"
      FROM "channel_settings" sts
      WHERE sts."id" = $1
    `, [id])
    return rows[0]
  }

  async upsert(id: string, data: ChSettingsData): Promise<InsSetting> {
    try {
      const { rows } = await this.db.query<InsSetting>(`
        INSERT INTO "channel_settings" ("id", "data") VALUES ($1, $2)
        ON CONFLICT ("id") DO UPDATE SET "data" = EXCLUDED.data
        RETURNING *, (xmax = 0) AS inserted
      `, [id, data])
      return rows[0]
    } catch (e: unknown) {
      console.log(e)
      throw new ReportableError('Failed to save settings')
    }
  }

  async deleteById(id: string): Promise<string | undefined> {
    const { rows } = await this.db.query<Pick<ChSetting, 'id'>>(`
      DELETE FROM "channel_settings" sts WHERE sts."id" = $1 RETURNING "id"
    `, [id])
    return rows[0]?.id
  }

  async updateAnyFieldById(id: string, data: Partial<ChSettingsData>): Promise<ChSetting | undefined> {
    const { rows } = await this.db.query<ChSetting>(`
      UPDATE "channel_settings" sts SET "data" = (
        SELECT "data" FROM "channel_settings" sts1 WHERE sts1.id = $1
      ) || $2
      WHERE sts."id" = $1
      RETURNING *
    `, [id, data])
    return rows[0]
  }
}

export default ChSettings
