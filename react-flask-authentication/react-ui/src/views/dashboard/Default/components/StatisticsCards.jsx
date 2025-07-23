import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'utils/axiosInstance';

// material-ui
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// icons
import {
    IconListCheck,
    IconFileImport,
    IconStack2,
    IconRuler2
} from '@tabler/icons';

const StatisticsCards = ({ selectedPeriod }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/dashboard/statistics?period=${selectedPeriod}`);
            if (response.data.success) {
                setStatistics(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch statistics');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, [selectedPeriod]);

    const StatCard = ({ title, value, icon, color = 'primary', suffix = '' }) => (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette[color].light} 0%, ${theme.palette[color].main} 100%)`,
                color: theme.palette[color].contrastText
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                `${value}${suffix}`
                            )}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                            {title}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t('dashboard.ordersWorkedOn', 'Orders Worked On')}
                    value={statistics?.orders_worked_on || 0}
                    icon={<IconListCheck size={24} />}
                    color="primary"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t('dashboard.markersImported', 'Markers Imported')}
                    value={statistics?.markers_imported || 0}
                    icon={<IconFileImport size={24} />}
                    color="secondary"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t('dashboard.mattressesCreated', 'Mattresses Created')}
                    value={statistics?.mattresses_created || 0}
                    icon={<IconStack2 size={24} />}
                    color="success"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t('dashboard.totalConsumption', 'Total Consumption')}
                    value={statistics?.total_consumption_planned || 0}
                    icon={<IconRuler2 size={24} />}
                    color="warning"
                    suffix=" m"
                />
            </Grid>
        </Grid>
    );
};

export default StatisticsCards;
