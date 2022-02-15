import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'

import { Submission } from '../../types'
import ImgSubm from './ImgSubm'

export type ImgSubmDialogProps = {
  open: boolean;
  onClose: () => void;
  imgSubm: Submission | null;
}

const ImgSubmDialog: React.FC<ImgSubmDialogProps> = ({ imgSubm, open, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogContent>
      {imgSubm && <ImgSubm isExpanded imgSubm={imgSubm} onClick={onClose} />}
      <DialogContentText>
        {imgSubm && `by ${imgSubm.user.tag}`}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
)

export default ImgSubmDialog
