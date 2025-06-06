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
    Divider
} from '@mui/material';

const MattressSummaryDialog = ({ open, onClose, table, fabricType }) => {
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

    const markerSummaryArray = Object.values(markerSummary);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { minHeight: '400px' }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Typography variant="h6" component="div">
                    Mattress Table Summary
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                    {fabricType || 'Unknown Fabric Type'}
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
                                        <TableCell align="center"><strong>Used In Rows</strong></TableCell>
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
                                                {marker.width ? marker.width.toFixed(1) : '-'}
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
                                                    variant="filled"
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
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Total Mattresses: <Chip label={validRows.length} color="info" size="small" />
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Unique Markers: <Chip label={markerSummaryArray.length} color="warning" size="small" />
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Total Layers: <Chip label={Math.round(totalLayers)} color="success" size="small" />
                            </Typography>
                        </Box>
                    </>
                )}
            </DialogContent>


        </Dialog>
    );
};

export default MattressSummaryDialog;
