import React from 'react';
import { Box, Grid, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const OrderQuantities = ({ orderSizes }) => {
  if (!orderSizes.length) return null;

  return (
    <Box mt={3} p={2} sx={{ background: '#f5f5f5', borderRadius: '8px' }}>
      <Grid container spacing={2}>
        {orderSizes.map((size, index) => (
          <Grid item xs={6} sm={4} md={2} key={index}>
            <TextField
              label={`Size: ${size.size}`}
              variant="outlined"
              value={size.qty}
              slotProps={{ input: { readOnly: true } }}
              sx={{ width: '100%' }}
            />
          </Grid>
        ))}
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