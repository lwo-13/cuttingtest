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
    TextField,
    IconButton
} from '@mui/material';

import MainCard from '../../ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import {
    ChevronLeft,
    ChevronRight,
    UnfoldMore
} from '@mui/icons-material';

// assets
import { IconTool } from '@tabler/icons';
import useCollapseMenu from '../../hooks/useCollapseMenu';

const SpreaderView = () => {
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
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);
    const [selectedMattress, setSelectedMattress] = useState(null);
    const [actualLayers, setActualLayers] = useState('');
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const [activeSpreadingMattress, setActiveSpreadingMattress] = useState(null); // Track active spreading mattress
    const [expandedShift, setExpandedShift] = useState(null); // Track which shift is expanded ('first', 'second', or null)
    const [lastActivityTime, setLastActivityTime] = useState(new Date());
    const [operatorSessionDate, setOperatorSessionDate] = useState(null);

    // Width change dialog state
    const [widthChangeDialog, setWidthChangeDialog] = useState({
        open: false,
        mattressId: null,
        markerName: '',
        currentWidth: '',
        newWidth: '',
        selectedMarker: '',
        availableMarkers: [],
        loadingMarkers: false,
        style: '',
        orderCommessa: '',
        currentMarkerLength: '',
        layers: '',
        allowance: 0.02, // Default allowance value in meters
        plannedConsumption: '' // Fetch from mattress_details.cons_planned
    });

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
    }, [spreaderDevice]);

    const fetchOperators = async () => {
        setLoadingOperators(true);
        try {
            const response = await axios.get('/operators/active');
            if (response.data.success) {
                setOperators(response.data.data);
                // Don't auto-select any operator - leave it empty by default
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
        // Update activity time
        updateActivityTime();

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

        // Update activity time
        updateActivityTime();

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

    // Width change dialog handlers
    const parseMattressSizes = (sizesString) => {
        // Parse "S - 10; M - 15; L - 20" format into {S: 10, M: 15, L: 20}
        if (!sizesString) return {};

        const sizeQuantities = {};
        const sizeEntries = sizesString.split(';');

        sizeEntries.forEach(entry => {
            const trimmed = entry.trim();
            if (trimmed) {
                const parts = trimmed.split(' - ');
                if (parts.length === 2) {
                    const size = parts[0].trim();
                    const quantity = parseFloat(parts[1].trim());
                    if (!isNaN(quantity)) {
                        sizeQuantities[size] = quantity;
                    }
                }
            }
        });

        return sizeQuantities;
    };

    const areSizeQuantitiesEqual = (mattressSizes, markerSizes) => {
        // Compare two size quantity objects for exact match
        const mattressKeys = Object.keys(mattressSizes).sort();
        const markerKeys = Object.keys(markerSizes).sort();

        // Check if they have the same sizes
        if (mattressKeys.length !== markerKeys.length) return false;
        if (mattressKeys.join(',') !== markerKeys.join(',')) return false;

        // Check if quantities match
        for (const size of mattressKeys) {
            if (mattressSizes[size] !== markerSizes[size]) return false;
        }

        return true;
    };

    const fetchMarkersForStyle = async (style, orderCommessa, mattressSizes) => {
        try {
            setWidthChangeDialog(prev => ({ ...prev, loadingMarkers: true }));

            // First get the order lines to get the sizes
            const orderLinesResponse = await axios.get(`/orders/order_lines?order_commessa=${encodeURIComponent(orderCommessa)}`);

            if (orderLinesResponse.data.success && orderLinesResponse.data.data.length > 0) {
                const sizes = orderLinesResponse.data.data.map(line => line.size);

                // Then fetch markers for this style with these sizes
                const markersResponse = await axios.get('/markers/marker_headers_planning', {
                    params: {
                        style: style,
                        sizes: sizes.join(',')
                    }
                });

                if (markersResponse.data.success) {
                    // Parse mattress sizes for comparison
                    const mattressSizeQuantities = parseMattressSizes(mattressSizes);

                    // Filter markers to only include those with exact size quantity matches
                    const matchingMarkers = markersResponse.data.data.filter(marker => {
                        return areSizeQuantitiesEqual(mattressSizeQuantities, marker.size_quantities || {});
                    });

                    setWidthChangeDialog(prev => ({
                        ...prev,
                        availableMarkers: matchingMarkers,
                        loadingMarkers: false
                    }));
                } else {
                    console.error('Failed to fetch markers:', markersResponse.data.msg);
                    setWidthChangeDialog(prev => ({ ...prev, loadingMarkers: false }));
                }
            } else {
                console.error('Failed to fetch order lines');
                setWidthChangeDialog(prev => ({ ...prev, loadingMarkers: false }));
            }
        } catch (error) {
            console.error('Error fetching markers:', error);
            setWidthChangeDialog(prev => ({ ...prev, loadingMarkers: false }));
        }
    };

    const handleOpenWidthChangeDialog = async (mattress) => {
        // Update activity time
        updateActivityTime();

        // First get the style from order_commessa and planned consumption
        try {
            const orderLinesResponse = await axios.get(`/orders/order_lines?order_commessa=${encodeURIComponent(mattress.order_commessa)}`);

            let style = '';
            if (orderLinesResponse.data.success && orderLinesResponse.data.data.length > 0) {
                style = orderLinesResponse.data.data[0].style;
            }

            // Use planned consumption from mattress data (already available from kanban endpoint)
            const plannedConsumption = mattress.consumption || '';

            setWidthChangeDialog({
                open: true,
                mattressId: mattress.id,
                markerName: mattress.marker || '',
                currentWidth: mattress.width || '',
                newWidth: '',
                selectedMarker: '',
                availableMarkers: [],
                loadingMarkers: false,
                style: style,
                orderCommessa: mattress.order_commessa,
                currentMarkerLength: mattress.markerLength || '',
                layers: mattress.layers || '',
                allowance: 0.02,
                plannedConsumption: plannedConsumption
            });

            // Fetch markers for this style with exact size matches
            if (style) {
                await fetchMarkersForStyle(style, mattress.order_commessa, mattress.sizes);
            }
        } catch (error) {
            console.error('Error opening width change dialog:', error);
            setWidthChangeDialog({
                open: true,
                mattressId: mattress.id,
                markerName: mattress.marker || '',
                currentWidth: mattress.width || '',
                newWidth: '',
                selectedMarker: '',
                availableMarkers: [],
                loadingMarkers: false,
                style: '',
                orderCommessa: mattress.order_commessa,
                currentMarkerLength: mattress.markerLength || '',
                layers: mattress.layers || '',
                allowance: 0.02,
                plannedConsumption: ''
            });
        }
    };

    const handleCloseWidthChangeDialog = () => {
        setWidthChangeDialog({
            open: false,
            mattressId: null,
            markerName: '',
            currentWidth: '',
            newWidth: '',
            selectedMarker: '',
            availableMarkers: [],
            loadingMarkers: false,
            style: '',
            orderCommessa: '',
            currentMarkerLength: '',
            layers: '',
            allowance: 0.02,
            plannedConsumption: ''
        });
    };

    const handleSubmitWidthChange = () => {
        // TODO: Implement width change submission logic
        console.log('Submitting width change:', {
            mattressId: widthChangeDialog.mattressId,
            markerName: widthChangeDialog.markerName,
            currentWidth: widthChangeDialog.currentWidth,
            newWidth: widthChangeDialog.newWidth,
            selectedMarker: widthChangeDialog.selectedMarker,
            style: widthChangeDialog.style,
            orderCommessa: widthChangeDialog.orderCommessa
        });

        setSnackbar({
            open: true,
            message: `Width change request submitted for ${widthChangeDialog.markerName}`,
            severity: 'success'
        });

        handleCloseWidthChangeDialog();
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
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.fabric')}:</strong> {mattress.fabric_code} {mattress.fabric_color}</Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('table.bagno')}:</strong> {mattress.dye_lot}</Typography>
                        {mattress.destination && mattress.destination !== 'Not Assigned' && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>{t('common.destination', 'Destination')}:</strong> {
                                    mattress.destination.includes('ZALLI 1')
                                        ? 'ZALLI 1'
                                        : mattress.destination
                                }
                            </Typography>
                        )}
                        {/* Only show sector field if destination contains "ZALLI 1" */}
                        {mattress.destination && mattress.destination.includes('ZALLI 1') && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>{t('common.sector', 'Sector')}:</strong> {
                                    mattress.destination.includes(' - ')
                                        ? mattress.destination.split(' - ')[1]
                                        : mattress.destination
                                }
                            </Typography>
                        )}
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
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.sizes')}:</strong> {mattress.sizes || t('table.na')}</Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>{t('common.spreadingMethod')}:</strong> {mattress.spreading_method}</Typography>
                    </Grid>
                </Grid>

                {/* Action buttons */}
                {mattress.status === "1 - TO LOAD" && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                            onClick={() => {
                                if (!selectedOperator) {
                                    setSnackbar({
                                        open: true,
                                        message: "Please select an operator before changing width",
                                        severity: "warning"
                                    });
                                    return;
                                }
                                handleOpenWidthChangeDialog(mattress);
                            }}
                            title={!selectedOperator ? "Select an operator first" : "Change Width"}
                            style={{
                                cursor: !selectedOperator ? 'not-allowed' : 'pointer',
                                userSelect: 'none',
                                opacity: !selectedOperator ? 0.5 : 1
                            }}
                        >
                            <IconTool size={20} />
                        </span>
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
                    {/* First Shift */}
                    <Grid item xs={12} md={expandedShift === 'first' ? 10 : expandedShift === 'second' ? 2 : 6}>
                        <Paper sx={{
                            p: 2,
                            bgcolor: '#f5f5f5',
                            borderRadius: 2,
                            minHeight: expandedShift === 'second' ? '60px' : 'auto'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="h4" gutterBottom={expandedShift !== 'second'}>
                                    {t('kanban.firstShift')}
                                </Typography>
                                <Box>
                                    {expandedShift !== 'first' && (
                                        <ChevronRight
                                            onClick={() => setExpandedShift('first')}
                                            sx={{
                                                cursor: 'pointer',
                                                fontSize: '24px',
                                                marginRight: '8px',
                                                '&:hover': { color: 'primary.main' }
                                            }}
                                        />
                                    )}
                                    {expandedShift === 'first' && (
                                        <ChevronLeft
                                            onClick={() => setExpandedShift(null)}
                                            sx={{
                                                cursor: 'pointer',
                                                fontSize: '24px',
                                                '&:hover': { color: 'primary.main' }
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                            {expandedShift !== 'second' && (
                                <>
                                    <Divider sx={{ mb: 2 }} />
                                    {mattresses.firstShift && mattresses.firstShift.length > 0 ? (
                                        mattresses.firstShift.map(renderMattressCard)
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">{t('spreader.noMattressesFirstShift', 'No mattresses assigned for 1st shift')}</Typography>
                                    )}
                                </>
                            )}
                        </Paper>
                    </Grid>

                    {/* Second Shift */}
                    <Grid item xs={12} md={expandedShift === 'second' ? 10 : expandedShift === 'first' ? 2 : 6}>
                        <Paper sx={{
                            p: 2,
                            bgcolor: '#f5f5f5',
                            borderRadius: 2,
                            minHeight: expandedShift === 'first' ? '60px' : 'auto'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="h4" gutterBottom={expandedShift !== 'first'}>
                                    {t('kanban.secondShift')}
                                </Typography>
                                <Box>
                                    {expandedShift !== 'second' && (
                                        <ChevronLeft
                                            onClick={() => setExpandedShift('second')}
                                            sx={{
                                                cursor: 'pointer',
                                                fontSize: '24px',
                                                marginRight: '8px',
                                                '&:hover': { color: 'primary.main' }
                                            }}
                                        />
                                    )}
                                    {expandedShift === 'second' && (
                                        <ChevronRight
                                            onClick={() => setExpandedShift(null)}
                                            sx={{
                                                cursor: 'pointer',
                                                fontSize: '24px',
                                                '&:hover': { color: 'primary.main' }
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                            {expandedShift !== 'first' && (
                                <>
                                    <Divider sx={{ mb: 2 }} />
                                    {mattresses.secondShift && mattresses.secondShift.length > 0 ? (
                                        mattresses.secondShift.map(renderMattressCard)
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">{t('spreader.noMattressesSecondShift', 'No mattresses assigned for 2nd shift')}</Typography>
                                    )}
                                </>
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

            {/* Width Change Request Dialog */}
            <Dialog
                open={widthChangeDialog.open}
                onClose={handleCloseWidthChangeDialog}
                maxWidth="md"
                PaperProps={{
                    sx: { width: '600px', maxWidth: '600px' }
                }}
            >

                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, gap: 1 }}>
                            <Typography variant="body1" sx={{ color: 'gray' }}>
                                Marker: {(() => {
                                    const markerName = widthChangeDialog.markerName;
                                    const parenIndex = markerName.indexOf('(');
                                    if (parenIndex !== -1) {
                                        const mainName = markerName.substring(0, parenIndex).trim();
                                        const parenContent = markerName.substring(parenIndex);
                                        return (
                                            <>
                                                <span style={{ color: 'gray' }}>{mainName}</span>
                                                <span style={{ color: 'gray', fontSize: '0.85em', marginLeft: '5px' }}>{parenContent}</span>
                                            </>
                                        );
                                    }
                                    return <span style={{ color: 'gray' }}>{markerName}</span>;
                                })()}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'gray' }}>
                                Current Width: {widthChangeDialog.currentWidth} cm
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 1 }}>
                            <TextField
                                label="New Width (cm)"
                                type="number"
                                value={widthChangeDialog.newWidth}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Only allow numbers and limit to 3 digits
                                    if (value === '' || (/^\d{1,3}$/.test(value) && parseInt(value) >= 0)) {
                                        setWidthChangeDialog(prev => {
                                            // Check if current selected marker is still valid for new width
                                            let newSelectedMarker = prev.selectedMarker;
                                            if (value && value.trim() !== '' && prev.selectedMarker) {
                                                const newWidth = parseFloat(value);
                                                if (!isNaN(newWidth)) {
                                                    const selectedMarkerData = prev.availableMarkers.find(
                                                        m => m.marker_name === prev.selectedMarker
                                                    );
                                                    if (selectedMarkerData) {
                                                        const markerWidth = parseFloat(selectedMarkerData.marker_width);
                                                        // Clear selection if marker width doesn't match new width range
                                                        if (markerWidth < newWidth || markerWidth > newWidth + 0.5) {
                                                            newSelectedMarker = '';
                                                        }
                                                    }
                                                }
                                            }

                                            return {
                                                ...prev,
                                                newWidth: value,
                                                selectedMarker: newSelectedMarker
                                            };
                                        });
                                    }
                                }}
                                inputProps={{
                                    min: 0,
                                    max: 999,
                                    maxLength: 3,
                                    style: { textAlign: 'center', fontWeight: 'normal' }
                                }}
                                sx={{
                                    width: '160px',
                                    flexShrink: 0,
                                    '& input[type=number]': {
                                        '-moz-appearance': 'textfield'
                                    },
                                    '& input[type=number]::-webkit-outer-spin-button': {
                                        '-webkit-appearance': 'none',
                                        margin: 0
                                    },
                                    '& input[type=number]::-webkit-inner-spin-button': {
                                        '-webkit-appearance': 'none',
                                        margin: 0
                                    }
                                }}
                            />
                            <FormControl variant="outlined" fullWidth sx={{ flexGrow: 1 }}>
                                <InputLabel id="marker-select-label">Select Alternative Marker</InputLabel>
                                <Select
                                    labelId="marker-select-label"
                                    label="Select Alternative Marker"
                                    value={widthChangeDialog.selectedMarker}
                                    onChange={(e) => {
                                        const selectedMarkerName = e.target.value;
                                        const selectedMarkerData = widthChangeDialog.availableMarkers.find(
                                            m => m.marker_name === selectedMarkerName
                                        );

                                        setWidthChangeDialog(prev => ({
                                            ...prev,
                                            selectedMarker: selectedMarkerName,
                                            newWidth: selectedMarkerData ? selectedMarkerData.marker_width.toString() : prev.newWidth
                                        }));
                                    }}
                                    disabled={widthChangeDialog.loadingMarkers}
                                    sx={{
                                        '& .MuiSelect-select': {
                                            fontWeight: 'normal'
                                        }
                                    }}
                                    endAdornment={
                                        widthChangeDialog.selectedMarker && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWidthChangeDialog(prev => ({
                                                        ...prev,
                                                        selectedMarker: '',
                                                        newWidth: ''
                                                    }));
                                                }}
                                                sx={{ mr: 1 }}
                                            >
                                                ✕
                                            </IconButton>
                                        )
                                    }
                                >
                                    {widthChangeDialog.loadingMarkers ? (
                                        <MenuItem disabled>Loading markers...</MenuItem>
                                    ) : (
                                        (() => {
                                            let filteredMarkers = widthChangeDialog.availableMarkers;

                                            // Exclude the current marker from the list
                                            filteredMarkers = filteredMarkers.filter(marker =>
                                                marker.marker_name !== widthChangeDialog.markerName
                                            );

                                            // Filter by new width if provided
                                            if (widthChangeDialog.newWidth && widthChangeDialog.newWidth.trim() !== '') {
                                                const newWidth = parseFloat(widthChangeDialog.newWidth);
                                                if (!isNaN(newWidth)) {
                                                    filteredMarkers = filteredMarkers.filter(marker => {
                                                        const markerWidth = parseFloat(marker.marker_width);
                                                        return markerWidth >= newWidth && markerWidth <= newWidth + 0.5;
                                                    });
                                                }
                                            }

                                            return filteredMarkers.length > 0 ? (
                                                filteredMarkers.map((marker) => (
                                                    <MenuItem key={marker.marker_name} value={marker.marker_name}>
                                                        <span style={{ color: 'black' }}>{marker.marker_name}</span>
                                                        <span style={{ color: 'gray', marginLeft: '10px', fontSize: '0.85em' }}>
                                                            ({marker.marker_width}cm x {marker.marker_length}m)
                                                        </span>
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled>No markers available for this width</MenuItem>
                                            );
                                        })()
                                    )}
                                </Select>
                            </FormControl>
                        </Box>

                        {widthChangeDialog.selectedMarker && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
                                    Selected Marker Details:
                                </Typography>
                                {(() => {
                                    const selectedMarkerData = widthChangeDialog.availableMarkers.find(
                                        m => m.marker_name === widthChangeDialog.selectedMarker
                                    );
                                    if (selectedMarkerData) {
                                        return (
                                            <Box sx={{ display: 'flex', gap: 3 }}>
                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Typography variant="body2">
                                                        <strong>Width:</strong> {selectedMarkerData.marker_width} cm
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Length:</strong> {selectedMarkerData.marker_length} m
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Efficiency:</strong> {selectedMarkerData.efficiency}%
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <strong>Size Quantities:</strong>
                                                    </Typography>
                                                    {Object.entries(selectedMarkerData.size_quantities || {}).map(([size, qty]) => (
                                                        <Typography key={size} variant="body2">
                                                            {size}: {qty} pcs
                                                        </Typography>
                                                    ))}
                                                </Box>
                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Typography variant="body2">
                                                        <strong>Planned Consumption:</strong> {widthChangeDialog.plannedConsumption || '0.00'} m
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>New Consumption:</strong> {(() => {
                                                            const newLength = parseFloat(selectedMarkerData.marker_length) || 0;
                                                            const layers = parseFloat(widthChangeDialog.layers) || 0;
                                                            const allowance = widthChangeDialog.allowance || 0.02;
                                                            const newConsumption = (newLength + allowance) * layers;
                                                            return newConsumption.toFixed(2);
                                                        })()} m
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                        <strong>Δ:</strong> {(() => {
                                                            const oldConsumption = parseFloat(widthChangeDialog.plannedConsumption) || 0;
                                                            const newLength = parseFloat(selectedMarkerData.marker_length) || 0;
                                                            const layers = parseFloat(widthChangeDialog.layers) || 0;
                                                            const allowance = widthChangeDialog.allowance || 0.02;
                                                            const newConsumption = (newLength + allowance) * layers;
                                                            const difference = newConsumption - oldConsumption;
                                                            const sign = difference >= 0 ? '+' : '';
                                                            return `${sign}${difference.toFixed(2)}`;
                                                        })()} m
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    }
                                    return null;
                                })()}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseWidthChangeDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitWidthChange}
                        variant="contained"
                        disabled={!widthChangeDialog.newWidth || widthChangeDialog.newWidth <= 0}
                    >
                        {widthChangeDialog.selectedMarker ? 'Change Marker' : 'New Marker Request'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SpreaderView;
