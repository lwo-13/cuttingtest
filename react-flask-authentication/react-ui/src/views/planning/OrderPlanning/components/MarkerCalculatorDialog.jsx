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
    Alert,
    Tabs,
    Tab,
    FormControl,
    Select,
    MenuItem
} from '@mui/material';
import { Add, Delete, Calculate, Close, ViewColumn } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import axios from 'utils/axiosInstance';
import { useTranslation } from 'react-i18next';

const MarkerCalculatorDialog = ({
    open,
    onClose,
    orderSizes,
    orderSizeNames,
    selectedStyle,
    tables,
    getTablePlannedQuantities,
    selectedOrder,
    selectedCombinationId
}) => {
    const { t } = useTranslation();

    // State for calculator tabs - iterative numbering system
    const [calculatorTabs, setCalculatorTabs] = useState([
        { value: 'calc_01', label: '01' }
    ]);

    // State for current material type tab
    const [currentMaterialType, setCurrentMaterialType] = useState('calc_01');

    // Add new calculator tab
    const addNewTab = () => {
        const nextNumber = calculatorTabs.length + 1;
        const paddedNumber = nextNumber.toString().padStart(2, '0');
        const newTab = {
            value: `calc_${paddedNumber}`,
            label: paddedNumber
        };

        setCalculatorTabs(prev => [...prev, newTab]);
        setCurrentMaterialType(newTab.value); // Switch to the new tab
    };

    // Remove calculator tab with confirmation
    const removeTab = async (tabValue) => {
        if (calculatorTabs.length <= 1) return; // Don't allow removing the last tab

        // Check if tab has data
        const tabMarkers = testMarkersByMaterial[tabValue];
        const hasData = tabMarkers && tabMarkers.length > 0 &&
                       tabMarkers.some(marker =>
                           marker.markerName ||
                           marker.width ||
                           marker.layers ||
                           Object.values(marker.quantities || {}).some(qty => qty && qty !== '0')
                       );

        // Show confirmation if tab has data
        if (hasData) {
            const tabNumber = tabValue.replace('calc_', '');
            const confirmed = window.confirm(
                t('calculator.confirmDeleteTab', { tabNumber })
            );
            if (!confirmed) return;
        }

        try {
            // Extract tab number from tabValue (e.g., 'calc_01' -> '01')
            const tabNumber = tabValue.replace('calc_', '');

            // Delete from backend if it exists
            const response = await axios.delete(`/marker_calculator/delete/${selectedOrder.id}/${selectedCombinationId}/${tabNumber}`);

            if (response.data.success) {
                console.log(`✅ Tab ${tabNumber} deleted from database`);
            } else {
                console.warn(`⚠️ Tab ${tabNumber} not found in database (may not have been saved yet)`);
            }
        } catch (error) {
            // If the tab doesn't exist in the database, that's okay (it might not have been saved yet)
            if (error.response?.status === 404) {
                console.log(`Tab ${tabValue} not found in database - probably wasn't saved yet`);
            } else {
                console.error('Error deleting tab from database:', error);
                // Don't prevent frontend deletion even if backend delete fails
            }
        }

        // Remove from frontend regardless of backend result
        setCalculatorTabs(prev => prev.filter(tab => tab.value !== tabValue));

        // If we're removing the current tab, switch to the first available tab
        if (currentMaterialType === tabValue) {
            const remainingTabs = calculatorTabs.filter(tab => tab.value !== tabValue);
            if (remainingTabs.length > 0) {
                setCurrentMaterialType(remainingTabs[0].value);
            }
        }

        // Remove data for the deleted tab
        setTestMarkersByMaterial(prev => {
            const newData = { ...prev };
            delete newData[tabValue];
            return newData;
        });

        // Remove baseline for the deleted tab
        setBaselineByTab(prev => {
            const newBaselines = { ...prev };
            delete newBaselines[tabValue];
            return newBaselines;
        });
    };

    // State for test markers per material type - using object to store data for each material type
    const [testMarkersByMaterial, setTestMarkersByMaterial] = useState({});

    // State for selected baseline (tab-specific)
    const [baselineByTab, setBaselineByTab] = useState({});

    // Get current tab's baseline
    const getCurrentBaseline = () => {
        return baselineByTab[currentMaterialType] || 'original';
    };

    // Set current tab's baseline
    const setCurrentBaseline = (baseline) => {
        setBaselineByTab(prev => ({
            ...prev,
            [currentMaterialType]: baseline
        }));
    };

    // State to prevent duplicate loading requests
    const [isLoading, setIsLoading] = useState(false);

    // State for snackbars
    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State for split view mode
    const [splitViewMode, setSplitViewMode] = useState(false);

    // State for right table markers (split view only) - organized by tab like left table
    const [rightTableMarkers, setRightTableMarkers] = useState([]);
    const [rightTableMarkersByMaterial, setRightTableMarkersByMaterial] = useState({});

    // Get current material type's markers
    const testMarkers = testMarkersByMaterial[currentMaterialType] || [];
    const currentRightTableMarkers = rightTableMarkersByMaterial[currentMaterialType] || [];

    // Sync right table markers with current tab
    useEffect(() => {
        setRightTableMarkers(currentRightTableMarkers);
    }, [currentMaterialType, currentRightTableMarkers]);

    // Ensure current tab has at least one empty marker
    useEffect(() => {
        if (testMarkers.length === 0) {
            addNewMarker();
        }
    }, [currentMaterialType]);

    // Ensure right table has at least one empty marker when split view is enabled
    useEffect(() => {
        if (splitViewMode && rightTableMarkers.length === 0) {
            addNewRightMarker();
        }
    }, [splitViewMode]);

    // Calculate totals for a specific calculator tab
    const calculateTabTotals = (tabValue) => {
        const tabMarkers = testMarkersByMaterial[tabValue] || [];
        const totals = {};

        // Initialize size totals
        orderSizeNames.forEach(sizeName => {
            totals[sizeName] = 0;
        });

        // Sum up quantities from all markers in the tab
        tabMarkers.forEach(marker => {
            const markerLayers = parseInt(marker.layers) || 1;
            orderSizeNames.forEach(sizeName => {
                const qty = parseInt(marker.quantities[sizeName]) || 0;
                const qtyWithLayers = qty * markerLayers;
                totals[sizeName] += qtyWithLayers;
            });
        });

        return totals;
    };

    // Calculate effective order quantities based on current tab's baseline
    const getEffectiveOrderQuantities = () => {
        const currentBaseline = getCurrentBaseline();

        if (currentBaseline === 'original') {
            return orderSizes;
        } else if (currentBaseline.startsWith('calc_tab_')) {
            // Use another calculator tab's totals
            const tabValue = currentBaseline.replace('calc_tab_', '');
            const tabTotals = calculateTabTotals(tabValue);
            return orderSizeNames.map(sizeName => ({
                size: sizeName,
                qty: tabTotals[sizeName] || 0
            }));
        } else {
            // Find the selected table
            const baselineTable = tables.find(table => table.id === currentBaseline);
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
        }
    };

    const effectiveOrderSizes = getEffectiveOrderQuantities();

    // Get effective order quantities for right table (always uses left table's calculated output)
    const getRightTableEffectiveOrderQuantities = () => {
        // Right table always uses left table's calculated totals as baseline
        return orderSizeNames.map(sizeName => ({
            size: sizeName,
            qty: totals.bySize[sizeName] || 0
        }));
    };

    // Create baseline options including other calculator tabs
    const baselineOptions = useMemo(() => {
        const options = [
            { value: 'original', label: t('calculator.originalOrderQuantities') }
        ];

        // Add table options with fabric information
        tables.forEach((table) => {
            const fabricType = table.fabricType || t('calculator.unknown');
            const fabricCode = table.fabricCode || t('calculator.unknown');
            const fabricColor = table.fabricColor || t('calculator.unknown');

            // Determine table type based on spreading or mattress names
            let tableType = t('calculator.mattress'); // Default
            if (table.rows && table.rows.length > 0) {
                const firstRow = table.rows[0];
                if (firstRow.mattressName) {
                    if (firstRow.mattressName.includes('-ASA-') || firstRow.mattressName.includes('-MSA-')) {
                        tableType = t('calculator.adhesive');
                    }
                }
            }

            options.push({
                value: table.id,
                label: `${tableType} ${fabricType} - ${fabricCode} - ${fabricColor} ${t('calculator.plannedQty')}`
            });
        });

        return options;
    }, [tables, t]);

    // Helper to update markers for current material type
    const setTestMarkers = (markersOrUpdater) => {
        setTestMarkersByMaterial(prev => ({
            ...prev,
            [currentMaterialType]: typeof markersOrUpdater === 'function'
                ? markersOrUpdater(prev[currentMaterialType] || [])
                : markersOrUpdater
        }));
    };

    // Generate enhanced marker name based on style, quantities, and width
    const generateMarkerName = (quantities, width = '') => {
        const nonZeroQuantities = [];
        effectiveOrderSizes.forEach(sizeObj => {
            const sizeName = sizeObj.size;
            const qty = parseInt(quantities[sizeName]) || 0;
            if (qty > 0) {
                nonZeroQuantities.push(`${qty}${sizeName}`);
            }
        });

        if (nonZeroQuantities.length > 0) {
            const quantitiesStr = nonZeroQuantities.join('');
            let baseName = `${selectedStyle}-${quantitiesStr}`;

            // Add width only if provided and not empty
            if (width && width.toString().trim() !== '') {
                baseName += `-${width.toString().trim()}`;
            }

            return baseName;
        } else {
            return '';
        }
    };

    // Generate enhanced marker name for right table (adds -G before width)
    const generateRightMarkerName = (quantities, width = '') => {
        const nonZeroQuantities = [];
        effectiveOrderSizes.forEach(sizeObj => {
            const sizeName = sizeObj.size;
            const qty = parseInt(quantities[sizeName]) || 0;
            if (qty > 0) {
                nonZeroQuantities.push(`${qty}${sizeName}`);
            }
        });

        if (nonZeroQuantities.length > 0) {
            const quantitiesStr = nonZeroQuantities.join('');
            let baseName = `${selectedStyle}-${quantitiesStr}-G`;

            // Add width only if provided and not empty
            if (width && width.toString().trim() !== '') {
                baseName += `-${width.toString().trim()}`;
            }

            return baseName;
        } else {
            return '';
        }
    };

    // Validate marker name length and return validation info
    const validateMarkerName = (name) => {
        const maxLength = 30;
        const isValid = name.length <= maxLength;
        return {
            isValid,
            length: name.length,
            maxLength,
            isOverLimit: name.length > maxLength
        };
    };

    const addNewMarker = () => {
        const newMarker = {
            id: uuidv4(),
            markerName: '',
            width: '',
            quantities: orderSizeNames.reduce((acc, sizeName) => {
                acc[sizeName] = 0;
                return acc;
            }, {}),
            layers: ''
        };
        setTestMarkers(prev => [...prev, newMarker]);
    };

    const removeMarker = (markerId) => {
        setTestMarkers(prev => prev.filter(marker => marker.id !== markerId));
    };

    // Right table marker functions
    const addNewRightMarker = () => {
        const newMarker = {
            id: uuidv4(),
            width: '',
            markerName: '',
            quantities: {},
            layers: 1
        };
        setRightTableMarkers(prev => [...prev, newMarker]);
        // Also update the material-specific state
        setRightTableMarkersByMaterial(prev => ({
            ...prev,
            [currentMaterialType]: [...(prev[currentMaterialType] || []), newMarker]
        }));
    };

    const removeRightMarker = (markerId) => {
        setRightTableMarkers(prev => prev.filter(marker => marker.id !== markerId));
        // Also update the material-specific state
        setRightTableMarkersByMaterial(prev => ({
            ...prev,
            [currentMaterialType]: (prev[currentMaterialType] || []).filter(marker => marker.id !== markerId)
        }));
    };

    const updateRightMarkerField = (markerId, field, value) => {
        const updateFunction = (prev) => prev.map(marker => {
            if (marker.id === markerId) {
                const updatedMarker = { ...marker, [field]: value };

                // Always regenerate marker name when width changes (except for layers)
                if (field === 'width') {
                    updatedMarker.markerName = generateRightMarkerName(marker.quantities, value);
                }

                return updatedMarker;
            }
            return marker;
        });

        setRightTableMarkers(updateFunction);
        // Also update the material-specific state
        setRightTableMarkersByMaterial(prev => ({
            ...prev,
            [currentMaterialType]: updateFunction(prev[currentMaterialType] || [])
        }));
    };

    const updateRightQuantity = (markerId, size, value) => {
        const updateFunction = (prev) => prev.map(marker => {
            if (marker.id === markerId) {
                const updatedQuantities = { ...marker.quantities, [size]: value };
                const updatedMarker = {
                    ...marker,
                    quantities: updatedQuantities
                };

                // Always regenerate marker name when quantities change
                updatedMarker.markerName = generateRightMarkerName(updatedQuantities, marker.width);

                return updatedMarker;
            }
            return marker;
        });

        setRightTableMarkers(updateFunction);
        // Also update the material-specific state
        setRightTableMarkersByMaterial(prev => ({
            ...prev,
            [currentMaterialType]: updateFunction(prev[currentMaterialType] || [])
        }));
    };

    const clearAllMarkers = () => {
        // Clear left table
        setTestMarkers([]);

        // Clear right table if in split view
        if (splitViewMode) {
            setRightTableMarkers([]);
            // Also clear the material-specific state
            setRightTableMarkersByMaterial(prev => ({
                ...prev,
                [currentMaterialType]: []
            }));
        }

        // Add one empty marker to left table after clearing
        setTimeout(() => {
            addNewMarker();
            // Add one empty marker to right table if in split view
            if (splitViewMode) {
                addNewRightMarker();
            }
        }, 0);
    };



    const updateMarkerField = (markerId, field, value) => {
        setTestMarkers(prev =>
            prev.map(marker => {
                if (marker.id === markerId) {
                    const updatedMarker = { ...marker, [field]: value };

                    // Always regenerate marker name when width changes (except for layers)
                    if (field === 'width') {
                        updatedMarker.markerName = generateMarkerName(marker.quantities, value);
                    }

                    return updatedMarker;
                }
                return marker;
            })
        );
    };

    const updateQuantity = (markerId, sizeName, quantity) => {
        const numQuantity = Math.max(0, parseInt(quantity) || 0);
        setTestMarkers(prev =>
            prev.map(marker => {
                if (marker.id === markerId) {
                    const updatedQuantities = {
                        ...marker.quantities,
                        [sizeName]: numQuantity
                    };
                    const updatedMarker = {
                        ...marker,
                        quantities: updatedQuantities
                    };

                    // Always regenerate marker name when quantities change
                    updatedMarker.markerName = generateMarkerName(updatedQuantities, marker.width);

                    return updatedMarker;
                }
                return marker;
            })
        );
    };

    // Load saved data when dialog opens
    useEffect(() => {
        if (open && selectedOrder?.id && selectedCombinationId && !isLoading) {
            loadCalculatorData();
        }
    }, [open, selectedOrder?.id, selectedCombinationId]); // Only load when dialog opens

    // Load calculator data from API (tab-specific)
    const loadCalculatorData = async () => {
        if (isLoading) return; // Prevent duplicate requests

        setIsLoading(true);
        try {
            const response = await axios.get(`/marker_calculator/load/${selectedOrder.id}/${selectedCombinationId}`);

            if (response.data.success && response.data.data) {
                const tabsData = response.data.data;
                const loadedTabsData = {};
                const loadedRightTabsData = {};
                const loadedBaselines = {};
                let hasRightTableData = false;

                // Process each tab's data
                Object.entries(tabsData).forEach(([tabNumber, tabData]) => {
                    if (tabNumber.endsWith('_right')) {
                        // This is right table data
                        const baseTabNumber = tabNumber.replace('_right', '');
                        const tabValue = `calc_${baseTabNumber}`;
                        hasRightTableData = true;

                        // Convert markers to the format expected by the component
                        const loadedRightMarkers = tabData.markers.map(marker => ({
                            id: uuidv4(), // Generate new client-side ID
                            markerName: marker.marker_name,
                            width: marker.marker_width || '',
                            layers: marker.layers,
                            quantities: marker.quantities
                        }));

                        loadedRightTabsData[tabValue] = loadedRightMarkers;
                    } else {
                        // This is left table data
                        const tabValue = `calc_${tabNumber}`;

                        // Store baseline for this tab
                        loadedBaselines[tabValue] = tabData.selected_baseline;

                        // Convert markers to the format expected by the component
                        const loadedMarkers = tabData.markers.map(marker => ({
                            id: uuidv4(), // Generate new client-side ID
                            markerName: marker.marker_name,
                            width: marker.marker_width || '',
                            layers: marker.layers,
                            quantities: marker.quantities
                        }));

                        loadedTabsData[tabValue] = loadedMarkers;
                    }
                });

                // Update calculator tabs to match loaded data (exclude right table entries)
                const loadedTabNumbers = Object.keys(tabsData)
                    .filter(tabNumber => !tabNumber.endsWith('_right'))
                    .sort();
                if (loadedTabNumbers.length > 0) {
                    const newTabs = loadedTabNumbers.map(tabNumber => ({
                        value: `calc_${tabNumber}`,
                        label: tabNumber
                    }));
                    setCalculatorTabs(newTabs);
                    setCurrentMaterialType(newTabs[0].value);
                }

                // Set all loaded markers data and baselines
                setTestMarkersByMaterial(loadedTabsData);
                setRightTableMarkersByMaterial(loadedRightTabsData);
                setBaselineByTab(loadedBaselines);

                // Enable split view if right table data exists
                if (hasRightTableData) {
                    setSplitViewMode(true);
                }
            } else {
                // No saved data, initialize with one empty marker if none exist
                if (testMarkers.length === 0) {
                    addNewMarker();
                }
            }
        } catch (error) {
            console.error('Error loading calculator data:', error);
            // Initialize with one empty marker on error if none exist
            if (testMarkers.length === 0) {
                addNewMarker();
            }
        } finally {
            setIsLoading(false);
        }
    };



    // Save calculator data to API (tab-specific) with deadlock handling
    const saveCalculatorData = async () => {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        const saveWithRetry = async (payload, retryCount = 0) => {
            try {
                return await axios.post('/marker_calculator/save', payload);
            } catch (error) {
                // Check if it's a deadlock error (SQL Server error 1205)
                const isDeadlock = error.response?.data?.message?.includes('1205') ||
                                 error.response?.data?.message?.includes('deadlock') ||
                                 error.message?.includes('1205') ||
                                 error.message?.includes('deadlock');

                if (isDeadlock && retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1))); // Exponential backoff
                    return saveWithRetry(payload, retryCount + 1);
                }
                throw error;
            }
        };

        try {
            // Save each tab sequentially to avoid deadlocks (instead of parallel)
            const results = [];

            for (const [tabValue, tabMarkers] of Object.entries(testMarkersByMaterial)) {
                if (tabMarkers && Array.isArray(tabMarkers) && tabMarkers.length > 0) {
                    // Extract tab number from tabValue (e.g., 'calc_01' -> '01')
                    const tabNumber = tabValue.replace('calc_', '');

                    const markersData = tabMarkers.map(marker => ({
                        marker_name: marker.markerName || '',
                        marker_width: marker.width ? parseFloat(marker.width) : null,
                        layers: marker.layers ? parseInt(marker.layers) : 1,
                        quantities: marker.quantities || {}
                    }));

                    const payload = {
                        order_commessa: selectedOrder.id,
                        combination_id: selectedCombinationId,
                        tab_number: tabNumber,
                        selected_baseline: baselineByTab[tabValue] || 'original',
                        style: selectedStyle,
                        markers: markersData
                    };

                    console.log(`Saving tab ${tabNumber}...`);
                    const response = await saveWithRetry(payload);
                    results.push(response);
                    console.log(`✅ Tab ${tabNumber} saved successfully`);

                    // Also save right table data if in split view and has data
                    const rightTabMarkers = rightTableMarkersByMaterial[tabValue];
                    if (splitViewMode && rightTabMarkers && Array.isArray(rightTabMarkers) && rightTabMarkers.length > 0) {
                        const rightMarkersData = rightTabMarkers.map(marker => ({
                            marker_name: marker.markerName || '',
                            marker_width: marker.width ? parseFloat(marker.width) : null,
                            layers: marker.layers ? parseInt(marker.layers) : 1,
                            quantities: marker.quantities || {}
                        }));

                        const rightPayload = {
                            order_commessa: selectedOrder.id,
                            combination_id: selectedCombinationId,
                            tab_number: `${tabNumber}_right`, // Distinguish right table data
                            selected_baseline: `calc_tab_${tabNumber}`, // Right table uses left table's output
                            style: selectedStyle,
                            markers: rightMarkersData
                        };

                        console.log(`Saving right table for tab ${tabNumber}...`);
                        const rightResponse = await saveWithRetry(rightPayload);
                        results.push(rightResponse);
                        console.log(`✅ Right table for tab ${tabNumber} saved successfully`);
                    }
                }
            }

            // Check if all saves were successful
            const allSuccessful = results.every(response => response.data.success);

            if (allSuccessful) {
                setShowSuccessSnackbar(true);
                return true;
            } else {
                const failedResponses = results.filter(response => !response.data.success);
                console.error('Failed to save some calculator data:', failedResponses);
                const errorMsg = t('calculator.failedToSaveSomeTabs', {
                    message: failedResponses.map(r => r.data.message).join(', ')
                });
                setErrorMessage(errorMsg);
                setShowErrorSnackbar(true);
                return false;
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;

            if (errorMsg.includes('1205') || errorMsg.includes('deadlock')) {
                setErrorMessage(t('calculator.databaseBusy'));
            } else {
                setErrorMessage(t('calculator.saveFailed', { message: errorMsg }));
            }
            setShowErrorSnackbar(true);
            return false;
        }
    };

    // Handle dialog close without auto-save
    const handleClose = () => {
        // Clear unsaved right table data
        setRightTableMarkers([]);
        setRightTableMarkersByMaterial({});
        setSplitViewMode(false);
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

    // Calculate totals for right table (split view only)
    const rightTotals = useMemo(() => {
        const calculatedTotals = {
            bySize: {},
            totalPieces: 0,
            totalPiecesWithLayers: 0
        };

        // Initialize size totals
        orderSizeNames.forEach(sizeName => {
            calculatedTotals.bySize[sizeName] = 0;
        });

        // Sum up quantities from all right table markers
        rightTableMarkers.forEach(marker => {
            const markerLayers = parseInt(marker.layers) || 1;
            orderSizeNames.forEach(sizeName => {
                const qty = parseInt(marker.quantities[sizeName]) || 0;
                const qtyWithLayers = qty * markerLayers;
                calculatedTotals.bySize[sizeName] += qtyWithLayers;
                calculatedTotals.totalPiecesWithLayers += qtyWithLayers;
            });
        });

        return calculatedTotals;
    }, [rightTableMarkers, orderSizeNames]);

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

    // Calculate coverage percentage for right table (comparison with left table)
    const getRightCoveragePercentage = (sizeName) => {
        const leftCalculatedQty = totals.bySize[sizeName];
        const rightCalculatedQty = rightTotals.bySize[sizeName];
        if (leftCalculatedQty === 0) return 0;
        return Math.round((rightCalculatedQty / leftCalculatedQty) * 100);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '85vh',
                    maxHeight: '95vh',
                    width: '98vw',
                    maxWidth: '1800px'
                }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <Calculate />
                    {t('calculator.title')}
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Calculator Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tabs
                            value={currentMaterialType}
                            onChange={(event, newValue) => setCurrentMaterialType(newValue)}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {calculatorTabs.map((tab) => (
                                <Tab
                                    key={tab.value}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span>{tab.label}</span>
                                            {calculatorTabs.length > 1 && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeTab(tab.value);
                                                    }}
                                                    sx={{
                                                        ml: 0.5,
                                                        p: 0.25,
                                                        '&:hover': { backgroundColor: 'error.light' }
                                                    }}
                                                >
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    }
                                    value={tab.value}
                                />
                            ))}
                        </Tabs>
                        <IconButton
                            onClick={addNewTab}
                            sx={{
                                ml: 2,
                                color: 'primary.main',
                                '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                            }}
                            title={t('calculator.addNewCalculatorTab')}
                        >
                            <Add />
                        </IconButton>
                    </Box>
                </Box>

                {/* Baseline Selector */}
                <Box mb={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                            {t('calculator.calculateCoverageAgainst')}
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 300 }}>
                            <Select
                                value={getCurrentBaseline()}
                                onChange={(e) => setCurrentBaseline(e.target.value)}
                                displayEmpty
                            >
                                {baselineOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary">
                            {getCurrentBaseline() === 'original'
                                ? t('calculator.usingOriginalOrderQuantities')
                                : t('calculator.usingOutputFrom', {
                                    label: baselineOptions.find(opt => opt.value === getCurrentBaseline())?.label
                                })
                            }
                        </Typography>
                    </Box>
                </Box>

                {/* Markers Table */}
                <Box mb={3}>
                    <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
                        <Box display="flex" gap={1}>
                            {/* Hide Add Marker button in split view mode */}
                            {!splitViewMode && (
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={addNewMarker}
                                    size="small"
                                >
                                    {t('calculator.addMarker')}
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={clearAllMarkers}
                                size="small"
                            >
                                {t('calculator.clearAll')}
                            </Button>
                            <Button
                                variant="outlined"
                                color={splitViewMode ? "primary" : "secondary"}
                                startIcon={<ViewColumn />}
                                onClick={() => setSplitViewMode(!splitViewMode)}
                                size="small"
                            >
                                {splitViewMode ? t('calculator.singleView') : t('calculator.splitView')}
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Main Content Area - Single or Split View */}
                <Box display="flex" gap={2} sx={{ width: '100%' }}>
                    {/* Left Panel (or Single Panel) */}
                    <Box sx={{ flex: splitViewMode ? 1 : 'none', width: splitViewMode ? '50%' : '100%' }}>
                        {/* Add Marker Button for Left Table (Split View Only) */}
                        {splitViewMode && (
                            <Box display="flex" justifyContent="center" mb={1}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={addNewMarker}
                                    size="small"
                                >
                                    {t('calculator.addMarker')}
                                </Button>
                            </Box>
                        )}
                        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" sx={{ width: '80px', padding: '8px' }}>{t('calculator.width')}</TableCell>
                                        <TableCell align="center" sx={{ width: '200px', padding: '8px' }}>{t('calculator.markerName')}</TableCell>
                                        {effectiveOrderSizes.length > 0 &&
                                            effectiveOrderSizes.map((size) => (
                                                <TableCell align="center" key={size.size} sx={{ width: '60px', padding: '8px' }}>
                                                    {size.size}
                                                </TableCell>
                                            ))
                                        }
                                        <TableCell align="center" sx={{ width: '60px', padding: '8px' }}>{t('calculator.layers')}</TableCell>
                                        <TableCell sx={{ width: '40px', padding: '8px' }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {testMarkers.map((marker) => (
                                        <TableRow key={marker.id}>
                                            <TableCell sx={{ width: '80px', padding: '8px', textAlign: 'center' }}>
                                                <TextField
                                                    value={marker.width}
                                                    onChange={(e) => updateMarkerField(marker.id, 'width', e.target.value)}
                                                    size="small"
                                                    sx={{
                                                        width: '100%',
                                                        '& .MuiInputBase-input': {
                                                            textAlign: 'center',
                                                        },
                                                        '& input[type=number]': {
                                                            '-moz-appearance': 'textfield',
                                                        },
                                                        '& input[type=number]::-webkit-outer-spin-button': {
                                                            '-webkit-appearance': 'none',
                                                            margin: 0,
                                                        },
                                                        '& input[type=number]::-webkit-inner-spin-button': {
                                                            '-webkit-appearance': 'none',
                                                            margin: 0,
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: '200px', padding: '8px', textAlign: 'center' }}>
                                                <TextField
                                                    value={marker.markerName}
                                                    onChange={(e) => updateMarkerField(marker.id, 'markerName', e.target.value)}
                                                    placeholder={generateMarkerName(marker.quantities, marker.width)}
                                                    variant="standard"
                                                    size="small"
                                                    sx={{
                                                        width: '100%',
                                                        '& .MuiInputBase-input': {
                                                            textAlign: 'center',
                                                            cursor: 'text',
                                                            userSelect: 'text',
                                                            '&:focus': {
                                                                outline: 'none',
                                                            },
                                                        },
                                                        '& .MuiInput-underline:before': {
                                                            borderBottom: 'none',
                                                        },
                                                        '& .MuiInput-underline:after': {
                                                            borderBottom: 'none',
                                                        },
                                                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                                            borderBottom: 'none',
                                                        },
                                                        '& .MuiInput-underline.Mui-focused:after': {
                                                            borderBottom: 'none',
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            {effectiveOrderSizes.map((size) => (
                                                <TableCell key={size.size} sx={{ width: '60px', padding: '8px', textAlign: 'center' }}>
                                                    <TextField
                                                        type="number"
                                                        value={marker.quantities[size.size] || ''}
                                                        onChange={(e) => updateQuantity(marker.id, size.size, e.target.value)}
                                                        size="small"
                                                        sx={{
                                                            width: '100%',
                                                            '& .MuiInputBase-input': {
                                                                textAlign: 'center',
                                                            },
                                                            '& input[type=number]': {
                                                                '-moz-appearance': 'textfield',
                                                            },
                                                            '& input[type=number]::-webkit-outer-spin-button': {
                                                                '-webkit-appearance': 'none',
                                                                margin: 0,
                                                            },
                                                            '& input[type=number]::-webkit-inner-spin-button': {
                                                                '-webkit-appearance': 'none',
                                                                margin: 0,
                                                            },
                                                        }}
                                                        inputProps={{ min: 0 }}
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell sx={{ width: '60px', padding: '8px', textAlign: 'center' }}>
                                                <TextField
                                                    type="number"
                                                    value={marker.layers}
                                                    onChange={(e) => updateMarkerField(marker.id, 'layers', e.target.value)}
                                                    size="small"
                                                    sx={{
                                                        width: '100%',
                                                        '& .MuiInputBase-input': {
                                                            textAlign: 'center',
                                                        },
                                                        '& input[type=number]': {
                                                            '-moz-appearance': 'textfield',
                                                        },
                                                        '& input[type=number]::-webkit-outer-spin-button': {
                                                            '-webkit-appearance': 'none',
                                                            margin: 0,
                                                        },
                                                        '& input[type=number]::-webkit-inner-spin-button': {
                                                            '-webkit-appearance': 'none',
                                                            margin: 0,
                                                        },
                                                    }}
                                                    inputProps={{ min: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: '40px', padding: '8px', textAlign: 'center' }}>
                                                <IconButton
                                                    onClick={() => removeMarker(marker.id)}
                                                    size="small"
                                                    color="error"
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

                    {/* Right Panel (Split View Only) */}
                    {splitViewMode && (
                        <Box sx={{ flex: 1, width: '50%' }}>
                            {/* Add Marker Button for Right Table */}
                            <Box display="flex" justifyContent="center" mb={1}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={addNewRightMarker}
                                    size="small"
                                >
                                    {t('calculator.addMarker')}
                                </Button>
                            </Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center" sx={{ width: '80px', padding: '8px' }}>{t('calculator.width')}</TableCell>
                                            <TableCell align="center" sx={{ width: '200px', padding: '8px' }}>{t('calculator.markerName')}</TableCell>
                                            {effectiveOrderSizes.length > 0 &&
                                                effectiveOrderSizes.map((size) => (
                                                    <TableCell align="center" key={size.size} sx={{ width: '60px', padding: '8px' }}>
                                                        {size.size}
                                                    </TableCell>
                                                ))
                                            }
                                            <TableCell align="center" sx={{ width: '60px', padding: '8px' }}>{t('calculator.layers')}</TableCell>
                                            <TableCell sx={{ width: '40px', padding: '8px' }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rightTableMarkers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={effectiveOrderSizes.length + 3} align="center" sx={{ py: 4 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('calculator.clickAddMarkerToStartComparing')}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rightTableMarkers.map((marker) => (
                                                <TableRow key={marker.id}>
                                                    <TableCell sx={{ width: '80px', padding: '8px', textAlign: 'center' }}>
                                                        <TextField
                                                            value={marker.width}
                                                            onChange={(e) => updateRightMarkerField(marker.id, 'width', e.target.value)}
                                                            size="small"
                                                            sx={{
                                                                width: '100%',
                                                                '& .MuiInputBase-input': {
                                                                    textAlign: 'center',
                                                                },
                                                                '& input[type=number]': {
                                                                    '-moz-appearance': 'textfield',
                                                                },
                                                                '& input[type=number]::-webkit-outer-spin-button': {
                                                                    '-webkit-appearance': 'none',
                                                                    margin: 0,
                                                                },
                                                                '& input[type=number]::-webkit-inner-spin-button': {
                                                                    '-webkit-appearance': 'none',
                                                                    margin: 0,
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ width: '200px', padding: '8px', textAlign: 'center' }}>
                                                        <TextField
                                                            value={marker.markerName}
                                                            onChange={(e) => updateRightMarkerField(marker.id, 'markerName', e.target.value)}
                                                            placeholder={generateRightMarkerName(marker.quantities, marker.width)}
                                                            variant="standard"
                                                            size="small"
                                                            sx={{
                                                                width: '100%',
                                                                '& .MuiInputBase-input': {
                                                                    textAlign: 'center',
                                                                    cursor: 'text',
                                                                    userSelect: 'text',
                                                                    '&:focus': {
                                                                        outline: 'none',
                                                                    },
                                                                },
                                                                '& .MuiInput-underline:before': {
                                                                    borderBottom: 'none',
                                                                },
                                                                '& .MuiInput-underline:after': {
                                                                    borderBottom: 'none',
                                                                },
                                                                '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                                                    borderBottom: 'none',
                                                                },
                                                                '& .MuiInput-underline.Mui-focused:after': {
                                                                    borderBottom: 'none',
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>
                                                    {effectiveOrderSizes.map((size) => (
                                                        <TableCell key={size.size} sx={{ width: '60px', padding: '8px', textAlign: 'center' }}>
                                                            <TextField
                                                                type="number"
                                                                value={marker.quantities[size.size] || ''}
                                                                onChange={(e) => updateRightQuantity(marker.id, size.size, e.target.value)}
                                                                size="small"
                                                                sx={{
                                                                    width: '100%',
                                                                    '& .MuiInputBase-input': {
                                                                        textAlign: 'center',
                                                                    },
                                                                    '& input[type=number]': {
                                                                        '-moz-appearance': 'textfield',
                                                                    },
                                                                    '& input[type=number]::-webkit-outer-spin-button': {
                                                                        '-webkit-appearance': 'none',
                                                                        margin: 0,
                                                                    },
                                                                    '& input[type=number]::-webkit-inner-spin-button': {
                                                                        '-webkit-appearance': 'none',
                                                                        margin: 0,
                                                                    },
                                                                }}
                                                                inputProps={{ min: 0 }}
                                                            />
                                                        </TableCell>
                                                    ))}
                                                    <TableCell sx={{ width: '60px', padding: '8px', textAlign: 'center' }}>
                                                        <TextField
                                                            type="number"
                                                            value={marker.layers}
                                                            onChange={(e) => updateRightMarkerField(marker.id, 'layers', e.target.value)}
                                                            size="small"
                                                            sx={{
                                                                width: '100%',
                                                                '& .MuiInputBase-input': {
                                                                    textAlign: 'center',
                                                                },
                                                                '& input[type=number]': {
                                                                    '-moz-appearance': 'textfield',
                                                                },
                                                                '& input[type=number]::-webkit-outer-spin-button': {
                                                                    '-webkit-appearance': 'none',
                                                                    margin: 0,
                                                                },
                                                                '& input[type=number]::-webkit-inner-spin-button': {
                                                                    '-webkit-appearance': 'none',
                                                                    margin: 0,
                                                                },
                                                            }}
                                                            inputProps={{ min: 1 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ width: '40px', padding: '8px', textAlign: 'center' }}>
                                                        <IconButton
                                                            onClick={() => removeRightMarker(marker.id)}
                                                            size="small"
                                                            color="error"
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Results Section - Always Below */}
                <Box>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center"><strong>{t('calculator.size')}</strong></TableCell>
                                    <TableCell align="center">
                                        <strong>
                                            {getCurrentBaseline() === 'original'
                                                ? t('calculator.orderQty')
                                                : `${baselineOptions.find(opt => opt.value === getCurrentBaseline())?.label || t('calculator.baseline')}`
                                            }
                                        </strong>
                                    </TableCell>
                                    <TableCell align="center"><strong>{t('calculator.calculatedTotal')}</strong></TableCell>
                                    <TableCell align="center"><strong>{t('calculator.coverage')}</strong></TableCell>
                                    {/* Additional columns for split view */}
                                    {splitViewMode && (
                                        <>
                                            <TableCell align="center"><strong>{t('calculator.calculated2ndTotal')}</strong></TableCell>
                                            <TableCell align="center"><strong>{t('calculator.2ndCoverage')}</strong></TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orderSizeNames.map((sizeName) => {
                                    const orderQty = getOrderQuantity(sizeName);
                                    const calculatedQty = totals.bySize[sizeName];
                                    const coverage = getCoveragePercentage(sizeName);
                                    const rightCalculatedQty = rightTotals.bySize[sizeName];
                                    const rightCoverage = getRightCoveragePercentage(sizeName);

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
                                            {/* Additional columns for split view */}
                                            {splitViewMode && (
                                                <>
                                                    <TableCell align="center">{rightCalculatedQty}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={`${rightCoverage}%`}
                                                            color={
                                                                rightCoverage >= 100 ? 'success' :
                                                                rightCoverage >= 80 ? 'warning' : 'error'
                                                            }
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    );
                                })}
                                {/* Total Row */}
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell align="center">
                                        <strong>{t('calculator.total')}</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>
                                            {orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0)}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>{totals.totalPiecesWithLayers}</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={`${Math.round(
                                                orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0) > 0
                                                    ? (totals.totalPiecesWithLayers / orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0)) * 100
                                                    : 0
                                            )}%`}
                                            color={
                                                totals.totalPiecesWithLayers >= orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0) ? 'success' :
                                                totals.totalPiecesWithLayers >= orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0) * 0.8 ? 'warning' : 'error'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    {/* Additional columns for split view totals */}
                                    {splitViewMode && (
                                        <>
                                            <TableCell align="center">
                                                <strong>{rightTotals.totalPiecesWithLayers}</strong>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${Math.round(
                                                        orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0) > 0
                                                            ? (rightTotals.totalPiecesWithLayers / orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0)) * 100
                                                            : 0
                                                    )}%`}
                                                    color={
                                                        rightTotals.totalPiecesWithLayers >= orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0) ? 'success' :
                                                        rightTotals.totalPiecesWithLayers >= orderSizeNames.reduce((sum, sizeName) => sum + getOrderQuantity(sizeName), 0) * 0.8 ? 'warning' : 'error'
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={saveCalculatorData}
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                >
                    {t('calculator.save')}
                </Button>
                <Button onClick={onClose} variant="outlined">
                    {t('calculator.close')}
                </Button>
            </DialogActions>

            {/* Success Snackbar */}
            <Snackbar
                open={showSuccessSnackbar}
                autoHideDuration={5000}
                onClose={() => setShowSuccessSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setShowSuccessSnackbar(false)}
                    severity="success"
                    sx={{ width: '100%', padding: "12px 16px", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }}
                >
                    {t('calculator.calculatorDataSavedSuccessfully')}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={showErrorSnackbar}
                autoHideDuration={5000}
                onClose={() => setShowErrorSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setShowErrorSnackbar(false)}
                    severity="error"
                    sx={{ width: '100%', padding: "12px 16px", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default MarkerCalculatorDialog;
