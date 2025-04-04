import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import PropTypes from 'prop-types';

const OrderQuantities = ({ orderSizes }) => {
  const [openPopup, setOpenPopup] = useState(false);
  const theme = useTheme();
  if (!orderSizes.length) return null;

  const totalQty = orderSizes.reduce((sum, size) => sum + size.qty, 0);

  return (
    <Box mt={3} p={2} sx={{ background: '#f5f5f5', borderRadius: '8px' }}>
      <Grid container spacing={2}>

        {/* Total Field */}
        <Grid item xs={4} sm={3} md={2}>
          <TextField
            label="Total"
            variant="outlined"
            value={totalQty}
            slotProps={{ input: { readOnly: true } }}
            sx={{ width: '100%' }}
          />
        </Grid>

        {orderSizes.map((size, index) => {
          const percentage = totalQty ? Math.round((size.qty / totalQty) * 100) : 0;
          
          return (
            <Grid item xs={4} sm={3} md={2} key={index}>
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

        {/*<Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" alignItems="center">
            <Button
              variant="outlined"
              onClick={() => setOpenPopup(true)}
              sx={{ fontSize: '1.5rem', minWidth: 48 }}
              title="Set Italian Ratio"
            >
              🇮🇹
            </Button>
          </Box>
        </Grid>

        <Dialog open={openPopup} onClose={() => setOpenPopup(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Italian Ratio Setup</DialogTitle>
          <DialogContent>
            <Typography>
              Define or view the Italian ratios here. You can insert inputs or visual tools.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPopup(false)}>Close</Button>
          </DialogActions>
        </Dialog>*/}

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