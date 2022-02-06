import React from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import { Submission } from '../types'
import SubmTable from './Table'

export type SubmTabProps = {
  isCandidate?: boolean;
}

const SubmTab: React.FC<SubmTabProps> = ({ isCandidate }) => {
  const { channelId } = useParams<{ channelId: string }>()
  const { data } = useSWR<Submission[]>(`/api/submissions/${channelId}?is_candidate=${Boolean(isCandidate)}`)

  return (
    <Box sx={{ display: 'flex', marginTop: 2 }}>
      {data === undefined && <CircularProgress />}
      {data !== undefined && <SubmTable items={data} channelId={channelId} />}
    </Box>
  )
}

export default SubmTab
