import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MattressActionRowReadOnly = ({ table }) => {
  const { t } = useTranslation();
  const rows = table.rows || [];

  // Sum of cons_planned (Planned Total)
  const plannedTotal = rows.reduce((sum, row) => {
    const val = parseFloat(row.cons_planned);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Sum of cons_actual (Expected Total)
  const expectedTotal = rows.reduce((sum, row) => {
    const val = parseFloat(row.cons_actual);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Total planned pieces (using planned layers)
  const totalPlannedPieces = rows.reduce((total, row) => {
    const pcsPerSize = row.piecesPerSize || {};
    const piecesPerLayer = Object.values(pcsPerSize).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const plannedLayers = parseFloat(row.layers) || 0; // Use planned layers
    return total + (piecesPerLayer * plannedLayers);
  }, 0);

  // Total actual pieces (using actual layers)
  const totalActualPieces = rows.reduce((total, row) => {
    const pcsPerSize = row.piecesPerSize || {};
    const piecesPerLayer = Object.values(pcsPerSize).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const actualLayers = parseFloat(row.layers_a) || 0; // Use actual layers
    return total + (piecesPerLayer * actualLayers);
  }, 0);

  const plannedAvg = totalPlannedPieces > 0 ? plannedTotal / totalPlannedPieces : 0;
  const expectedAvg = totalActualPieces > 0 ? expectedTotal / totalActualPieces : 0;

  const showConsumption = (plannedTotal > 0 && totalPlannedPieces > 0) || (expectedTotal > 0 && totalActualPieces > 0);

  return (
    <Box
      className="consumption-summary"
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
            {t('table.plannedAvgCons')}: {plannedAvg.toFixed(2)} m/pc
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {t('table.plannedTotalCons')}: {plannedTotal.toFixed(0).toLocaleString()} m
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {t('table.expectedAvgCons')}: {expectedAvg.toFixed(2)} m/pc
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {t('table.expectedTotalCons')}: {expectedTotal.toFixed(0).toLocaleString()} m
          </Typography>
        </>
      )}
    </Box>
  );
};

export default MattressActionRowReadOnly;

