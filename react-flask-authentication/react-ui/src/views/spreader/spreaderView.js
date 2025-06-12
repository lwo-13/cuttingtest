import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Divider,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';

import MainCard from '../../ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import useCollapseMenu from '../../hooks/useCollapseMenu';

const SpreaderView = () => {
    const { t } = useTranslation();
    // Automatically collapse the sidebar menu
    useCollapseMenu(true);

    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // State for background refresh
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [processingMattress, setProcessingMattress] = useState(null);
    const [operators, setOperators] = useState([]);
    const [selectedOperator, setSelectedOperator] = useState('');
    const [loadingOperators, setLoadingOperators] = useState(false);
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);
    const [selectedMattress, setSelectedMattress] = useState(null);
    const [actualLayers, setActualLayers] = useState('');
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const [activeSpreadingMattress, setActiveSpreadingMattress] = useState(null); // Track active spreading mattress
    const account = useSelector((state) => state.account);
    const { user } = account;

    // Extract spreader number from username (e.g., "Spreader1" -> "SP1")
    const getSpreaderDevice = (username) => {
        if (!username) return null;
        const match = username.match(/Spreader(\d+)/i);
        return match ? `SP${match[1]}` : null;
    };

    const spreaderDevice = getSpreaderDevice(user?.username);

    useEffect(() => {
        if (!spreaderDevice) {
            setError(t('spreader.invalidUsername'));
            setLoading(false);
            return;
        }

        fetchMattresses(true); // Initial load
        fetchOperators();

        // Set up auto-refresh polling every 5 minutes
        const refreshInterval = setInterval(() => {
            fetchMattresses(false); // Background refresh
        }, 300000); // 5 minutes (300,000 ms)

        // Clean up the interval when component unmounts
        return () => clearInterval(refreshInterval);
    }, [spreaderDevice]);

    const fetchOperators = async () => {
        setLoadingOperators(true);
        try {
            const response = await axios.get('/operators/active');
            if (response.data.success) {
                setOperators(response.data.data);
                // Set default selected operator to the current user if they're in the list
                const currentUserName = user?.username || '';
                const matchingOperator = response.data.data.find(op => op.name === currentUserName);
                if (matchingOperator) {
                    setSelectedOperator(matchingOperator.id.toString());
                } else if (response.data.data.length > 0) {
                    // Otherwise select the first operator
                    setSelectedOperator(response.data.data[0].id.toString());
                }
            } else {
                console.error("Error fetching operators:", response.data.message);
            }
        } catch (error) {
            console.error("API Error fetching operators:", error);
        } finally {
            setLoadingOperators(false);
        }
    };

    const fetchMattresses = (isInitialLoad = false) => {
        // Only set loading to true for initial load, otherwise use refreshing state
        if (isInitialLoad) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        // Add day=today parameter to only show mattresses for today
        axios.get(`/mattress/kanban?day=today`)
            .then((res) => {
                if (res.data.success) {
                    // Filter mattresses assigned to this spreader
                    const filteredMattresses = res.data.data.filter(
                        m => m.device === spreaderDevice &&
                        (m.status === "1 - TO LOAD" || m.status === "2 - ON SPREAD")
                    );

                    // Group by shift
                    const firstShift = filteredMattresses.filter(m => m.shift === '1shift');
                    const secondShift = filteredMattresses.filter(m => m.shift === '2shift');

                    // Sort by position
                    firstShift.sort((a, b) => a.position - b.position);
                    secondShift.sort((a, b) => a.position - b.position);

                    // Check if there's any mattress with status "2 - ON SPREAD" for this specific spreader device
                    const onSpreadMattress = [...firstShift, ...secondShift].find(
                        m => m.status === "2 - ON SPREAD" && m.device === spreaderDevice
                    );
                    setActiveSpreadingMattress(onSpreadMattress || null);

                    setMattresses({
                        firstShift,
                        secondShift
                    });

                    // Update last refresh time
                    setLastRefreshTime(new Date());
                } else {
                    setError("Error fetching data: " + res.data.message);
                }
            })
            .catch((err) => {
                setError("API Error: " + (err.message || "Unknown error"));
                console.error("API Error:", err);
            })
            .finally(() => {
                // Reset loading states
                setLoading(false);
                setRefreshing(false);
            });
    };

    const handleStartSpreading = (mattressId) => {
        // Check if there's already an active spreading mattress for this spreader
        if (activeSpreadingMattress) {
            setSnackbar({
                open: true,
                message: t('spreader.cannotStartSpreading', { mattress: activeSpreadingMattress.mattress, device: spreaderDevice }),
                severity: "error"
            });
            return;
        }

        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(mattressId);
        axios.put(`/mattress/update_status/${mattressId}`, {
            status: "2 - ON SPREAD",
            operator: operatorName,
            device: spreaderDevice // Explicitly set the device to ensure it's updated
        })
        .then((res) => {
            if (res.data.success) {
                setSnackbar({
                    open: true,
                    message: "Status updated to ON SPREAD successfully",
                    severity: "success"
                });
                fetchMattresses(false); // Refresh the data in background
            } else {
                setSnackbar({
                    open: true,
                    message: "Error: " + res.data.message,
                    severity: "error"
                });
            }
        })
        .catch((err) => {
            setSnackbar({
                open: true,
                message: "API Error: " + (err.message || "Unknown error"),
                severity: "error"
            });
            console.error("API Error:", err);
        })
        .finally(() => {
            setProcessingMattress(null);
        });
    };

    const handleOpenFinishDialog = (mattress) => {
        setSelectedMattress(mattress);
        setActualLayers(mattress.layers || ''); // Default to planned layers
        setFinishDialogOpen(true);
    };

    const handleCloseFinishDialog = () => {
        setFinishDialogOpen(false);
        setSelectedMattress(null);
        setActualLayers('');
    };

    const handleFinishSpreading = () => {
        if (!selectedMattress) return;

        // Validate actual layers input
        if (!actualLayers || isNaN(actualLayers) || Number(actualLayers) <= 0) {
            setSnackbar({
                open: true,
                message: t('spreader.enterValidLayers'),
                severity: "error"
            });
            return;
        }

        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(selectedMattress.id);

        // First update the status to "3 - TO CUT" or "5 - COMPLETE"
        const nextStatus = ['ASW', 'ASB'].includes(selectedMattress.item_type)
            ? '5 - COMPLETED'
            : '3 - TO CUT';

        // First update the status
        axios.put(`/mattress/update_status/${selectedMattress.id}`, {
            status: nextStatus,
            operator: operatorName,
            device: spreaderDevice
        })
        .then((res) => {
            if (res.data.success) {
                // Then update the actual layers (layers_a) in mattress_details
                return axios.put(`/mattress/update_layers_a/${selectedMattress.id}`, {
                    layers_a: Number(actualLayers)
                });
            } else {
                throw new Error(res.data.message || "Failed to update status");
            }
        })
        .then((res) => {
            if (res.data.success) {
                setSnackbar({
                    open: true,
                    message: "Spreading finished successfully",
                    severity: "success"
                });
                handleCloseFinishDialog();
                // Reset active spreading mattress
                setActiveSpreadingMattress(null);
                fetchMattresses(false); // Refresh the data in background
            } else {
                throw new Error(res.data.message || "Failed to update actual layers");
            }
        })
        .catch((err) => {
            setSnackbar({
                open: true,
                message: "Error: " + (err.message || "Unknown error"),
                severity: "error"
            });
            console.error("API Error:", err);
        })
        .finally(() => {
            setProcessingMattress(null);
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const renderMattressCard = (mattress) => (
        <Card key={mattress.id} sx={{ mb: 2, boxShadow: 3 }}>
            <Box sx={{ p: 2 }}>
                {/* Header with mattress ID and pieces/layers info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                            {mattress.mattress}
                        </Typography>

                        {mattress.marker && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                <strong>{t('kanban.marker')}:</strong> {mattress.marker}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: mattress.status?.includes('ON SPREAD') ? 'secondary.main' : 'text.secondary',
                                bgcolor: mattress.status?.includes('ON SPREAD') ? '#f3e5f5' : '#ffffff',
                                px: 1,
                                py: 1,
                                borderRadius: 2,
                                minWidth: 100,
                                fontWeight: 'bold',
                                fontSize: '0.875rem'
                            }}
                        >
                            {mattress.status?.split(' - ')[1] || mattress.status}
                        </Box>
                        {mattress.total_pcs > 0 && (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#e3f2fd',
                                px: 1,
                                py: 1,
                                borderRadius: 2,
                                minWidth: 100
                            }}>
                                <Typography variant="h4" color="#2196f3" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                                {mattress.total_pcs}
                                </Typography>
                                <Typography sx={{ ml: 1, fontSize: '1rem', color: '#1976d2' }}>{t('kanban.pieces')}</Typography>
                            </Box>
                        )}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#f3e5f5',
                            px: 1,
                            py: 1,
                            borderRadius: 2,
                            minWidth: 100
                        }}>
                            <Typography variant="h4" color="#9c27b0" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                                {mattress.layers || 0} {t('kanban.layers')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Details section */}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.order')}:</strong> {mattress.order_commessa}</Typography>
                        {mattress.destination && mattress.destination !== 'Not Assigned' && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.destination', 'Destination')}:</strong> {mattress.destination}</Typography>
                        )}
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.fabric')}:</strong> {mattress.fabric_code} {mattress.fabric_color}</Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('table.bagno')}:</strong> {mattress.dye_lot}</Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.spreadingMethod')}:</strong> {mattress.spreading_method}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('table.width')}:</strong> {mattress.width} cm</Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>{t('table.length')}:</strong> {mattress.marker_length || t('table.na')} m
                            {/* Only show extra for non-collaretto weft/bias mattresses */}
                            {mattress.extra && mattress.extra > 0 &&
                             mattress.item_type !== 'ASW' && mattress.item_type !== 'ASB' && (
                                <span style={{ color: '#666', fontSize: '0.9em' }}> (+{mattress.extra} {t('common.extra', 'extra')})</span>
                            )}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.sector', 'Sector')}:</strong> {mattress.sector || t('table.na')}</Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.sizes')}:</strong> {mattress.sizes || t('table.na')}</Typography>
                    </Grid>
                </Grid>

                {/* Action buttons */}
                {mattress.status === "1 - TO LOAD" && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={
                                processingMattress === mattress.id ||
                                !selectedOperator ||
                                activeSpreadingMattress !== null
                            }
                            onClick={() => handleStartSpreading(mattress.id)}
                            title={activeSpreadingMattress ? t('spreader.cannotStartSpreading', { mattress: activeSpreadingMattress.mattress, device: spreaderDevice }) : ""}
                        >
                            {processingMattress === mattress.id ? t('spreader.processing') : t('spreader.startSpreading')}
                        </Button>
                    </Box>
                )}
                {mattress.status === "2 - ON SPREAD" && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            disabled={processingMattress === mattress.id || !selectedOperator}
                            onClick={() => handleOpenFinishDialog(mattress)}
                        >
                            {processingMattress === mattress.id ? t('spreader.processing') : t('spreader.finishSpreading')}
                        </Button>
                    </Box>
                )}
            </Box>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box m={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!user || user.role !== 'Spreader') {
        return (
            <Box m={2}>
                <Alert severity="warning">
                    {t('spreader.accessRestricted', 'This page is only accessible to users with the Spreader role.')}
                </Alert>
            </Box>
        );
    }

    return (
        <>
            <MainCard
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h2" component="span">
                            {t('spreader.jobQueue', `Spreader ${spreaderDevice} Job Queue`)}
                        </Typography>
                        {refreshing && (
                            <CircularProgress
                                size={20}
                                sx={{ ml: 2 }}
                                color="primary"
                            />
                        )}
                    </Box>
                }
                secondary={
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '56px'
                    }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel id="operator-select-label">{t('spreader.selectOperator')}</InputLabel>
                            <Select
                                labelId="operator-select-label"
                                id="operator-select"
                                value={selectedOperator}
                                label={t('spreader.selectOperator')}
                                onChange={(e) => setSelectedOperator(e.target.value)}
                                size="small"
                                disabled={loadingOperators}
                            >
                                {operators.length === 0 ? (
                                    <MenuItem value="" disabled>
                                        {t('common.noOperatorsAvailable')}
                                    </MenuItem>
                                ) : (
                                    operators.map((op) => (
                                        <MenuItem key={op.id} value={op.id.toString()}>
                                            {op.name}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                            {t('common.lastUpdated')}: {lastRefreshTime.toLocaleTimeString()}
                        </Typography>
                    </Box>
                }
            >
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="h4" gutterBottom>{t('kanban.firstShift')}</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {mattresses.firstShift && mattresses.firstShift.length > 0 ? (
                                mattresses.firstShift.map(renderMattressCard)
                            ) : (
                                <Typography variant="body2" color="textSecondary">{t('spreader.noMattressesFirstShift', 'No mattresses assigned for 1st shift')}</Typography>
                            )}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="h4" gutterBottom>{t('kanban.secondShift')}</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {mattresses.secondShift && mattresses.secondShift.length > 0 ? (
                                mattresses.secondShift.map(renderMattressCard)
                            ) : (
                                <Typography variant="body2" color="textSecondary">{t('spreader.noMattressesSecondShift', 'No mattresses assigned for 2nd shift')}</Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </MainCard>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Finish Spreading Dialog */}
            <Dialog
                open={finishDialogOpen}
                onClose={handleCloseFinishDialog}
                PaperProps={{
                    sx: { position: 'relative', overflow: 'visible' }
                }}
            >
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pt: 1 }}>
                        <Typography variant="body1" gutterBottom>
                            {t('spreader.enterActualLayers', 'Please enter the actual number of layers loaded:')}
                        </Typography>
                        <TextField
                            margin="dense"
                            label={t('spreader.actualLayers')}
                            type="number"
                            fullWidth={false}
                            value={actualLayers}
                            onChange={(e) => {
                                // Only allow positive numbers
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setActualLayers(value);
                            }}
                            InputProps={{
                                inputProps: { min: 1 },
                                sx: { width: 120, fontSize: 24 }
                            }}
                            sx={{ mb: 2, mt: 1, '& input': { fontSize: 24, textAlign: 'center' } }}
                        />
                        {selectedMattress && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                <strong>{t('spreader.mattressInfo')}:</strong> {selectedMattress.mattress}<br />
                                <strong>{t('spreader.plannedLayers')}:</strong> {selectedMattress.layers}<br />
                                <strong>{t('spreader.plannedConsumption')}:</strong> {selectedMattress.consumption} m<br />
                                <strong>{t('spreader.estimatedActualConsumption')}:</strong> {
                                    actualLayers && selectedMattress.consumption && selectedMattress.layers ?
                                    ((selectedMattress.consumption / selectedMattress.layers) * Number(actualLayers)).toFixed(2) :
                                    '0.00'
                                } m
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                {/* Elevator buttons absolutely positioned outside the dialog */}
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    right: -120, // move further out to accommodate larger buttons
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    zIndex: 1301,
                    pointerEvents: 'auto',
                }}>
                    <Button
                        variant="contained"
                        size="large"
                        sx={{ width: 105, height: 105, fontSize: 60, borderRadius: 2, boxShadow: 3, bgcolor: '#e0e0e0', color: '#333', '&:hover': { bgcolor: '#bdbdbd' } }}
                        onClick={() => setActualLayers(prev => {
                            const val = Number(prev) || 0;
                            return (val + 1).toString();
                        })}
                        aria-label="Increase"
                    >
                        ▲
                    </Button>
                    <Button
                        variant="contained"
                        size="large"
                        sx={{ width: 105, height: 105, fontSize: 60, borderRadius: 2, boxShadow: 3, bgcolor: '#e0e0e0', color: '#333', '&:hover': { bgcolor: '#bdbdbd' } }}
                        onClick={() => setActualLayers(prev => {
                            const val = Number(prev) || 1;
                            return val > 1 ? (val - 1).toString() : '1';
                        })}
                        aria-label="Decrease"
                    >
                        ▼
                    </Button>
                </Box>
                <DialogActions>
                    <Button onClick={handleCloseFinishDialog}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleFinishSpreading}
                        variant="contained"
                        color="secondary"
                        disabled={!actualLayers || processingMattress === (selectedMattress?.id)}
                    >
                        {processingMattress === (selectedMattress?.id) ? t('spreader.processing') : t('common.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SpreaderView;
