import pool from '../../db/pool'

export const cleanDb = async (): Promise<void> => {
  await pool.query('TRUNCATE documents, channel_settings, votes, users')
}

export default cleanDb
