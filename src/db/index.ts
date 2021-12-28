import { PoolClient } from 'pg'
import Settings from './Settings'
import pool from './pool'

export default class Managers {
  settings: Settings

  private constructor(client: PoolClient) {
    this.settings = new Settings(client)
  }

  static async init() {
    const client = await pool.connect()

    return new Managers(client)
  }
}
