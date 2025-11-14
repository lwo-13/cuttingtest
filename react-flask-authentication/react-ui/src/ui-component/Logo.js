import React from 'react';
import { useTheme } from '@mui/styles';
import { ReactComponent as LogoDefault } from '../assets/images/logo.svg';
import { ReactComponent as LogoZalli } from '../assets/images/logo-zalli.svg';
import { ReactComponent as LogoDark } from '../assets/images/logo-dark.svg';
import { LOGO_VARIANT, CUSTOM_LOGO_URL } from '../utils/appBrandingConfig';

const Logo = () => {
  const theme = useTheme();

  // If a custom logo URL is configured, use it instead of the SVG variants
  if (CUSTOM_LOGO_URL && typeof CUSTOM_LOGO_URL === 'string' && CUSTOM_LOGO_URL.trim() !== '') {
    return (
      <img
        src={CUSTOM_LOGO_URL}
        alt="Logo"
        style={{ maxHeight: 50, width: 'auto', display: 'block' }}
      />
    );
  }

  let LogoComponent = LogoDefault;

  if (LOGO_VARIANT === 'zalli') {
    LogoComponent = LogoZalli;
  } else if (LOGO_VARIANT === 'dark') {
    LogoComponent = LogoDark;
  }

  return <LogoComponent width="160" height="50" />;
};

export default Logo;
