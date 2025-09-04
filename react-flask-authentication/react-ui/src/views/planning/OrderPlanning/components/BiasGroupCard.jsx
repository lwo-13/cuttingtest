import React from 'react';
import { Grid, Autocomplete, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ColorFieldWithDescription from 'components/ColorFieldWithDescription';
import FabricCodeDropdown from './FabricCodeDropdown';
import useBomFabrics from '../hooks/useBomFabrics';

const BiasGroupCard = ({
  table,
  tables,
  fabricTypeOptions,
  isTableEditable,
  setTables,
  setUnsavedChanges,
  handleBiasExtraChange,
  selectedOrder
}) => {
  const { t } = useTranslation();

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
        {/* Fabric Type */}
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
            sx={{ width: '100%', minWidth: '60px', "& .MuiAutocomplete-input": { fontWeight: 'normal' } }}
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
            sx={{ width: '100%', minWidth: '60px' }}
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