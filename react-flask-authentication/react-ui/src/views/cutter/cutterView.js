import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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

const CutterView = () => {
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
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const [activeCuttingMattress, setActiveCuttingMattress] = useState(null); // Track active cutting mattress
    const account = useSelector((state) => state.account);
    const { user } = account;

    // Extract cutter number from username (e.g., "Cutter1" -> "CT1")
    const getCutterDevice = (username) => {
        if (!username) return null;
        const match = username.match(/Cutter(\d+)/i);
        return match ? `CT${match[1]}` : null;
    };

    const cutterDevice = getCutterDevice(user?.username);

    // Get corresponding spreader devices based on cutter device
    const getAssociatedSpreaderDevices = (cutterDevice) => {
        if (!cutterDevice) return [];

        // Mapping of cutter devices to spreader devices
        const mapping = {
            'CT1': ['SP1'],         // Cutter1 receives from Spreader1
            'CT2': ['SP2', 'SP3']   // Cutter2 receives from Spreader2 and Spreader3
        };

        return mapping[cutterDevice] || [];
    };

    const associatedSpreaderDevices = getAssociatedSpreaderDevices(cutterDevice);

    useEffect(() => {
        if (!cutterDevice) {
            setError("Invalid cutter username format. Expected format: Cutter1, Cutter2, etc.");
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
    }, [cutterDevice]);

    const fetchOperators = async () => {
        setLoadingOperators(true);
        try {
            const response = await axios.get('/cutter_operators/active');
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
                console.error("Error fetching cutter operators:", response.data.message);
            }
        } catch (error) {
            console.error("API Error fetching cutter operators:", error);
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
                    // Filter mattresses based on status and device
                    const filteredMattresses = res.data.data.filter(m => {
                        // Include mattresses that are already assigned to this cutter device
                        if (m.device === cutterDevice &&
                            (m.status === "3 - TO CUT" || m.status === "4 - ON CUT")) {
                            return true;
                        }

                        // Include mattresses that are ready to be cut (status "3 - TO CUT")
                        // and come from associated spreader devices but haven't been assigned to a cutter yet
                        if (m.status === "3 - TO CUT" &&
                            associatedSpreaderDevices.includes(m.device) &&
                            (!m.device.startsWith('CT'))) {
                            return true;
                        }

                        return false;
                    });

                    // Group by shift
                    const firstShift = filteredMattresses.filter(m => m.shift === '1shift');
                    const secondShift = filteredMattresses.filter(m => m.shift === '2shift');

                    // Sort by position
                    firstShift.sort((a, b) => a.position - b.position);
                    secondShift.sort((a, b) => a.position - b.position);

                    // Check if there's any mattress with status "4 - ON CUT" for this specific cutter device
                    const onCutMattress = [...firstShift, ...secondShift].find(
                        m => m.status === "4 - ON CUT" && m.device === cutterDevice
                    );
                    setActiveCuttingMattress(onCutMattress || null);

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

    const handleStartCutting = (mattressId) => {
        // Check if there's already an active cutting mattress for this cutter
        if (activeCuttingMattress) {
            setSnackbar({
                open: true,
                message: `Cannot start cutting. Mattress ${activeCuttingMattress.mattress} is already being cut on ${cutterDevice}.`,
                severity: "error"
            });
            return;
        }

        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(mattressId);
        axios.put(`/mattress/update_status/${mattressId}`, {
            status: "4 - ON CUT",
            operator: operatorName,
            device: cutterDevice // Explicitly set the device to ensure it's updated
        })
        .then((res) => {
            if (res.data.success) {
                setSnackbar({
                    open: true,
                    message: "Status updated to ON CUT successfully",
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

    const [actualLayers, setActualLayers] = useState('');

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

    const handleFinishCutting = () => {
        if (!selectedMattress) return;

        // Validate actual layers input
        if (!actualLayers || isNaN(actualLayers) || Number(actualLayers) <= 0) {
            setSnackbar({
                open: true,
                message: "Please enter a valid number of layers",
                severity: "error"
            });
            return;
        }

        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(selectedMattress.id);

        // First update the status to "5 - COMPLETED"
        axios.put(`/mattress/update_status/${selectedMattress.id}`, {
            status: "5 - COMPLETED",
            operator: operatorName,
            device: cutterDevice // Explicitly set the device to ensure it's updated
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
                    message: "Cutting finished successfully",
                    severity: "success"
                });
                handleCloseFinishDialog();
                // Reset active cutting mattress
                setActiveCuttingMattress(null);
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

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const renderMattressCard = (mattress) => {
        // Determine if this mattress is from an associated spreader
        const isFromAssociatedSpreader = associatedSpreaderDevices.includes(mattress.device);
        const sourceDevice = mattress.device;

        return (
            <Card key={mattress.id} sx={{ mb: 2, boxShadow: 3 }}>
                <Box sx={{ p: 2 }}>
                    {/* Header with mattress ID and pieces/layers info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                                Mattress: {mattress.mattress}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Status: {mattress.status}
                            </Typography>
                            {sourceDevice && sourceDevice !== cutterDevice && (
                                <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                                    <strong>From Spreader: {sourceDevice}</strong>
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'baseline',
                                mb: 0.5,
                                bgcolor: '#e3f2fd', // Light blue background
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1
                            }}>
                                <Typography variant="h4" color="#2196f3" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                                    {mattress.total_pcs || 0}
                                </Typography>
                                <Typography sx={{ ml: 1, fontSize: '1rem', color: '#1976d2' }}>pcs</Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'baseline',
                                bgcolor: '#f3e5f5', // Light purple background
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1
                            }}>
                                <Typography variant="h4" color="#9c27b0" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                                    {mattress.layers || 0}
                                </Typography>
                                <Typography sx={{ ml: 1, fontSize: '1rem', color: '#7b1fa2' }}>layers</Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Details section */}
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Order:</strong> {mattress.order_commessa}</Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Fabric:</strong> {mattress.fabric_code} {mattress.fabric_color}</Typography>
                            <Typography variant="body2"><strong>Type:</strong> {mattress.fabric_type}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Marker:</strong> {mattress.marker_name || 'N/A'}</Typography>
                            <Typography variant="body2"><strong>Sizes:</strong> {mattress.sizes || 'N/A'}</Typography>
                        </Grid>
                    </Grid>

                    {/* Action buttons */}
                    {mattress.status === "3 - TO CUT" && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={processingMattress === mattress.id || !selectedOperator || activeCuttingMattress !== null}
                                onClick={() => handleStartCutting(mattress.id)}
                                title={activeCuttingMattress ? `Cannot start cutting: Mattress ${activeCuttingMattress.mattress} is already being cut on ${cutterDevice}` : ""}
                            >
                                {processingMattress === mattress.id ? 'Processing...' : 'Start Cutting'}
                            </Button>
                        </Box>
                    )}
                    {mattress.status === "4 - ON CUT" && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="success"
                                disabled={processingMattress === mattress.id || !selectedOperator}
                                onClick={() => handleOpenFinishDialog(mattress)}
                            >
                                {processingMattress === mattress.id ? 'Processing...' : 'Finish Cutting'}
                            </Button>
                        </Box>
                    )}
                </Box>
            </Card>
        );
    };

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

    if (!user || user.role !== 'Cutter') {
        return (
            <Box m={2}>
                <Alert severity="warning">
                    This page is only accessible to users with the Cutter role.
                </Alert>
            </Box>
        );
    }

    return (
        <>
            <MainCard
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h3" component="span">
                            {`${cutterDevice} Assigned Mattresses - Today`}
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel id="operator-select-label">Current Operator</InputLabel>
                            <Select
                                labelId="operator-select-label"
                                id="operator-select"
                                value={selectedOperator}
                                label="Current Operator"
                                onChange={(e) => setSelectedOperator(e.target.value)}
                                size="small"
                                disabled={loadingOperators}
                            >
                                {operators.length === 0 ? (
                                    <MenuItem value="" disabled>
                                        No operators available
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
                            Last updated: {lastRefreshTime.toLocaleTimeString()}
                        </Typography>
                    </Box>
                }
            >
                <Box sx={{ mb: 3 }}>
                    <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                        <Typography variant="h5" gutterBottom color="primary">
                            Cutter Assignment Information
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            {cutterDevice === 'CT1' ?
                                'You are assigned to receive mattresses from Spreader1 (SP1).' :
                                'You are assigned to receive mattresses from Spreader2 (SP2) and Spreader3 (SP3).'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Mattresses with status "3 - TO CUT" from your assigned spreader(s) will appear here.
                        </Typography>
                    </Paper>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="h4" gutterBottom>1st Shift</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {mattresses.firstShift && mattresses.firstShift.length > 0 ? (
                                mattresses.firstShift.map(renderMattressCard)
                            ) : (
                                <Typography variant="body2" color="textSecondary">No mattresses assigned for 1st shift</Typography>
                            )}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="h4" gutterBottom>2nd Shift</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {mattresses.secondShift && mattresses.secondShift.length > 0 ? (
                                mattresses.secondShift.map(renderMattressCard)
                            ) : (
                                <Typography variant="body2" color="textSecondary">No mattresses assigned for 2nd shift</Typography>
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Finish Cutting Dialog */}
            <Dialog
                open={finishDialogOpen}
                onClose={handleCloseFinishDialog}
                PaperProps={{
                    sx: { position: 'relative', overflow: 'visible' }
                }}
            >
                <DialogTitle>Finish Cutting</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pt: 1 }}>
                        <Typography variant="body1" gutterBottom>
                            Please enter the actual number of layers cut:
                        </Typography>
                        <TextField
                            margin="dense"
                            label="Actual Layers"
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
                                <strong>Mattress:</strong> {selectedMattress.mattress}<br />
                                <strong>Planned Layers:</strong> {selectedMattress.layers}<br />
                                <strong>Planned Consumption:</strong> {selectedMattress.cons_planned} m<br />
                                <strong>Estimated Actual Consumption:</strong> {
                                    actualLayers && selectedMattress.cons_planned && selectedMattress.layers ?
                                    ((selectedMattress.cons_planned / selectedMattress.layers) * Number(actualLayers)).toFixed(2) :
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
                    <Button onClick={handleCloseFinishDialog}>Cancel</Button>
                    <Button
                        onClick={handleFinishCutting}
                        variant="contained"
                        color="success"
                        disabled={!actualLayers || processingMattress === (selectedMattress?.id)}
                    >
                        {processingMattress === (selectedMattress?.id) ? 'Processing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CutterView;
