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
import { useTranslation } from 'react-i18next';

const CollarettoConsumptionInfo = ({ style, fabricCode }) => {
    const { t } = useTranslation();
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

    const handleTooltipToggle = () => {
        setOpen(!open);
    };

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        return parseFloat(num).toFixed(2);
    };

    // Function to get applicable sizes from collaretto record
    const getApplicableSizes = (record) => {
        // Use the stored applicable_sizes from the collaretto record
        const applicableSizes = record.applicable_sizes;

        if (!applicableSizes) {
            // If no applicable_sizes stored, it means ALL sizes
            return {
                sizes: ['ALL'],
                displayText: 'ALL',
                isAll: true
            };
        }

        // Parse the dash-separated sizes (e.g., "S-M-L" -> ["S", "M", "L"])
        const sizesArray = applicableSizes.split('-').filter(size => size.trim());

        return {
            sizes: sizesArray,
            displayText: sizesArray.join(' + '),
            isAll: false
        };
    };

    // Function to get grain direction from item_type
    const getGrainDirection = (itemType) => {
        switch (itemType) {
            case 'CA':
                return t('orderPlanning.collarettoAlongGrain', 'Along the Grain');
            case 'CW':
                return t('orderPlanning.collarettoWeft', 'Weft');
            case 'CB':
                return t('orderPlanning.collarettoBias', 'Bias');
            default:
                return t('common.unknown', 'Unknown');
        }
    };

    // Function to format numbers with dynamic decimal places (removes trailing zeros)
    const formatNumberDynamic = (value) => {
        if (value === null || value === undefined || isNaN(value)) return '0';
        return parseFloat(value).toString();
    };

    // Function to group records by collaretto type (Gross Length + Pcs Seam + Collaretto Width)
    const groupRecordsByType = (records) => {
        const groups = {};

        records.forEach(record => {
            // For along the grain (CA), don't include pcs_seam in grouping
            const typeKey = record.item_type === 'CA'
                ? `${record.gross_length}-${record.collarettoWidth}`
                : `${record.gross_length}-${record.pcs_seam}-${record.collarettoWidth}`;

            if (!groups[typeKey]) {
                groups[typeKey] = {
                    item_type: record.item_type,
                    pcs_seam: record.pcs_seam,
                    usable_width: record.usable_width, // Keep for display but not grouping
                    gross_length: record.gross_length,
                    collarettoWidth: record.collarettoWidth,
                    records: [],
                    allApplicableSizes: new Set(),
                    totalConsumption: 0,
                    totalPieces: 0
                };
            }

            groups[typeKey].records.push(record);

            // Add to totals for this specific combination
            groups[typeKey].totalConsumption += (record.cons_planned || 0);
            groups[typeKey].totalPieces += (record.pieces || 0);

            // Collect all applicable sizes for this type
            const sizeInfo = getApplicableSizes(record);
            if (sizeInfo.isAll) {
                groups[typeKey].allApplicableSizes.add('ALL');
            } else {
                sizeInfo.sizes.forEach(size => groups[typeKey].allApplicableSizes.add(size));
            }
        });

        // Calculate average consumption for each group
        Object.keys(groups).forEach(typeKey => {
            const group = groups[typeKey];
            group.avgConsumption = group.totalPieces > 0
                ? group.totalConsumption / group.totalPieces
                : 0;
        });

        return groups;
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
                    <Typography variant="body2" color="text.secondary">
                        {t('orderPlanning.noCollarettoData', 'No collaretto data found for {{style}} - {{fabricCode}}', { style, fabricCode })}
                    </Typography>
                </Box>
            );
        }

        // Group records by grain direction (item_type) first
        const recordsByGrainDirection = {};
        if (consumptionData.records) {
            consumptionData.records.forEach(record => {
                const grainDirection = record.item_type || 'Unknown';
                if (!recordsByGrainDirection[grainDirection]) {
                    recordsByGrainDirection[grainDirection] = [];
                }
                recordsByGrainDirection[grainDirection].push(record);
            });
        }

        return (
            <Box sx={{ p: 3, maxWidth: 700, maxHeight: 600, overflow: 'auto' }}>
                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'bold', fontSize: '1rem' }}>
                    {t('orderPlanning.collarettoInfo', 'Collaretto Information')}
                </Typography>

                {/* Show separate section for each grain direction */}
                {Object.entries(recordsByGrainDirection).map(([grainDirection, records]) => (
                    <Box key={grainDirection} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
                        {/* Header for this grain direction */}
                        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1.5 }}>
                            <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>
                                {consumptionData.fabric_code} ({consumptionData.fabric_type}) - {getGrainDirection(grainDirection)}
                            </Typography>
                        </Box>

                        {/* Spacing between header and collaretto lines */}
                        <Box sx={{ p: 1.5 }}>
                            {/* Grouped Collaretto Types for this grain direction */}
                            {(() => {
                            const groupedTypes = groupRecordsByType(records);

                            return Object.entries(groupedTypes).map(([typeKey, typeData]) => {
                                const hasAllSizes = typeData.allApplicableSizes.has('ALL');
                                const specificSizes = Array.from(typeData.allApplicableSizes).filter(size => size !== 'ALL').sort();
                                const displaySizes = hasAllSizes ? 'ALL' : specificSizes.join(' + ');

                                return (
                                    <Box key={typeKey} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 1.5 }}>
                                        {/* Collaretto Type Header */}
                                        <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', color: 'white' }}>
                                                {formatNumberDynamic(typeData.gross_length)} m{typeData.item_type !== 'CA' ? ` • ${formatNumberDynamic(typeData.pcs_seam)} seam` : ''} • {typeData.collarettoWidth > 0 ? Math.round(typeData.collarettoWidth) + ' mm' : 'N/A'}
                                                <Typography component="span" sx={{ fontSize: '0.8rem', ml: 2, opacity: 0.9 }}>
                                                    ({typeData.records.length} {t('common.records', typeData.records.length === 1 ? 'record' : 'records')})
                                                </Typography>
                                            </Typography>
                                        </Box>

                                        {/* Type Details */}
                                        <Box sx={{ p: 1.5 }}>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                        {t('table.usableWidth', 'Usable Width')}: {Math.round(typeData.usable_width)} {t('common.cm', 'cm')}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                        {t('table.grossLength', 'Gross Length')}: {formatNumberDynamic(typeData.gross_length)} {t('common.m', 'm')}
                                                    </Typography>
                                                    {/* Average Consumption for this specific combination */}
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'primary.main' }}>
                                                        {t('orderPlanning.avgConsumption', 'Avg Consumption')}: {typeData.avgConsumption.toFixed(3).replace(/\.?0+$/, '')} {t('common.m', 'm')}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    {typeData.item_type !== 'CA' && (
                                                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                            {t('table.pcsSeamToSeam', 'Pcs Seam')}: {formatNumberDynamic(typeData.pcs_seam)}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                        {t('table.collarettoWidth', 'Collaretto Width')}: {typeData.collarettoWidth > 0 ? Math.round(typeData.collarettoWidth) + ' ' + t('common.mm', 'mm') : t('table.na', 'N/A')}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Applicable Sizes */}
                                            <Box sx={{ mt: 1 }}>
                                                <Box sx={{
                                                    bgcolor: hasAllSizes ? 'info.light' : 'success.light',
                                                    borderRadius: 1,
                                                    p: 1,
                                                    border: '1px solid',
                                                    borderColor: hasAllSizes ? 'info.main' : 'success.main'
                                                }}>
                                                    <Typography variant="body2" sx={{
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        color: 'white'
                                                    }}>
                                                        {displaySizes}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{
                                                        fontSize: '0.7rem',
                                                        color: 'white',
                                                        mt: 0.5,
                                                        opacity: 0.9
                                                    }}>
                                                        {hasAllSizes
                                                            ? t('orderPlanning.collarettoAppliesToAllSizes', 'This collaretto type applies to all sizes')
                                                            : t('orderPlanning.collarettoAppliesToSpecificSizes', 'This collaretto type applies to specific sizes: {{sizes}}', { sizes: specificSizes.join(', ') })
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            });
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
                disableHoverListener
                disableFocusListener
                disableTouchListener
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
                    onClick={handleTooltipToggle}
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
