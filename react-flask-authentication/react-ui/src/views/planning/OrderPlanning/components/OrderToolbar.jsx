import React from 'react';
import { Grid, TextField, Autocomplete } from '@mui/material';

const OrderToolbar = ({
  styleOptions = [],
  selectedStyle,
  onStyleChange,
  orderOptions = [],
  filteredOrders = [],
  selectedOrder,
  selectedSeason,
  selectedBrand,
  selectedColorCode,
  onOrderChange
}) => {

  console.log("▶️ selectedOrder:", selectedOrder);
  console.log("▶️ orderOptions IDs:", orderOptions.map(o => o?.id));
  console.log("▶️ filteredOrders IDs:", filteredOrders.map(o => o?.id));
  console.log("▶️ is selectedOrder in orderOptions:", orderOptions.some(o => o?.id === selectedOrder?.id));

  return (
    <Grid container spacing={1} justifyContent="flex-start" alignItems="center">
      {/* Order Selection */}
      <Grid item xs={6} sm={4} md={2.5}>
        <Autocomplete
          options={filteredOrders.length > 0 ? filteredOrders : orderOptions}
          getOptionLabel={(option) => option?.id || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedOrder || null}
          onChange={(event, newValue) => onOrderChange(newValue || null)}
          renderInput={(params) => (
            <TextField {...params} label="Order/Commessa" variant="outlined" />
          )}
          sx={{ width: '100%', "& .MuiAutocomplete-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Style Dropdown*/}
      <Grid item xs={3} sm={2} md={1.5}>
        <Autocomplete
          options={styleOptions}
          value={selectedStyle || ''}
          onChange={(e, newValue) => {
            const newVal = newValue || '';
            if (newVal !== selectedStyle) {
              onStyleChange(newVal, true); // ✅ only fire when it changes
            }
          }}
          renderInput={(params) => <TextField {...params} label="Style" variant="outlined" fullWidth />}
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

    </Grid>
  );
};

export default OrderToolbar;