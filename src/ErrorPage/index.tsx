import React from 'react'
import { Helmet } from 'react-helmet-async'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export type ErrorPageProps = {
  error: Error;
}

type ErrorDet = {
  message: string;
  subMessage?: string;
}

const compError = (error: Error): ErrorDet => {
  switch (error.message) {
    case 'Failed to fetch':
      return { message: 'Internet connectivity issue', subMessage: 'Please, try again later' }
    case 'Not Found':
      return { message: 'Can\'t find it', subMessage: 'The page is ded 😭' }
    case 'Server Issue':
      return { message: 'Server issue', subMessage: 'Cave trolls got out of control and ate our server 😩' }
    default:
      return { message: 'Unknown error' }
  }
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
  const errorDet = compError(error)

  return (
    <>
      <Helmet>
        <title>{errorDet.message}</title>
      </Helmet>
      <Box sx={{ marginTop: 4, textAlign: 'center' }}>
        <Typography sx={{ textTransform: 'uppercase' }} variant="h1">
          {errorDet.message}
        </Typography>
        {errorDet.subMessage && (
          <Typography variant="body1" sx={{ marginTop: 1 }}>
            {errorDet.subMessage}
          </Typography>
        )}
      </Box>
    </>
  )
}

export default ErrorPage
