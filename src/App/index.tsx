import * as React from 'react'
import { Helmet } from 'react-helmet-async'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Switch, Route } from 'react-router-dom'

import HomePage from '../HomePage'
import SubmissionsPage from '../SubmissionsPage/index'
import Menu from './Menu'

const drawerWidth = 240

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <>
      <Helmet
        titleTemplate="%s - Concave Co-Op"
        defaultTitle="Concave Co-Op"
      >
        <title>PoW Hub</title>
      </Helmet>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            display: { sm: 'none' },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              PoW Hub
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
           <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <Menu />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <Menu />
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` } }}
        >
          <Toolbar sx={{ display: { sm: 'none' } }} />
          <Switch>
            <Route exact path="/">
              <HomePage />
            </Route>
            <Route path="/:channelId">
              <SubmissionsPage />
            </Route>
          </Switch>
        </Box>
      </Box>
    </>
  )
}

export default App
