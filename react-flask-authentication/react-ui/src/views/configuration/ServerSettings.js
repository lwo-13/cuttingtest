import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Snackbar,
    Alert,
    Stack,
    Divider,
    CircularProgress
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const ServerSettings = () => {
    const [settings, setSettings] = useState({
        databaseHost: '',
        databasePort: '',
        databaseName: '',
        databaseUser: '',
        databasePassword: '',
        consumptionAnalyticsPowerBiUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            console.log('Fetching server settings...');
            const response = await axios.get('/config/server-settings');
            console.log('Server settings response:', response.data);
            if (response.data.success) {
                setSettings(response.data.data || {});
                setHasChanges(false);
            } else {
                console.error('API returned success=false:', response.data);
                showSnackbar(response.data.msg || 'Error loading server settings', 'error');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showSnackbar('Error loading server settings: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleChange = (field, value) => {
        setSettings({ ...settings, [field]: value });
        setHasChanges(true);
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await axios.post('/config/server-settings', settings);
            if (response.data.success) {
                showSnackbar('Server settings saved successfully!', 'success');
                setHasChanges(false);
            } else {
                showSnackbar(response.data.msg || 'Error saving settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showSnackbar('Error saving server settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainCard title="Server Settings">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <MainCard
            title="Server Settings"
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchSettings}
                        size="small"
                    >
                        Reload
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={saveSettings}
                        size="small"
                        color="primary"
                        disabled={!hasChanges || saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </Box>
            }
        >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure database and server connection settings
            </Typography>

            <Stack spacing={2}>
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Database Configuration</Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Database Host"
                            value={settings.databaseHost || ''}
                            onChange={(e) => handleChange('databaseHost', e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Database Port"
                            value={settings.databasePort || ''}
                            onChange={(e) => handleChange('databasePort', e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Database Name"
                            value={settings.databaseName || ''}
                            onChange={(e) => handleChange('databaseName', e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Database User"
                            value={settings.databaseUser || ''}
                            onChange={(e) => handleChange('databaseUser', e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Database Password"
                            type="password"
                            value={settings.databasePassword || ''}
                            onChange={(e) => handleChange('databasePassword', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Stack>
                </Box>

                <Divider />

                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Consumption Analytics Power BI</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This URL is used in the "Consumption Analytics" dashboard page.
                    </Typography>
                    <TextField
                        label="Power BI Embed URL"
                        value={settings.consumptionAnalyticsPowerBiUrl || ''}
                        onChange={(e) => handleChange('consumptionAnalyticsPowerBiUrl', e.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                        size="small"
                    />
                </Box>
            </Stack>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainCard>
    );
};

export default ServerSettings;

