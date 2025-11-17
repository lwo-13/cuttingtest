import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    Typography,
    Snackbar,
    Alert
} from '@mui/material';
import { Save, RestoreOutlined, Refresh } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'axios';

const ApplicationModules = () => {
    const [modules, setModules] = useState({
        dashboard: true,
        planning: true,
        todoLists: true,
        tables: true,
        importPrintTools: true,
        collarettoOperations: true,
        operatorsManagement: true
    });
    const [originalModules, setOriginalModules] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchModules();
    }, []);

    useEffect(() => {
        if (originalModules) {
            const changed = JSON.stringify(modules) !== JSON.stringify(originalModules);
            setHasChanges(changed);
        }
    }, [modules, originalModules]);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchModules = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/config/application-modules');
            if (response.data && response.data.success) {
                const data = response.data.data || {};
                setModules(data);
                setOriginalModules(data);
                setHasChanges(false);
            } else {
                showSnackbar(response.data.msg || 'Failed to load application modules', 'error');
            }
        } catch (error) {
            console.error('Error fetching application modules:', error);
            showSnackbar('Error loading application modules', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveModules = async () => {
        try {
            setSaving(true);
            const response = await axios.post('/api/config/application-modules', modules);
            if (response.data.success) {
                setOriginalModules(modules);
                showSnackbar('Application modules saved successfully!', 'success');
                setHasChanges(false);
            } else {
                showSnackbar(response.data.msg || 'Error saving modules', 'error');
            }
        } catch (error) {
            console.error('Error saving application modules:', error);
            showSnackbar('Error saving application modules', 'error');
        } finally {
            setSaving(false);
        }
    };

    const discardChanges = () => {
        setModules(originalModules);
        setHasChanges(false);
    };

    const handleToggle = (moduleKey) => {
        setModules({ ...modules, [moduleKey]: !modules[moduleKey] });
    };

    if (loading) {
        return (
            <MainCard title="Application Modules">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    const moduleDefinitions = [
        { key: 'dashboard', label: 'Dashboard', description: 'KPI Dashboard, Consumption Analytics, and Order Report' },
        { key: 'planning', label: 'Planning', description: 'Kanban Board and Order Planning' },
        { key: 'todoLists', label: 'To-Do Lists', description: 'Italian Ratios, Width Changes, and Marker Requests' },
        { key: 'tables', label: 'Tables', description: 'Orders, Marker Database, and Pad Prints' },
        { key: 'importPrintTools', label: 'Import & Print Tools', description: 'Import and print functionality' },
        { key: 'collarettoOperations', label: 'Collaretto Operations', description: 'Create, Reprint, and Delete collaretto' },
        { key: 'operatorsManagement', label: 'Operators Management', description: 'Manage spreader, cutter, collaretto, and warehouse operators' }
    ];

    return (
        <MainCard
            title="Application Modules"
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="text"
                        onClick={fetchModules}
                        size="small"
                        sx={{ minWidth: 'auto', p: 1 }}
                        title="Reload"
                    >
                        <Refresh />
                    </Button>
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
                        onClick={saveModules}
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enable or disable specific modules of the application. Disabled modules will be hidden from the navigation menu.
            </Typography>

            <Stack spacing={2}>
                {moduleDefinitions.map((module) => (
                    <Paper key={module.key} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" sx={{ mb: 0.5 }}>
                                    {module.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {module.description}
                                </Typography>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={modules[module.key]}
                                        onChange={() => handleToggle(module.key)}
                                        color="primary"
                                    />
                                }
                                label={modules[module.key] ? 'Enabled' : 'Disabled'}
                                labelPlacement="start"
                                sx={{
                                    ml: 2,
                                    '& .MuiFormControlLabel-label': {
                                        fontWeight: 'normal',
                                        color: modules[module.key] ? 'success.main' : 'text.secondary'
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                ))}
            </Stack>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
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

export default ApplicationModules;

