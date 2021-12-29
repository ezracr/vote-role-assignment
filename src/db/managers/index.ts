import { PoolClient } from 'pg'
import pool from '../pool'
import ChSettings from './ChSettings'
import Documents from './Documents'

export default class Managers {
  settings: ChSettings
  documents: Documents

  private constructor(client: PoolClient) {
    this.settings = new ChSettings(client)
    this.documents = new Documents(client)
  }

  static async init() {
    const client = await pool.connect()

    return new Managers(client)
  }
}
