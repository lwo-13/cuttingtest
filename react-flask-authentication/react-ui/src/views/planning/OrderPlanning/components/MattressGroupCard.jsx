import React, { useState } from 'react';
import { Grid, Autocomplete, TextField, Box, IconButton, CircularProgress } from '@mui/material';
import { Refresh, AutoFixHigh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import MattressBulkAddDialog from './MattressBulkAddDialog';
import ColorFieldWithDescription from 'components/ColorFieldWithDescription';
import FabricCodeDropdown from './FabricCodeDropdown';
import useBomFabrics from '../hooks/useBomFabrics';

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
  onBulkAddRows,
  selectedOrder
}) => {
  const { t } = useTranslation();
  // Dialog state for bulk add
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);

  // BOM fabrics hook
  const {
    bomFabrics,
    loading: bomLoading,
    getColorCodeForFabric,
    fetchBomFabrics
  } = useBomFabrics(selectedOrder);

  return (
    <Box p={1}>
      {/* Fabric Information */}
      <Grid container spacing={2}>

        {/* Fabric Type (Dropdown) */}
        <Grid item xs={3} sm={2} md={1.2}>
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
            renderInput={(params) => <TextField {...params} label={t('orderPlanning.fabricType', 'Fabric Type')} variant="outlined" />}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Fabric Code (BOM Dropdown) */}
        <Grid item xs={3} sm={2} md={1.8}>
          <FabricCodeDropdown
            value={table.fabricCode || ""}
            disabled={!isTableEditable(table)}
            bomFabrics={bomFabrics}
            loading={bomLoading}
            getColorCodeForFabric={getColorCodeForFabric}
            fetchBomFabrics={fetchBomFabrics}
            onChange={(fabricCode) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricCode: fabricCode } : t
                )
              );
              setUnsavedChanges(true);
            }}
            onColorChange={(colorCode) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricColor: colorCode } : t
                )
              );
              setUnsavedChanges(true);
            }}
          />
        </Grid>

        {/* Fabric Color (Read-only, auto-populated from BOM) */}
        <Grid item xs={3} sm={2} md={1.5}>
          <ColorFieldWithDescription
            label={t('orderPlanning.fabricColor', 'Fabric Color')}
            value={table.fabricColor || ""}
            readOnly={true} // Always read-only since it's auto-populated from BOM
            onChange={() => {}} // No-op since it's read-only
            debounceMs={400}
            minCharsForSearch={3}
            sx={{
              width: '100%',
              minWidth: '60px'
            }}
          />
        </Grid>

        {/* Allowance */}
        <Grid item xs={2} sm={1.5} md={1.2}>
          <TextField
            label={t('orderPlanning.allowance', 'Allowance') + ' [m]'}
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
        <Grid item xs={3} sm={2} md={1.8}>
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
              <TextField {...params} label={t('orderPlanning.spreadingMethod', 'Spreading Method')} variant="outlined" />
            )}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Spreading */}
        <Grid item xs={3} sm={2} md={1.8}>
          <Autocomplete
            options={spreadingOptions}
            getOptionLabel={(option) => {
              if (option === 'AUTOMATIC') return t('orderPlanning.automatic', 'Automatic');
              if (option === 'MANUAL') return t('orderPlanning.manual', 'Manual');
              return option;
            }}
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
              <TextField {...params} label={t('orderPlanning.spreading', 'Spreading')} variant="outlined" />
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
        table={table}
        markerOptions={markerOptions}
        onBulkAdd={(bulkAddData) => {
          onBulkAddRows(table.id, bulkAddData);
          setBulkAddDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default MattressGroupCard;