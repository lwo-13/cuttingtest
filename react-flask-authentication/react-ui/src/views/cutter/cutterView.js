import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Card,
    CircularProgress,
    Alert,
    Button,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import MainCard from '../../ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import useCollapseMenu from '../../hooks/useCollapseMenu';

const CutterView = () => {
    const { t } = useTranslation();

    // Function to reset operator selection
    const resetOperatorSession = () => {
        setSelectedOperator('');
        setOperatorSessionDate(null);
        setSnackbar({
            open: true,
            message: "Operator session has been reset. Please select an operator to continue.",
            severity: "warning"
        });
    };

    // Function to check if we need to reset operator session
    const checkOperatorSessionValidity = () => {
        const now = new Date();
        const currentDate = now.toDateString();

        // Reset if it's a new day
        if (operatorSessionDate && operatorSessionDate !== currentDate) {
            resetOperatorSession();
            return;
        }

        // Reset after 4 hours of inactivity (14400000 ms)
        const timeSinceLastActivity = now - lastActivityTime;
        if (selectedOperator && timeSinceLastActivity > 14400000) { // 4 hours
            resetOperatorSession();
            return;
        }
    };

    // Function to update activity time
    const updateActivityTime = () => {
        setLastActivityTime(new Date());
    };

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
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const [activeCuttingMattress, setActiveCuttingMattress] = useState(null); // Track active cutting mattress
    const [lastActivityTime, setLastActivityTime] = useState(new Date());
    const [operatorSessionDate, setOperatorSessionDate] = useState(null);
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
            'CT1': ['SP1'],             // Cutter1 receives from Spreader1
            'CT2': ['SP2', 'SP3', 'MS'] // Cutter2 receives from Spreader2, Spreader3, and Manual Spreading (MS)
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
            checkOperatorSessionValidity(); // Check if operator session is still valid
        }, 300000); // 5 minutes (300,000 ms)

        // Set up session validity check every 30 minutes
        const sessionCheckInterval = setInterval(() => {
            checkOperatorSessionValidity();
        }, 1800000); // 30 minutes (1,800,000 ms)

        // Clean up the intervals when component unmounts
        return () => {
            clearInterval(refreshInterval);
            clearInterval(sessionCheckInterval);
        };
    }, [cutterDevice]);

    const fetchOperators = async () => {
        setLoadingOperators(true);
        try {
            const response = await axios.get('/cutter_operators/active');
            if (response.data.success) {
                setOperators(response.data.data);
                // Don't auto-select any operator - leave it empty by default
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

                    // Sort all mattresses by position
                    filteredMattresses.sort((a, b) => a.position - b.position);

                    // Check if there's any mattress with status "4 - ON CUT" for this specific cutter device
                    const onCutMattress = filteredMattresses.find(
                        m => m.status === "4 - ON CUT" && m.device === cutterDevice
                    );
                    setActiveCuttingMattress(onCutMattress || null);

                    // Debug: Log marker names
                    console.log("Mattress data sample:", filteredMattresses.length > 0 ? filteredMattresses[0] : "No mattresses");

                    // Set all mattresses in a single list
                    setMattresses(filteredMattresses);

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
        // Update activity time
        updateActivityTime();

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

    const handleFinishCutting = (mattressId, layers) => {
        // Update activity time
        updateActivityTime();

        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(mattressId);

        // First update the status to "5 - COMPLETED"
        axios.put(`/mattress/update_status/${mattressId}`, {
            status: "5 - COMPLETED",
            operator: operatorName,
            device: cutterDevice // Explicitly set the device to ensure it's updated
        })
        .then((res) => {
            if (res.data.success) {
                // Then update the actual layers (layers_a) in mattress_details
                // Use the planned layers value automatically
                return axios.put(`/mattress/update_layers_a/${mattressId}`, {
                    layers_a: Number(layers)
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

    const handleCloseSnackbar = (_, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    // Function to copy text to clipboard using a fallback method
    const copyToClipboard = (text) => {
        if (!text || text === 'N/A') return;

        try {
            // Try the modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        setSnackbar({
                            open: true,
                            message: t('cutter.markerCopied'),
                            severity: "success"
                        });
                    })
                    .catch(() => {
                        // If Clipboard API fails, fall back to the older method
                        fallbackCopyToClipboard(text);
                    });
            } else {
                // If Clipboard API is not available, use the fallback method
                fallbackCopyToClipboard(text);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setSnackbar({
                open: true,
                message: t('cutter.copyFailed'),
                severity: "error"
            });
        }
    };

    // Fallback method using a temporary textarea element
    const fallbackCopyToClipboard = (text) => {
        try {
            // Create a temporary textarea element
            const textArea = document.createElement('textarea');
            textArea.value = text;

            // Make the textarea out of viewport
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);

            // Select and copy the text
            textArea.focus();
            textArea.select();

            // Note: execCommand is deprecated but still widely supported as a fallback
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                setSnackbar({
                    open: true,
                    message: t('cutter.markerCopied'),
                    severity: "success"
                });
            } else {
                throw new Error('Copy command was unsuccessful');
            }
        } catch (err) {
            console.error('Fallback copy method failed: ', err);
            setSnackbar({
                open: true,
                message: t('cutter.copyFailed'),
                severity: "error"
            });
        }
    };

    const renderMattressCard = (mattress) => {
        // Get the source device
        const sourceDevice = mattress.device;

        return (
            <Card key={mattress.id} sx={{ mb: 2, boxShadow: 2 }}>
                <Box sx={{ p: 1.5 }}>
                    {/* Header with mattress ID and pills - matching spreader style */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {mattress.mattress}
                            </Typography>
                            {sourceDevice && sourceDevice !== cutterDevice && (
                                <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                                    <strong>{t('cutter.from')}: {sourceDevice}</strong>
                                </Typography>
                            )}
                        </Box>

                        {/* Status, Pieces, and Layers pills on the right */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: mattress.status?.includes('ON CUT') ? 'secondary.main' : 'text.secondary',
                                    bgcolor: mattress.status?.includes('ON CUT') ? '#f3e5f5' : '#ffffff',
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

                    {/* Details section - simplified to a single row with better alignment */}
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        mt: 0.5,
                        alignItems: 'center'
                    }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}><strong>{t('common.order')}:</strong> {mattress.order_commessa}</Typography>
                        {mattress.destination && mattress.destination !== 'Not Assigned' && (
                            <Typography variant="body2" sx={{ lineHeight: 1.5 }}><strong>{t('common.destination', 'Destination')}:</strong> {mattress.destination}</Typography>
                        )}
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}><strong>{t('common.fabric')}:</strong> {mattress.fabric_code} {mattress.fabric_color}</Typography>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '24px', // Fixed height to match other elements
                            position: 'relative',
                            top: '-1px' // Move up by 1mm for perfect alignment
                        }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.5 }}><strong>{t('kanban.marker')}:</strong> {mattress.marker || t('table.na')}</Typography>
                            {mattress.marker && (
                                <Tooltip title={t('common.copyMarkerName', 'Copy marker name')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => copyToClipboard(mattress.marker)}
                                        sx={{
                                            ml: 0.5,
                                            p: 0.25,
                                            height: '24px',
                                            width: '24px',
                                            position: 'relative',
                                            top: '-1px' // Move the icon up by 1mm as well
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Action buttons */}
                    {mattress.status === "3 - TO CUT" && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={processingMattress === mattress.id || !selectedOperator || activeCuttingMattress !== null}
                                onClick={() => handleStartCutting(mattress.id)}
                                title={activeCuttingMattress ? t('cutter.cannotStartCutting', { mattress: activeCuttingMattress.mattress, device: cutterDevice }) : ""}
                            >
                                {processingMattress === mattress.id ? t('cutter.processing') : t('cutter.startCutting')}
                            </Button>
                        </Box>
                    )}
                    {mattress.status === "4 - ON CUT" && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="success"
                                disabled={processingMattress === mattress.id || !selectedOperator}
                                onClick={() => handleFinishCutting(mattress.id, mattress.layers)}
                            >
                                {processingMattress === mattress.id ? t('cutter.processing') : t('cutter.finishCutting')}
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
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '56px'
                    }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel id="operator-select-label">{t('cutter.selectOperator')}</InputLabel>
                            <Select
                                labelId="operator-select-label"
                                id="operator-select"
                                value={selectedOperator}
                                label={t('cutter.selectOperator')}
                                onChange={(e) => {
                                    const operatorId = e.target.value;
                                    setSelectedOperator(operatorId);
                                    if (operatorId) {
                                        // Set session date when operator is selected
                                        setOperatorSessionDate(new Date().toDateString());
                                        updateActivityTime();
                                    } else {
                                        // Clear session date when no operator selected
                                        setOperatorSessionDate(null);
                                    }
                                }}
                                size="small"
                                disabled={loadingOperators}
                            >
                                <MenuItem value="">
                                    <span style={{ color: 'gray', fontStyle: 'italic' }}>No operator selected</span>
                                </MenuItem>
                                {operators.length === 0 ? (
                                    <MenuItem value="" disabled>
                                        {t('common.noOperatorsAvailable', 'No operators available')}
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
                            {t('common.lastUpdated', 'Last updated')}: {lastRefreshTime.toLocaleTimeString()}
                        </Typography>
                    </Box>
                }
            >
                {/* No operator selected warning */}
                {!selectedOperator && (
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                        <Alert severity="warning" sx={{ maxWidth: '800px', width: '100%' }}>
                            <Typography variant="body1">
                                Please select an operator to start cutting operations.
                            </Typography>
                        </Alert>
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Paper sx={{
                        p: 2,
                        bgcolor: '#f5f5f5',
                        borderRadius: 2,
                        maxWidth: '800px',
                        width: '100%'
                    }}>
                        <Typography variant="h4" gutterBottom>{t('cutter.mattressesToCut', 'Mattresses to Cut')}</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {mattresses && mattresses.length > 0 ? (
                            mattresses.map(renderMattressCard)
                        ) : (
                            <Typography variant="body2" color="textSecondary">{t('cutter.noMattresses', 'No mattresses assigned for cutting')}</Typography>
                        )}
                    </Paper>
                </Box>
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
        </>
    );
};

export default CutterView;
