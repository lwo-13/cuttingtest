import React, { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import MainCard from 'ui-component/cards/MainCard';

const ProductionCenterTabs = ({
    combinations = [],
    selectedCombination,
    onCombinationChange,
    loading = false
}) => {
    const { t } = useTranslation();
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
        <MainCard
            title={t('dashboard.productionCenter', 'Production Center')}
            sx={{ mb: 3 }}
            data-testid="production-center-card"
            className="production-center-card production-center-card-print"
        >
            <Box>
                {/* Interactive tabs - hidden when printing */}
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    className="print-hidden"
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

                {/* Print-only header showing selected combination */}
                {selectedCombination && (
                    <Box
                        sx={{
                            display: 'none',
                            '@media print': {
                                display: 'block !important',
                                p: 2,
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }
                        }}
                        className="production-center-print-header"
                    >
                        <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                            {selectedCombination.production_center} - {selectedCombination.cutting_room}
                            {selectedCombination.destination && selectedCombination.destination !== selectedCombination.cutting_room && ` - ${selectedCombination.destination}`}
                        </Typography>
                    </Box>
                )}
            </Box>
        </MainCard>
    );
};

export default ProductionCenterTabs;
