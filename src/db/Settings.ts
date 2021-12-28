import { PoolClient } from 'pg'

import { SettingsData } from './dbTypes'

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
}

export default Settings
