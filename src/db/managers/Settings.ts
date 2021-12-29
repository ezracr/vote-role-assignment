import { PoolClient } from 'pg'

import { SettingsData, Setting } from '../dbTypes'
import { ReportableError } from './manUtils'

type InsSetting = Setting & { inserted: boolean }

class Settings {
  public constructor(private db: PoolClient) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  async getById(id: string): Promise<Setting | undefined> {
    const { rows } = await this.db.query<Setting>(`
      SELECT sts."data"
      FROM "settings" sts
      WHERE sts."id" = $1
    `, [id])
    return rows[0]
  }

  async upsert(id: string, data: SettingsData): Promise<InsSetting> {
    try {
      const { rows } = await this.db.query<InsSetting>(`
        INSERT INTO "settings" ("id", "data") VALUES ($1, $2)
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
    const { rows } = await this.db.query<Pick<Setting, 'id'>>(`
      DELETE FROM "settings" sts WHERE sts."id" = $1 RETURNING "id"
    `, [id])
    return rows[0]?.id
  }

  async updateAnyFieldById(id: string, data: Partial<SettingsData>): Promise<Setting | undefined> {
    const { rows } = await this.db.query<Setting>(`
      UPDATE "settings" sts SET "data" = (
        SELECT "data" FROM "settings" sts1 WHERE sts1.id = $1
      ) || $2
      WHERE sts."id" = $1
      RETURNING *
    `, [id, data])
    return rows[0]
  }
}

export default Settings
