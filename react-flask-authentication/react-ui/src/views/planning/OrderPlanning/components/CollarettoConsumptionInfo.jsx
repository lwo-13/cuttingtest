import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tooltip,
    IconButton,
    CircularProgress,
    Alert
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import axios from 'utils/axiosInstance';

const CollarettoConsumptionInfo = ({ style, fabricCode, plannedByBagno }) => {
    const [consumptionData, setConsumptionData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);

    const fetchConsumptionData = async () => {
        if (!style || !fabricCode) {
            setError('Style and fabric code are required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/orders/collaretto_consumption/${encodeURIComponent(style)}/${encodeURIComponent(fabricCode)}`);

            if (response.data.success) {
                setConsumptionData(response.data.data || {});
            } else {
                setError(response.data.msg || 'Failed to fetch consumption data');
            }
        } catch (err) {

            // More detailed error handling
            if (err.response) {
                // Server responded with error status
                setError(`Server error: ${err.response.status} - ${err.response.data?.msg || err.response.statusText}`);
            } else if (err.request) {
                // Request was made but no response received
                setError('Network error: Unable to reach server');
            } else {
                // Something else happened
                setError(`Request error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && style && fabricCode) {
            fetchConsumptionData();
        }
    }, [open, style, fabricCode]);

    const handleTooltipOpen = () => {
        setOpen(true);
    };

    const handleTooltipClose = () => {
        setOpen(false);
    };

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        return parseFloat(num).toFixed(2);
    };

    // Function to match collaretto pieces with specific bagno sizes
    const findMatchingSizes = (individualPieces, totalPieces, bagno, plannedQuantities) => {
        // Use planned quantities from API response first, fallback to current order's plannedByBagno
        const bagnoSizes = plannedQuantities || plannedByBagno?.[bagno];

        if (!bagnoSizes || Object.keys(bagnoSizes).length === 0) {
            return { individual: [], total: [], useTotal: false, bestMatches: [] };
        }
        const tolerance = Math.max(10, individualPieces * 0.02); // 2% tolerance or minimum 10 pieces

        // Helper function to find matches for given pieces
        const findMatches = (pieces) => {
            const matchingSizes = [];

            // Check individual sizes first
            Object.entries(bagnoSizes).forEach(([size, plannedQty]) => {
                if (Math.abs(plannedQty - pieces) <= tolerance) {
                    matchingSizes.push({
                        combination: [size],
                        total_qty: plannedQty,
                        difference: Math.abs(plannedQty - pieces),
                        breakdown: [{ size: size, qty: plannedQty }]
                    });
                }
            });

            // Check combinations of 2 sizes
            const sizeEntries = Object.entries(bagnoSizes);
            for (let i = 0; i < sizeEntries.length; i++) {
                for (let j = i + 1; j < sizeEntries.length; j++) {
                    const [size1, qty1] = sizeEntries[i];
                    const [size2, qty2] = sizeEntries[j];
                    const totalQty = qty1 + qty2;

                    if (Math.abs(totalQty - pieces) <= tolerance) {
                        matchingSizes.push({
                            combination: [size1, size2],
                            total_qty: totalQty,
                            difference: Math.abs(totalQty - pieces),
                            breakdown: [
                                { size: size1, qty: qty1 },
                                { size: size2, qty: qty2 }
                            ]
                        });
                    }
                }
            }

            // Check combination of all sizes
            if (sizeEntries.length >= 3) {
                const totalQty = sizeEntries.reduce((sum, [, qty]) => sum + qty, 0);
                if (Math.abs(totalQty - pieces) <= tolerance) {
                    matchingSizes.push({
                        combination: sizeEntries.map(([size]) => size),
                        total_qty: totalQty,
                        difference: Math.abs(totalQty - pieces),
                        breakdown: sizeEntries.map(([size, qty]) => ({ size, qty }))
                    });
                }
            }

            // Sort by difference (best matches first) and then by number of sizes (simpler combinations first)
            matchingSizes.sort((a, b) => {
                if (a.difference !== b.difference) return a.difference - b.difference;
                return a.combination.length - b.combination.length;
            });

            return matchingSizes;
        };

        // Try individual pieces first
        const individualMatches = findMatches(individualPieces);

        // If no individual matches and we have different total pieces, try total
        const totalMatches = (totalPieces && totalPieces !== individualPieces) ? findMatches(totalPieces) : [];

        // Decide which to use: prefer individual if it has matches, otherwise use total
        const useTotal = individualMatches.length === 0 && totalMatches.length > 0;

        return {
            individual: individualMatches || [],
            total: totalMatches || [],
            useTotal: useTotal,
            bestMatches: useTotal ? (totalMatches || []) : (individualMatches || [])
        };
    };

    const TooltipContent = () => {
        if (loading) {
            return (
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Loading...</Typography>
                </Box>
            );
        }

        if (error) {
            return (
                <Box sx={{ p: 2, maxWidth: 300 }}>
                    <Alert severity="error" size="small">{error}</Alert>
                </Box>
            );
        }

        if (!consumptionData || Object.keys(consumptionData).length === 0 || !consumptionData.records || consumptionData.records.length === 0) {
            return (
                <Box sx={{ p: 2, maxWidth: 300 }}>
                    <Typography variant="body2" color="text.secondary">No collaretto data found for {style} - {fabricCode}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Check console for debug information</Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ p: 2, maxWidth: 700, maxHeight: 600, overflow: 'auto' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1rem' }}>
                    Collaretto Information ({consumptionData.total_records} records)
                </Typography>

                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                    {/* Header */}
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1.5 }}>
                        <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {consumptionData.style} - {consumptionData.fabric_code}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                            {consumptionData.description}
                        </Typography>
                    </Box>

                    {/* Statistics */}
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 1 }}>Statistics</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Avg m/pc</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'primary.main' }}>
                                    {(consumptionData.statistics?.avg_consumption_per_piece || 0).toFixed(3)}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Avg Length</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'secondary.main' }}>
                                    {formatNumber(consumptionData.statistics?.avg_length || 0)} m
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Individual Records */}
                {consumptionData.records.map((record) => (
                    <Box key={record.collaretto_id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                        {/* Record Header */}
                        <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                                Order: {record.order_commessa} (ID: {record.collaretto_id})
                                {(() => {
                                    const bagno = record.bagno_info?.bagno;
                                    const individualPieces = record.pieces;
                                    const totalPieces = record.bagno_info?.pieces_to_match;
                                    const plannedQuantities = record.bagno_info?.planned_quantities;
                                    const matchResult = bagno ? findMatchingSizes(individualPieces, totalPieces, bagno, plannedQuantities) : { bestMatches: [] };
                                    return matchResult?.bestMatches?.length > 0 && (
                                        <Typography component="span" sx={{ fontSize: '0.8rem', ml: 2, opacity: 0.9 }}>
                                            Sizes: {matchResult.bestMatches[0]?.combination?.join(' + ') || 'Unknown'}
                                            {matchResult.useTotal && (
                                                <Typography component="span" sx={{ fontSize: '0.7rem', color: 'info.main' }}>
                                                    {' '}(total)
                                                </Typography>
                                            )}
                                        </Typography>
                                    );
                                })()}
                            </Typography>
                        </Box>

                        {/* Record Details */}
                        <Box sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                                <Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                        Pieces: {formatNumber(record.pieces)}
                                    </Typography>
                                    {record.bagno_info?.total_pieces_in_bagno && record.bagno_info.total_pieces_in_bagno !== record.pieces && (
                                        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'info.main' }}>
                                            Bagno Total: {formatNumber(record.bagno_info.total_pieces_in_bagno)}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Pcs Seam: {formatNumber(record.pcs_seam)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Width: {formatNumber(record.usable_width)} cm</Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Length: {formatNumber(record.gross_length)} m</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Consumption: {formatNumber(record.cons_planned)} m</Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'primary.main' }}>
                                        m/pc: {(record.consumption_per_piece || 0).toFixed(3)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Matching Sizes for this Bagno */}
                            {(() => {
                                const bagno = record.bagno_info?.bagno;
                                const individualPieces = record.pieces;
                                const totalPieces = record.bagno_info?.pieces_to_match;
                                const plannedQuantities = record.bagno_info?.planned_quantities;
                                const matchResult = bagno ? findMatchingSizes(individualPieces, totalPieces, bagno, plannedQuantities) : { bestMatches: [], useTotal: false };

                                if (matchResult?.bestMatches?.length > 0) {
                                    return (
                                        <Box>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 1 }}>
                                                Matching Sizes for Bagno {bagno}
                                                {matchResult.useTotal && (
                                                    <Typography component="span" sx={{ fontSize: '0.7rem', color: 'info.main', fontWeight: 'normal' }}>
                                                        {' '}(using bagno total {formatNumber(totalPieces)} pieces)
                                                    </Typography>
                                                )}:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {(matchResult.bestMatches || []).map((combination, index) => (
                                                    <Box key={index} sx={{
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        p: 1,
                                                        border: '1px solid',
                                                        borderColor: 'grey.300'
                                                    }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            {combination.combination.join(' + ')}
                                                            {matchResult.useTotal && (
                                                                <Typography component="span" sx={{ fontSize: '0.7rem', color: 'info.main', fontWeight: 'normal' }}>
                                                                    {' '}(total match)
                                                                </Typography>
                                                            )}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.primary' }}>
                                                            Total: {formatNumber(combination.total_qty)}
                                                            {combination.difference > 0 && (
                                                                <Typography component="span" sx={{ color: 'warning.main' }}>
                                                                    {' '}(Diff: {formatNumber(combination.difference)})
                                                                </Typography>
                                                            )}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                            {(combination?.breakdown || []).map((item, itemIndex) => (
                                                                <Typography key={itemIndex} variant="body2" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                                                    {item.size}: {formatNumber(item.qty)}
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>

                                            {/* Show alternative matches if using total but individual had no matches */}
                                            {matchResult.useTotal && matchResult.individual.length === 0 && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'info.dark' }}>
                                                        Individual {formatNumber(individualPieces)} pieces had no direct matches.
                                                        Using bagno total for matching.
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                } else {
                                    return (
                                        <Box sx={{ bgcolor: 'warning.light', borderRadius: 1, p: 1, mt: 1 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'warning.dark' }}>
                                                No matching sizes found for {formatNumber(individualPieces)} pieces in Bagno {bagno}
                                                {totalPieces && totalPieces !== individualPieces && (
                                                    <Typography component="span" sx={{ fontSize: '0.7rem', display: 'block' }}>
                                                        (Also tried bagno total: {formatNumber(totalPieces)} pieces)
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Box>
                                    );
                                }
                            })()}
                        </Box>
                    </Box>
                ))}
            </Box>
        );
    };

    // Don't show the component if style or fabricCode is missing
    if (!style || !fabricCode) {
        return null;
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                top: '60%',
                right: 10,
                transform: 'translateY(-50%)',
                zIndex: 1300,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                boxShadow: 3,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Tooltip
                title={<TooltipContent />}
                placement="left"
                arrow
                open={open}
                onClose={handleTooltipClose}
                onOpen={handleTooltipOpen}
                slotProps={{
                    tooltip: {
                        sx: {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 3,
                            maxWidth: 'none',
                            mr: 1
                        }
                    }
                }}
            >
                <IconButton
                    size="medium"
                    sx={{
                        color: 'info.main',
                        m: 0.5,
                        '&:hover': {
                            backgroundColor: 'info.light',
                            color: 'white'
                        }
                    }}
                >
                    <InfoIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default CollarettoConsumptionInfo;
