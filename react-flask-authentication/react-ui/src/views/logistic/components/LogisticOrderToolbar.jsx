import React from 'react';
import { Box, Grid, Autocomplete, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LogisticOrderToolbar = ({
  orderOptions = [],
  selectedOrder,
  onOrderChange,
  selectedStyle,
  selectedSeason,
  selectedBrand,
  selectedColorCode
}) => {
  const { t } = useTranslation();

  return (
    <Box sx={{
      '@media print': {
        width: '100%',
        '& .MuiGrid-container': {
          flexWrap: 'nowrap !important',
          width: '100%'
        }
      }
    }}>
      <Grid container spacing={2} alignItems="center">

      {/* Order Selection */}
      <Grid item xs={12} sm={6} md={3}>
        <Autocomplete
          options={orderOptions}
          getOptionLabel={(option) => option?.id || ""}
          value={selectedOrder}
          onChange={(event, newValue) => {
            onOrderChange(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('orderPlanning.order', 'Order')}
              variant="outlined"
              sx={{ width: '100%', minWidth: '120px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
            />
          )}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          sx={{ width: '100%', minWidth: '120px' }}
        />
      </Grid>

      {/* Style */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label={t('orderPlanning.style', 'Style')}
          variant="outlined"
          value={selectedStyle || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Color */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label={t('orderPlanning.color', 'Color')}
          variant="outlined"
          value={selectedColorCode || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Season */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label={t('orderPlanning.season', 'Season')}
          variant="outlined"
          value={selectedSeason || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Brand */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label={t('orderPlanning.brand', 'Brand')}
          variant="outlined"
          value={selectedBrand || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      </Grid>
    </Box>
  );
};

export default LogisticOrderToolbar;
