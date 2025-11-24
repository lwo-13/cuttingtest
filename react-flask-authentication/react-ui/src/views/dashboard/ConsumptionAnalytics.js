import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../../utils/axiosInstance';

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
import { updateDatabaseConfig } from '../../utils/databaseConfig';

//-----------------------|| CONSUMPTION ANALYTICS PAGE ||-----------------------//

const ConsumptionAnalytics = () => {
    const { t } = useTranslation();
    const [powerBiUrl, setPowerBiUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPowerBiUrl();
    }, []);

    const fetchPowerBiUrl = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch server settings from the API
            const response = await axios.get('/config/server-settings');

            if (response.data.success) {
                const settings = response.data.data || {};

                // Update the global database config so other parts of the app can use it
                updateDatabaseConfig(settings);

                // Set the Power BI URL
                setPowerBiUrl(settings.consumptionAnalyticsPowerBiUrl || '');
            } else {
                setError(response.data.msg || 'Failed to load server settings');
            }
        } catch (err) {
            // More detailed error message
            let errorMessage = 'Failed to load Power BI configuration';
            if (err.response) {
                errorMessage = `Server error: ${err.response.status} - ${err.response.data?.msg || err.response.statusText}`;
            } else if (err.request) {
                errorMessage = 'Network error: Unable to reach server';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainCard>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    if (error) {
        return (
            <MainCard>
                <Alert severity="error">
                    {error}
                </Alert>
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
