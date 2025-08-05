import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Chip,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import axios from 'utils/axiosInstance';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { useBadgeCount } from 'contexts/BadgeCountContext';

const SubcontractorWidthChangeApprovals = () => {
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
        fetchSubcontractorWidthChangeRequests();
    }, []);

    const fetchSubcontractorWidthChangeRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/width_change_requests/subcontractor/list');
            if (response.data.success) {
                setRequests(response.data.data);
            } else {
                console.error('Failed to fetch subcontractor width change requests:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching subcontractor width change requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const getStatusIcon = (request) => {
        switch (request.status) {
            case 'approved':
                return <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />;
            case 'rejected':
                return <CancelIcon sx={{ color: 'error.main', mr: 1 }} />;
            case 'waiting_for_marker':
                return <HourglassEmptyIcon sx={{ color: 'warning.main', mr: 1 }} />;
            case 'pending':
            default:
                return <PendingIcon sx={{ color: 'info.main', mr: 1 }} />;
        }
    };

    const getStatusColor = (request) => {
        switch (request.status) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'waiting_for_marker':
                return 'warning';
            case 'pending':
            default:
                return 'info';
        }
    };

    const getStatusText = (request) => {
        switch (request.status) {
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            case 'waiting_for_marker':
                return 'Waiting for Marker';
            case 'pending':
            default:
                return 'Pending';
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

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <MainCard title="Subcontractor Width Change Requests">
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <>
            <MainCard title="Subcontractor Width Change Requests">
                {requests.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        No subcontractor width change requests available
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
                                        {/* Subcontractor name chip */}
                                        <Chip
                                            label={request.requested_by}
                                            variant="outlined"
                                            size="small"
                                            sx={{ 
                                                mr: 2,
                                                backgroundColor: 'primary.light',
                                                color: 'primary.contrastText',
                                                fontWeight: 'medium'
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
                                            {request.current_width}cm → {request.requested_width}cm
                                        </Typography>

                                        {/* Show marker info for new_marker requests with pending status and available marker info */}
                                        {request.status === 'pending' && request.request_type === 'new_marker' && request.selected_marker_name && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                                                    New Marker: {request.selected_marker_name} - {request.requested_width}cm
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
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

                                                {/* Arrow - 1/3 width */}
                                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Typography variant="h4" sx={{ color: 'primary.main' }}>→</Typography>
                                                </Box>

                                                {/* New Marker - 1/3 width */}
                                                <Box sx={{ flex: 1, pl: 1 }}>
                                                    <Typography variant="body2"><strong>New Marker:</strong> {request.selected_marker_name}</Typography>
                                                    <Typography variant="body2" sx={{ mt: 1 }}><strong>New Width:</strong> {request.requested_width} cm</Typography>
                                                    {request.selected_marker_length && (
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>New Length:</strong> {request.selected_marker_length} cm</Typography>
                                                    )}
                                                </Box>
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

                                                    {/* Arrow - 1/3 width */}
                                                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Typography variant="h4" sx={{ color: 'primary.main' }}>→</Typography>
                                                    </Box>

                                                    {/* New Marker - 1/3 width */}
                                                    <Box sx={{ flex: 1, pl: 1 }}>
                                                        <Typography variant="body2"><strong>New Marker:</strong> {request.selected_marker_name}</Typography>
                                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>New Width:</strong> {request.requested_width} cm</Typography>
                                                        {request.selected_marker_length && (
                                                            <Typography variant="body2" sx={{ mt: 1 }}><strong>New Length:</strong> {request.selected_marker_length} cm</Typography>
                                                        )}
                                                    </Box>
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

                                        {/* Request Details */}
                                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2"><strong>Requested by:</strong> {request.requested_by}</Typography>
                                                    <Typography variant="body2" sx={{ mt: 1 }}><strong>Request Date:</strong> {formatDateTime(request.created_at)}</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    {request.approved_by && (
                                                        <>
                                                            <Typography variant="body2"><strong>Processed by:</strong> {request.approved_by}</Typography>
                                                            <Typography variant="body2" sx={{ mt: 1 }}><strong>Processed Date:</strong> {formatDateTime(request.approved_at)}</Typography>
                                                        </>
                                                    )}
                                                </Grid>
                                            </Grid>
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
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        padding: "12px 16px",
                        fontSize: "1.1rem",
                        lineHeight: "1.5",
                        borderRadius: "8px"
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SubcontractorWidthChangeApprovals;
