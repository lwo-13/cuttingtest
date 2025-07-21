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
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { useBadgeCount } from 'contexts/BadgeCountContext';

const MarkerRequests = () => {
    const { t } = useTranslation();
    const account = useSelector((state) => state.account);
    const { user } = account;
    const { refreshAllBadges } = useBadgeCount();

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

    useEffect(() => {
        fetchMarkerRequests();
    }, []);

    const fetchMarkerRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/marker_requests/list');
            if (response.data.success) {
                setRequests(response.data.data);
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
                    if (!actionDialog.createdMarkerId) {
                        setSnackbar({
                            open: true,
                            message: 'Please specify the created marker ID',
                            severity: 'error'
                        });
                        return;
                    }
                    response = await axios.post(`/marker_requests/${selectedRequest.id}/complete`, {
                        created_marker_id: actionDialog.createdMarkerId,
                        planner_notes: actionDialog.notes
                    });
                    break;
                case 'cancel':
                    response = await axios.post(`/marker_requests/${selectedRequest.id}/cancel`, {
                        planner_notes: actionDialog.notes
                    });
                    break;
                case 'update_notes':
                    response = await axios.post(`/marker_requests/${selectedRequest.id}/update_notes`, {
                        planner_notes: actionDialog.notes
                    });
                    break;
                default:
                    return;
            }

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: `Marker request ${actionDialog.action}d successfully`,
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

    if (loading) {
        return (
            <MainCard title="Marker Requests">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <>
            <MainCard title="Marker Requests">
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Manage marker creation requests from approved width changes.
                </Typography>

                {requests.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        No marker requests available
                    </Typography>
                ) : (
                    requests.map((request, index) => (
                        <Accordion key={request.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Order: {request.order_commessa}
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            Request Details
                                        </Typography>
                                        <Typography variant="body2"><strong>Requested by:</strong> {request.requested_by}</Typography>
                                        <Typography variant="body2"><strong>Style:</strong> {request.style}</Typography>
                                        <Typography variant="body2"><strong>Order:</strong> {request.order_commessa}</Typography>
                                        <Typography variant="body2"><strong>Requested Width:</strong> {request.requested_width} cm</Typography>
                                        <Typography variant="body2"><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</Typography>
                                        {request.size_quantities && (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Size Quantities:</Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.85em', color: 'text.secondary' }}>
                                                    {JSON.stringify(JSON.parse(request.size_quantities), null, 2)}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            Status & Actions
                                        </Typography>
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
                                        
                                        {request.status === 'pending' && (
                                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<AssignmentIcon />}
                                                    onClick={() => handleOpenActionDialog(request, 'assign')}
                                                >
                                                    Assign
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    onClick={() => handleOpenActionDialog(request, 'complete')}
                                                >
                                                    Complete
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleOpenActionDialog(request, 'cancel')}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleOpenActionDialog(request, 'update_notes')}
                                                >
                                                    Update Notes
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
                    {actionDialog.action === 'update_notes' && 'Update Notes'}
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
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Order:</strong> {selectedRequest.order_commessa}
                            </Typography>
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
                        {actionDialog.action === 'update_notes' && 'Update'}
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
