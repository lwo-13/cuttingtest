import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { ThemeProvider, CssBaseline, StyledEngineProvider, GlobalStyles } from '@mui/material';

// routing
import Routes from './routes';

// defaultTheme
import theme from './themes';

// project imports
import NavigationScroll from './layout/NavigationScroll';
import { BadgeCountProvider } from './contexts/BadgeCountContext';
import { preloadItemDescriptions } from './hooks/useItemDescriptions';
import { CUSTOM_FAVICON_URL } from 'utils/appBrandingConfig';

//-----------------------|| APP ||-----------------------//

const App = () => {
    const customization = useSelector((state) => state.customization);

    // Preload color descriptions early to prevent layout shifts
    useEffect(() => {
        preloadItemDescriptions().catch(err => {
            console.warn('Failed to preload item descriptions:', err);
        });
    }, []);

    // Apply custom favicon from branding configuration, if provided
    useEffect(() => {
        if (!CUSTOM_FAVICON_URL || typeof CUSTOM_FAVICON_URL !== 'string' || !CUSTOM_FAVICON_URL.trim()) {
            return;
        }

        const existingLink = document.querySelector("link[rel='icon']");
        const link = existingLink || document.createElement('link');
        link.rel = 'icon';
        link.href = CUSTOM_FAVICON_URL;

        if (!existingLink) {
            document.head.appendChild(link);
        }
    }, []);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme(customization)}>
                <CssBaseline />

                {/* ✅ Edge fix for password reveal and clear */}
                <GlobalStyles
                styles={{
                    'input::-ms-reveal': { display: 'none' },
                    'input::-ms-clear': { display: 'none' }
                }}
                />
                <BadgeCountProvider>
                    <NavigationScroll>
                        <Routes />
                    </NavigationScroll>
                </BadgeCountProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
