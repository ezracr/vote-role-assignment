import React, { useCallback } from 'react'
import useSWR from 'swr'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { matchPath } from 'react-router'
import { useLocation, useHistory } from 'react-router-dom'
import Box from '@mui/material/Box';

import Link from '../common/Link'
import { ChSetting } from '../types'

export type HomeProps = {

}

const Home: React.FC<HomeProps> = () => {
  const { data } = useSWR<ChSetting[]>('/api/categories')

  const { pathname } = useLocation()
  const match = matchPath<{ channelId: string }>(pathname, { path: "/:channelId" })
  const history = useHistory()

  const navigate = useCallback((id: string) => {
    history.push(`/${id}`)
  }, [history])

  return (
    <>
      <Link
        sx={{
          textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
        }}
        to="/"
        title="Go to home page."
        tabIndex={-1}
      >
        <Box component="span" sx={{ marginRight: 2 }}>
          <img
            src="https://i.postimg.cc/xCPZTvwb/a07d3c72a97f7ce9bd07e6812a6aa3d1.png"
            alt="PoW Hub"
            style={{ height: 70 }}
          />
        </Box>
        <Typography variant='h2'>
          PoW <br />Hub
        </Typography>
      </Link>
      <List component="nav">
        {data?.map((category) => (
          <ListItem
            button
            key={category.channel_id}
            selected={category.channel_id === match?.params.channelId}
            onClick={() => navigate(category.channel_id)}
          >
            <ListItemText primary={category.data.title} />
          </ListItem>
        ))}
      </List>
    </>
  )
}

export default Home
