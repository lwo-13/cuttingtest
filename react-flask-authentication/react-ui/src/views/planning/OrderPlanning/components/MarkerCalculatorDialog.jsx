import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    IconButton,
    Chip,
    Autocomplete,
    Snackbar,
    Alert
} from '@mui/material';
import { Add, Delete, Calculate } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import axios from 'utils/axiosInstance';

const MarkerCalculatorDialog = ({
    open,
    onClose,
    orderSizes,
    orderSizeNames,
    selectedStyle,
    tableId,
    tables,
    getTablePlannedQuantities,
    selectedOrder
}) => {
    // State for test markers per table - using object to store data for each table
    const [testMarkersByTable, setTestMarkersByTable] = useState({});

    // State for selected baseline (which table's output to use as input)
    const [selectedBaseline, setSelectedBaseline] = useState('original');

    // State to prevent duplicate loading requests
    const [isLoading, setIsLoading] = useState(false);

    // State for success snackbar
    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

    // Get current table's markers
    const testMarkers = testMarkersByTable[tableId] || [];

    // Calculate effective order quantities based on selected baseline
    const getEffectiveOrderQuantities = () => {
        if (selectedBaseline === 'original') {
            return orderSizes;
        }

        // Find the selected table
        const baselineTable = tables.find(table => table.id === selectedBaseline);
        if (!baselineTable) {
            return orderSizes;
        }

        // Get calculated quantities from the selected table
        const baselineTableTotals = getTablePlannedQuantities(baselineTable);

        // Convert to the same format as orderSizes
        return orderSizeNames.map(sizeName => ({
            size: sizeName,
            qty: baselineTableTotals[sizeName] || 0
        }));
    };

    const effectiveOrderSizes = getEffectiveOrderQuantities();

    // Get current table info
    const currentTable = tables.find(table => table.id === tableId);
    const currentFabricType = currentTable?.fabricType || 'Unknown';

    // Create baseline options using fabric type for identification
    const baselineOptions = [
        { value: 'original', label: 'Original Order Quantities' },
        ...tables
            .filter(table => table.id !== tableId) // Exclude current table
            .map((table) => {
                const fabricType = table.fabricType || 'Unknown';
                return {
                    value: table.id,
                    label: `${fabricType} Output`
                };
            })
    ];

    // Helper to update markers for current table
    const setTestMarkers = (markersOrUpdater) => {
        setTestMarkersByTable(prev => ({
            ...prev,
            [tableId]: typeof markersOrUpdater === 'function'
                ? markersOrUpdater(prev[tableId] || [])
                : markersOrUpdater
        }));
    };

    // Generate marker name based on style and quantities
    const generateMarkerName = (quantities, index) => {
        const nonZeroQuantities = [];
        orderSizeNames.forEach(sizeName => {
            const qty = parseInt(quantities[sizeName]) || 0;
            if (qty > 0) {
                nonZeroQuantities.push(`${qty}${sizeName}`);
            }
        });

        if (nonZeroQuantities.length > 0) {
            const quantitiesStr = nonZeroQuantities.join('');
            return `${selectedStyle}-${quantitiesStr} ${index}`;
        } else {
            return `${selectedStyle}-Marker ${index}`;
        }
    };

    const addNewMarker = () => {
        const newMarker = {
            id: uuidv4(),
            markerName: '',
            quantities: orderSizeNames.reduce((acc, sizeName) => {
                acc[sizeName] = 0;
                return acc;
            }, {}),
            layers: 1
        };
        setTestMarkers(prev => [...prev, newMarker]);
    };

    const removeMarker = (markerId) => {
        setTestMarkers(prev => prev.filter(marker => marker.id !== markerId));
    };

    const clearAllMarkers = () => {
        setTestMarkers([]);
        // Add one empty marker after clearing
        setTimeout(() => {
            addNewMarker();
        }, 0);
    };

    // Check if marker name is duplicate
    const isMarkerNameDuplicate = (markerId, markerName) => {
        if (!markerName || markerName.trim() === '') return false;

        return testMarkers.some(marker =>
            marker.id !== markerId &&
            marker.markerName &&
            marker.markerName.trim().toLowerCase() === markerName.trim().toLowerCase()
        );
    };

    const updateMarkerField = (markerId, field, value) => {
        setTestMarkers(prev =>
            prev.map(marker =>
                marker.id === markerId
                    ? { ...marker, [field]: value }
                    : marker
            )
        );
    };

    const updateQuantity = (markerId, sizeName, quantity) => {
        const numQuantity = Math.max(0, parseInt(quantity) || 0);
        setTestMarkers(prev =>
            prev.map(marker =>
                marker.id === markerId
                    ? {
                        ...marker,
                        quantities: {
                            ...marker.quantities,
                            [sizeName]: numQuantity
                        }
                    }
                    : marker
            )
        );
    };

    // Load saved data when dialog opens
    useEffect(() => {
        if (open && tableId && selectedOrder?.id && !isLoading) {
            loadCalculatorData();
        }
    }, [open, tableId, selectedOrder?.id]); // Use selectedOrder.id instead of the whole object

    // Load calculator data from API
    const loadCalculatorData = async () => {
        if (isLoading) return; // Prevent duplicate requests

        setIsLoading(true);
        try {
            const response = await axios.get(`/marker_calculator/load/${tableId}/${selectedOrder.id}`);

            if (response.data.success && response.data.data) {
                const data = response.data.data;

                // Set baseline
                setSelectedBaseline(data.selected_baseline);

                // Convert markers to the format expected by the component
                const loadedMarkers = data.markers.map(marker => ({
                    id: uuidv4(), // Generate new client-side ID
                    markerName: marker.marker_name,
                    layers: marker.layers,
                    quantities: marker.quantities
                }));

                // Set markers for this table
                setTestMarkersByTable(prev => ({
                    ...prev,
                    [tableId]: loadedMarkers
                }));
            } else {
                // No saved data, initialize with one empty marker
                if (testMarkers.length === 0) {
                    addNewMarker();
                }
            }
        } catch (error) {
            console.error('Error loading calculator data:', error);
            // Initialize with one empty marker on error
            if (testMarkers.length === 0) {
                addNewMarker();
            }
        }
    };

    // Check if there are any duplicate marker names
    const hasDuplicateMarkerNames = () => {
        const markerNames = testMarkers
            .map(marker => marker.markerName?.trim().toLowerCase())
            .filter(name => name && name !== '');

        return markerNames.length !== new Set(markerNames).size;
    };

    // Save calculator data to API
    const saveCalculatorData = async () => {
        try {
            // Check for duplicate marker names before saving
            if (hasDuplicateMarkerNames()) {
                alert('Cannot save: Duplicate marker names found. Please ensure all marker names are unique.');
                return false;
            }

            const markersData = testMarkers.map(marker => ({
                marker_name: marker.markerName || '',
                layers: marker.layers || 1,
                quantities: marker.quantities || {}
            }));

            const payload = {
                table_id: tableId,
                order_commessa: selectedOrder.id,  // Use selectedOrder.id instead of selectedOrder.commessa
                selected_baseline: selectedBaseline,
                style: selectedStyle,  // Add style for marker naming
                markers: markersData
            };

            const response = await axios.post('/marker_calculator/save', payload);

            if (response.data.success) {
                setShowSuccessSnackbar(true);
                return true;
            } else {
                console.error('Failed to save calculator data:', response.data.message);
                alert(`Failed to save: ${response.data.message}`);
                return false;
            }
        } catch (error) {
            console.error('Error saving calculator data:', error);

            // Show detailed error information
            if (error.response && error.response.data) {
                console.error('Server response:', error.response.data);
                alert(`Save failed: ${error.response.data.message || 'Unknown server error'}`);
            } else {
                alert('Save failed: Network or server error');
            }
            return false;
        }
    };

    // Handle dialog close without auto-save
    const handleClose = () => {
        onClose();
    };

    // Calculate totals using useMemo to ensure recalculation when dependencies change
    const totals = useMemo(() => {
        const calculatedTotals = {
            bySize: {},
            totalPieces: 0,
            totalPiecesWithLayers: 0
        };

        // Initialize size totals
        orderSizeNames.forEach(sizeName => {
            calculatedTotals.bySize[sizeName] = 0;
        });

        // Sum up quantities from all markers
        testMarkers.forEach(marker => {
            const markerLayers = parseInt(marker.layers) || 1;
            orderSizeNames.forEach(sizeName => {
                const qty = parseInt(marker.quantities[sizeName]) || 0;
                const qtyWithLayers = qty * markerLayers;
                calculatedTotals.bySize[sizeName] += qtyWithLayers;
                calculatedTotals.totalPiecesWithLayers += qtyWithLayers;
            });
        });

        return calculatedTotals;
    }, [testMarkers, orderSizeNames]);

    // Get order quantities for comparison (using effective order sizes)
    const getOrderQuantity = (sizeName) => {
        const sizeData = effectiveOrderSizes.find(size => size.size === sizeName);
        return sizeData ? sizeData.qty : 0;
    };

    // Calculate coverage percentage
    const getCoveragePercentage = (sizeName) => {
        const orderQty = getOrderQuantity(sizeName);
        const calculatedQty = totals.bySize[sizeName];
        if (orderQty === 0) return 0;
        return Math.round((calculatedQty / orderQty) * 100);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '80vh',
                    maxHeight: '90vh',
                    width: '95vw',
                    maxWidth: '1400px'
                }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <Calculate />
                    Marker Calculator - Test Combinations {currentFabricType && `(${currentFabricType})`}
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box mb={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Typography variant="h6" gutterBottom>
                        Style: {selectedStyle}
                    </Typography>

                    {/* Baseline Selector */}
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                            Calculate coverage against:
                        </Typography>
                        <Autocomplete
                            options={baselineOptions}
                            getOptionLabel={(option) => option.label}
                            value={baselineOptions.find(opt => opt.value === selectedBaseline) || baselineOptions[0]}
                            onChange={(event, newValue) => {
                                setSelectedBaseline(newValue?.value || 'original');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                            sx={{ width: 300 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {selectedBaseline === 'original'
                                ? "Using original order quantities"
                                : `Using output from ${baselineOptions.find(opt => opt.value === selectedBaseline)?.label}`
                            }
                        </Typography>
                    </Box>
                </Box>

                {/* Test Markers Table */}
                <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            Test Markers
                        </Typography>
                        <Box display="flex" gap={1}>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={addNewMarker}
                                size="small"
                            >
                                Add Marker
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={clearAllMarkers}
                                size="small"
                            >
                                Clear All
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                        <Table>
                            {/* Table Header */}
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" sx={{ minWidth: '200px' }}>Marker Name</TableCell>

                                    {/* Dynamic Sizes */}
                                    {effectiveOrderSizes.length > 0 &&
                                        effectiveOrderSizes.map((size) => (
                                            <TableCell align="center" key={size.size}>
                                                {size.size}
                                            </TableCell>
                                        ))
                                    }

                                    <TableCell align="center">Layers</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>

                            {/* Table Body */}
                            <TableBody>
                                {testMarkers.map((marker, index) => (
                                    <TableRow key={marker.id}>
                                        {/* Marker Name */}
                                        <TableCell sx={{ padding: '4px', minWidth: '180px', maxWidth: '200px', textAlign: 'center' }}>
                                            <TextField
                                                variant="outlined"
                                                value={marker.markerName || generateMarkerName(marker.quantities, index + 1)}
                                                onChange={(e) => updateMarkerField(marker.id, "markerName", e.target.value)}
                                                placeholder={generateMarkerName(marker.quantities, index + 1)}
                                                error={isMarkerNameDuplicate(marker.id, marker.markerName)}
                                                helperText={isMarkerNameDuplicate(marker.id, marker.markerName) ? "Duplicate name" : ""}
                                                sx={{
                                                    width: '100%',
                                                    "& input": { fontWeight: 'normal', textAlign: 'center' },
                                                    "& .MuiFormHelperText-root": {
                                                        fontSize: '0.7rem',
                                                        textAlign: 'center',
                                                        margin: '2px 0 0 0'
                                                    }
                                                }}
                                                size="small"
                                            />
                                        </TableCell>

                                        {/* Size Quantities */}
                                        {effectiveOrderSizes.map((size) => (
                                            <TableCell
                                                key={size.size}
                                                sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}
                                            >
                                                <TextField
                                                    type="number"
                                                    value={marker.quantities[size.size] || ''}
                                                    onChange={(e) => updateQuantity(marker.id, size.size, e.target.value)}
                                                    inputProps={{ min: 0 }}
                                                    sx={{
                                                        width: '100%',
                                                        "& input": { textAlign: 'center', fontWeight: 'normal' }
                                                    }}
                                                    size="small"
                                                />
                                            </TableCell>
                                        ))}

                                        {/* Layers */}
                                        <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
                                            <TextField
                                                type="number"
                                                value={marker.layers || 1}
                                                onChange={(e) => {
                                                    const value = Math.max(1, parseInt(e.target.value) || 1);
                                                    updateMarkerField(marker.id, "layers", value);
                                                }}
                                                inputProps={{ min: 1 }}
                                                sx={{
                                                    width: '100%',
                                                    "& input": { textAlign: 'center', fontWeight: "normal" }
                                                }}
                                                size="small"
                                            />
                                        </TableCell>

                                        {/* Delete Button */}
                                        <TableCell>
                                            <IconButton
                                                onClick={() => removeMarker(marker.id)}
                                                color="error"
                                                disabled={testMarkers.length === 1}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Results Section */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Calculation Results
                    </Typography>

                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center"><strong>Size</strong></TableCell>
                                    <TableCell align="center">
                                        <strong>
                                            {selectedBaseline === 'original'
                                                ? "Order Qty"
                                                : `${baselineOptions.find(opt => opt.value === selectedBaseline)?.label || 'Baseline'}`
                                            }
                                        </strong>
                                    </TableCell>
                                    <TableCell align="center"><strong>Calculated Total</strong></TableCell>
                                    <TableCell align="center"><strong>Coverage</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orderSizeNames.map((sizeName) => {
                                    const orderQty = getOrderQuantity(sizeName);
                                    const calculatedQty = totals.bySize[sizeName];
                                    const coverage = getCoveragePercentage(sizeName);

                                    return (
                                        <TableRow key={sizeName}>
                                            <TableCell align="center">{sizeName}</TableCell>
                                            <TableCell align="center">{orderQty}</TableCell>
                                            <TableCell align="center">{calculatedQty}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${coverage}%`}
                                                    color={
                                                        coverage >= 100 ? 'success' :
                                                        coverage >= 80 ? 'warning' : 'error'
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Summary */}
                    <Box display="flex" gap={3} flexWrap="wrap">
                        <Typography variant="body1">
                            <strong>Total Pieces:</strong> {totals.totalPiecesWithLayers}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={saveCalculatorData}
                    variant="contained"
                    color="primary"
                    disabled={hasDuplicateMarkerNames()}
                    title={hasDuplicateMarkerNames() ? "Cannot save: Duplicate marker names found" : "Save calculator data"}
                >
                    Save
                </Button>
                <Button onClick={handleClose} variant="outlined">
                    Close Without Saving
                </Button>
            </DialogActions>

            {/* Success Snackbar */}
            <Snackbar
                open={showSuccessSnackbar}
                autoHideDuration={3000}
                onClose={() => setShowSuccessSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowSuccessSnackbar(false)}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    Calculator data saved successfully!
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default MarkerCalculatorDialog;
