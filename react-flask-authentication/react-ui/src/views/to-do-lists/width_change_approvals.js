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
    CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
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
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approvalDialog, setApprovalDialog] = useState({
        open: false,
        action: '', // 'approve' or 'reject'
        notes: ''
    });
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

    const handleOpenApprovalDialog = (request, action) => {
        setSelectedRequest(request);
        setApprovalDialog({
            open: true,
            action: action,
            notes: ''
        });
    };

    const handleCloseApprovalDialog = () => {
        setApprovalDialog({
            open: false,
            action: '',
            notes: ''
        });
        setSelectedRequest(null);
    };

    const handleSubmitApproval = async () => {
        if (!selectedRequest) return;

        try {
            const endpoint = approvalDialog.action === 'approve' ? 'approve' : 'reject';
            const response = await axios.post(`/width_change_requests/${selectedRequest.id}/${endpoint}`, {
                approved_by: user.username,
                approval_notes: approvalDialog.notes
            });

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: `Width change request ${approvalDialog.action}d successfully`,
                    severity: 'success'
                });
                
                // Refresh the requests list
                await fetchWidthChangeRequests();
                
                // Refresh badge counts
                refreshAllBadges();
            } else {
                setSnackbar({
                    open: true,
                    message: response.data.message || `Failed to ${approvalDialog.action} request`,
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error(`Error ${approvalDialog.action}ing request:`, error);
            setSnackbar({
                open: true,
                message: `Error ${approvalDialog.action}ing request`,
                severity: 'error'
            });
        } finally {
            handleCloseApprovalDialog();
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <PendingIcon sx={{ color: 'orange', mr: 1 }} />;
            case 'approved':
                return <CheckCircleIcon sx={{ color: 'green', mr: 1 }} />;
            case 'rejected':
                return <CancelIcon sx={{ color: 'red', mr: 1 }} />;
            default:
                return <PendingIcon sx={{ color: 'gray', mr: 1 }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pending Approval';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            default:
                return status;
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
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Review and approve/reject width change requests from spreader operators.
                </Typography>

                {requests.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        No width change requests available
                    </Typography>
                ) : (
                    requests.map((request, index) => (
                        <Accordion key={request.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    {getStatusIcon(request.status)}
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2, fontSize: '1.1rem' }}>
                                        {request.mattress?.mattress || `Mattress ID: ${request.mattress_id}`}
                                    </Typography>
                                    <Chip
                                        label={getStatusText(request.status)}
                                        color={getStatusColor(request.status)}
                                        size="small"
                                        sx={{ mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {request.current_width}cm → {request.requested_width}cm
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
                                        <Typography variant="body2"><strong>Current Marker:</strong> {request.current_marker_name}</Typography>
                                        <Typography variant="body2"><strong>Current Width:</strong> {request.current_width} cm</Typography>
                                        <Typography variant="body2"><strong>Requested Width:</strong> {request.requested_width} cm</Typography>
                                        <Typography variant="body2"><strong>Request Type:</strong> {request.request_type === 'change_marker' ? 'Change to Existing Marker' : 'New Marker Required'}</Typography>
                                        {request.selected_marker_name && (
                                            <Typography variant="body2"><strong>Selected Marker:</strong> {request.selected_marker_name}</Typography>
                                        )}
                                        <Typography variant="body2"><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            Mattress Details
                                        </Typography>
                                        {request.mattress && (
                                            <>
                                                <Typography variant="body2"><strong>Order:</strong> {request.mattress.order_commessa}</Typography>
                                                <Typography variant="body2"><strong>Layers:</strong> {request.mattress.layers}</Typography>
                                                <Typography variant="body2"><strong>Status:</strong> {request.mattress.status}</Typography>
                                            </>
                                        )}
                                        
                                        {request.status === 'pending' && (
                                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    onClick={() => handleOpenApprovalDialog(request, 'approve')}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleOpenApprovalDialog(request, 'reject')}
                                                >
                                                    Reject
                                                </Button>
                                            </Box>
                                        )}
                                        
                                        {request.status !== 'pending' && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2"><strong>Approved by:</strong> {request.approved_by}</Typography>
                                                <Typography variant="body2"><strong>Approved at:</strong> {new Date(request.approved_at).toLocaleString()}</Typography>
                                                {request.approval_notes && (
                                                    <Typography variant="body2"><strong>Notes:</strong> {request.approval_notes}</Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}
            </MainCard>

            {/* Approval Dialog */}
            <Dialog open={approvalDialog.open} onClose={handleCloseApprovalDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'} Width Change Request
                </DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Mattress:</strong> {selectedRequest.mattress?.mattress || `ID: ${selectedRequest.mattress_id}`}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Width Change:</strong> {selectedRequest.current_width}cm → {selectedRequest.requested_width}cm
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Requested by:</strong> {selectedRequest.requested_by}
                            </Typography>
                        </Box>
                    )}
                    <TextField
                        label="Notes (optional)"
                        multiline
                        rows={3}
                        fullWidth
                        value={approvalDialog.notes}
                        onChange={(e) => setApprovalDialog(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={`Add notes for this ${approvalDialog.action}al...`}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseApprovalDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmitApproval}
                        variant="contained"
                        color={approvalDialog.action === 'approve' ? 'success' : 'error'}
                    >
                        {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
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

export default WidthChangeApprovals;
