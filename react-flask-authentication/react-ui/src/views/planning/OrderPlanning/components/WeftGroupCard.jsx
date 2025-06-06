import React from 'react';
import { Grid, Autocomplete, TextField, Box, Paper } from '@mui/material';
import {
  getProductionCenterOptions,
  getCuttingRoomOptions,
  getDestinationOptions,
  getAutoSelectedDestination
} from 'utils/productionCenterConfig';

const WeftGroupCard = ({
  table,
  tables,
  fabricTypeOptions,
  isTableEditable,
  setTables,
  setUnsavedChanges,
  handleWeftExtraChange
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
                "& .MuiAutocomplete-input": { fontWeight: "normal" }
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
                const selectedCuttingRoom = newValue?.value || null;
                const autoDestination = selectedCuttingRoom ? getAutoSelectedDestination(selectedCuttingRoom) : null;

                setTables(prev =>
                  prev.map(t =>
                    t.id === table.id ? {
                      ...t,
                      cuttingRoom: selectedCuttingRoom,
                      destination: autoDestination // Auto-select if only one destination, otherwise null
                    } : t
                  )
                );
                setUnsavedChanges(true);
              }}
              renderInput={(params) => <TextField {...params} label="Cutting Room" variant="outlined" />}
              sx={{
                width: '100%',
                "& .MuiAutocomplete-input": { fontWeight: "normal" }
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
                    t.id === table.id ? { ...t, destination: newValue?.value || null } : t
                  )
                );
                setUnsavedChanges(true);
              }}
              renderInput={(params) => <TextField {...params} label="Destination" variant="outlined" />}
              sx={{
                width: '100%',
                "& .MuiAutocomplete-input": { fontWeight: "normal" }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

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
            value={table.weftExtra || ""}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 2);
              handleWeftExtraChange(table.id, value);
              setUnsavedChanges(true);
            }}
            sx={{ width: '100%', minWidth: '60px', "& input": { fontWeight: "normal" } }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WeftGroupCard;
