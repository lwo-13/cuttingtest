import React from 'react';
import { Box, Typography } from '@mui/material';

const MattressActionRowReadOnly = ({ table }) => {
  const rows = table.rows || [];

  // Sum of cons_actual (Expected Total)
  const expectedTotal = rows.reduce((sum, row) => {
    const val = parseFloat(row.cons_actual);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Sum of cons_real (Real/Total Cons)
  const realTotal = rows.reduce((sum, row) => {
    const val = parseFloat(row.cons_real);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Total pieces for actual avg
  const totalPieces = rows.reduce((total, row) => {
    const pcsPerSize = row.piecesPerSize || {};
    const piecesPerLayer = Object.values(pcsPerSize).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const layers = parseFloat(row.layers_a) || 0;
    return total + (piecesPerLayer * layers);
  }, 0);

  const expectedAvg = totalPieces > 0 ? expectedTotal / totalPieces : 0;
  const realAvg = totalPieces > 0 ? realTotal / totalPieces : 0;

  const showConsumption = expectedTotal > 0 || realTotal > 0;

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
            Expected Avg Cons: {expectedAvg.toFixed(2)} m/pc
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Expected Total Cons: {expectedTotal.toFixed(0)} m
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Avg Cons: {realAvg.toFixed(2)} m/pc
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Total Cons: {realTotal.toFixed(0)} m
          </Typography>
        </>
      )}
    </Box>
  );
};

export default MattressActionRowReadOnly;

