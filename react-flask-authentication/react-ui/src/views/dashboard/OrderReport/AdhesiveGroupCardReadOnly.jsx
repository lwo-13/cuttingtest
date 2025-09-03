import React from 'react';
import { Grid, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ColorFieldWithDescription from 'components/ColorFieldWithDescription';

const AdhesiveGroupCardReadOnly = ({ table }) => {
  const { t } = useTranslation();

  return (
    <Box p={1}>
      <Grid container spacing={2}>
        {/* Fabric Type */}
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label={t('orderPlanning.fabricType', 'Fabric Type')}
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
            label={t('orderPlanning.fabricCode', 'Fabric Code')}
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
          <ColorFieldWithDescription
            label={t('table.fabricColor')}
            value={table.fabricColor || ''}
            readOnly={true}
            sx={{ width: '100%' }}
          />
        </Grid>

        {/* Allowance */}
        <Grid item xs={3} sm={2} md={1}>
          <TextField
            label={t('orderPlanning.allowance')}
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
            label={t('orderPlanning.spreadingMethod')}
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
