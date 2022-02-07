import React from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'
import MatLink, { LinkProps as MatLinkProps } from '@mui/material/Link'

export type LinkProps = {

} & RouterLinkProps & MatLinkProps

const Link: React.FC<LinkProps> = (props) => {
  return (
    <MatLink component={RouterLink} {...props} />
  )
}

export default Link
