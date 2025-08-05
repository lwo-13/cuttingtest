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
import RefreshIcon from '@mui/icons-material/Refresh';

import MainCard from '../../ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import useCollapseMenu from '../../hooks/useCollapseMenu';

const CutterView = () => {
    const { t } = useTranslation();

    // Function to reset operator selection
    const resetOperatorSession = () => {
        setSelectedOperator('');
        localStorage.removeItem('cutter_selectedOperator');
        localStorage.removeItem('cutter_lastUser');
        localStorage.removeItem('cutter_lastToken');
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

    // Function to notify other cutter tabs about mattress status changes
    const notifyOtherCutters = (mattressId, newStatus, device) => {
        const changeData = {
            mattressId,
            newStatus,
            device,
            timestamp: Date.now(),
            source: cutterDevice
        };
        localStorage.setItem('cutter_mattress_status_change', JSON.stringify(changeData));
        // Remove the item immediately to trigger the event for other tabs
        setTimeout(() => {
            localStorage.removeItem('cutter_mattress_status_change');
        }, 100);
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
    const [conflictDetected, setConflictDetected] = useState(false);
    const account = useSelector((state) => state.account);
    const { user, token, isLoggedIn } = account;

    // Extract cutter number from username (e.g., "Cutter1" -> "CT1")
    const getCutterDevice = (username) => {
        if (!username) return null;
        const match = username.match(/Cutter(\d+)/i);
        return match ? `CT${match[1]}` : null;
    };

    const cutterDevice = getCutterDevice(user?.username);

    // Initialize operator selection based on user and login state
    useEffect(() => {
        if (user?.username && token && isLoggedIn) {
            // User is logged in - check for stored operator
            const storedOperator = localStorage.getItem('cutter_selectedOperator');
            const storedUser = localStorage.getItem('cutter_lastUser');
            const storedToken = localStorage.getItem('cutter_lastToken');
            const currentUser = user.username;

            // If same user AND same token, restore operator; otherwise start fresh
            if (storedOperator && storedUser === currentUser && storedToken === token) {
                setSelectedOperator(storedOperator);
            } else {
                // Fresh login or different user - reset to default
                localStorage.removeItem('cutter_selectedOperator');
                localStorage.removeItem('cutter_lastUser');
                localStorage.removeItem('cutter_lastToken');
                setSelectedOperator('');
            }
        } else {
            // User logged out - clear operator selection and localStorage
            setSelectedOperator('');
            localStorage.removeItem('cutter_selectedOperator');
            localStorage.removeItem('cutter_lastUser');
            localStorage.removeItem('cutter_lastToken');
        }
    }, [user?.username, token, isLoggedIn]);

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

        // Set up auto-refresh polling every 30 seconds for real-time updates
        const refreshInterval = setInterval(() => {
            fetchMattresses(false); // Background refresh
            checkOperatorSessionValidity(); // Check if operator session is still valid
        }, 30000); // 30 seconds (30,000 ms) - much more frequent for race condition prevention

        // Set up session validity check every 30 minutes
        const sessionCheckInterval = setInterval(() => {
            checkOperatorSessionValidity();
        }, 1800000); // 30 minutes (1,800,000 ms)

        // Listen for cross-tab communication about mattress status changes
        const handleStorageChange = (e) => {
            if (e.key === 'cutter_mattress_status_change') {
                const changeData = JSON.parse(e.newValue || '{}');
                if (changeData.timestamp && (Date.now() - changeData.timestamp) < 5000) { // Only process recent changes
                    // Refresh data immediately when another cutter makes changes
                    fetchMattresses(false);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Clean up the intervals and event listeners when component unmounts
        return () => {
            clearInterval(refreshInterval);
            clearInterval(sessionCheckInterval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [cutterDevice]);

    const fetchOperators = async () => {
        setLoadingOperators(true);
        try {
            const response = await axios.get('/cutter_operators/active');
            if (response.data.success) {
                setOperators(response.data.data);
                // Don't auto-select any operator - leave it empty by default
            }
        } catch (error) {
            // Error fetching operators - handle silently
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
                    // Filter mattresses based on status and device assignment
                    const filteredMattresses = res.data.data.filter(m => {
                        // Show mattresses assigned to this cutter (TO CUT or ON CUT)
                        if (m.device === cutterDevice) {
                            return m.status === "3 - TO CUT" || m.status === "4 - ON CUT";
                        }

                        // Show available "TO CUT" mattresses that are NOT assigned to any cutter
                        // This prevents showing mattresses that other cutters have started
                        if (m.status === "3 - TO CUT") {
                            // Only show if no device assigned OR device is not a cutter (CT1, CT2, etc.)
                            return !m.device || !m.device.startsWith('CT');
                        }

                        // Don't show mattresses in other statuses or assigned to other cutters
                        return false;
                    });

                    // Sort all mattresses by position (more efficient with pre-sorted data)
                    filteredMattresses.sort((a, b) => (a.position || 0) - (b.position || 0));

                    // More efficient: find active cutting mattress during filtering
                    let onCutMattress = null;
                    for (const m of filteredMattresses) {
                        if (m.status === "4 - ON CUT" && m.device === cutterDevice) {
                            onCutMattress = m;
                            break; // Early exit once found
                        }
                    }
                    setActiveCuttingMattress(onCutMattress);

                    // Check for potential conflicts (TO CUT mattresses assigned to other cutters)
                    const conflicts = filteredMattresses.filter(m =>
                        m.status === "3 - TO CUT" &&
                        m.device &&
                        m.device.startsWith('CT') &&
                        m.device !== cutterDevice
                    );

                    if (conflicts.length > 0 && !conflictDetected) {
                        setConflictDetected(true);
                        setSnackbar({
                            open: true,
                            message: `${conflicts.length} mattress(es) may have been assigned to other cutters. Data refreshed.`,
                            severity: "warning"
                        });
                    } else if (conflicts.length === 0 && conflictDetected) {
                        setConflictDetected(false);
                    }

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

        // Find the mattress to get its current status for optimistic locking
        const mattress = mattresses.find(m => m.id === mattressId);
        if (!mattress) {
            setSnackbar({
                open: true,
                message: "Mattress not found. Please refresh the page.",
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
            device: cutterDevice, // Explicitly set the device to ensure it's updated
            expected_current_status: mattress.status // Add optimistic locking
        })
        .then((res) => {
            if (res.data.success) {
                // Immediately update local state to hide mattress from other cutters
                setMattresses(prevMattresses =>
                    prevMattresses.map(m =>
                        m.id === mattressId
                            ? { ...m, status: "4 - ON CUT", device: cutterDevice }
                            : m
                    )
                );

                // Notify other cutter tabs about this change
                notifyOtherCutters(mattressId, "4 - ON CUT", cutterDevice);

                setSnackbar({
                    open: true,
                    message: "Status updated to ON CUT successfully",
                    severity: "success"
                });

                // Also refresh data in background to sync with server
                fetchMattresses(false);
            } else {
                setSnackbar({
                    open: true,
                    message: "Error: " + res.data.message,
                    severity: "error"
                });
                // If it's a conflict, refresh the data to show current state
                if (res.data.conflict) {
                    fetchMattresses(false);
                }
            }
        })
        .catch((err) => {
            let errorMessage = "API Error: " + (err.message || "Unknown error");

            // Handle specific conflict responses
            if (err.response && err.response.status === 409) {
                const conflictData = err.response.data;
                if (conflictData.message) {
                    errorMessage = conflictData.message;
                }
                // Refresh data to show current state
                fetchMattresses(false);
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error"
            });

        })
        .finally(() => {
            setProcessingMattress(null);
        });
    };

    const handleFinishCutting = (mattressId, layers) => {
        // Update activity time
        updateActivityTime();

        // Find the mattress to get its current status for optimistic locking
        const mattress = mattresses.find(m => m.id === mattressId);
        if (!mattress) {
            setSnackbar({
                open: true,
                message: "Mattress not found. Please refresh the page.",
                severity: "error"
            });
            return;
        }

        // Get the selected operator name
        const selectedOperatorObj = operators.find(op => op.id.toString() === selectedOperator);
        const operatorName = selectedOperatorObj ? selectedOperatorObj.name : (user?.username || "Unknown");

        setProcessingMattress(mattressId);

        // Only update the status to "5 - COMPLETED" (layers_a is updated by spreader, not cutter)
        axios.put(`/mattress/update_status/${mattressId}`, {
            status: "5 - COMPLETED",
            operator: operatorName,
            device: cutterDevice, // Explicitly set the device to ensure it's updated
            expected_current_status: mattress.status // Add optimistic locking
        })
        .then((res) => {
            if (res.data.success) {
                // Notify other cutter tabs about this change
                notifyOtherCutters(mattressId, "5 - COMPLETED", cutterDevice);

                setSnackbar({
                    open: true,
                    message: "Cutting finished successfully",
                    severity: "success"
                });
                // Reset active cutting mattress
                setActiveCuttingMattress(null);
                fetchMattresses(false); // Refresh the data in background
            } else {
                setSnackbar({
                    open: true,
                    message: "Error: " + res.data.message,
                    severity: "error"
                });
                // If it's a conflict, refresh the data to show current state
                if (res.data.conflict) {
                    fetchMattresses(false);
                }
            }
        })
        .catch((err) => {
            let errorMessage = "API Error: " + (err.message || "Unknown error");

            // Handle specific conflict responses
            if (err.response && err.response.status === 409) {
                const conflictData = err.response.data;
                if (conflictData.message) {
                    errorMessage = conflictData.message;
                }
                // Refresh data to show current state
                fetchMattresses(false);
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error"
            });

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

        // Check if data might be stale (more than 1 minute since last refresh)
        const isDataStale = (new Date() - lastRefreshTime) > 60000;

        // Check if this mattress might have a conflict (TO CUT status but assigned to a cutter device)
        const hasDeviceConflict = mattress.status === "3 - TO CUT" && sourceDevice && sourceDevice.startsWith('CT') && sourceDevice !== cutterDevice;

        return (
            <Card key={mattress.id} sx={{
                mb: 2,
                boxShadow: 2,
                // Add visual indicator for potential conflicts
                border: hasDeviceConflict ? '2px solid #ff9800' : (isDataStale ? '1px solid #ffc107' : 'none')
            }}>
                <Box sx={{ p: 1.5 }}>
                    {/* Warning for potential conflicts */}
                    {hasDeviceConflict && (
                        <Alert severity="warning" sx={{ mb: 1, fontSize: '0.875rem' }}>
                            This mattress may be assigned to {sourceDevice}. Please refresh to see current status.
                        </Alert>
                    )}

                    {/* Header with mattress ID and pills - matching spreader style */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {mattress.mattress}
                                {isDataStale && (
                                    <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                                        (Data may be stale)
                                    </Typography>
                                )}
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
                                    {mattress.layers_a || mattress.layers || 0} {t('kanban.layers')}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Details section - first row */}
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
                    </Box>

                    {/* Marker section - separate paragraph for better aesthetics */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 1,
                        gap: 0.5
                    }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}><strong>{t('kanban.marker')}:</strong> {mattress.marker || t('table.na')}</Typography>
                        {mattress.marker && (
                            <Tooltip title={t('common.copyMarkerName', 'Copy marker name')}>
                                <IconButton
                                    size="small"
                                    onClick={() => copyToClipboard(mattress.marker)}
                                    sx={{
                                        p: 0.25,
                                        height: '24px',
                                        width: '24px'
                                    }}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Action buttons */}
                    {mattress.status === "3 - TO CUT" && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {(isDataStale || hasDeviceConflict) && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => fetchMattresses(false)}
                                    disabled={refreshing}
                                >
                                    Refresh Status
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={processingMattress === mattress.id || !selectedOperator || activeCuttingMattress !== null || hasDeviceConflict}
                                onClick={() => handleStartCutting(mattress.id)}
                                title={
                                    activeCuttingMattress ? t('cutter.cannotStartCutting', { mattress: activeCuttingMattress.mattress, device: cutterDevice }) :
                                    hasDeviceConflict ? "Please refresh to see current status before starting" : ""
                                }
                            >
                                {processingMattress === mattress.id ? t('cutter.processing') : t('cutter.startCutting')}
                            </Button>
                        </Box>
                    )}
                    {mattress.status === "4 - ON CUT" && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                disabled={processingMattress === mattress.id || !selectedOperator}
                                onClick={() => handleFinishCutting(mattress.id, mattress.layers_a || mattress.layers)}
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
                            Cutter Job Queue
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
                        minHeight: '56px',
                        gap: 2
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
                                    // Save to localStorage for persistence across page refreshes
                                    if (operatorId) {
                                        localStorage.setItem('cutter_selectedOperator', operatorId);
                                        localStorage.setItem('cutter_lastUser', user?.username || '');
                                        localStorage.setItem('cutter_lastToken', token || '');
                                        // Set session date when operator is selected
                                        setOperatorSessionDate(new Date().toDateString());
                                        updateActivityTime();
                                    } else {
                                        localStorage.removeItem('cutter_selectedOperator');
                                        localStorage.removeItem('cutter_lastUser');
                                        localStorage.removeItem('cutter_lastToken');
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

                        {/* Manual refresh button */}
                        <Tooltip title="Refresh data">
                            <IconButton
                                onClick={() => fetchMattresses(false)}
                                disabled={refreshing}
                                color="primary"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Typography variant="caption" color="textSecondary">
                            {t('common.lastUpdated', 'Last updated')}: {lastRefreshTime.toLocaleTimeString()}
                        </Typography>
                    </Box>
                }
            >
                {/* No operator selected warning */}
                {!selectedOperator && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Box sx={{
                            maxWidth: '800px',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Alert severity="warning" sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 'auto'
                            }}>
                                <Typography variant="body1">
                                    Please select an operator to start cutting operations.
                                </Typography>
                            </Alert>
                        </Box>
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
