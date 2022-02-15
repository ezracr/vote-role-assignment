import React, { useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import useSWRInfinite from 'swr/infinite'
import Box from '@mui/material/Box'
import LoadingButton from '@mui/lab/LoadingButton'

import { PaginatedSubmissions, Submission } from '../types'
import SubmTable from './SubmTable/SubmTable'

export type SubmTabProps = {
  isCandidate?: boolean;
}

const SubmTab: React.FC<SubmTabProps> = ({ isCandidate }) => {
  const { channelId } = useParams<{ channelId: string }>()

  const getKey = useCallback((pageIndex: number, previousPageData: PaginatedSubmissions | null) => {
    if (previousPageData?.cursor === null) {
      return null
    }
    return `/api/submissions/${channelId}?is_candidate=${Boolean(isCandidate)}&after=${previousPageData?.cursor ?? ''}`
  }, [isCandidate, channelId])

  const { data, size, setSize, error } = useSWRInfinite<PaginatedSubmissions>(getKey, { revalidateFirstPage: false }) // eslint-disable-line @typescript-eslint/no-unsafe-assignment

  const lastData = Array.isArray(data) ? data[data.length - 1] : null

  const nodes = useMemo(() => data?.flatMap((result) => result.nodes) ?? [] as Submission[], [data])

  const isLoading = (data === undefined && !error) || (size > 0 && data && typeof data[size - 1] === 'undefined')

  return (
    <Box sx={{ marginTop: 2, maxWidth: 1000, display: 'flex', flexDirection: 'column' }}>
      <SubmTable items={nodes} channelId={channelId} />
      <LoadingButton
        sx={{ marginTop: 1, marginLeft: 'auto', marginRight: 'auto' }}
        variant="outlined"
        loading={isLoading}
        onClick={() => setSize(size + 1)}
        disabled={nodes.length >= (lastData?.count ?? 0)}
      >
        Load more {typeof lastData?.count === 'number' ? `(${nodes.length}/${lastData.count})` : ''}
      </LoadingButton>
    </Box>
  )
}

export default SubmTab
