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
    CircularProgress,
    MenuItem,
    Grid,
    InputAdornment,
    IconButton,
    Paper
} from '@mui/material';
import { Save, CheckCircle, Visibility, VisibilityOff, RestoreOutlined } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { updateDatabaseConfig } from 'utils/databaseConfig';

// Available ODBC drivers for SQL Server
const AVAILABLE_ODBC_DRIVERS = [
    'ODBC Driver 18 for SQL Server',
    'ODBC Driver 17 for SQL Server',
    'ODBC Driver 13.1 for SQL Server',
    'ODBC Driver 13 for SQL Server',
    'ODBC Driver 11 for SQL Server'
];

const ServerSettings = () => {
    const [settings, setSettings] = useState({
        databaseHost: '',
        databasePort: '',
        databaseName: '',
        databaseUser: '',
        databasePassword: '',
        odbcDriver: 'ODBC Driver 18 for SQL Server',
        consumptionAnalyticsPowerBiUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [hasChanges, setHasChanges] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [originalSettings, setOriginalSettings] = useState(null);
    const [urlError, setUrlError] = useState(false);

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
                const data = response.data.data || {};
                setSettings(data);
                setOriginalSettings(data);
                // Update the database config module
                updateDatabaseConfig(data);
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

    const testConnection = async () => {
        try {
            setTesting(true);
            const response = await axios.post('/config/test-connection', {
                databaseHost: settings.databaseHost,
                databasePort: settings.databasePort,
                databaseName: settings.databaseName,
                databaseUser: settings.databaseUser,
                databasePassword: settings.databasePassword,
                odbcDriver: settings.odbcDriver
            });
            if (response.data.success) {
                showSnackbar('✅ Connection successful!', 'success');
            } else {
                showSnackbar('❌ ' + (response.data.msg || 'Connection failed'), 'error');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            const errorMsg = error.response?.data?.msg || error.message || 'Connection test failed';
            showSnackbar('❌ ' + errorMsg, 'error');
        } finally {
            setTesting(false);
        }
    };

    const discardChanges = () => {
        if (originalSettings) {
            setSettings(originalSettings);
            setHasChanges(false);
            showSnackbar('Changes discarded', 'info');
        }
    };

    const validateUrl = (url) => {
        if (!url) {
            setUrlError(false);
            return;
        }
        const isValid = url.startsWith('http://') || url.startsWith('https://');
        setUrlError(!isValid);
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await axios.post('/config/server-settings', settings);
            if (response.data.success) {
                // Update the database config module
                updateDatabaseConfig(settings);
                setOriginalSettings(settings);
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
                    {hasChanges && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<RestoreOutlined />}
                            onClick={discardChanges}
                            disabled={saving}
                            sx={{
                                fontSize: '0.875rem',
                                py: 0.75,
                                px: 2,
                                minHeight: '36px'
                            }}
                        >
                            Discard
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={saveSettings}
                        disabled={!hasChanges || saving}
                        sx={{
                            backgroundColor: hasChanges ? 'primary.main' : 'grey.400',
                            color: 'white',
                            fontSize: '0.875rem',
                            py: 0.75,
                            px: 2,
                            minHeight: '36px',
                            '&:hover': {
                                backgroundColor: hasChanges ? 'primary.dark' : 'grey.500'
                            },
                            '&:disabled': {
                                backgroundColor: 'grey.300',
                                color: 'grey.500'
                            }
                        }}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            }
        >
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        Database Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure your database connection settings and ODBC driver.
                    </Typography>

                    {/* Groups 1 & 2: Server Location and Authentication Side by Side */}
                    <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5 }}>
                        {/* Group 1: Server Location */}
                        <Paper sx={{ p: 1.5, pb: 2.5, flex: 1, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                Server Location
                            </Typography>
                            <Stack spacing={1.5} sx={{ width: '50%' }}>
                                <TextField
                                    label="Database Host"
                                    value={settings.databaseHost || ''}
                                    onChange={(e) => handleChange('databaseHost', e.target.value)}
                                    size="small"
                                    placeholder="e.g., 172.27.57.201"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                />
                                <TextField
                                    label="Database Port"
                                    value={settings.databasePort || ''}
                                    onChange={(e) => handleChange('databasePort', e.target.value)}
                                    size="small"
                                    placeholder="e.g., 1433"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                />
                            </Stack>
                        </Paper>

                        {/* Group 2: Authentication */}
                        <Paper sx={{ p: 1.5, pb: 2.5, flex: 1, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                Authentication
                            </Typography>
                            <Stack spacing={1.5} sx={{ width: '50%' }}>
                                <TextField
                                    label="Database User"
                                    value={settings.databaseUser || ''}
                                    onChange={(e) => handleChange('databaseUser', e.target.value)}
                                    size="small"
                                    placeholder="e.g., sa"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                />
                                <TextField
                                    label="Database Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={settings.databasePassword || ''}
                                    onChange={(e) => handleChange('databasePassword', e.target.value)}
                                    size="small"
                                    placeholder="Enter password"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Stack>
                        </Paper>
                    </Box>

                    {/* Group 3: Target Database & Driver with Test Connection Button */}
                    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', mb: 2.5 }}>
                        <Paper sx={{ p: 1.5, pb: 2.5, width: '50%', backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
                                Target Database & Driver
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                <Stack spacing={1.5} sx={{ width: '50%' }}>
                                    <TextField
                                        label="Database Name"
                                        value={settings.databaseName || ''}
                                        onChange={(e) => handleChange('databaseName', e.target.value)}
                                        size="small"
                                        placeholder="e.g., CuttingRoom"
                                        fullWidth
                                        sx={{ "& input": { fontWeight: "normal" } }}
                                    />
                                    <TextField
                                        select
                                        label="ODBC Driver"
                                        value={settings.odbcDriver || 'ODBC Driver 18 for SQL Server'}
                                        onChange={(e) => handleChange('odbcDriver', e.target.value)}
                                        size="small"
                                        fullWidth
                                        sx={{ "& input": { fontWeight: "normal" } }}
                                    >
                                        {AVAILABLE_ODBC_DRIVERS.map((driver) => (
                                            <MenuItem key={driver} value={driver}>
                                                {driver}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* Test Connection Button - Wrapped in Transparent Paper */}
                        <Paper sx={{ p: 1.5, pb: 2.5, width: '50%', backgroundColor: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={testing ? <CircularProgress size={20} /> : <CheckCircle />}
                                onClick={testConnection}
                                disabled={testing || !settings.databaseHost || !settings.databasePort || !settings.databaseName || !settings.databaseUser}
                                sx={{
                                    color: 'primary.main',
                                    borderColor: 'primary.main',
                                    fontSize: '1rem',
                                    py: 1.25,
                                    px: 3,
                                    minHeight: '44px',
                                    '&:hover': {
                                        backgroundColor: 'primary.light',
                                        borderColor: 'primary.main'
                                    },
                                    '&:disabled': {
                                        color: 'grey.400',
                                        borderColor: 'grey.300'
                                    }
                                }}
                            >
                                {testing ? 'Testing...' : 'Test Connection'}
                            </Button>
                        </Paper>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        VPN Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Configure VPN settings for secure connections.
                    </Typography>

                    {/* Groups 1 & 2: VPN Server and VM Configuration Side by Side */}
                    <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5 }}>
                        {/* Group 1: VPN Server */}
                        <Paper sx={{ p: 1.5, pb: 2.5, flex: 1, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                VPN Server
                            </Typography>
                            <Stack spacing={1.5} sx={{ width: '50%' }}>
                                <TextField
                                    label="VPN Server Hostname"
                                    value={settings.vpnServerHostname || ''}
                                    onChange={(e) => handleChange('vpnServerHostname', e.target.value)}
                                    size="small"
                                    placeholder="e.g., sslvpn1.calzedonia.com"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                />
                                <TextField
                                    label="VPN Proxy Path"
                                    value={settings.vpnProxyPath || ''}
                                    onChange={(e) => handleChange('vpnProxyPath', e.target.value)}
                                    size="small"
                                    placeholder="e.g., /web_forward_CuttingApplicationAPI"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                />
                            </Stack>
                        </Paper>

                        {/* Group 2: VM Configuration */}
                        <Paper sx={{ p: 1.5, pb: 2.5, flex: 1, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                VM Configuration
                            </Typography>
                            <Stack spacing={1.5} sx={{ width: '50%' }}>
                                <TextField
                                    label="VM Hostname"
                                    value={settings.vmHostname || ''}
                                    onChange={(e) => handleChange('vmHostname', e.target.value)}
                                    size="small"
                                    placeholder="e.g., gab-navint01p.csg1.sys.calzedonia.com"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                />
                                <TextField
                                    label="VM IP Address"
                                    value={settings.vmIpAddress || ''}
                                    onChange={(e) => handleChange('vmIpAddress', e.target.value)}
                                    size="small"
                                    placeholder="e.g., 172.27.57.210"
                                    fullWidth
                                    sx={{ "& input": { fontWeight: "normal" } }}
                                />
                            </Stack>
                        </Paper>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        BI Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This URL is used in the "BI Configuration" dashboard page.
                    </Typography>
                    <TextField
                        label="BI Configuration URL"
                        value={settings.consumptionAnalyticsPowerBiUrl || ''}
                        onChange={(e) => handleChange('consumptionAnalyticsPowerBiUrl', e.target.value)}
                        onBlur={(e) => validateUrl(e.target.value)}
                        multiline
                        minRows={2}
                        size="small"
                        fullWidth
                        error={urlError}
                        helperText={urlError ? 'Must be a valid URL.' : ''}
                        sx={{ "& input": { fontWeight: "normal" }, "& textarea": { fontWeight: "normal" } }}
                    />
                </Box>
            </Stack>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%', padding: "12px 16px", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainCard>
    );
};

export default ServerSettings;

