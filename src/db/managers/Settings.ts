import { PoolClient } from 'pg'

import { SettingsData, Setting } from '../dbTypes'
import { ReportableError } from './manUtils'

type InsSetting = Setting & { inserted: boolean }

class Settings {
  public constructor(private db: PoolClient) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  async getById(id: string): Promise<SettingsData | undefined> {
    const { rows } = await this.db.query<SettingsData>(`
      SELECT sts."data"
      FROM "settings" sts
      WHERE sts."id" = $1
    `, [id])
    return rows[0]
  }

  async create(id: string, data: SettingsData): Promise<InsSetting>  {
    try {
      const { rows } = await this.db.query<InsSetting>(`
        INSERT INTO "settings" ("id", "data") VALUES ($1, $2)
        ON CONFLICT ("id") DO UPDATE SET "data" = EXCLUDED.data
        RETURNING *, (xmax = 0) AS inserted
      `, [id, data])
      return rows[0]
    } catch (e) {
      console.log(e)
      throw new ReportableError('Failed to save settings')
    }
  }

  async deleteById(id: string): Promise<SettingsData | undefined> {
    const { rows } = await this.db.query<SettingsData>(`
      DELETE FROM "settings" sts WHERE sts."id" = $1 RETURNING "id"
    `, [id])
    return rows[0]
  }
}

export default Settings
