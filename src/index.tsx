import React from 'react'
import ReactDOM from 'react-dom'
import { HelmetProvider } from 'react-helmet-async'
import {
  BrowserRouter as Router,
} from "react-router-dom"
import { SWRConfig } from "swr"
import { createTheme, ThemeProvider } from '@mui/material/styles'

import './index.css'
import App from './App'
import config from './config'

const fetcher = (url: string): Promise<any> => fetch(`${config.baseUrl}${url}`).then((res) => res.json()) // eslint-disable-line @typescript-eslint/no-explicit-any

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
        <SWRConfig value={{ fetcher }}>
          <Router basename={config.baseUrl}>
            <App />
          </Router>
        </SWRConfig>
      </HelmetProvider>
    </ThemeProvider>,

  </React.StrictMode>,
  document.getElementById('root'),
)
