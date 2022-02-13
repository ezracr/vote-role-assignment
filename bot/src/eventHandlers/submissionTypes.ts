import { pathToRegexp } from 'path-to-regexp'
import axios from 'axios'

import { SubmissionType } from '../db/dbTypes'

export const typeToTitleRecord = {
  gdoc: 'Google Doc',
  gsheet: 'Google Sheet',
  tweet: 'Tweet',
  ytvideo: 'YouTube video',
  audio: 'SoundCloud or Spotify track',
  image: 'Image',
} as const

export type SubmissionTypeTitles = typeof typeToTitleRecord[SubmissionType];

type Val = {
  readonly type: SubmissionTypeDetector;
  readonly normalize: (url: URL) => Promise<string | null>;
  readonly shouldFetchTitle: boolean;
}

const gdocMatcher = pathToRegexp('/document/d/:id/', undefined, { end: false })
const gdocPubMatcher = pathToRegexp('/document/d/e/:id/', undefined, { end: false })
const gsheetMatcher = pathToRegexp('/spreadsheets/d/:id/', undefined, { end: false })
const gsheetPubMatcher = pathToRegexp('/spreadsheets/d/e/:id/', undefined, { end: false })
const tweetMatcher = pathToRegexp('/:user/status/:id', undefined, { end: false })
const soundCloudMatcher = pathToRegexp('/:user/:track', undefined, { end: false })
const spotifyMatcher = pathToRegexp('/track/:id', undefined, { end: false })

type SubmissionTypeDetector = Exclude<SubmissionType, 'image'>

const detectors: Record<SubmissionTypeDetector, Val> = {
  gdoc: {
    type: 'gdoc',
    normalize: async (url: URL): Promise<string | null> => {
      const { hostname, pathname } = url
      if (hostname === 'docs.google.com' && pathname.startsWith('/document/d/')) {
        const isPub = pathname.includes('/e/')
        const matches = isPub ? pathname.match(gdocPubMatcher) : pathname.match(gdocMatcher)
        const id = matches?.[1]
        if (id) {
          if (isPub) {
            return `https://docs.google.com/document/d/e/${id}/pub`
          }
          return `https://docs.google.com/document/d/${id}/edit`
        }
      }
      return null
    },
    shouldFetchTitle: true,
  },
  gsheet: {
    type: 'gsheet',
    normalize: async (url: URL): Promise<string | null> => {
      const { hostname, pathname } = url
      if (hostname === 'docs.google.com' && pathname.startsWith('/spreadsheets/d/')) {
        const isPub = pathname.includes('/e/')
        const matches = isPub ? pathname.match(gsheetPubMatcher) : pathname.match(gsheetMatcher)
        const id = matches?.[1]
        if (id) {
          if (isPub) {
            return `https://docs.google.com/spreadsheets/d/e/${id}/pubhtml`
          }
          return `https://docs.google.com/spreadsheets/d/${id}/edit`
        }
      }
      return null
    },
    shouldFetchTitle: true,
  },
  tweet: {
    type: 'tweet',
    normalize: async (url: URL): Promise<string | null> => {
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
    normalize: async (url: URL): Promise<string | null> => {
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
  audio: {
    type: 'audio',
    normalize: async (url: URL): Promise<string | null> => {
      if (url.hostname === 'soundcloud.app.goo.gl' || url.hostname === 'soundcloud.com') {
        let normUrl = url
        if (url.hostname === 'soundcloud.app.goo.gl') {
          const res: string | undefined = (await axios({ method: 'GET', url: url.href, timeout: 1000 })).request.res.responseUrl // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          if (!res) {
            return null
          }
          normUrl = new URL(res)
        }
        const matches = normUrl.pathname.match(soundCloudMatcher)
        const user = matches?.[1]
        const track = matches?.[2]
        if (user && track) {
          return `https://soundcloud.com/${user}/${track}`
        }
      }
      if (url.hostname === 'open.spotify.com') {
        const matches = url.pathname.match(spotifyMatcher)
        const id = matches?.[1]
        if (id) {
          return `https://open.spotify.com/track/${id}`
        }
      }
      return null
    },
    shouldFetchTitle: true,
  },
}

export const submissionTypes: ReadonlyMap<SubmissionTypeDetector, Val> = new Map(
  Object.entries(detectors) as (readonly [SubmissionTypeDetector, Val])[],
)

export const allTypes: SubmissionType[] = Array.from(submissionTypes.keys())

export const processUrl = async (url: URL): Promise<{ type: SubmissionTypeDetector; url: string; } | null> => {
  for (const [, detector] of submissionTypes) {
    const normUrl = await detector.normalize(url) // eslint-disable-line no-await-in-loop
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
