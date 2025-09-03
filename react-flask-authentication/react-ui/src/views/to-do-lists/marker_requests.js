import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Chip,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Snackbar,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { areSizeQuantitiesEqual } from 'utils/sizeNormalization';
import { useBadgeCount } from 'contexts/BadgeCountContext';

const MarkerRequests = () => {
    const { t } = useTranslation();
    const account = useSelector((state) => state.account);
    const { user } = account;
    const { refreshAllBadges } = useBadgeCount();

    // Check if user has access to this page
    const hasAccess = user && ['Manager', 'Project Admin', 'Subcontractor'].includes(user.role);
    const isSubcontractor = user && user.role === 'Subcontractor';

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionDialog, setActionDialog] = useState({
        open: false,
        action: '', // 'assign', 'complete', 'cancel'
        assignedTo: '',
        createdMarkerId: '',
        notes: ''
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [markersForStyle, setMarkersForStyle] = useState({});
    const [selectedMarkers, setSelectedMarkers] = useState({});

    useEffect(() => {
        if (hasAccess) {
            fetchMarkerRequests();
        }
    }, [hasAccess]);

    // Fetch markers for all pending requests when requests are loaded
    useEffect(() => {
        const pendingRequests = requests.filter(req => req.status === 'pending');
        pendingRequests.forEach(request => {
            fetchMarkersForRequest(request);
        });
    }, [requests]);

    // Note: Using imported areSizeQuantitiesEqual function with size normalization

    // Parse size quantities string (same as spreader logic)
    const parseSizeQuantities = (sizesString) => {
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

    // Fetch markers for a specific style and size quantities (using spreader logic)
    const fetchMarkersForRequest = async (request) => {
        const cacheKey = `${request.style}_${request.size_quantities}`;
        if (markersForStyle[cacheKey]) {
            return; // Already fetched
        }

        try {
            // Parse the size quantities from the request
            let requestSizeQuantities = {};
            if (typeof request.size_quantities === 'string') {
                requestSizeQuantities = parseSizeQuantities(request.size_quantities);
            } else if (typeof request.size_quantities === 'object') {
                try {
                    const parsed = typeof request.size_quantities === 'string' ?
                        JSON.parse(request.size_quantities) : request.size_quantities;
                    requestSizeQuantities = parsed || {};
                } catch (e) {
                    console.error('Error parsing size quantities:', e);
                    requestSizeQuantities = {};
                }
            }

            // Get the sizes for the API call
            const sizes = Object.keys(requestSizeQuantities);

            // Use the same API endpoint as spreader
            const response = await axios.get('/markers/marker_headers_planning', {
                params: {
                    style: request.style,
                    sizes: sizes.join(',')
                }
            });

            if (response.data.success) {
                // Filter markers with both size quantity matches AND width filtering
                const matchingMarkers = response.data.data.filter(marker => {
                    // First check size quantities match (same as spreader)
                    const sizeQuantitiesMatch = areSizeQuantitiesEqual(requestSizeQuantities, marker.size_quantities || {});

                    // Then check width filtering (decimal variations like original logic)
                    let widthMatches = true;
                    if (request.requested_width) {
                        const baseWidth = Math.floor(request.requested_width); // Get integer part (e.g., 160)
                        const markerWidth = marker.marker_width;
                        // Include decimal variations: 160.0, 160.1, 160.2, ..., 160.9
                        widthMatches = markerWidth >= baseWidth && markerWidth < baseWidth + 1;
                    }

                    return sizeQuantitiesMatch && widthMatches;
                });

                setMarkersForStyle(prev => ({
                    ...prev,
                    [cacheKey]: matchingMarkers
                }));
            }
        } catch (error) {
            console.error('Error fetching markers for request:', error);
        }
    };

    const fetchMarkerRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/marker_requests/list');
            if (response.data.success) {
                let filteredRequests = response.data.data;

                // If user is a subcontractor, only show their own requests
                if (isSubcontractor) {
                    filteredRequests = response.data.data.filter(request =>
                        request.requested_by === user.username
                    );
                }

                setRequests(filteredRequests);
            } else {
                console.error('Failed to fetch marker requests:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching marker requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenActionDialog = (request, action) => {
        setSelectedRequest(request);
        setActionDialog({
            open: true,
            action: action,
            assignedTo: request.assigned_to || '',
            createdMarkerId: '',
            notes: request.planner_notes || ''
        });
    };

    const handleCloseActionDialog = () => {
        setActionDialog({
            open: false,
            action: '',
            assignedTo: '',
            createdMarkerId: '',
            notes: ''
        });
        setSelectedRequest(null);
    };

    const handleSubmitAction = async () => {
        if (!selectedRequest) return;

        try {
            let response;
            
            switch (actionDialog.action) {
                case 'assign':
                    response = await axios.post(`/marker_requests/${selectedRequest.id}/assign`, {
                        assigned_to: actionDialog.assignedTo
                    });
                    break;
                case 'complete':
                    // Check if user selected an existing marker or wants to create new
                    const selectedMarkerId = selectedMarkers[selectedRequest.id];

                    if (selectedMarkerId) {
                        // User selected an existing marker - use that marker
                        response = await axios.post(`/marker_requests/${selectedRequest.id}/complete`, {
                            created_marker_id: selectedMarkerId,
                            planner_notes: actionDialog.notes
                        });
                    } else {
                        // User wants to create a new marker
                        if (!actionDialog.createdMarkerId) {
                            setSnackbar({
                                open: true,
                                message: 'Please select an existing marker or enter the created marker ID',
                                severity: 'error'
                            });
                            return;
                        }
                        response = await axios.post(`/marker_requests/${selectedRequest.id}/complete`, {
                            created_marker_id: actionDialog.createdMarkerId,
                            planner_notes: actionDialog.notes
                        });
                    }
                    break;
                case 'cancel':
                    response = await axios.post(`/marker_requests/${selectedRequest.id}/cancel`, {
                        planner_notes: actionDialog.notes,
                        cancelled_by: user.username
                    });
                    break;

                default:
                    return;
            }

            if (response.data.success) {
                let successMessage = `Marker request ${actionDialog.action}d successfully`;

                // Special message for cancellation to indicate width change rejection
                if (actionDialog.action === 'cancel') {
                    successMessage = 'Marker request cancelled and width change request rejected successfully';
                }

                setSnackbar({
                    open: true,
                    message: successMessage,
                    severity: 'success'
                });

                // Refresh the requests list
                await fetchMarkerRequests();

                // Refresh badge counts
                refreshAllBadges();
            } else {
                setSnackbar({
                    open: true,
                    message: response.data.message || `Failed to ${actionDialog.action} request`,
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error(`Error ${actionDialog.action}ing request:`, error);
            setSnackbar({
                open: true,
                message: `Error ${actionDialog.action}ing request`,
                severity: 'error'
            });
        } finally {
            handleCloseActionDialog();
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <PendingIcon sx={{ color: 'orange', mr: 1 }} />;
            case 'completed':
                return <CheckCircleIcon sx={{ color: 'green', mr: 1 }} />;
            case 'cancelled':
                return <CancelIcon sx={{ color: 'red', mr: 1 }} />;
            default:
                return <PendingIcon sx={{ color: 'gray', mr: 1 }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // If user doesn't have access, show access denied message
    if (!hasAccess) {
        return (
            <MainCard title="Access Denied">
                <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                    You don't have permission to access this page.
                </Typography>
            </MainCard>
        );
    }

    if (loading) {
        return (
            <MainCard title={isSubcontractor ? t('subcontractor.markerRequests', 'Marker Requests') : 'Marker Requests'}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <>
            <MainCard title={isSubcontractor ? t('subcontractor.markerRequests', 'Marker Requests') : 'Marker Requests'}>


                {requests.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        No marker requests available
                    </Typography>
                ) : (
                    requests.map((request, index) => (
                        <Accordion key={request.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {getStatusIcon(request.status)}
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2, fontSize: '1.1rem' }}>
                                            {request.style} - {request.requested_width}cm
                                        </Typography>
                                        <Chip
                                            label={getStatusText(request.status)}
                                            color={getStatusColor(request.status)}
                                            size="small"
                                            sx={{ mr: 2 }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {request.requested_by}
                                        </Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Style:</strong> {request.style}
                                        </Typography>

                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Width:</strong> {request.requested_width} cm
                                        </Typography>

                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Fabric:</strong> {request.fabric_code || 'N/A'}
                                        </Typography>

                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Size Quantities:</strong> {(() => {
                                                try {
                                                    const sizes = typeof request.size_quantities === 'string' ?
                                                        JSON.parse(request.size_quantities) : request.size_quantities;
                                                    return Object.entries(sizes || {})
                                                        .map(([size, qty]) => `${size}: ${qty}`)
                                                        .join(', ') || 'N/A';
                                                } catch (e) {
                                                    return request.size_quantities || 'N/A';
                                                }
                                            })()}
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>Created:</strong> {new Date(request.created_at).toLocaleString()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        {/* Marker Selection Dropdown - Only for managers and project admins */}
                                        {request.status === 'pending' && !isSubcontractor && (
                                            <Box sx={{ mb: 2 }}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Select Marker</InputLabel>
                                                    <Select
                                                        value={selectedMarkers[request.id] || ''}
                                                        label="Select Marker"
                                                        onChange={(e) => {
                                                            setSelectedMarkers(prev => ({
                                                                ...prev,
                                                                [request.id]: e.target.value
                                                            }));
                                                        }}

                                                    >
                                                        {(() => {
                                                            const cacheKey = `${request.style}_${request.size_quantities}`;
                                                            const markers = markersForStyle[cacheKey] || [];

                                                            if (markers.length === 0) {
                                                                return (
                                                                    <MenuItem value="" disabled>
                                                                        <em>0 markers found</em>
                                                                    </MenuItem>
                                                                );
                                                            }

                                                            return markers.map((marker) => (
                                                                <MenuItem key={marker.id} value={marker.id}>
                                                                    {marker.marker_name} - {marker.marker_width}cm
                                                                </MenuItem>
                                                            ));
                                                        })()}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        )}

                                        {request.assigned_to && (
                                            <Typography variant="body2"><strong>Assigned to:</strong> {request.assigned_to}</Typography>
                                        )}
                                        {request.created_marker_id && (
                                            <Typography variant="body2"><strong>Created Marker ID:</strong> {request.created_marker_id}</Typography>
                                        )}
                                        {request.planner_notes && (
                                            <Typography variant="body2"><strong>Notes:</strong> {request.planner_notes}</Typography>
                                        )}
                                        {request.completed_at && (
                                            <Typography variant="body2"><strong>Completed:</strong> {new Date(request.completed_at).toLocaleString()}</Typography>
                                        )}

                                        {request.status === 'pending' && !isSubcontractor && (
                                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    disabled={!selectedMarkers[request.id]}
                                                    sx={{
                                                        backgroundColor: '#00e676',
                                                        '&:hover': {
                                                            backgroundColor: '#00c853'
                                                        },
                                                        '&:disabled': {
                                                            backgroundColor: '#e0e0e0'
                                                        },
                                                        minWidth: '40px',
                                                        width: '40px',
                                                        height: '32px'
                                                    }}
                                                    onClick={() => handleOpenActionDialog(request, 'complete')}
                                                >
                                                    <CheckIcon fontSize="small" />
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#f44336',
                                                        '&:hover': {
                                                            backgroundColor: '#c62828'
                                                        },
                                                        minWidth: '40px',
                                                        width: '40px',
                                                        height: '32px'
                                                    }}
                                                    onClick={() => handleOpenActionDialog(request, 'cancel')}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </Button>

                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}
            </MainCard>

            {/* Action Dialog */}
            <Dialog open={actionDialog.open} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {actionDialog.action === 'assign' && 'Assign Marker Request'}
                    {actionDialog.action === 'complete' && 'Complete Marker Request'}
                    {actionDialog.action === 'cancel' && 'Cancel Marker Request'}

                </DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Style:</strong> {selectedRequest.style}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Width:</strong> {selectedRequest.requested_width}cm
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Order:</strong> {selectedRequest.order_commessa}
                            </Typography>

                            {/* Fabric Information in Dialog */}
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Fabric Code:</Typography>
                                <Typography variant="body2">{selectedRequest.fabric_code || 'N/A'}</Typography>
                            </Box>
                        </Box>
                    )}
                    
                    {actionDialog.action === 'assign' && (
                        <TextField
                            label="Assign to (username)"
                            fullWidth
                            value={actionDialog.assignedTo}
                            onChange={(e) => setActionDialog(prev => ({ ...prev, assignedTo: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                    )}
                    
                    {actionDialog.action === 'complete' && (
                        <TextField
                            label="Created Marker ID"
                            type="number"
                            fullWidth
                            value={actionDialog.createdMarkerId}
                            onChange={(e) => setActionDialog(prev => ({ ...prev, createdMarkerId: e.target.value }))}
                            sx={{ mb: 2 }}
                            required
                        />
                    )}
                    
                    <TextField
                        label="Notes"
                        multiline
                        rows={3}
                        fullWidth
                        value={actionDialog.notes}
                        onChange={(e) => setActionDialog(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add notes..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseActionDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmitAction}
                        variant="contained"
                        disabled={actionDialog.action === 'assign' && !actionDialog.assignedTo}
                    >
                        {actionDialog.action === 'assign' && 'Assign'}
                        {actionDialog.action === 'complete' && 'Complete'}
                        {actionDialog.action === 'cancel' && 'Cancel Request'}

                    </Button>
                </DialogActions>
            </Dialog>

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

export default MarkerRequests;
