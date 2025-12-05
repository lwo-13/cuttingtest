import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Chip,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import { Email } from '@mui/icons-material';
import axios from 'utils/axiosInstance';

const MattressSummaryDialog = ({ open, onClose, table, fabricType, orderNumber, style, productionCenter, cuttingRoom, destination }) => {
    if (!table || !table.rows) {
        return null;
    }

    // Filter out empty rows (rows without marker names)
    const validRows = table.rows.filter(row => row.markerName && row.markerName.trim() !== '');

    // Calculate total layers
    const totalLayers = validRows.reduce((sum, row) => {
        const layers = parseFloat(row.layers) || 0;
        return sum + layers;
    }, 0);

    // Create marker summary (group by marker name)
    const markerSummary = validRows.reduce((acc, row) => {
        const markerName = row.markerName;
        const layers = parseFloat(row.layers) || 0;
        const width = parseFloat(row.width) || 0;

        if (!acc[markerName]) {
            acc[markerName] = {
                markerName,
                width,
                totalLayers: 0,
                occurrences: 0
            };
        }

        acc[markerName].totalLayers += layers;
        acc[markerName].occurrences += 1;
        return acc;
    }, {});

    const markerSummaryArray = Object.values(markerSummary).sort((a, b) =>
        a.markerName.localeCompare(b.markerName)
    );

    // Function to handle email composition
    const handleEmailSummary = async () => {
        // Prepare email recipients
        const recipients = [];

        // Fetch subcontractor email from configurable email settings
        if (cuttingRoom) {
            try {
                const response = await axios.get(`/config/email-settings/subcontractor/${encodeURIComponent(cuttingRoom)}`);
                if (response.data.success && response.data.email) {
                    recipients.push(response.data.email);
                }
            } catch (error) {
                console.error('Error fetching cutting room email:', error);
                // Continue without the cutting room email
            }
        }

        // Fetch main recipients from configurable email settings
        try {
            const mainResponse = await axios.get('/config/email-settings/main-recipients');
            if (mainResponse.data.success && mainResponse.data.emails) {
                mainResponse.data.emails.forEach(email => {
                    if (email && !recipients.includes(email)) {
                        recipients.push(email);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching main email recipients:', error);
            // Continue without main recipients if fetch fails
        }

        // Join recipients with semicolon (correct mailto format)
        const toField = recipients.join(';');

        // Fetch ALL markers for the order filtered by production center, cutting room, and destination
        let body = '';
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (productionCenter) params.append('production_center', productionCenter);
            if (cuttingRoom) params.append('cutting_room', cuttingRoom);
            if (destination) params.append('destination', destination);

            const response = await axios.get(`/mattress/marker_summary/${orderNumber}?${params.toString()}`);
            if (response.data.success && response.data.data.length > 0) {
                // Use API data for email body - include marker name, width (cm), length (m), and times used
                response.data.data.forEach((marker) => {
                    const width = marker.marker_width ? Math.round(marker.marker_width) : '-';
                    const length = marker.marker_length ? marker.marker_length.toFixed(2) : '-';
                    body += `${marker.marker_name} (${width}cm x ${length}m) - x${marker.times_used}\n`;
                });
            } else {
                // Fallback to table data if API fails
                markerSummaryArray.forEach((marker) => {
                    const width = marker.width ? Math.round(marker.width) : '-';
                    body += `${marker.markerName} (${width}cm) - x${marker.occurrences}\n`;
                });
            }
        } catch (error) {
            console.error('Error fetching marker summary for email:', error);
            // Fallback to table data if API fails
            markerSummaryArray.forEach((marker) => {
                const width = marker.width ? Math.round(marker.width) : '-';
                body += `${marker.markerName} (${width}cm) - x${marker.occurrences}\n`;
            });
        }

        // Add the required line at the end of the email body
        body += '\nПоръчката е изготвена в апликацията.';

        // Prepare email subject - order number and item style
        const subject = style ? `${orderNumber} - ${style}` : orderNumber || 'Marker Usage Summary';

        // Create mailto link with recipients
        const mailtoLink = `mailto:${toField}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Open email client
        window.location.href = mailtoLink;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Typography variant="h4" component="div">
                    Marker Summary
                </Typography>
            </DialogTitle>

            <DialogContent>
                {validRows.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No markers found in this table
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Marker Summary Table */}
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center"><strong>Marker Name</strong></TableCell>
                                        <TableCell align="center"><strong>Width (cm)</strong></TableCell>
                                        <TableCell align="center"><strong>Times Used</strong></TableCell>
                                        <TableCell align="center"><strong>Total Layers</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {markerSummaryArray.map((marker, index) => (
                                        <TableRow key={index}>
                                            <TableCell align="center" sx={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {marker.markerName}
                                            </TableCell>
                                            <TableCell align="center">
                                                {marker.width ? Math.round(marker.width) : '-'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={marker.occurrences}
                                                    size="small"
                                                    color="secondary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={Math.round(marker.totalLayers)}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Total Summary */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 3,
                            p: 2,
                            backgroundColor: 'grey.50',
                            borderRadius: 1
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Total Mattresses:
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#e3f2fd',
                                        color: 'info.main',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        minWidth: 70,
                                        fontWeight: 'bold',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {validRows.length}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Unique Markers:
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#f3e5f5',
                                        color: 'secondary.main',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        minWidth: 70,
                                        fontWeight: 'bold',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {markerSummaryArray.length}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Total Layers:
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#e8f5e8',
                                        color: 'success.main',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        minWidth: 70,
                                        fontWeight: 'bold',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {Math.round(totalLayers)}
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
                {/* Email Button on the left */}
                <Tooltip title="Send summary via email">
                    <IconButton
                        onClick={handleEmailSummary}
                        disabled={validRows.length === 0}
                        sx={{
                            color: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'white'
                            },
                            '&:disabled': {
                                color: 'grey.400'
                            }
                        }}
                    >
                        <Email />
                    </IconButton>
                </Tooltip>

                {/* Close Button on the right */}
                <Button onClick={onClose} variant="contained" color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MattressSummaryDialog;
