import React from 'react';
import { Box, Typography } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

// ==============================|| COLLARETTO OPS - REPRINT ||============================== //

const CollarettoOpsReprint = () => {
  return (
    <MainCard title="Collaretto Reprint">
      <Box>
        <Typography variant="h6" gutterBottom>
          Collaretto Reprint
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This page will allow reprinting of existing collaretto documents.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Coming soon...
        </Typography>
      </Box>
    </MainCard>
  );
};

export default CollarettoOpsReprint;
