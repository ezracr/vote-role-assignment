import { pathToRegexp } from 'path-to-regexp'

import { SubmissionType } from '../db/dbTypes'

export const typeToTitleRecord = {
  gdoc: 'Google Doc',
  gsheet: 'Google Sheet',
  tweet: 'Tweet',
  ytvideo: 'YouTube video',
} as const

export type SubmissionTypeTitles = typeof typeToTitleRecord[SubmissionType];

type Val = {
  readonly type: SubmissionType;
  readonly normalize: (url: URL) => string | null;
  readonly shouldFetchTitle: boolean;
}

const gdocMatcher = pathToRegexp('/document/d/:id/', undefined, { end: false })
const gsheetMatcher = pathToRegexp('/spreadsheets/d/:id/', undefined, { end: false })
const tweetMatcher = pathToRegexp('/:user/status/:id', undefined, { end: false })

const detectors: Record<SubmissionType, Val> = {
  gdoc: {
    type: 'gdoc',
    normalize: (url: URL): string | null => {
      if (url.hostname === 'docs.google.com' && url.pathname.startsWith('/document/d/')) {
        const matches = url.pathname.match(gdocMatcher)
        const id = matches?.[1]
        if (id) {
          return `https://docs.google.com/document/d/${id}/edit`
        }
      }
      return null
    },
    shouldFetchTitle: true,
  },
  gsheet: {
    type: 'gsheet',
    normalize: (url: URL): string | null => {
      if (url.hostname === 'docs.google.com' && url.pathname.startsWith('/spreadsheets/d/')) {
        const matches = url.pathname.match(gsheetMatcher)
        const id = matches?.[1]
        if (id) {
          return `https://docs.google.com/spreadsheets/d/${id}/edit`
        }
      }
      return null
    },
    shouldFetchTitle: true,
  },
  tweet: {
    type: 'tweet',
    normalize: (url: URL): string | null => {
      if (url.hostname === 'twitter.com') {
        const matches = url.pathname.match(tweetMatcher)
        const username = matches?.[1]
        const id = matches?.[2]
        if (id) {
          return `https://twitter.com/${username}/status/${id}`
        }
      }
      return null
    },
    shouldFetchTitle: false,
  },
  ytvideo: {
    type: 'ytvideo',
    normalize: (url: URL): string | null => {
      if (url.hostname === 'www.youtube.com') {
        const vidId = url.searchParams.get('v')
        if (vidId) {
          return `https://www.youtube.com/watch?v=${vidId}`
        }
      }
      return null
    },
    shouldFetchTitle: false,
  },
}

export const submissionTypes: ReadonlyMap<SubmissionType, Val> = new Map(Object.entries(detectors) as (readonly [SubmissionType, Val])[])

export const allTypes: SubmissionType[] = Array.from(submissionTypes.keys())

export const processUrl = (url: URL): { type: SubmissionType; url: string; } | null => {
  for (const [, detector] of submissionTypes) {
    const normUrl = detector.normalize(url)
    if (normUrl) {
      return {
        type: detector.type,
        url: normUrl,
      }
    }
  }
  return null
}

export const stringifyTypes = (types?: SubmissionType[]): string => {
  if (types && types.length > 0) {
    return types.map((type) => typeToTitleRecord[type]).join(', ')
  }
  return ''
}
