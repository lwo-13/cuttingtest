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

    const markerSummaryArray = Object.values(markerSummary).sort((a, b) =>
        a.markerName.localeCompare(b.markerName)
    );

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


        </Dialog>
    );
};

export default MattressSummaryDialog;
