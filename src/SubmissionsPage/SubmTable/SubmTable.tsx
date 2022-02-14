import React, { useState, useCallback } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Link from '@mui/material/Link'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { Submission } from '../../types'
import config from '../../config'
import ImgSubm from './ImgSubm'
import ImgSubmDialog from './ImgSubmDialog'

export type SubmTableProps = {
  items?: Submission[] | null;
  channelId?: string;
}

const normTitle = (title: string | null, description: string | null, link: string): string => {
  if (title) return title
  if (description) {
    if (description.length > 60) {
      const slicedDesc = description.trim().slice(0, 60)
      const lastWordBoundary = slicedDesc.lastIndexOf(' ')
      const normDesc = lastWordBoundary !== -1 ? slicedDesc.slice(0, lastWordBoundary) : slicedDesc
      return `${normDesc}…`
    } else return description
  }
  return link
}

const SubmTable: React.FC<SubmTableProps> = ({ items, channelId }) => {
  const [activeImg, setActiveImg] = useState<Submission | null>(null)

  const toggleActiveImg = useCallback((newImg: Submission) => {
    setActiveImg((oldImg) => oldImg && oldImg.id === newImg.id ? null : newImg)
  }, [])

  const clearActiveImg = useCallback(() => setActiveImg(null), [])

  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  if (!items) {
    return null
  }

  return (
    <>
      {isSmallScreen && <ImgSubmDialog open={activeImg !== null} onClose={clearActiveImg} imgSubm={activeImg} />}
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
                <TableCell sx={{ wordBreak: 'break-word', minWidth: 150 }} scope="row">
                  {item.submission_type === 'image' && (
                    <ImgSubm
                      isExpanded={item.id === activeImg?.id && !isSmallScreen}
                      imgSubm={item}
                      onClick={toggleActiveImg}
                    />
                  )}
                  {item.submission_type !== 'image' && <Link href={item.link}>{normTitle(item.title, item.description, item.link)}</Link>}
                </TableCell>
                <TableCell sx={{ wordBreak: 'break-word' }} align="right">{item.user.tag}</TableCell>
                <TableCell align="right">
                  {(item.message_id || item.usr_message_id) && (
                    <Link href={`https://discord.com/channels/${config.guildId}/${channelId}/${item.message_id ?? item.usr_message_id}`}>
                      link
                    </Link>
                  )}
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
