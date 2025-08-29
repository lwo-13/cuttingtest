import React from 'react';
import { Grid, Autocomplete, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ColorFieldWithDescription from 'components/ColorFieldWithDescription';

const BiasGroupCard = ({
  table,
  tables,
  fabricTypeOptions,
  isTableEditable,
  setTables,
  setUnsavedChanges,
  handleBiasExtraChange
}) => {
  const { t } = useTranslation();

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

        {/* Fabric Code */}
        <Grid item xs={3} sm={2} md={1.8}>
          <TextField
            label={t('orderPlanning.fabricCode', 'Fabric Code')}
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
          <ColorFieldWithDescription
            label={t('orderPlanning.fabricColor', 'Fabric Color')}
            value={table.fabricColor || ""}
            readOnly={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricColor: value } : t
                )
              );
              setUnsavedChanges(true);
            }}
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