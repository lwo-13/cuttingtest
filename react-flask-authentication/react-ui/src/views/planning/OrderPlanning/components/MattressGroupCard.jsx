import React, { useState } from 'react';
import { Grid, Autocomplete, TextField, Box, IconButton, CircularProgress } from '@mui/material';
import { Refresh, AutoFixHigh } from '@mui/icons-material';
import MattressBulkAddDialog from './MattressBulkAddDialog';

const MattressGroupCard = ({
  table,
  tables,
  fabricTypeOptions,
  spreadingOptions,
  spreadingMethods,
  isTableEditable,
  setTables,
  setUnsavedChanges,
  updateExpectedConsumption,
  onRefreshMarkers,
  refreshingMarkers,
  markerOptions,
  onBulkAddRows
}) => {
  // Dialog state for bulk add
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);

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

        {/* Fabric Code (Text Input) */}
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
            sx={{
              width: '100%',
              minWidth: '60px',
              "& input": { fontWeight: "normal" }
            }}
          />
        </Grid>

        {/* Fabric Color (Text Input) */}
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
            sx={{
              width: '100%',
              minWidth: '60px',
              "& input": { fontWeight: "normal" }
            }}
          />
        </Grid>

        {/* Allowance */}
        <Grid item xs={1.5} sm={1.5} md={1.5}>
          <TextField
            label="Allowance [m]"
            variant="outlined"
            value={table?.allowance || ""}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value
                .replace(/[^0-9.,]/g, '')
                .replace(/[,]+/g, '.')
                .replace(/(\..*)\./g, '$1')
                .slice(0, 4);

              setTables(prev =>
                prev.map(t => {
                  if (t.id !== table.id) return t;

                  const updatedRows = t.rows.map(row => {
                    updateExpectedConsumption(t.id, row.id); // ✅ ID-based call
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
            sx={{
              width: '100%',
              minWidth: '60px',
              "& input": { fontWeight: "normal" }
            }}
          />
        </Grid>

        {/* Spreading Method (Dropdown) */}
        <Grid item xs={3} sm={2} md={2}>
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
            renderInput={(params) => (
              <TextField {...params} label="Spreading Method" variant="outlined" />
            )}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Spreading */}
        <Grid item xs={3} sm={2} md={2}>
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
            renderInput={(params) => (
              <TextField {...params} label="Spreading" variant="outlined" />
            )}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Magic Wand Icon */}
        <Grid item xs="auto">
          <IconButton
            size="small"
            onClick={() => setBulkAddDialogOpen(true)}
            sx={{
              color: 'secondary.main',
              '&:hover': { backgroundColor: 'secondary.light', color: 'white' },
              mt: 1
            }}
            title="Bulk add mattress rows"
          >
            <AutoFixHigh fontSize="small" />
          </IconButton>
        </Grid>

        {/* Refresh Markers Icon */}
        <Grid item xs="auto">
          <IconButton
            size="small"
            onClick={onRefreshMarkers}
            disabled={refreshingMarkers}
            sx={{
              color: 'primary.main',
              '&:hover': { backgroundColor: 'primary.light', color: 'white' },
              mt: 1
            }}
            title="Refresh markers"
          >
            {refreshingMarkers ? (
              <CircularProgress size={20} />
            ) : (
              <Refresh fontSize="small" />
            )}
          </IconButton>
        </Grid>
      </Grid>

      {/* Bulk Add Dialog */}
      <MattressBulkAddDialog
        open={bulkAddDialogOpen}
        onClose={() => setBulkAddDialogOpen(false)}
        markerOptions={markerOptions}
        onBulkAdd={(layerPackageNr, width, selectedMarker) => {
          onBulkAddRows(table.id, layerPackageNr, width, selectedMarker);
          setBulkAddDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default MattressGroupCard;