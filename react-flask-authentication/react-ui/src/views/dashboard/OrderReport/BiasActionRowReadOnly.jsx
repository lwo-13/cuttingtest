import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BiasActionRowReadOnly = ({ table }) => {
  const { t } = useTranslation();

  // Calculate totals
  const totalPieces = table.rows?.reduce((sum, row) => sum + (parseInt(row.pieces) || 0), 0) || 0;
  const totalRolls = table.rows?.reduce((sum, row) => sum + (parseInt(row.rolls) || 0), 0) || 0;
  const totalRollsPlanned = table.rows?.reduce((sum, row) => sum + (parseFloat(row.rollsPlanned) || 0), 0) || 0;
  const totalConsPlanned = table.rows?.reduce((sum, row) => sum + (parseFloat(row.consPlanned) || 0), 0) || 0;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2,
        backgroundColor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'grey.300'
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {t('table.totals')}: {totalPieces} {t('table.pieces')}, {totalRolls} {t('table.rolls')}, {totalRollsPlanned.toFixed(1)} {t('table.rollsPlanned')}, {totalConsPlanned.toFixed(1)} {t('table.consPlanned')}
      </Typography>
    </Box>
  );
};

export default BiasActionRowReadOnly;
