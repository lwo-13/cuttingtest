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

const SpreaderView = () => {
    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [processingMattress, setProcessingMattress] = useState(null);
    const [operators, setOperators] = useState([]);
    const [selectedOperator, setSelectedOperator] = useState('');
    const [loadingOperators, setLoadingOperators] = useState(false);
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);
    const [selectedMattress, setSelectedMattress] = useState(null);
    const [actualLayers, setActualLayers] = useState('');
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
            setError("Invalid spreader username format. Expected format: Spreader1, Spreader2, etc.");
            setLoading(false);
            return;
        }

        fetchMattresses();
        fetchOperators();
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

    const fetchMattresses = () => {
        setLoading(true);
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

                    setMattresses({
                        firstShift,
                        secondShift
                    });
                    setLoading(false);
                } else {
                    setError("Error fetching data: " + res.data.message);
                    setLoading(false);
                }
            })
            .catch((err) => {
                setError("API Error: " + (err.message || "Unknown error"));
                setLoading(false);
                console.error("API Error:", err);
            });
    };

    const handleStartSpreading = (mattressId) => {
        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(mattressId);
        axios.put(`/mattress/update_status/${mattressId}`, {
            status: "2 - ON SPREAD",
            operator: operatorName
        })
        .then((res) => {
            if (res.data.success) {
                setSnackbar({
                    open: true,
                    message: "Status updated to ON SPREAD successfully",
                    severity: "success"
                });
                fetchMattresses(); // Refresh the data
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
                message: "Please enter a valid number of layers",
                severity: "error"
            });
            return;
        }

        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(selectedMattress.id);

        // First update the status to "3 - TO CUT"
        axios.put(`/mattress/update_status/${selectedMattress.id}`, {
            status: "3 - TO CUT",
            operator: operatorName
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
                fetchMattresses(); // Refresh the data
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
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                            Mattress: {mattress.mattress}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Status: {mattress.status}
                        </Typography>
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
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Marker:</strong> {mattress.marker || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Sizes:</strong> {mattress.sizes || 'N/A'}</Typography>
                    </Grid>
                </Grid>

                {/* Action buttons */}
                {mattress.status === "1 - TO LOAD" && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={processingMattress === mattress.id || !selectedOperator}
                            onClick={() => handleStartSpreading(mattress.id)}
                        >
                            {processingMattress === mattress.id ? 'Processing...' : 'Start Spreading'}
                        </Button>
                    </Box>
                )}
                {mattress.status === "2 - ON SPREAD" && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="success"
                            disabled={processingMattress === mattress.id || !selectedOperator}
                            onClick={() => handleOpenFinishDialog(mattress)}
                        >
                            {processingMattress === mattress.id ? 'Processing...' : 'Finish Spreading'}
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
                    This page is only accessible to users with the Spreader role.
                </Alert>
            </Box>
        );
    }

    return (
        <>
            <MainCard
                title={`${spreaderDevice} Assigned Mattresses - Today`}
                secondary={
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
                }
            >
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
                message={snackbar.message}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Finish Spreading Dialog */}
            <Dialog open={finishDialogOpen} onClose={handleCloseFinishDialog}>
                <DialogTitle>Finish Spreading</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body1" gutterBottom>
                            Please enter the actual number of layers loaded:
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Actual Layers"
                            type="number"
                            fullWidth
                            value={actualLayers}
                            onChange={(e) => {
                                // Only allow positive numbers
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setActualLayers(value);
                            }}
                            InputProps={{
                                inputProps: { min: 1 }
                            }}
                        />
                        {selectedMattress && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                <strong>Mattress:</strong> {selectedMattress.mattress}<br />
                                <strong>Planned Layers:</strong> {selectedMattress.layers}<br />
                                <strong>Planned Consumption:</strong> {selectedMattress.consumption} m<br />
                                <strong>Estimated Actual Consumption:</strong> {
                                    actualLayers && selectedMattress.consumption && selectedMattress.layers ?
                                    ((selectedMattress.consumption / selectedMattress.layers) * Number(actualLayers)).toFixed(2) :
                                    '0.00'
                                } m
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseFinishDialog}>Cancel</Button>
                    <Button
                        onClick={handleFinishSpreading}
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

export default SpreaderView;
