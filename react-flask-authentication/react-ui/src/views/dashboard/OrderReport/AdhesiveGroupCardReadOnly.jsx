import React from 'react';
import { Grid, TextField, Box } from '@mui/material';

const AdhesiveGroupCardReadOnly = ({ table }) => {
  return (
    <Box p={1}>
      <Grid container spacing={2}>
        {/* Fabric Type */}
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Fabric Type"
            value={table.fabricType || ''}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                '& .MuiInputBase-input': {
                  fontWeight: 'normal',
                }
              }
            }}
          />
        </Grid>

        {/* Fabric Code */}
        <Grid item xs={3} sm={2} md={2}>
          <TextField
            label="Fabric Code"
            value={table.fabricCode || ''}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                '& .MuiInputBase-input': {
                  fontWeight: 'normal',
                }
              }
            }}
          />
        </Grid>

        {/* Fabric Color */}
        <Grid item xs={3} sm={2} md={2}>
          <TextField
            label="Fabric Color"
            value={table.fabricColor || ''}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                '& .MuiInputBase-input': {
                  fontWeight: 'normal',
                }
              }
            }}
          />
        </Grid>

        {/* Allowance */}
        <Grid item xs={3} sm={2} md={1}>
          <TextField
            label="Allowance"
            value={table.allowance || ''}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                '& .MuiInputBase-input': {
                  fontWeight: 'normal',
                }
              }
            }}
          />
        </Grid>

        {/* Spreading Method */}
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Spreading Method"
            value={table.spreadingMethod || ''}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                '& .MuiInputBase-input': {
                  fontWeight: 'normal',
                }
              }
            }}
          />
        </Grid>

        {/* Spreading */}
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Spreading"
            value={table.spreading || ''}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                '& .MuiInputBase-input': {
                  fontWeight: 'normal',
                }
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdhesiveGroupCardReadOnly;
