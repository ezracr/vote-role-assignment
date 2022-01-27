import { PoolClient } from 'pg'
import pool from '../pool'

import { User } from '../dbTypes'

class Users {
  async upsert(data: Pick<User, 'id' | 'tag'>, client?: PoolClient): Promise<User | undefined> {
    const { rows } = await (client ?? pool).query<User>(`
      INSERT INTO users ("id", "tag") VALUES ($1, $2)
      ON CONFLICT ("id") DO UPDATE SET "tag" = EXCLUDED."tag"
      RETURNING *
    `, [data.id, data.tag])

    return rows[0]
  }

  async delById(data: Pick<User, 'id'>, client?: PoolClient, savepoint?: string): Promise<User['id'] | undefined> {
    try {
      await (client ?? pool).query<User>(`
        DELETE FROM users us WHERE us."id" = $1
    `, [data.id])

      return data.id
    } catch (e: unknown) {
      if (client && savepoint) {
        await client.query(`ROLLBACK TO ${savepoint}`)
      }
    }
  }
}

export default Users
