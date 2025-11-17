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
    Slider,
    MenuItem
} from '@mui/material';
import { CUTTING_ROOMS } from 'utils/productionCenterConfig';

import { Save, RestoreOutlined } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const InstallationSettings = () => {
    const [settings, setSettings] = useState({
        internalCuttingRoom: 'ZALLI',
        spreaderLineCount: 3,
        cutterLineCount: 2,
        cutterAssignments: {}
    });
    const [originalSettings, setOriginalSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/config/installation-settings');
            if (response.data && response.data.success) {
                const data = response.data.data || {};
                const next = {
                    internalCuttingRoom: data.internalCuttingRoom || data.installationCuttingRoom || 'ZALLI',
                    spreaderLineCount: data.spreaderLineCount ?? 3,
                    cutterLineCount: data.cutterLineCount ?? 2,
                    cutterAssignments: data.cutterAssignments || {}
                };
                setSettings(next);
                setOriginalSettings(next);
                setHasChanges(false);
            } else {
                showSnackbar(response.data.msg || 'Failed to load installation settings', 'error');
            }
        } catch (error) {
            console.error('Error loading installation settings:', error);
            showSnackbar('Error loading installation settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const getSpreaderIds = (count) => {
        const n = Number(count) || 0;
        return Array.from({ length: n }, (_, i) => `SP${i + 1}`);
    };

    const getCutterIds = (count) => {
        const n = Number(count) || 0;
        return Array.from({ length: n }, (_, i) => `CT${i + 1}`);
    };

    const cuttingRoomOptions = Object.values(CUTTING_ROOMS || {});


    // Slider marks: show all possible line counts (1..6) as grey numbers under the slider
    const lineMarks = Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

    const handleToggleAssignment = (cutterId, spreaderId) => {
        setSettings((prev) => {
            const currentAssignments = prev.cutterAssignments || {};
            const existing = new Set(currentAssignments[cutterId] || []);
            if (existing.has(spreaderId)) {
                existing.delete(spreaderId);
            } else {
                existing.add(spreaderId);
            }
            return {
                ...prev,
                cutterAssignments: {
                    ...currentAssignments,
                    [cutterId]: Array.from(existing)
                }
            };
        });
        setHasChanges(true);
    };

    const discardChanges = () => {
        if (originalSettings) {
            setSettings(originalSettings);
            setHasChanges(false);
            showSnackbar('Changes discarded', 'info');
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const payload = {
                ...settings,
                spreaderLineCount: Number(settings.spreaderLineCount) || 0,
                cutterLineCount: Number(settings.cutterLineCount) || 0
            };
            const response = await axios.post('/config/installation-settings', payload);
            if (response.data && response.data.success) {
                showSnackbar('Installation settings saved successfully!', 'success');
                setOriginalSettings(payload);
                setHasChanges(false);
            } else {
                showSnackbar(response.data.msg || 'Failed to save installation settings', 'error');
            }
        } catch (error) {
            console.error('Error saving installation settings:', error);
            showSnackbar('Error saving installation settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const spreaderIds = getSpreaderIds(settings.spreaderLineCount);
    const cutterIds = getCutterIds(settings.cutterLineCount);

    if (loading) {
        return (
            <MainCard title="Internal Installation Settings">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <MainCard
            title="Internal Installation Settings"
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {hasChanges && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<RestoreOutlined />}
                            onClick={discardChanges}
                            disabled={saving}
                            sx={{ fontSize: '0.875rem', py: 0.75, px: 2, minHeight: '36px' }}
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
                            '&:hover': { backgroundColor: hasChanges ? 'primary.dark' : 'grey.500' },
                            '&:disabled': { backgroundColor: 'grey.300', color: 'grey.500' }
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
                        Cutting Room & Devices
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Define which cutting room is your internal cutting room and how many spreaders and cutters are installed there.
                    </Typography>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Internal Cutting Room"
                            value={settings.internalCuttingRoom || ''}
                            onChange={(e) => handleFieldChange('internalCuttingRoom', e.target.value)}
                            size="small"
                            sx={{ maxWidth: 320, '& .MuiInputBase-input': { fontWeight: 'normal' } }}
                        >
                            {cuttingRoomOptions.map((room) => (
                                <MenuItem key={room} value={room}>
                                    {room}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ maxWidth: 260 }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                    Spreader Line Count
                                </Typography>
                                <Slider
                                    size="small"
                                    min={1}
                                    max={6}
                                    step={1}
                                    marks={lineMarks}
                                    value={Number(settings.spreaderLineCount) || 1}
                                    onChange={(_, value) => {
                                        const numericValue = Array.isArray(value) ? value[0] : value;
                                        handleFieldChange('spreaderLineCount', numericValue);
                                    }}
                                />
                            </Box>
                            <Box sx={{ maxWidth: 260 }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                    Cutter Line Count
                                </Typography>
                                <Slider
                                    size="small"
                                    min={1}
                                    max={6}
                                    step={1}
                                    marks={lineMarks}
                                    value={Number(settings.cutterLineCount) || 1}
                                    onChange={(_, value) => {
                                        const numericValue = Array.isArray(value) ? value[0] : value;
                                        handleFieldChange('cutterLineCount', numericValue);
                                    }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <Box>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        Cutter to Spreader Assignments
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        For each cutter line (CT1...CTN), choose which spreader lines (SP1...SPM) feed mattresses to it.
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                        {spreaderIds.length === 0 || cutterIds.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                Increase the spreader and cutter line counts above to configure assignments.
                            </Typography>
                        ) : (
                            <Stack spacing={1.5}>
                                {cutterIds.map((cutterId) => {
                                    const assigned = new Set(settings.cutterAssignments?.[cutterId] || []);
                                    return (
                                        <Box key={cutterId} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography sx={{ width: 80 }}>{cutterId}</Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                {spreaderIds.map((spreaderId) => {
                                                    const selected = assigned.has(spreaderId);
                                                    return (
                                                        <Button
                                                            key={spreaderId}
                                                            variant={selected ? 'contained' : 'outlined'}
                                                            size="small"
                                                            onClick={() => handleToggleAssignment(cutterId, spreaderId)}
                                                            sx={{ textTransform: 'none', minWidth: 64 }}
                                                        >
                                                            {spreaderId}
                                                        </Button>
                                                    );
                                                })}
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Paper>
                </Box>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                >
                    <Alert
                        severity={snackbar.severity}
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Stack>
        </MainCard>
    );
};

export default InstallationSettings;

