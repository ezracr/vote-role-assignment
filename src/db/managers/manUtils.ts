import pgp from 'pg-promise'

export class ReportableError extends Error {

}

export const helpers = pgp().helpers
export const format = pgp.as.format // eslint-disable-line @typescript-eslint/unbound-method
