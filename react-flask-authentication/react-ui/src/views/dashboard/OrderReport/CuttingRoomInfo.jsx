import React from 'react';
import { Grid, TextField, Button, Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';

const CuttingRoomInfo = ({ productionCenter, cuttingRoom, destination, onChangeSelection }) => {
  // Always show production center and cutting room
  // Only show destination for ZALLI and DELICIA (cutting rooms with multiple destinations)
  const shouldShowDestination = cuttingRoom === 'ZALLI' || cuttingRoom === 'DELICIA';

  return (
    <MainCard title="Production Center">
      <Grid container spacing={2}>
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Production Center"
            value={productionCenter || ''}
            placeholder="Not assigned"
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Grid>
        <Grid item xs={6} sm={2.5} md={1.5}>
          <TextField
            label="Cutting Room"
            value={cuttingRoom || ''}
            placeholder="Not assigned"
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Grid>
        {shouldShowDestination && (
          <Grid item xs={6} sm={2.5} md={1.5}>
            <TextField
              label="Destination"
              value={destination || ''}
              placeholder="Not assigned"
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
              sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
            />
          </Grid>
        )}

        {onChangeSelection && (
          <Grid item xs="auto">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Edit />}
              onClick={onChangeSelection}
              size="small"
              sx={{
                height: '48px',
                px: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none'
                }
              }}
            >
              Change Selection
            </Button>
          </Grid>
        )}
      </Grid>
    </MainCard>
  );
};

export default CuttingRoomInfo;
