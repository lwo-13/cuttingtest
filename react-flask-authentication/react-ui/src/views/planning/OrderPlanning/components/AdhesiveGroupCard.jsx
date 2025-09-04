import React from 'react';
import { Grid, Autocomplete, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ColorFieldWithDescription from 'components/ColorFieldWithDescription';

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
  const { t } = useTranslation();
  return (
    <Box p={1}>
      {/* Fabric Information */}
      <Grid container spacing={2}>

        {/* Fabric Type (Dropdown) */}
        <Grid item xs={3} sm={2} md={1}>
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

        {/* Fabric Code */}
        <Grid item xs={3} sm={2} md={1.8}>
          <TextField
            label={t('orderPlanning.fabricCode', 'Fabric Code')}
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
          <ColorFieldWithDescription
            label={t('orderPlanning.fabricColor', 'Fabric Color')}
            value={table.fabricColor || ''}
            readOnly={!isTableEditable(table)}
            onChange={(e) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricColor: e.target.value } : t
                )
              );
              setUnsavedChanges(true);
            }}
            debounceMs={400}
            minCharsForSearch={3}
            sx={{
              width: '100%',
              minWidth: '60px'
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
            renderInput={(params) => <TextField {...params} label={t('orderPlanning.spreadingMethod', 'Spreading Method')} variant="outlined" />}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& .MuiAutocomplete-input": { fontWeight: 'normal' }
            }}
          />
        </Grid>

        {/* Allowance */}
        <Grid item xs={2} sm={1.5} md={1.2}>
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
            renderInput={(params) => <TextField {...params} label={t('orderPlanning.spreading', 'Spreading')} variant="outlined" />}
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
