import pg from 'pg'

import config from '../config'

pg.defaults.parseInt8 = true

export default new pg.Pool({
  connectionString: config.connectionString,
  max: 40,
})
