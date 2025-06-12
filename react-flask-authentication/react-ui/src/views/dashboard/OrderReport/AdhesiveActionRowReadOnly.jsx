import React from 'react';
import { Box, Typography } from '@mui/material';

const AdhesiveActionRowReadOnly = ({ table }) => {
  const rows = table.rows || [];

  // Sum of expectedConsumption (Total Consumption)
  const totalConsumption = rows.reduce((sum, row) => {
    const val = parseFloat(row.expectedConsumption);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Total pieces for average calculation
  const totalPieces = rows.reduce((total, row) => {
    const pcsPerSize = row.piecesPerSize || {};
    const piecesPerLayer = Object.values(pcsPerSize).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const layers = parseFloat(row.layers) || 0;
    return total + (piecesPerLayer * layers);
  }, 0);

  // Average consumption per piece
  const avgConsumption = totalPieces > 0 ? totalConsumption / totalPieces : 0;

  const showConsumption = totalConsumption > 0;

  return (
    <Box
      mt={2}
      display="flex"
      justifyContent="flex-start"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
    >
      {/* Consumption Info */}
      <Box sx={{ minWidth: '240px', height: '32px' }}>
        {showConsumption && (
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              Avg Cons: {avgConsumption.toFixed(2)} m/pc
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              Total Cons: {totalConsumption.toFixed(0)} m
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdhesiveActionRowReadOnly;
