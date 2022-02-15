import React from 'react'
import ReactDOM from 'react-dom'
import { HelmetProvider } from 'react-helmet-async'
import {
  BrowserRouter as Router,
} from "react-router-dom"
import { SWRConfig, SWRConfiguration } from "swr"
import { createTheme, ThemeProvider } from '@mui/material/styles'

import './index.css'
import App from './App'
import config from './config'

const fetcher = async (url: string): Promise<any> => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const res = await fetch(`${config.baseUrl}${url}`)
  if (res.status === 404) {
    throw new Error('Not Found')
  }
  if (res.status === 500) {
    throw new Error('Server Issue')
  }
  return res.json()
}

const onErrorRetry: SWRConfiguration['onErrorRetry'] = (error: Error, key, swrConfig, revalidate, { retryCount }) => {
  if (error.message === 'Not Found' || error.message === 'Server Issue') return

  if (retryCount >= 10) return

  setTimeout(() => revalidate({ retryCount }), 5000)
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#606604',
    },
  },
  typography: {
    h1: {
      fontSize: '3rem',
    },
    h2: {
      fontSize: '2rem',
    },
  },
})

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <HelmetProvider>
        <SWRConfig value={{ fetcher, onErrorRetry }}>
          <Router basename={config.baseUrl}>
            <App />
          </Router>
        </SWRConfig>
      </HelmetProvider>
    </ThemeProvider>,
  </React.StrictMode>,
  document.getElementById('root'),
)
