import pgp from 'pg-promise'

export class ReportableError extends Error {

}

export const helpers = pgp({ capSQL: true }).helpers
export const format = pgp.as.format // eslint-disable-line @typescript-eslint/unbound-method

export const formatUpsert = (data: Parameters<typeof helpers.insert>[0], onConflictCols: string[], tableName: string): string => {
  const insertSt = helpers.insert(data, null, tableName)
  const onConflictSt = `ON CONFLICT (${onConflictCols.map(pgp.as.name)}) DO UPDATE SET` // eslint-disable-line @typescript-eslint/unbound-method
  const updateSt = Object.keys(data).map((colName): string => {
    const normColName = pgp.as.name(colName)
    return `${normColName} = EXCLUDED.${normColName}`
  }).join(', ')
  return `${insertSt} ${onConflictSt} ${updateSt}`
}
