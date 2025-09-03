import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Grid,
    TextField,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Typography,
    Alert
} from '@mui/material';
import { Add, Edit, Delete, Save, Cancel } from '@mui/icons-material';
import axios from 'utils/axiosInstance';
import MainCard from 'ui-component/cards/MainCard';
import CumulativeQuantities from './CumulativeQuantities';

const ProductionCenterTabs = forwardRef(({
    selectedOrder,
    onCombinationChange,
    selectedCombinationId,
    setUnsavedChanges,
    productionCenterOptions = [],
    orderSizes = [],
    italianRatios = {},
    updateTablesWithCombination,
    tables = [],
    setTables,
    adhesiveTables = [],
    setAdhesiveTables,
    alongTables = [],
    setAlongTables,
    weftTables = [],
    setWeftTables,
    biasTables = [],
    setBiasTables,
    // Deletion tracking functions
    setDeletedMattresses,
    setDeletedAdhesive,
    setDeletedAlong,
    setDeletedWeft,
    setDeletedBias,
    setDeletedTableIds,
    setDeletedCombinations,
    // Print-specific props
    printSelectedDestination = null
}, ref) => {
    const [combinations, setCombinations] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [combinationToDelete, setCombinationToDelete] = useState(null);
    const [editingCombination, setEditingCombination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state for new/edit combination
    const [formData, setFormData] = useState({
        production_center: '',
        cutting_room: '',
        destination: ''
    });



    // Fetch combinations when order changes
    useEffect(() => {
        if (selectedOrder) {
            fetchCombinations();
        } else {
            setCombinations([]);
            setActiveTab(0);
        }
    }, [selectedOrder]);

    // Update active tab when selectedCombinationId changes
    useEffect(() => {
        if (selectedCombinationId && combinations.length > 0) {
            const index = combinations.findIndex(c => c.combination_id === selectedCombinationId);
            if (index >= 0) {
                setActiveTab(index);
            }
        }
    }, [selectedCombinationId, combinations]);

    const fetchCombinations = async () => {
        if (!selectedOrder) return;

        setLoading(true);
        try {
            const response = await axios.get(`/orders/production_center_combinations/get/${selectedOrder.id}`);
            if (response.data.success) {
                const combos = response.data.data || [];
                setCombinations(combos);



                // Auto-select first combination if none selected and combinations exist
                if (!selectedCombinationId && combos.length > 0) {
                    onCombinationChange(combos[0]);
                    setActiveTab(0);
                }
                // Note: Removed automatic dialog opening when no combinations exist
            }
        } catch (error) {
            console.error('Error fetching production center combinations:', error);
            setError('Failed to load production center combinations');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        if (combinations[newValue]) {
            onCombinationChange(combinations[newValue]);
        }
    };

    // Function to switch to a specific destination tab (for printing)
    const switchToDestinationTab = (destination) => {
        const tabIndex = combinations.findIndex(c => c.destination === destination);
        if (tabIndex !== -1 && tabIndex !== activeTab) {
            console.log(`🔄 Switching from tab ${activeTab} to tab ${tabIndex} for destination: ${destination}`);
            setActiveTab(tabIndex);
            if (combinations[tabIndex] && onCombinationChange) {
                onCombinationChange(combinations[tabIndex]);
            }
        }
    };

    // Calculate percentage of mattress pieces (fabric type 01) for a combination
    const calculateCombinationPercentage = (combination) => {
        if (!orderSizes.length || !tables.length) return 0;

        // Calculate total original order quantity
        const totalOriginalQty = orderSizes.reduce((sum, size) => sum + size.qty, 0);
        if (totalOriginalQty === 0) return 0;

        // Find mattress tables that match this combination and have fabric type "01"
        const matchingTables = tables.filter(table =>
            table.productionCenter === combination.production_center &&
            table.cuttingRoom === combination.cutting_room &&
            table.destination === combination.destination &&
            table.fabricType === '01' // Only fabric type "01"
        );

        // Calculate total planned quantity for this combination
        let totalPlannedQty = 0;
        matchingTables.forEach(table => {
            if (table.rows && table.rows.length > 0) {
                table.rows.forEach(row => {
                    if (row.piecesPerSize && typeof row.piecesPerSize === 'object') {
                        const layers = parseInt(row.layers) || 1;
                        orderSizes.forEach(size => {
                            const piecesForSize = parseInt(row.piecesPerSize[size.size]) || 0;
                            totalPlannedQty += piecesForSize * layers;
                        });
                    }
                });
            }
        });

        // Calculate percentage
        const percentage = (totalPlannedQty / totalOriginalQty) * 100;
        return Math.round(percentage * 10) / 10; // Round to 1 decimal place
    };

    // Expose switchToDestinationTab function and combinations to parent component
    useImperativeHandle(ref, () => ({
        switchToDestinationTab,
        getCombinations: () => combinations
    }), [combinations, activeTab, onCombinationChange]);



    const handleOpenAddDialog = () => {
        setEditingCombination(null);
        setFormData({
            production_center: '',
            cutting_room: '',
            destination: ''
        });
        setOpenDialog(true);
    };

    const handleEditCombination = (combination) => {
        setEditingCombination(combination);
        setFormData({
            production_center: combination.production_center || '',
            cutting_room: combination.cutting_room || '',
            destination: combination.destination || ''
        });
        setOpenDialog(true);
    };

    // Helper function to find tables that use a specific combination
    const findTablesUsingCombination = (combination) => {
        const matchingTables = [];

        // Check mattress tables
        tables.forEach(table => {
            // Only match if all values are defined and match exactly
            if (table.productionCenter && table.cuttingRoom && table.destination &&
                combination.production_center && combination.cutting_room && combination.destination &&
                table.productionCenter === combination.production_center &&
                table.cuttingRoom === combination.cutting_room &&
                table.destination === combination.destination) {
                matchingTables.push({ type: 'mattress', table });
            }
        });

        // Check adhesive tables
        adhesiveTables.forEach(table => {
            // Only match if all values are defined and match exactly
            if (table.productionCenter && table.cuttingRoom && table.destination &&
                combination.production_center && combination.cutting_room && combination.destination &&
                table.productionCenter === combination.production_center &&
                table.cuttingRoom === combination.cutting_room &&
                table.destination === combination.destination) {
                matchingTables.push({ type: 'adhesive', table });
            }
        });

        // Check along tables
        alongTables.forEach(table => {
            // Only match if all values are defined and match exactly
            if (table.productionCenter && table.cuttingRoom && table.destination &&
                combination.production_center && combination.cutting_room && combination.destination &&
                table.productionCenter === combination.production_center &&
                table.cuttingRoom === combination.cutting_room &&
                table.destination === combination.destination) {
                matchingTables.push({ type: 'along', table });
            }
        });

        // Check weft tables
        weftTables.forEach(table => {
            // Only match if all values are defined and match exactly
            if (table.productionCenter && table.cuttingRoom && table.destination &&
                combination.production_center && combination.cutting_room && combination.destination &&
                table.productionCenter === combination.production_center &&
                table.cuttingRoom === combination.cutting_room &&
                table.destination === combination.destination) {
                matchingTables.push({ type: 'weft', table });
            }
        });

        // Check bias tables
        biasTables.forEach(table => {
            // Only match if all values are defined and match exactly
            if (table.productionCenter && table.cuttingRoom && table.destination &&
                combination.production_center && combination.cutting_room && combination.destination &&
                table.productionCenter === combination.production_center &&
                table.cuttingRoom === combination.cutting_room &&
                table.destination === combination.destination) {
                matchingTables.push({ type: 'bias', table });
            }
        });

        return matchingTables;
    };

    const handleDeleteCombination = async (combination) => {
        // Allow deletion even if it's the last production center combination
        // Open confirmation dialog instead of window.confirm
        setCombinationToDelete(combination);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        const combination = combinationToDelete;
        if (!combination) return;

        setOpenDeleteDialog(false);
        setCombinationToDelete(null);

        try {
            // Find all tables that use this combination
            const matchingTables = findTablesUsingCombination(combination);

            // Remove tables from UI - the table removal logic will handle marking records for deletion
            matchingTables.forEach(({ type, table }) => {

                switch (type) {
                    case 'mattress':
                        if (setTables) {
                            setTables(prev => {
                                const tableToRemove = prev.find(t => t.id === table.id);
                                if (tableToRemove) {
                                    // Mark mattress records for deletion
                                    tableToRemove.rows.forEach((row) => {
                                        if (row.mattressName && setDeletedMattresses) {
                                            setDeletedMattresses(prevDeleted =>
                                                prevDeleted.includes(row.mattressName) ? prevDeleted : [...prevDeleted, row.mattressName]
                                            );
                                        }
                                    });

                                    // Mark table ID for production center cleanup
                                    if (setDeletedTableIds) {
                                        setDeletedTableIds(prevIds =>
                                            prevIds.includes(table.id) ? prevIds : [...prevIds, table.id]
                                        );
                                    }
                                }

                                return prev.filter(t => t.id !== table.id);
                            });
                        }
                        break;
                    case 'adhesive':
                        if (setAdhesiveTables) {
                            setAdhesiveTables(prev => {
                                const tableToRemove = prev.find(t => t.id === table.id);
                                if (tableToRemove) {
                                    // Mark adhesive records for deletion
                                    tableToRemove.rows.forEach((row) => {
                                        if (row.mattressName && setDeletedAdhesive) {
                                            setDeletedAdhesive(prevDeleted =>
                                                prevDeleted.includes(row.mattressName) ? prevDeleted : [...prevDeleted, row.mattressName]
                                            );
                                        }
                                    });

                                    // Mark table ID for production center cleanup
                                    if (setDeletedTableIds) {
                                        setDeletedTableIds(prevIds =>
                                            prevIds.includes(table.id) ? prevIds : [...prevIds, table.id]
                                        );
                                    }
                                }
                                return prev.filter(t => t.id !== table.id);
                            });
                        }
                        break;
                    case 'along':
                        if (setAlongTables) {
                            setAlongTables(prev => {
                                const tableToRemove = prev.find(t => t.id === table.id);
                                if (tableToRemove) {
                                    // Mark along records for deletion
                                    tableToRemove.rows.forEach((row) => {
                                        if (row.collarettoName && setDeletedAlong) {
                                            setDeletedAlong(prevDeleted =>
                                                prevDeleted.includes(row.collarettoName) ? prevDeleted : [...prevDeleted, row.collarettoName]
                                            );
                                        }
                                    });

                                    // Mark table ID for production center cleanup
                                    if (setDeletedTableIds) {
                                        setDeletedTableIds(prevIds =>
                                            prevIds.includes(table.id) ? prevIds : [...prevIds, table.id]
                                        );
                                    }
                                }
                                return prev.filter(t => t.id !== table.id);
                            });
                        }
                        break;
                    case 'weft':
                        if (setWeftTables) {
                            setWeftTables(prev => {
                                const tableToRemove = prev.find(t => t.id === table.id);
                                if (tableToRemove) {
                                    // Mark weft records for deletion
                                    tableToRemove.rows.forEach((row) => {
                                        if (row.collarettoName && setDeletedWeft) {
                                            setDeletedWeft(prevDeleted =>
                                                prevDeleted.includes(row.collarettoName) ? prevDeleted : [...prevDeleted, row.collarettoName]
                                            );
                                        }
                                    });

                                    // Mark table ID for production center cleanup
                                    if (setDeletedTableIds) {
                                        setDeletedTableIds(prevIds =>
                                            prevIds.includes(table.id) ? prevIds : [...prevIds, table.id]
                                        );
                                    }
                                }
                                return prev.filter(t => t.id !== table.id);
                            });
                        }
                        break;
                    case 'bias':
                        if (setBiasTables) {
                            setBiasTables(prev => {
                                const tableToRemove = prev.find(t => t.id === table.id);
                                if (tableToRemove) {
                                    // Mark bias records for deletion
                                    tableToRemove.rows.forEach((row) => {
                                        if (row.collarettoName && setDeletedBias) {
                                            setDeletedBias(prevDeleted =>
                                                prevDeleted.includes(row.collarettoName) ? prevDeleted : [...prevDeleted, row.collarettoName]
                                            );
                                        }
                                    });

                                    // Mark table ID for production center cleanup
                                    if (setDeletedTableIds) {
                                        setDeletedTableIds(prevIds =>
                                            prevIds.includes(table.id) ? prevIds : [...prevIds, table.id]
                                        );
                                    }
                                }
                                return prev.filter(t => t.id !== table.id);
                            });
                        }
                        break;
                }
            });

            // Mark combination for deletion
            if (setDeletedCombinations) {
                setDeletedCombinations(prev => prev.includes(combination.combination_id) ? prev : [...prev, combination.combination_id]);
            }

            // Delete combination from database immediately
            try {
                await axios.delete(`/orders/production_center_combinations/delete/${selectedOrder.id}/${combination.combination_id}`);
            } catch (error) {
                console.error('Error deleting combination from database:', error);
                // Don't fail the UI operation if database deletion fails
            }

            // Remove combination from UI
            const updatedCombinations = combinations.filter(c => c.combination_id !== combination.combination_id);
            setCombinations(updatedCombinations);

            // Update active tab if needed and trigger combination change
            let newActiveTab = activeTab;
            if (activeTab >= updatedCombinations.length) {
                newActiveTab = Math.max(0, updatedCombinations.length - 1);
                setActiveTab(newActiveTab);
            }

            // Trigger combination change to update table filtering
            if (updatedCombinations.length > 0 && onCombinationChange) {
                const newActiveCombination = updatedCombinations[newActiveTab];
                onCombinationChange(newActiveCombination);
            } else if (onCombinationChange) {
                // No combinations left, clear the selection
                onCombinationChange(null);
            }

            setUnsavedChanges(true);

        } catch (error) {
            console.error('Error removing combination:', error);
            setError('Failed to remove combination');
        }
    };

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
        setCombinationToDelete(null);
    };

    const handleAddCombination = async () => {
        if (!formData.cutting_room) {
            setError('Cutting room is required');
            return;
        }

        // Validate destination for ZALLI and DELICIA
        if ((formData.cutting_room === 'ZALLI' || formData.cutting_room === 'DELICIA') && !formData.destination) {
            setError('Destination is required for ZALLI and DELICIA cutting rooms');
            return;
        }

        try {
            const newCombination = {
                ...formData,
                combination_id: editingCombination?.combination_id || `combo_${Date.now()}`
            };

            console.log('➕ Adding combination locally:', {
                isEditing: !!editingCombination,
                editingId: editingCombination?.combination_id,
                newCombination,
                formData
            });

            let updatedCombinations;
            if (editingCombination) {
                // Update existing combination
                updatedCombinations = combinations.map(c =>
                    c.combination_id === editingCombination.combination_id ? newCombination : c
                );
                console.log('📝 Updated combinations for edit:', updatedCombinations);
            } else {
                // Add new combination
                updatedCombinations = [...combinations, newCombination];
                console.log('➕ Updated combinations for add:', updatedCombinations);
            }

            // Update local state only (no API call)
            setCombinations(updatedCombinations);

            // If we're editing an existing combination, we need to update all tables
            // that were assigned to the old combination with the new values
            if (editingCombination && updateTablesWithCombination) {
                console.log('🔄 Updating existing table assignments...');
                console.log('Old combination:', editingCombination);
                console.log('New combination:', newCombination);

                // Update all table types that might have been assigned to the old combination
                updateTablesWithCombination(editingCombination, newCombination, tables, setTables);
                updateTablesWithCombination(editingCombination, newCombination, adhesiveTables, setAdhesiveTables);
                updateTablesWithCombination(editingCombination, newCombination, alongTables, setAlongTables);
                updateTablesWithCombination(editingCombination, newCombination, weftTables, setWeftTables);
                updateTablesWithCombination(editingCombination, newCombination, biasTables, setBiasTables);

                // Call the parent component to trigger combination change
                if (onCombinationChange) {
                    onCombinationChange(newCombination);
                }
            } else if (!editingCombination) {
                // For new combinations, auto-select the newly added combination
                if (onCombinationChange) {
                    onCombinationChange(newCombination);
                }
                setActiveTab(updatedCombinations.length - 1); // Switch to the new tab
            }

            setOpenDialog(false);
            setEditingCombination(null);
            setError('');
            setUnsavedChanges(true); // Mark as having unsaved changes
        } catch (error) {
            console.error('Error adding combination:', error);
            setError('Failed to add combination');
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setError('');
    };

    const getCuttingRoomOptions = () => {
        if (!formData.production_center) return [];

        // Filter cutting rooms that belong to the selected production center
        const cuttingRooms = productionCenterOptions
            .filter(opt => opt.production_center === formData.production_center)
            .map(opt => opt.cutting_room);

        // Remove duplicates and create options
        return [...new Set(cuttingRooms)].map(cr => ({ value: cr, label: cr }));
    };

    const getDestinationOptions = (cuttingRoom = null) => {
        const roomToCheck = cuttingRoom || formData.cutting_room;
        if (!roomToCheck) return [];

        const destinations = productionCenterOptions
            .filter(opt => opt.cutting_room === roomToCheck)
            .map(opt => opt.destination)
            .filter(dest => dest); // Remove null/empty destinations

        return [...new Set(destinations)].map(dest => ({ value: dest, label: dest }));
    };

    const getProductionCenterOptions = () => {
        const uniqueCenters = [...new Set(productionCenterOptions.map(opt => opt.production_center))];
        return uniqueCenters.map(center => ({ value: center, label: center }));
    };

    if (!selectedOrder) {
        return null;
    }

    return (
        <MainCard
            title="Production Center"
            secondary={
                <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleOpenAddDialog}
                    size="small"
                >
                    Add Configuration
                </Button>
            }
        >
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {combinations.length > 0 && (
                <Box>
                    {/* Interactive tabs - hidden when printing */}
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ mb: 3 }}
                        className="print-hidden"
                    >
                        {combinations.map((combination, index) => {
                            const percentage = calculateCombinationPercentage(combination);
                            return (
                                <Tab
                                    key={combination.combination_id}
                                    label={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <span>
                                                {combination.production_center} - {combination.cutting_room}
                                                {combination.destination && combination.destination !== combination.cutting_room && ` - ${combination.destination}`}
                                                {percentage > 0 && ` (${percentage}%)`}
                                            </span>
                                            <Edit
                                                fontSize="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCombination(combination);
                                                }}
                                                sx={{
                                                    ml: 1,
                                                    cursor: 'pointer',
                                                    '&:hover': { color: 'primary.main' }
                                                }}
                                            />
                                            <Delete
                                                fontSize="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCombination(combination);
                                                }}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': { color: 'error.main' }
                                                }}
                                            />
                                        </Box>
                                    }
                                />
                            );
                        })}
                    </Tabs>

                    {/* Print-only text - shows selected combination for printing */}
                    <Box
                        sx={{
                            display: 'none',
                            '@media print': {
                                display: 'block',
                                mb: 1,
                                mt: 0,
                                p: 1,
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }
                        }}
                        className="production-center-print-header"
                    >
                        <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                            {(() => {
                                // Check if we're printing with a specific destination
                                const printDestination = document.body.getAttribute('data-print-destination');
                                let selectedCombination;

                                if (printDestination) {
                                    // Find the combination that matches the print destination
                                    selectedCombination = combinations.find(c => c.destination === printDestination);
                                } else {
                                    // Default to current active tab
                                    selectedCombination = combinations[activeTab];
                                }

                                if (selectedCombination) {
                                    const percentage = calculateCombinationPercentage(selectedCombination);
                                    const combinationText = `${selectedCombination.production_center} - ${selectedCombination.cutting_room}${selectedCombination.destination && selectedCombination.destination !== selectedCombination.cutting_room ? ` - ${selectedCombination.destination}` : ''}`;
                                    return percentage > 0 ? `${combinationText} (${percentage}%)` : combinationText;
                                }

                                return '';
                            })()}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Cumulative Quantities Section - Only show for 2nd combination onwards */}
            {selectedOrder && orderSizes.length > 0 && combinations.length > 0 && activeTab > 0 && (
                <CumulativeQuantities
                    orderSizes={orderSizes}
                    combinations={combinations}
                    currentTabIndex={activeTab}
                    tables={tables}
                />
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Autocomplete
                                options={getProductionCenterOptions()}
                                getOptionLabel={(option) => option.label}
                                value={getProductionCenterOptions().find(opt => opt.value === formData.production_center) || null}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        production_center: newValue?.value || '',
                                        cutting_room: '', // Reset cutting room when production center changes
                                        destination: '' // Reset destination when production center changes
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Production Center" fullWidth />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                options={getCuttingRoomOptions()}
                                getOptionLabel={(option) => option.label}
                                value={getCuttingRoomOptions().find(opt => opt.value === formData.cutting_room) || null}
                                onChange={(event, newValue) => {
                                    const selectedCuttingRoom = newValue?.value || '';

                                    // Get destinations for the selected cutting room
                                    const availableDestinations = getDestinationOptions(selectedCuttingRoom);

                                    // Auto-select destination if there's only one option
                                    let autoDestination = '';
                                    if (selectedCuttingRoom && availableDestinations.length === 1) {
                                        autoDestination = availableDestinations[0].value;
                                    }

                                    setFormData(prev => ({
                                        ...prev,
                                        cutting_room: selectedCuttingRoom,
                                        destination: autoDestination // Auto-select if only one option, otherwise reset
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Cutting Room" fullWidth required />
                                )}
                            />
                        </Grid>
                        {(formData.cutting_room === 'ZALLI' || formData.cutting_room === 'DELICIA') && (
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={getDestinationOptions()}
                                    getOptionLabel={(option) => option.label}
                                    value={getDestinationOptions().find(opt => opt.value === formData.destination) || null}
                                    onChange={(event, newValue) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            destination: newValue?.value || ''
                                        }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Destination" fullWidth required />
                                    )}
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddCombination} variant="contained" startIcon={<Save />}>
                        {editingCombination ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCancelDelete}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{
                    color: 'error.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Delete color="error" />
                    Remove Production Center
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        You are about to remove the production center configuration:
                    </Typography>

                    {combinationToDelete && (
                        <Box sx={{
                            p: 2,
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                            mb: 2,
                            border: '1px solid',
                            borderColor: 'grey.300'
                        }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                                {combinationToDelete.production_center} - {combinationToDelete.cutting_room}
                                {combinationToDelete.destination && ` → ${combinationToDelete.destination}`}
                            </Typography>
                        </Box>
                    )}

                    {combinations.length <= 1 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Note:</strong> This is the last production center configuration for this order.
                                Removing it will leave the order without any production center assignment.
                            </Typography>
                        </Alert>
                    )}

                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>This will also remove:</strong>
                        </Typography>
                        <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                            <li>All mattress tables assigned to this production center</li>
                            <li>All collaretto tables (Along, Weft, Bias) for this configuration</li>
                            <li>All data and calculations within these tables</li>
                        </Typography>
                    </Alert>

                    <Typography variant="body2" color="text.secondary">
                        This action cannot be undone. Are you sure you want to continue?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleCancelDelete}
                        variant="outlined"
                        startIcon={<Cancel />}
                    >
                        Keep Configuration
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                    >
                        Remove Everything
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
});

export default ProductionCenterTabs;
