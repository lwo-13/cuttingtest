import React from 'react';
import { Box, Typography } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

// ==============================|| COLLARETTO OPS - DELETE ||============================== //

const CollarettoOpsDelete = () => {
  return (
    <MainCard title="Collaretto Delete">
      <Box>
        <Typography variant="h6" gutterBottom>
          Collaretto Delete
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This page will allow deletion of collaretto records.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Coming soon...
        </Typography>
      </Box>
    </MainCard>
  );
};

export default CollarettoOpsDelete;
