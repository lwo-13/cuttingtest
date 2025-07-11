import React from 'react';
import { Grid, Autocomplete, TextField, Box } from '@mui/material';

const BiasGroupCard = ({
  table,
  tables,
  fabricTypeOptions,
  isTableEditable,
  setTables,
  setUnsavedChanges,
  handleBiasExtraChange
}) => {


  return (
    <Box p={1}>
      {/* Fabric Information */}
      <Grid container spacing={2}>
        {/* Fabric Type */}
        <Grid item xs={3} sm={2} md={1.5}>
          <Autocomplete
            options={fabricTypeOptions}
            getOptionLabel={(option) => option}
            value={table.fabricType || null}
            disabled={!isTableEditable(table)}
            onChange={(event, newValue) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricType: newValue } : t
                )
              );
              setUnsavedChanges(true);
            }}
            renderInput={(params) => <TextField {...params} label="Fabric Type" variant="outlined" />}
            sx={{ width: '100%', minWidth: '60px', "& .MuiAutocomplete-input": { fontWeight: 'normal' } }}
          />
        </Grid>

        {/* Fabric Code */}
        <Grid item xs={3} sm={2} md={2}>
          <TextField
            label="Fabric Code"
            variant="outlined"
            value={table.fabricCode || ""}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, 8);
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricCode: value } : t
                )
              );
              setUnsavedChanges(true);
            }}
            sx={{ width: '100%', minWidth: '60px', "& input": { fontWeight: "normal" } }}
          />
        </Grid>

        {/* Fabric Color */}
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Fabric Color"
            variant="outlined"
            value={table.fabricColor || ""}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricColor: value } : t
                )
              );
              setUnsavedChanges(true);
            }}
            sx={{ width: '100%', minWidth: '60px', "& input": { fontWeight: "normal" } }}
          />
        </Grid>

        {/* Extra % */}
        <Grid item xs={2} sm={1} md={1}>
          <TextField
            label="Extra %"
            variant="outlined"
            value={table.biasExtra ?? ""}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 2);
              handleBiasExtraChange(table.id, value);
              setUnsavedChanges(true);
            }}
            sx={{ width: '100%', minWidth: '60px', "& input": { fontWeight: "normal" } }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BiasGroupCard;