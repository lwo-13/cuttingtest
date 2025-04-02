import React from 'react';
import { Grid, Autocomplete, TextField, Box } from '@mui/material';

const MattressGroupCard = ({
  table,
  tableIndex,
  tables,
  fabricTypeOptions,
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
              !tables.some((t, i) => i !== tableIndex && t.fabricType === option)
            )}
            getOptionLabel={(option) => option}
            value={table.fabricType || null}
            disabled={!isTableEditable(table)}
            onChange={(event, newValue) => {
              setTables(prevTables => {
                const updatedTables = [...prevTables];
                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricType: newValue };
                return updatedTables;
              });
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
              setTables(prevTables => {
                const updatedTables = [...prevTables];
                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricCode: value };
                return updatedTables;
              });
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
              setTables(prevTables => {
                const updatedTables = [...prevTables];
                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricColor: value };
                return updatedTables;
              });
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
            options={["FACE UP", "FACE DOWN", "FACE TO FACE"]}
            getOptionLabel={(option) => option}
            value={table.spreadingMethod || null}
            disabled={!isTableEditable(table)}
            onChange={(event, newValue) => {
              setTables(prevTables => {
                const updatedTables = [...prevTables];
                updatedTables[tableIndex] = { ...updatedTables[tableIndex], spreadingMethod: newValue };
                return updatedTables;
              });
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

              setTables(prevTables => {
                const updatedTables = [...prevTables];
                updatedTables[tableIndex] = {
                  ...updatedTables[tableIndex],
                  allowance: value
                };

                updatedTables[tableIndex].rows.forEach((_, rowIndex) => {
                  updateExpectedConsumption(tableIndex, rowIndex);
                });

                return updatedTables;
              });
              setUnsavedChanges(true);
            }}
            sx={{
              width: '100%',
              minWidth: '60px',
              "& input": { fontWeight: "normal" }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MattressGroupCard;