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

    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { useBadgeCount } from 'contexts/BadgeCountContext';

const WidthChangeApprovals = () => {
    const { t } = useTranslation();
    const account = useSelector((state) => state.account);
    const { user } = account;
    const { refreshAllBadges } = useBadgeCount();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchWidthChangeRequests();
    }, []);

    const fetchWidthChangeRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/width_change_requests/list');
            if (response.data.success) {
                setRequests(response.data.data);
            } else {
                console.error('Failed to fetch width change requests:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching width change requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (request, action) => {
        try {
            const endpoint = action === 'approve' ? 'approve' : 'reject';
            const response = await axios.post(`/width_change_requests/${request.id}/${endpoint}`, {
                approved_by: user.username
            });

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: `Width change request ${action}d successfully`,
                    severity: 'success'
                });

                // Refresh the requests list
                await fetchWidthChangeRequests();

                // Refresh badge counts
                refreshAllBadges();
            } else {
                setSnackbar({
                    open: true,
                    message: response.data.message || `Failed to ${action} request`,
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
            setSnackbar({
                open: true,
                message: `Error ${action}ing request`,
                severity: 'error'
            });
        }
    };

    const getStatusIcon = (request) => {
        // Check if it's a new marker request without selected marker
        if (request.status === 'pending' && request.request_type === 'new_marker' && !request.selected_marker_name) {
            return <PendingIcon sx={{ color: 'blue', mr: 1 }} />;
        }

        switch (request.status) {
            case 'pending':
                return <PendingIcon sx={{ color: 'orange', mr: 1 }} />;
            case 'approved':
                return <CheckCircleIcon sx={{ color: 'green', mr: 1 }} />;
            case 'rejected':
                return <CancelIcon sx={{ color: 'red', mr: 1 }} />;
            case 'waiting_for_marker':
                return <PendingIcon sx={{ color: 'blue', mr: 1 }} />;
            default:
                return <PendingIcon sx={{ color: 'gray', mr: 1 }} />;
        }
    };

    const getStatusColor = (request) => {
        // Check if it's a new marker request without selected marker
        if (request.status === 'pending' && request.request_type === 'new_marker' && !request.selected_marker_name) {
            return 'info';
        }

        switch (request.status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'waiting_for_marker':
                return 'info';
            default:
                return 'default';
        }
    };

    const getStatusText = (request) => {
        // Check if it's a new marker request without selected marker
        if (request.status === 'pending' && request.request_type === 'new_marker' && !request.selected_marker_name) {
            return 'Waiting for Marker';
        }

        switch (request.status) {
            case 'pending':
                return 'Pending Approval';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            case 'waiting_for_marker':
                return 'Waiting for Marker';
            default:
                return request.status;
        }
    };

    const getRequestTypeText = (requestType) => {
        switch (requestType) {
            case 'change_marker':
                return 'Change to Existing Marker';
            case 'new_marker':
                return 'New Marker Required';
            default:
                return requestType;
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (loading) {
        return (
            <MainCard title="Width Change Approvals">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <>
            <MainCard title="Width Change Approvals">
                {requests.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        No width change requests available
                    </Typography>
                ) : (
                    requests.map((request, index) => (
                        <Accordion key={request.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {getStatusIcon(request)}
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2, fontSize: '1.1rem' }}>
                                            {request.mattress?.mattress || `Mattress ID: ${request.mattress_id}`}
                                        </Typography>
                                        <Chip
                                            label={getStatusText(request)}
                                            color={getStatusColor(request)}
                                            size="small"
                                            sx={{ mr: 2 }}
                                        />
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {request.current_width}cm → {request.requested_width}cm
                                        </Typography>
                                    </Box>

                                    {/* Show approve/reject buttons only for pending requests that have a marker OR are change_marker type */}
                                    {request.status === 'pending' && (request.request_type === 'change_marker' || request.selected_marker_name) && (
                                        <Box sx={{ display: 'flex', gap: 1, mr: 1 }} onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    backgroundColor: '#00e676',
                                                    '&:hover': {
                                                        backgroundColor: '#00c853'
                                                    },
                                                    minWidth: '40px',
                                                    width: '40px',
                                                    height: '32px'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApproval(request, 'approve');
                                                }}
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApproval(request, 'reject');
                                                }}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </Button>
                                        </Box>
                                    )}

                                    {/* Show waiting message only for waiting_for_marker status */}
                                    {request.status === 'waiting_for_marker' && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                Waiting for marker creation
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Show marker info for new_marker requests with pending status and available marker info */}
                                    {request.status === 'pending' && request.request_type === 'new_marker' && request.selected_marker_name && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                                                New Marker: {request.selected_marker_name} - {request.new_width}cm
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {getRequestTypeText(request.request_type)}
                                        </Typography>

                                        {request.request_type === 'change_marker' ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
                                                {/* Current Marker - 1/3 width */}
                                                <Box sx={{ flex: 1, pr: 1 }}>
                                                    <Typography variant="body2"><strong>Current Marker:</strong> {request.current_marker_name}</Typography>
                                                    <Typography variant="body2" sx={{ mt: 1 }}><strong>Current Width:</strong> {request.current_width} cm</Typography>
                                                    {request.current_marker_length && (
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Current Length:</strong> {request.current_marker_length} cm</Typography>
                                                    )}
                                                </Box>

                                                {/* New Marker - 1/3 width */}
                                                <Box sx={{ flex: 1, px: 1 }}>
                                                    <Typography variant="body2"><strong>New Marker:</strong> {request.selected_marker_name}</Typography>
                                                    <Typography variant="body2" sx={{ mt: 1 }}><strong>New Width:</strong> {request.requested_width} cm</Typography>
                                                    {request.selected_marker_length && (
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>New Length:</strong> {request.selected_marker_length} cm</Typography>
                                                    )}
                                                </Box>

                                                {/* Consumption Analysis - 1/3 width */}
                                                {request.selected_marker_length && request.mattress_layers && request.planned_consumption ? (
                                                    <Box sx={{ flex: 1, pl: 1 }}>
                                                        <Typography variant="body2"><strong>Old Cons.:</strong> {parseFloat(request.planned_consumption).toFixed(2)} m</Typography>
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>New Cons.:</strong> {(() => {
                                                            const newLength = parseFloat(request.selected_marker_length) || 0;
                                                            const layers = parseFloat(request.mattress_layers) || 0;
                                                            const extra = parseFloat(request.extra) || 0.02;
                                                            const newConsumption = (newLength + extra) * layers;
                                                            return newConsumption.toFixed(2);
                                                        })()} m</Typography>
                                                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                            <strong>Δ:</strong> {(() => {
                                                                const oldConsumption = parseFloat(request.planned_consumption) || 0;
                                                                const newLength = parseFloat(request.selected_marker_length) || 0;
                                                                const layers = parseFloat(request.mattress_layers) || 0;
                                                                const extra = parseFloat(request.extra) || 0.02;
                                                                const newConsumption = (newLength + extra) * layers;
                                                                const difference = newConsumption - oldConsumption;
                                                                const sign = difference >= 0 ? '+' : '';
                                                                const color = difference >= 0 ? '#d32f2f' : '#2e7d32';
                                                                return (
                                                                    <span style={{ color }}>
                                                                        {sign}{difference.toFixed(2)} m
                                                                    </span>
                                                                );
                                                            })()}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ flex: 1 }}></Box>
                                                )}
                                            </Box>
                                        ) : (
                                            /* New Marker Required requests */
                                            request.selected_marker_name ? (
                                                /* When marker has been created */
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
                                                    {/* Current Marker - 1/3 width */}
                                                    <Box sx={{ flex: 1, pr: 1 }}>
                                                        <Typography variant="body2"><strong>Current Marker:</strong> {request.current_marker_name}</Typography>
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Current Width:</strong> {request.current_width} cm</Typography>
                                                        {request.current_marker_length && (
                                                            <Typography variant="body2" sx={{ mt: 1 }}><strong>Current Length:</strong> {request.current_marker_length} cm</Typography>
                                                        )}
                                                    </Box>

                                                    {/* New Marker - 1/3 width */}
                                                    <Box sx={{ flex: 1, px: 1 }}>
                                                        <Typography variant="body2"><strong>New Marker:</strong> {request.selected_marker_name}</Typography>
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>New Width:</strong> {request.requested_width} cm</Typography>
                                                        {request.selected_marker_length && (
                                                            <Typography variant="body2" sx={{ mt: 1 }}><strong>New Length:</strong> {request.selected_marker_length} cm</Typography>
                                                        )}
                                                    </Box>

                                                    {/* Consumption Analysis - 1/3 width */}
                                                    {request.selected_marker_length && request.mattress_layers && request.planned_consumption ? (
                                                        <Box sx={{ flex: 1, pl: 1 }}>
                                                            <Typography variant="body2"><strong>Old Cons.:</strong> {parseFloat(request.planned_consumption).toFixed(2)} m</Typography>
                                                            <Typography variant="body2" sx={{ mt: 1 }}><strong>New Cons.:</strong> {(() => {
                                                                const newLength = parseFloat(request.selected_marker_length) || 0;
                                                                const layers = parseFloat(request.mattress_layers) || 0;
                                                                const extra = parseFloat(request.extra) || 0.02;
                                                                const newConsumption = (newLength + extra) * layers;
                                                                return newConsumption.toFixed(2);
                                                            })()} m</Typography>
                                                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                                <strong>Δ:</strong> {(() => {
                                                                    const oldConsumption = parseFloat(request.planned_consumption) || 0;
                                                                    const newLength = parseFloat(request.selected_marker_length) || 0;
                                                                    const layers = parseFloat(request.mattress_layers) || 0;
                                                                    const extra = parseFloat(request.extra) || 0.02;
                                                                    const newConsumption = (newLength + extra) * layers;
                                                                    const difference = newConsumption - oldConsumption;
                                                                    const sign = difference >= 0 ? '+' : '';
                                                                    const color = difference >= 0 ? '#d32f2f' : '#2e7d32';
                                                                    return (
                                                                        <span style={{ color }}>
                                                                            {sign}{difference.toFixed(2)} m
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ flex: 1 }}></Box>
                                                    )}
                                                </Box>
                                            ) : (
                                                /* When marker hasn't been created yet */
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
                                                    <Box sx={{ flex: 1, pr: 2 }}>
                                                        <Typography variant="body2"><strong>Current Marker:</strong> {request.current_marker_name}</Typography>
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Current Width:</strong> {request.current_width} cm</Typography>
                                                        {request.current_marker_length && (
                                                            <Typography variant="body2" sx={{ mt: 1 }}><strong>Current Length:</strong> {request.current_marker_length} cm</Typography>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ flex: 1, pl: 2 }}>
                                                        <Typography variant="body2"><strong>New Width:</strong> {request.requested_width} cm</Typography>
                                                    </Box>
                                                </Box>
                                            )
                                        )}



                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                            {/* First Column - Creation Info */}
                                            <Box sx={{ flex: 1, pr: 2 }}>
                                                <Typography variant="body2"><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</Typography>
                                                <Typography variant="body2"><strong>Requested by:</strong> {request.operator ? `${request.operator} (${request.requested_by})` : request.requested_by}</Typography>
                                            </Box>

                                            {/* Second Column - Approval Info */}
                                            <Box sx={{ flex: 1, pl: 2 }}>
                                                {request.status !== 'pending' && (
                                                    <>
                                                        <Typography variant="body2"><strong>Approved by:</strong> {request.approved_by}</Typography>
                                                        <Typography variant="body2"><strong>Approved at:</strong> {new Date(request.approved_at).toLocaleString()}</Typography>
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}
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

export default WidthChangeApprovals;
