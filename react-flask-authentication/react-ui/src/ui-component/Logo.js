import React from 'react';
import { useTheme } from '@mui/styles';
import { ReactComponent as LogoSVG } from '../assets/images/logo.svg';  // Corrected path

const Logo = () => {
  const theme = useTheme();

  return <LogoSVG width="160" height="auto" />;
};

export default Logo;
