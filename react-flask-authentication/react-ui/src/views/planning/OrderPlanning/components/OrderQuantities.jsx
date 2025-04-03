import React from 'react';
import { Box, Grid, TextField, Typography, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

const OrderQuantities = ({ orderSizes }) => {
  const theme = useTheme();
  if (!orderSizes.length) return null;

  const totalQty = orderSizes.reduce((sum, size) => sum + size.qty, 0);

  return (
    <Box mt={3} p={2} sx={{ background: '#f5f5f5', borderRadius: '8px' }}>
      <Grid container spacing={2}>
        {orderSizes.map((size, index) => {
          const percentage = totalQty ? Math.round((size.qty / totalQty) * 100) : 0;
          
          return (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  label={`Size: ${size.size}`}
                  variant="outlined"
                  value={size.qty}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ width: '100%' }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 12,
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    pointerEvents: 'none',
                  }}
                >
                  {percentage}%
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

OrderQuantities.propTypes = {
  orderSizes: PropTypes.arrayOf(
    PropTypes.shape({
      size: PropTypes.string.isRequired,
      qty: PropTypes.number.isRequired
    })
  ).isRequired
};

export default OrderQuantities;