import React from 'react'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import ErrorPage from '../ErrorPage'
import { ChSetting } from '../types'
import CandidatesTab from './SubmTab'

const SubmissionsPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const { data: category, error } = useSWR<ChSetting, Error>(`/api/categories/${channelId}`)

  const [value, setValue] = React.useState('1')

  const handleChange = (event: React.SyntheticEvent, newValue: string): void => {
    setValue(newValue)
  }

  if (error) {
    return (
      <ErrorPage error={error} />
    )
  }

  return (
    <>
      <Typography variant="h1">
        {category?.data.title ?? ''}
      </Typography>
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="Pick submissions">
              <Tab label="Accepted" value="1" />
              <Tab label="Candidates" value="2" />
            </TabList>
          </Box>
          <TabPanel sx={{ padding: 0 }} value="1"><CandidatesTab /></TabPanel>
          <TabPanel sx={{ padding: 0 }} value="2"><CandidatesTab isCandidate /></TabPanel>
        </TabContext>
      </Box>
    </>
  )
}

export default SubmissionsPage
