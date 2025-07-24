import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// material-ui
import {
    Box,
    Typography,
    Button,
    Stack,
    Alert,
    Card,
    CardContent,
    Grid
} from '@mui/material';
import { IconExternalLink, IconChartBar } from '@tabler/icons';

// project imports
import MainCard from '../../ui-component/cards/MainCard';
import AnimateButton from '../../ui-component/extended/AnimateButton';

//-----------------------|| CONSUMPTION ANALYTICS PAGE ||-----------------------//

const ConsumptionAnalytics = () => {
    const { t } = useTranslation();

    return (
        <MainCard>
            <Box sx={{ height: '80vh', width: '100%' }}>
                <iframe
                    title="Cutting BI ZALLI"
                    width="100%"
                    height="100%"
                    src="https://app.powerbi.com/view?r=eyJrIjoiOTNiMGFhNWMtMjM5MS00NmQwLTliMDYtNmVhODEyNWE5MGYwIiwidCI6IjYwNTllMzY5LTQzYzktNDM4My04ODk0LTIzYTlkNTk1N2NlYiIsImMiOjh9&pageName=ReportSection&$filter=&navContentPaneEnabled=false&filterPaneEnabled=false"
                    frameBorder="0"
                    allowFullScreen={true}
                    style={{
                        border: 'none',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}
                />
            </Box>
        </MainCard>
    );
};

export default ConsumptionAnalytics;
