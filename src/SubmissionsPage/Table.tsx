import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'

import { Submission } from '../types'
import config from '../config'

export type SubmTableProps = {
  title: string;
  items?: Submission[] | null;
  channelId?: string;
}

const SubmTable: React.FC<SubmTableProps> = ({ title, items, channelId }) => {
  if (!items) {
    return null
  }

  return (
    <>
      <Typography variant="h2" sx={{ marginTop: 1 }}>
        {title}
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="A list of submissions">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell align="right">Author</TableCell>
              <TableCell align="right">Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Link href={item.link}>{item.title ? item.title : item.link}</Link>
                </TableCell>
                <TableCell align="right">{item.user.tag}</TableCell>
                <TableCell align="right">
                  {item.message_id && <Link href={`https://discord.com/channels/${config.guildId}/${channelId}/${item.message_id}`}>link</Link>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

export default SubmTable