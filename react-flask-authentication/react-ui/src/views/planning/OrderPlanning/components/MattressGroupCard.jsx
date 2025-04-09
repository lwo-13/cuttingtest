import React from 'react';
import { Grid, Autocomplete, TextField, Box } from '@mui/material';

const MattressGroupCard = ({
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
      <Grid container spacing={2}>
        {/* Fabric Type (Dropdown) */}
        <Grid item xs={3} sm={2} md={1.5}>
          <Autocomplete
            options={fabricTypeOptions.filter(option =>
              !tables.some(t => t.id !== table.id && t.fabricType === option)
            )}
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
      </Grid>
    </Box>
  );
};

export default MattressGroupCard;