import React from 'react';
import { Grid, Autocomplete, TextField, Box, Paper } from '@mui/material';
import {
  getProductionCenterOptions,
  getCuttingRoomOptions,
  getDestinationOptions,
  getAutoSelectedDestination
} from 'utils/productionCenterConfig';

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
  // Get dropdown options based on current selections
  const productionCenterOptions = getProductionCenterOptions();
  const cuttingRoomOptions = getCuttingRoomOptions(table.productionCenter);
  const destinationOptions = getDestinationOptions(table.cuttingRoom);

  return (
    <Box p={1}>
      {/* Production Center Information Box */}
      <Paper sx={{ p: 1 , mb: 2, bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
        <Grid container spacing={2}>
          <Grid item xs={3} md={2}>
            <Autocomplete
              options={productionCenterOptions}
              getOptionLabel={(option) => option.label}
              value={productionCenterOptions.find(opt => opt.value === table.productionCenter) || null}
              disabled={!isTableEditable(table)}
              onChange={(event, newValue) => {
                setTables(prev =>
                  prev.map(t =>
                    t.id === table.id ? {
                      ...t,
                      productionCenter: newValue?.value || null,
                      cuttingRoom: null, // Reset cutting room when production center changes
                      destination: null  // Reset destination when production center changes
                    } : t
                  )
                );
                setUnsavedChanges(true);
              }}
              renderInput={(params) => <TextField {...params} label="Production Center" variant="outlined" />}
              sx={{
                width: '100%',
                minWidth: '60px',
                "& .MuiAutocomplete-input": { fontWeight: 'normal' }
              }}
            />
          </Grid>

          <Grid item xs={3} md={2}>
            <Autocomplete
              options={cuttingRoomOptions}
              getOptionLabel={(option) => option.label}
              value={cuttingRoomOptions.find(opt => opt.value === table.cuttingRoom) || null}
              disabled={!isTableEditable(table) || !table.productionCenter}
              onChange={(event, newValue) => {
                const autoDestination = getAutoSelectedDestination(newValue?.value);
                setTables(prev =>
                  prev.map(t =>
                    t.id === table.id ? {
                      ...t,
                      cuttingRoom: newValue?.value || null,
                      destination: autoDestination || null // Auto-select destination if only one option
                    } : t
                  )
                );
                setUnsavedChanges(true);
              }}
              renderInput={(params) => <TextField {...params} label="Cutting Room" variant="outlined" />}
              sx={{
                width: '100%',
                minWidth: '60px',
                "& .MuiAutocomplete-input": { fontWeight: 'normal' }
              }}
            />
          </Grid>

          <Grid item xs={3} md={2}>
            <Autocomplete
              options={destinationOptions}
              getOptionLabel={(option) => option.label}
              value={destinationOptions.find(opt => opt.value === table.destination) || null}
              disabled={!isTableEditable(table) || !table.cuttingRoom}
              onChange={(event, newValue) => {
                setTables(prev =>
                  prev.map(t =>
                    t.id === table.id ? {
                      ...t,
                      destination: newValue?.value || null
                    } : t
                  )
                );
                setUnsavedChanges(true);
              }}
              renderInput={(params) => <TextField {...params} label="Destination" variant="outlined" />}
              sx={{
                width: '100%',
                minWidth: '60px',
                "& .MuiAutocomplete-input": { fontWeight: 'normal' }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

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
