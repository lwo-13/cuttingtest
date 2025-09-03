import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AlongActionRowReadOnly = ({ table }) => {
  const { t } = useTranslation();

  // Calculate totals for planned rolls and planned consumption
  const totalPlannedRolls = table.rows?.reduce((sum, row) => sum + (parseInt(row.rolls) || 0), 0) || 0;
  const totalPlannedCons = table.rows?.reduce((sum, row) => sum + (parseFloat(row.consPlanned) || 0), 0) || 0;

  return (
    <Box
      className="consumption-summary"
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        p: 2
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {t('table.rollsPlanned')}: {totalPlannedRolls}, {t('table.plannedConsShort')}: {totalPlannedCons.toFixed(2)} m
      </Typography>
    </Box>
  );
};

export default AlongActionRowReadOnly;
