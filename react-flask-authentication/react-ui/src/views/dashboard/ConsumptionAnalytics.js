import React, { useState, useEffect } from 'react';
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
    Grid,
    CircularProgress
} from '@mui/material';
import { IconExternalLink, IconChartBar } from '@tabler/icons';

// project imports
import MainCard from '../../ui-component/cards/MainCard';
import AnimateButton from '../../ui-component/extended/AnimateButton';
import { getPowerBiUrl } from '../../utils/databaseConfig';

//-----------------------|| CONSUMPTION ANALYTICS PAGE ||-----------------------//

const ConsumptionAnalytics = () => {
    const { t } = useTranslation();
    const [powerBiUrl, setPowerBiUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get the Power BI URL from server config
        const url = getPowerBiUrl();
        setPowerBiUrl(url);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <MainCard>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    if (!powerBiUrl) {
        return (
            <MainCard>
                <Alert severity="warning">
                    Power BI URL is not configured. Please go to Server Settings to configure it.
                </Alert>
            </MainCard>
        );
    }

    return (
        <MainCard>
            <Box sx={{ height: '80vh', width: '100%' }}>
                <iframe
                    title="Cutting BI ZALLI"
                    width="100%"
                    height="100%"
                    src={powerBiUrl}
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
