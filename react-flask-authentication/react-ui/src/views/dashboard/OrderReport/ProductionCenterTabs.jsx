import React, { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography
} from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const ProductionCenterTabs = ({
    combinations = [],
    selectedCombination,
    onCombinationChange,
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState(0);

    // Update active tab when selectedCombination changes
    useEffect(() => {
        if (selectedCombination) {
            const index = combinations.findIndex(combo => 
                combo.cutting_room === selectedCombination.cutting_room && 
                combo.destination === selectedCombination.destination
            );
            if (index >= 0) {
                setActiveTab(index);
            }
        }
    }, [selectedCombination, combinations]);

    // Auto-select first combination if none selected
    useEffect(() => {
        if (combinations.length > 0 && !selectedCombination && onCombinationChange) {
            onCombinationChange(combinations[0]);
        }
    }, [combinations, selectedCombination, onCombinationChange]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        const selectedCombo = combinations[newValue];
        if (selectedCombo && onCombinationChange) {
            onCombinationChange(selectedCombo);
        }
    };

    if (!combinations || combinations.length === 0) {
        return null;
    }

    // Always show tabs, even for single combination (like Order Planning)

    return (
        <MainCard title="Production Center" sx={{ mb: 3 }}>
            <Box>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {combinations.map((combination, index) => (
                        <Tab
                            key={`${combination.cutting_room}-${combination.destination}`}
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <span>
                                        {combination.production_center} - {combination.cutting_room}
                                        {combination.destination && combination.destination !== combination.cutting_room && ` - ${combination.destination}`}
                                    </span>
                                </Box>
                            }
                            disabled={loading}
                        />
                    ))}
                </Tabs>
            </Box>
        </MainCard>
    );
};

export default ProductionCenterTabs;
