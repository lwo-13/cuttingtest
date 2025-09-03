import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography
} from '@mui/material';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const CumulativeQuantities = ({
  orderSizes,
  combinations,
  currentTabIndex,
  tables
}) => {
  const { t } = useTranslation();
  const [cumulativeQuantities, setCumulativeQuantities] = useState([]);

  // Calculate cumulative quantities from previous combinations
  useEffect(() => {
    if (!combinations.length || !tables.length || currentTabIndex === 0) {
      setCumulativeQuantities([]);
      return;
    }

    // Get all combinations before the current one
    const previousCombinations = combinations.slice(0, currentTabIndex);

    // Initialize size totals
    const sizeTotals = {};
    orderSizes.forEach(size => {
      sizeTotals[size.size] = 0;
    });

    // Calculate quantities from mattress tables with fabric type "01" for previous combinations
    previousCombinations.forEach((combination, combIndex) => {

      // Find mattress tables that match this combination and have fabric type "01"
      const matchingTables = tables.filter(table => {
        const matches = table.productionCenter === combination.production_center &&
          table.cuttingRoom === combination.cutting_room &&
          table.destination === combination.destination &&
          table.fabricType === '01'; // Only fabric type "01"



        return matches;
      });

      // Sum up quantities from these tables
      matchingTables.forEach((table, tableIndex) => {

        if (table.rows && table.rows.length > 0) {
          table.rows.forEach((row, rowIndex) => {
            // The size quantities are stored in the piecesPerSize object and need to be multiplied by layers
            if (row.piecesPerSize && typeof row.piecesPerSize === 'object') {
              const layers = parseInt(row.layers) || 1; // Default to 1 if no layers specified

              orderSizes.forEach(size => {
                const sizeKey = size.size;
                const piecesForSize = parseInt(row.piecesPerSize[sizeKey]) || 0;
                const totalQuantity = piecesForSize * layers; // Multiply by layers

                sizeTotals[sizeKey] += totalQuantity;
              });
            }
          });
        }
      });
    });

    // Convert to array format for display - show remaining quantities (original - planned)
    const remainingArray = orderSizes.map(size => ({
      size: size.size,
      originalQty: size.qty,
      plannedQty: sizeTotals[size.size],
      remainingQty: size.qty - sizeTotals[size.size] // Original - Already Planned
    }));

    setCumulativeQuantities(remainingArray);
  }, [combinations, currentTabIndex, tables, orderSizes]);

  // Calculate totals
  const totalOriginal = cumulativeQuantities.reduce((sum, size) => sum + size.originalQty, 0);
  const totalPlanned = cumulativeQuantities.reduce((sum, size) => sum + size.plannedQty, 0);
  const totalRemaining = cumulativeQuantities.reduce((sum, size) => sum + size.remainingQty, 0);

  if (currentTabIndex === 0 || !cumulativeQuantities.length) {
    return null;
  }

  return (
    <Box
      mt={3}
      p={2}
      sx={{
        background: '#f5f5f5',
        borderRadius: '8px'
      }}

    >
      <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
        Remaining Quantities (Original - Already Planned)
      </Typography>

      <Box sx={{
        '@media print': {
          width: '100%',
          '& .MuiGrid-container': {
            flexWrap: 'nowrap !important',
            width: '100%'
          }
        }
      }}>
        <Grid container spacing={2} alignItems="stretch" sx={{
          '@media print': {
            flexWrap: 'nowrap !important',
            width: '100%'
          }
        }}>
        {/* Total Remaining (Read-only) */}
        <Grid item xs={4} sm={3} md={1.4}>
          <TextField
            label={t('orderPlanning.totalRemaining', 'Total Remaining')}
            variant="outlined"
            value={totalRemaining}
            slotProps={{ input: { readOnly: true } }}
            sx={{
              width: '100%',
              '& .MuiInputBase-input': {
                color: totalRemaining >= 0 ? 'success.main' : 'error.main',
                fontWeight: 'bold'
              }
            }}
          />
        </Grid>

        {/* Remaining Size Quantities */}
        {cumulativeQuantities.map((size, index) => (
          <Grid item xs={4} sm={3} md={1.4} key={index}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                label={`${t('orderPlanning.size', 'Size')}: ${size.size}`}
                variant="outlined"
                value={size.remainingQty}
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  width: '100%',
                  '& .MuiInputBase-input': {
                    color: size.remainingQty >= 0 ? 'text.primary' : 'error.main',
                    fontWeight: 'normal'
                  }
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 12,
                  fontWeight: 'bold',
                  color: '#666',
                  pointerEvents: 'none',
                }}
              >
                {size.originalQty - size.plannedQty < size.originalQty ? `${size.plannedQty}/${size.originalQty}` : ''}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      </Box>

      {/* Summary Information */}
      {totalPlanned > 0 && (
        <Box mt={2} p={1} sx={{ background: totalRemaining >= 0 ? '#e8f5e8' : '#ffebee', borderRadius: '4px' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Summary:</strong> {totalPlanned} pieces already planned from previous combinations.
            {totalRemaining >= 0 ? `${totalRemaining} pieces remaining to plan.` : `${Math.abs(totalRemaining)} pieces over-planned!`}
          </Typography>
        </Box>
      )}

      {totalPlanned === 0 && (
        <Box mt={2} p={1} sx={{ background: '#e3f2fd', borderRadius: '4px' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> No quantities planned yet in previous combinations. Full order quantities available for planning.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

CumulativeQuantities.propTypes = {
  orderSizes: PropTypes.arrayOf(
    PropTypes.shape({
      size: PropTypes.string.isRequired,
      qty: PropTypes.number.isRequired
    })
  ).isRequired,
  combinations: PropTypes.array.isRequired,
  currentTabIndex: PropTypes.number.isRequired,
  tables: PropTypes.array.isRequired
};

export default CumulativeQuantities;
