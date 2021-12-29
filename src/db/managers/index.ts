import { PoolClient } from 'pg'
import pool from '../pool'
import ChSettings from './ChSettings'

export default class Managers {
  settings: ChSettings

  private constructor(client: PoolClient) {
    this.settings = new ChSettings(client)
  }

  static async init() {
    const client = await pool.connect()

    return new Managers(client)
  }
}
