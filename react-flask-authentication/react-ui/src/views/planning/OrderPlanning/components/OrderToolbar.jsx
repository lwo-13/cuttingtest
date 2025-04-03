import React from 'react';
import { Grid, TextField, Autocomplete } from '@mui/material';

const OrderToolbar = ({
  orderOptions,
  selectedOrder,
  selectedSeason,
  selectedBrand,
  selectedStyle,
  selectedColorCode,
  onOrderChange
}) => {
  return (
    <Grid container spacing={1} justifyContent="flex-start" alignItems="center">
      {/* Order Selection */}
      <Grid item xs={6} sm={4} md={2.5}>
        <Autocomplete
          options={orderOptions}
          getOptionLabel={(option) => option.id}
          value={orderOptions.find(order => order.id === selectedOrder) || null}
          onChange={onOrderChange}
          renderInput={(params) => (
            <TextField {...params} label="Order/Commessa" variant="outlined" />
          )}
          sx={{ width: '100%', "& .MuiAutocomplete-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Season */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label="Season"
          variant="outlined"
          value={selectedSeason || ""}
          inputProps={{ readOnly: true }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Brand */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label="Brand"
          variant="outlined"
          value={selectedBrand || ""}
          inputProps={{ readOnly: true }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Style */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label="Style"
          variant="outlined"
          value={selectedStyle || ""}
          inputProps={{ readOnly: true }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Color */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label="Color"
          variant="outlined"
          value={selectedColorCode || ""}
          inputProps={{ readOnly: true }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>
    </Grid>
  );
};

export default OrderToolbar;