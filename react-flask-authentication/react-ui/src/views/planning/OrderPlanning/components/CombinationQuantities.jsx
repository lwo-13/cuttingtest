import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  InputAdornment
} from '@mui/material';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const CombinationQuantities = ({
  orderSizes,
  combinationQuantity,
  onCombinationQuantityChange,
  selectedCombination
}) => {
  const { t } = useTranslation();
  const [totalQuantity, setTotalQuantity] = useState(combinationQuantity || 0);
  const [calculatedSizes, setCalculatedSizes] = useState([]);

  // Debug props
  console.log('📊 CombinationQuantities props:', {
    combinationQuantity,
    selectedCombination,
    combinationId: selectedCombination?.combination_id
  });

  // Calculate original order total and percentages
  const originalTotal = orderSizes.reduce((sum, size) => sum + size.qty, 0);
  const originalPercentages = orderSizes.reduce((acc, size) => {
    acc[size.size] = originalTotal ? (size.qty / originalTotal) * 100 : 0;
    return acc;
  }, {});

  // Calculate size quantities based on total quantity and original percentages
  useEffect(() => {
    if (totalQuantity && originalTotal) {
      const calculated = orderSizes.map(size => {
        const percentage = originalPercentages[size.size];
        const calculatedQty = Math.round((totalQuantity * percentage) / 100);
        return {
          size: size.size,
          qty: calculatedQty,
          percentage: percentage.toFixed(1)
        };
      });
      setCalculatedSizes(calculated);
    } else {
      setCalculatedSizes(orderSizes.map(size => ({
        size: size.size,
        qty: 0,
        percentage: originalPercentages[size.size].toFixed(1)
      })));
    }
  }, [totalQuantity, orderSizes, originalTotal]);

  // Handle total quantity change
  const handleTotalQuantityChange = (event) => {
    const value = parseInt(event.target.value) || 0;
    console.log('📝 CombinationQuantities input change:', {
      value,
      selectedCombination,
      combinationId: selectedCombination?.combination_id
    });
    setTotalQuantity(value);
    if (onCombinationQuantityChange) {
      onCombinationQuantityChange(value);
    }
  };

  if (!orderSizes.length) return null;

  return (
    <Box mt={3} p={2} sx={{ background: '#f5f5f5', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {selectedCombination ?
          `Quantities for ${selectedCombination.production_center} - ${selectedCombination.cutting_room}${selectedCombination.destination && selectedCombination.destination !== selectedCombination.cutting_room ? ` - ${selectedCombination.destination}` : ''}` :
          'Combination Quantities'
        }
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
        {/* Total Quantity Input */}
        <Grid item xs={4} sm={3} md={1.4}>
          <TextField
            label={t('orderPlanning.totalAssigned', 'Total Assigned')}
            variant="outlined"
            type="number"
            value={totalQuantity}
            onChange={handleTotalQuantityChange}
            sx={{ width: '100%' }}
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
        </Grid>

        {/* Original Order Total (Read-only) */}
        <Grid item xs={4} sm={3} md={1.4}>
          <TextField
            label={t('orderPlanning.originalTotal', 'Original Total')}
            variant="outlined"
            value={originalTotal}
            slotProps={{ input: { readOnly: true } }}
            sx={{
              width: '100%',
              '& .MuiInputBase-input': {
                color: 'text.secondary',
                fontStyle: 'italic'
              }
            }}
          />
        </Grid>

        {/* Percentage of Original */}
        <Grid item xs={4} sm={3} md={1.4}>
          <TextField
            label={t('orderPlanning.percentageOfOriginal', '% of Original')}
            variant="outlined"
            value={originalTotal ? ((totalQuantity / originalTotal) * 100).toFixed(1) : '0.0'}
            slotProps={{ input: { readOnly: true } }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-input': {
                color: 'primary.main',
                fontWeight: 'bold'
              }
            }}
          />
        </Grid>

        {/* Calculated Size Quantities */}
        {calculatedSizes.map((size, index) => (
          <Grid item xs={4} sm={3} md={1.4} key={index}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                label={`${t('orderPlanning.size', 'Size')}: ${size.size}`}
                variant="outlined"
                value={size.qty}
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  width: '100%',
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
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
                  color: '#12239e',
                  pointerEvents: 'none',
                }}
              >
                {size.percentage}%
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      </Box>

      {/* Summary Information */}
      {totalQuantity > 0 && (
        <Box mt={2} p={1} sx={{ background: '#e3f2fd', borderRadius: '4px' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Summary:</strong> {totalQuantity} pieces assigned ({originalTotal ? ((totalQuantity / originalTotal) * 100).toFixed(1) : '0'}% of original order)
            distributed across {calculatedSizes.length} sizes based on original order proportions.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

CombinationQuantities.propTypes = {
  orderSizes: PropTypes.arrayOf(
    PropTypes.shape({
      size: PropTypes.string.isRequired,
      qty: PropTypes.number.isRequired
    })
  ).isRequired,
  combinationQuantity: PropTypes.number,
  onCombinationQuantityChange: PropTypes.func,
  selectedCombination: PropTypes.object
};

export default CombinationQuantities;
