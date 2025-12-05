import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Snackbar,
    Alert,
    Stack,
    CircularProgress,
    Paper,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { Save, RestoreOutlined, Add, Delete } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { CUTTING_ROOMS } from 'utils/productionCenterConfig';

// List of subcontractor cutting rooms (exclude internal rooms like ZALLI)
const SUBCONTRACTOR_CUTTING_ROOMS = Object.values(CUTTING_ROOMS).filter(
    room => room !== 'ZALLI'
);

const EmailSettings = () => {
    const [settings, setSettings] = useState({
        mainRecipients: [],
        subcontractorEmails: {}
    });
    const [originalSettings, setOriginalSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/config/email-settings');
            if (response.data && response.data.success) {
                const data = response.data.data || {};
                const next = {
                    mainRecipients: data.mainRecipients || [],
                    subcontractorEmails: data.subcontractorEmails || {}
                };
                setSettings(next);
                setOriginalSettings(JSON.parse(JSON.stringify(next)));
                setHasChanges(false);
            } else {
                showSnackbar(response.data.msg || 'Failed to load email settings', 'error');
            }
        } catch (error) {
            console.error('Error loading email settings:', error);
            showSnackbar('Error loading email settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMainRecipient = () => {
        setSettings(prev => ({
            ...prev,
            mainRecipients: [...prev.mainRecipients, { email: '', description: '' }]
        }));
        setHasChanges(true);
    };

    const handleRemoveMainRecipient = (index) => {
        setSettings(prev => ({
            ...prev,
            mainRecipients: prev.mainRecipients.filter((_, i) => i !== index)
        }));
        setHasChanges(true);
    };

    const handleMainRecipientChange = (index, field, value) => {
        setSettings(prev => ({
            ...prev,
            mainRecipients: prev.mainRecipients.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
        setHasChanges(true);
    };

    const handleSubcontractorEmailChange = (cuttingRoom, field, value) => {
        setSettings(prev => ({
            ...prev,
            subcontractorEmails: {
                ...prev.subcontractorEmails,
                [cuttingRoom]: {
                    ...(prev.subcontractorEmails[cuttingRoom] || { email: '', description: '' }),
                    [field]: value
                }
            }
        }));
        setHasChanges(true);
    };

    const discardChanges = () => {
        if (originalSettings) {
            setSettings(JSON.parse(JSON.stringify(originalSettings)));
            setHasChanges(false);
            showSnackbar('Changes discarded', 'info');
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await axios.post('/config/email-settings', settings);
            if (response.data && response.data.success) {
                showSnackbar('Email settings saved successfully!', 'success');
                setOriginalSettings(JSON.parse(JSON.stringify(settings)));
                setHasChanges(false);
            } else {
                showSnackbar(response.data.msg || 'Failed to save email settings', 'error');
            }
        } catch (error) {
            console.error('Error saving email settings:', error);
            showSnackbar('Error saving email settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainCard title="Email Settings">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <MainCard
            title="Email Settings"
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {hasChanges && (
                        <Button variant="outlined" color="error" startIcon={<RestoreOutlined />}
                            onClick={discardChanges} disabled={saving}
                            sx={{ fontSize: '0.875rem', py: 0.75, px: 2, minHeight: '36px' }}>
                            Discard
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<Save />} onClick={saveSettings}
                        disabled={!hasChanges || saving}
                        sx={{ backgroundColor: hasChanges ? 'primary.main' : 'grey.400', color: 'white',
                            fontSize: '0.875rem', py: 0.75, px: 2, minHeight: '36px',
                            '&:hover': { backgroundColor: hasChanges ? 'primary.dark' : 'grey.500' },
                            '&:disabled': { backgroundColor: 'grey.300', color: 'grey.500' } }}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            }
        >
            <Stack spacing={3}>
                {/* Main Recipients Section */}
                <Box>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        Main Email Recipients
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        These email addresses will always be included when sending order notifications.
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Description (Optional)</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: 60 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {settings.mainRecipients.map((recipient, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <TextField
                                                    fullWidth size="small" type="email"
                                                    placeholder="email@example.com"
                                                    value={recipient.email || ''}
                                                    onChange={(e) => handleMainRecipientChange(index, 'email', e.target.value)}
                                                    sx={{ '& .MuiInputBase-input': { fontWeight: 'normal' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth size="small" placeholder="e.g., Planning Manager"
                                                    value={recipient.description || ''}
                                                    onChange={(e) => handleMainRecipientChange(index, 'description', e.target.value)}
                                                    sx={{ '& .MuiInputBase-input': { fontWeight: 'normal' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="error"
                                                    onClick={() => handleRemoveMainRecipient(index)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button startIcon={<Add />} onClick={handleAddMainRecipient} sx={{ mt: 2 }}>
                            Add Recipient
                        </Button>
                    </Paper>
                </Box>

                {/* Subcontractor Emails Section */}
                <Box>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        Subcontractor Emails
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Configure email addresses for each subcontractor cutting room. These will be included when sending orders to that cutting room.
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Cutting Room</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Description (Optional)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {SUBCONTRACTOR_CUTTING_ROOMS.map((cuttingRoom) => (
                                        <TableRow key={cuttingRoom}>
                                            <TableCell sx={{ fontWeight: 500 }}>{cuttingRoom}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth size="small" type="email"
                                                    placeholder="email@example.com"
                                                    value={settings.subcontractorEmails[cuttingRoom]?.email || ''}
                                                    onChange={(e) => handleSubcontractorEmailChange(cuttingRoom, 'email', e.target.value)}
                                                    sx={{ '& .MuiInputBase-input': { fontWeight: 'normal' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth size="small" placeholder="Contact name"
                                                    value={settings.subcontractorEmails[cuttingRoom]?.description || ''}
                                                    onChange={(e) => handleSubcontractorEmailChange(cuttingRoom, 'description', e.target.value)}
                                                    sx={{ '& .MuiInputBase-input': { fontWeight: 'normal' } }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>

                <Snackbar open={snackbar.open} autoHideDuration={4000}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    <Alert severity={snackbar.severity}
                        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Stack>
        </MainCard>
    );
};

export default EmailSettings;

