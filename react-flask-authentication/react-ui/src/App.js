import React from 'react';
import { useSelector } from 'react-redux';

import { ThemeProvider, CssBaseline, StyledEngineProvider } from '@mui/material';

import { GlobalStyles } from '@mui/material';

// routing
import Routes from './routes';

// defaultTheme
import theme from './themes';

// project imports
import NavigationScroll from './layout/NavigationScroll';

//-----------------------|| APP ||-----------------------//

const App = () => {
    const customization = useSelector((state) => state.customization);

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
                
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
