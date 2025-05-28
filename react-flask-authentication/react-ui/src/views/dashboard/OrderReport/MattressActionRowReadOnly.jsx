import React from 'react';
import { Box, Typography } from '@mui/material';

const MattressActionRowReadOnly = ({ avgConsumption = 0, table }) => {
  const rows = table.rows || [];

  // Expected total consumption
  const expectedTotal = rows.reduce((sum, row) => {
    const val = parseFloat(row.expectedConsumption);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Actual total consumption
  const actualTotal = rows.reduce((sum, row) => {
    const val = parseFloat(row.cons_actual);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Total pieces for actual avg
  const totalPieces = rows.reduce((total, row) => {
    const pcs = row.piecesPerSize || {};
    const rowTotal = Object.values(pcs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    return total + rowTotal;
  }, 0);

  const actualAvg = totalPieces > 0 ? actualTotal / totalPieces : 0;

  const showConsumption = expectedTotal > 0 || actualTotal > 0;

  return (
    <Box
      mt={2}
      display="flex"
      justifyContent="flex-start"
      alignItems="center"
      flexWrap="wrap"
      gap={3}
      sx={{ minHeight: '32px' }}
    >
      {showConsumption && (
        <>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Expected Avg Cons: {(avgConsumption || 0).toFixed(2)} m/pc
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Expected Total Cons: {expectedTotal.toFixed(0)} m
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Avg Cons: {actualAvg.toFixed(2)} m/pc
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Total Cons: {actualTotal.toFixed(0)} m
          </Typography>
        </>
      )}
    </Box>
  );
};

export default MattressActionRowReadOnly;

