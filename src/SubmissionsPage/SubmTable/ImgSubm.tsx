import React, { useCallback } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'

import { Submission } from '../../types'
import config from '../../config'

export type ImgSubmProps = {
  imgSubm: Submission;
  onClick: (imgSubm: Submission) => void;
  isExpanded?: boolean;
}

const ImgSubm: React.FC<ImgSubmProps> = ({ imgSubm, onClick, isExpanded }) => {
  const handleClick = useCallback(() => onClick(imgSubm), [imgSubm, onClick])

  return (
    <Box
      sx={{ display: 'block', border: 0, background: 'transparent', cursor: 'pointer' }}
      component="button"
      onClick={handleClick}
      aria-label={`Fully expand the image submitted by ${imgSubm.user.tag}`}
    >
      <Collapse orientation="vertical" in={isExpanded} collapsedSize={60}>
        <Box
          component="img"
          sx={{ width: '100%', cursor: 'pointer' }}
          src={`${config.baseUrl}${config.uploadsUrl}/${imgSubm.link}`}
          draggable="false"
          alt={`Image made by ${imgSubm.user.tag}`}
        />
      </Collapse>
    </Box>
  )
}

export default ImgSubm
