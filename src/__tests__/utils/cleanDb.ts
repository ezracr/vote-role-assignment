import pool from '../../db/pool'

const cleanDb = async () => {
  await pool.query('TRUNCATE documents, channel_settings, votes, users')
}

export default cleanDb
