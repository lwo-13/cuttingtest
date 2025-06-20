import React from 'react';
import { Grid, Autocomplete, TextField, Box } from '@mui/material';

const AdhesiveGroupCard = ({
  table,
  tables,
  fabricTypeOptions,
  spreadingOptions,
  spreadingMethods,
  isTableEditable,
  setTables,
  setUnsavedChanges,
  updateExpectedConsumption
}) => {
  return (
    <Box p={1}>
      {/* Fabric Information */}
      <Grid container spacing={2}>

        {/* Fabric Type (Dropdown) */}
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
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Fabric Code */}
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Fabric Code"
            value={table.fabricCode || ''}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricCode: e.target.value } : t
                )
              );
              setUnsavedChanges(true);
            }}
            fullWidth
            variant="outlined"
            sx={{
              minWidth: '60px',
              "& .MuiInputBase-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Fabric Color */}
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Fabric Color"
            value={table.fabricColor || ''}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricColor: e.target.value } : t
                )
              );
              setUnsavedChanges(true);
            }}
            fullWidth
            variant="outlined"
            sx={{
              minWidth: '60px',
              "& .MuiInputBase-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Spreading Method (Dropdown) */}
        <Grid item xs={3} sm={2} md={1.5}>
          <Autocomplete
            options={spreadingMethods}
            getOptionLabel={(option) => option}
            value={table.spreadingMethod || null}
            disabled={!isTableEditable(table)}
            onChange={(event, newValue) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, spreadingMethod: newValue } : t
                )
              );
              setUnsavedChanges(true);
            }}
            renderInput={(params) => <TextField {...params} label="Spreading Method" variant="outlined" />}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Allowance */}
        <Grid item xs={3} sm={2} md={1}>
          <TextField
            label="Allowance"
            value={table.allowance || ''}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d.]/g, '');
              setTables(prev =>
                prev.map(t => {
                  if (t.id !== table.id) return t;

                  const updatedRows = t.rows.map(row => {
                    updateExpectedConsumption(t.id, row.id); // ✅ Recalculate consumption for each row
                    return row;
                  });

                  return {
                    ...t,
                    allowance: value,
                    rows: updatedRows
                  };
                })
              );
              setUnsavedChanges(true);
            }}
            fullWidth
            variant="outlined"
            sx={{
              minWidth: '60px',
              "& .MuiInputBase-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Spreading (Dropdown) */}
        <Grid item xs={3} sm={2} md={1.5}>
          <Autocomplete
            options={spreadingOptions}
            getOptionLabel={(option) => option}
            value={table.spreading || null}
            disabled={!isTableEditable(table)}
            onChange={(event, newValue) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, spreading: newValue } : t
                )
              );
              setUnsavedChanges(true);
            }}
            renderInput={(params) => <TextField {...params} label="Spreading" variant="outlined" />}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

      </Grid>
    </Box>
  );
};

export default AdhesiveGroupCard;
