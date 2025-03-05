import React from 'react';

// material-ui
import { Typography, Stack } from '@mui/material';

//-----------------------|| FOOTER - AUTHENTICATION 2 & 3 ||-----------------------//

const AuthFooter = () => {
    return (
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle2">
                Cutting Zalli
            </Typography>
            <Typography variant="subtitle2">
                &copy; <strong>λν</strong> Devs. Inc.
            </Typography>
        </Stack>
    );
};

export default AuthFooter;
