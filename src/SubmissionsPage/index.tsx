import React from 'react'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import { ChSetting, Submission } from '../types'
import SubmTable from './Table'

const SubmissionsPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const { data: accepted } = useSWR<Submission[]>(`/api/submissions/${channelId}`)
  const { data: candidates } = useSWR<Submission[]>(`/api/submissions/${channelId}?is_candidate=true`)
  const { data: category } = useSWR<ChSetting>(`/api/categories/${channelId}`)

  if (candidates === undefined) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Typography variant="h1">
        {category?.data.title ?? ''}
      </Typography>
      <SubmTable items={candidates} title="Candidates" channelId={channelId} />
      <SubmTable items={accepted} title="Accepted" channelId={channelId} />
    </>
  )
}

export default SubmissionsPage
