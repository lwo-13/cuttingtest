import { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axiosInstance';

const useProductionCenterTabs = ({ 
    selectedOrder, 
    tables, 
    adhesiveTables, 
    alongTables, 
    weftTables, 
    biasTables,
    setUnsavedChanges 
}) => {
    const [selectedCombination, setSelectedCombination] = useState(null);
    const [productionCenterOptions, setProductionCenterOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch production center options
    useEffect(() => {
        fetchProductionCenterOptions();
    }, []);

    const fetchProductionCenterOptions = async () => {
        try {
            // This endpoint should return all available production center combinations
            // You might need to create this endpoint or use existing ones
            const response = await axios.get('/mattress/production_center/options');
            if (response.data.success) {
                setProductionCenterOptions(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching production center options:', error);
            // Fallback to real production center options if API fails
            setProductionCenterOptions([
                { production_center: 'PXE1', cutting_room: 'ZALLI', destination: 'ZALLI 1 - SECTOR 1' },
                { production_center: 'PXE1', cutting_room: 'ZALLI', destination: 'ZALLI 1 - SECTOR 2' },
                { production_center: 'PXE1', cutting_room: 'ZALLI', destination: 'ZALLI 1 - SECTOR 3' },
                { production_center: 'PXE1', cutting_room: 'ZALLI', destination: 'ZALLI 2' },
                { production_center: 'PXE1', cutting_room: 'ZALLI', destination: 'ZALLI 3' },
                { production_center: 'PXE1', cutting_room: 'ZALLI', destination: 'TEXCONS' },
                { production_center: 'PXE1', cutting_room: 'ZALLI', destination: 'VERONA' },
                { production_center: 'PXE1', cutting_room: 'VERONA', destination: 'VERONA' },
                { production_center: 'PXE1', cutting_room: 'TEXCONS', destination: 'TEXCONS' },
                { production_center: 'PXE3', cutting_room: 'DELICIA', destination: 'DELICIA' },
                { production_center: 'PXE3', cutting_room: 'VEGATEX', destination: 'VEGATEX' },
            ]);
        }
    };

    // Handle combination change
    const handleCombinationChange = useCallback((combination) => {
        setSelectedCombination(combination);
    }, []);

    // Filter tables based on selected combination
    const getFilteredTables = useCallback((allTables, tableType) => {
        if (!selectedCombination || !allTables) {
            return allTables || [];
        }

        // Filter tables that either:
        // 1. Match the selected production center combination, OR
        // 2. Don't have production center data assigned yet (so they can be assigned to current combination)
        return allTables.filter(table => {
            // Show tables that match the selected combination
            const matchesSelectedCombination = (
                table.productionCenter === selectedCombination.production_center &&
                table.cuttingRoom === selectedCombination.cutting_room &&
                table.destination === selectedCombination.destination
            );

            // Show tables that don't have production center data yet
            const hasNoProductionCenter = (
                !table.productionCenter &&
                !table.cuttingRoom &&
                !table.destination
            );

            return matchesSelectedCombination || hasNoProductionCenter;
        });
    }, [selectedCombination]);

    // Get filtered tables for each type
    const filteredTables = getFilteredTables(tables, 'MATTRESS');
    const filteredAdhesiveTables = getFilteredTables(adhesiveTables, 'ADHESIVE');
    const filteredAlongTables = getFilteredTables(alongTables, 'ALONG');
    const filteredWeftTables = getFilteredTables(weftTables, 'WEFT');
    const filteredBiasTables = getFilteredTables(biasTables, 'BIAS');

    // Update table production center data when combination changes
    const updateTablesWithSelectedCombination = useCallback((tablesToUpdate, setTablesFunction, tableType) => {
        if (!selectedCombination || !tablesToUpdate) return;

        const updatedTables = tablesToUpdate.map(table => ({
            ...table,
            productionCenter: selectedCombination.production_center || '',
            cuttingRoom: selectedCombination.cutting_room || '',
            destination: selectedCombination.destination || ''
        }));

        setTablesFunction(updatedTables);
        setUnsavedChanges(true);
    }, [selectedCombination, setUnsavedChanges]);

    // Function to assign combination to tables (both new and existing)
    const assignCombinationToNewTable = useCallback((table) => {
        if (!selectedCombination) return table;

        return {
            ...table,
            productionCenter: selectedCombination.production_center || '',
            cuttingRoom: selectedCombination.cutting_room || '',
            destination: selectedCombination.destination || ''
        };
    }, [selectedCombination]);

    // Function to update tables when a combination is modified
    const updateTablesWithCombination = useCallback((oldCombination, newCombination, allTables, setTablesFunction) => {
        if (!oldCombination || !newCombination || !allTables || allTables.length === 0) return;

        const updatedTables = allTables.map(table => {
            // Check if this table was assigned to the old combination
            const wasAssignedToOldCombination = (
                table.productionCenter === oldCombination.production_center &&
                table.cuttingRoom === oldCombination.cutting_room &&
                table.destination === oldCombination.destination
            );

            // If it was assigned to the old combination, update it with the new combination
            if (wasAssignedToOldCombination) {
                return {
                    ...table,
                    productionCenter: newCombination.production_center || '',
                    cuttingRoom: newCombination.cutting_room || '',
                    destination: newCombination.destination || ''
                };
            }

            return table;
        });

        // Only update if there are actual changes
        const hasChanges = updatedTables.some((table, index) =>
            table.productionCenter !== allTables[index].productionCenter ||
            table.cuttingRoom !== allTables[index].cuttingRoom ||
            table.destination !== allTables[index].destination
        );

        if (hasChanges) {
            setTablesFunction(updatedTables);
            setUnsavedChanges(true);
        }
    }, [setUnsavedChanges]);

    // Check if any tables exist for the current combination
    const hasTablesForCombination = useCallback(() => {
        if (!selectedCombination) return false;

        const allTables = [
            ...(tables || []),
            ...(adhesiveTables || []),
            ...(alongTables || []),
            ...(weftTables || []),
            ...(biasTables || [])
        ];

        return allTables.some(table => 
            table.productionCenter === selectedCombination.production_center &&
            table.cuttingRoom === selectedCombination.cutting_room &&
            table.destination === selectedCombination.destination
        );
    }, [selectedCombination, tables, adhesiveTables, alongTables, weftTables, biasTables]);

    // Get combination summary for display
    const getCombinationSummary = useCallback(() => {
        if (!selectedCombination) return '';

        const parts = [];
        if (selectedCombination.production_center) {
            parts.push(`PC: ${selectedCombination.production_center}`);
        }
        if (selectedCombination.cutting_room) {
            parts.push(`CR: ${selectedCombination.cutting_room}`);
        }
        if (selectedCombination.destination) {
            parts.push(`Dest: ${selectedCombination.destination}`);
        }

        return parts.join(' | ');
    }, [selectedCombination]);

    // Reset when order changes
    useEffect(() => {
        if (!selectedOrder) {
            setSelectedCombination(null);
        }
    }, [selectedOrder]);

    return {
        selectedCombination,
        selectedCombinationId: selectedCombination?.combination_id,
        productionCenterOptions,
        loading,
        handleCombinationChange,
        filteredTables,
        filteredAdhesiveTables,
        filteredAlongTables,
        filteredWeftTables,
        filteredBiasTables,
        updateTablesWithCombination,
        assignCombinationToNewTable,
        hasTablesForCombination,
        getCombinationSummary
    };
};

export default useProductionCenterTabs;
