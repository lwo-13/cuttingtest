import React from 'react';
import { Grid, TextField } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const CuttingRoomInfo = ({ productionCenter, cuttingRoom, destination }) => {
  // Show nothing if any field is missing
  if (!productionCenter || !cuttingRoom || !destination) return null;

  return (
    <MainCard title="Production Center Info">
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Production Center"
            value={productionCenter}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Cutting Room"
            value={cuttingRoom}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Destination"
            value={destination}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default CuttingRoomInfo;
