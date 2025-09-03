import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BiasActionRowReadOnly = ({ table }) => {
  const { t } = useTranslation();

  // Calculate totals
  const totalRolls = table.rows?.reduce((sum, row) => sum + (parseInt(row.rolls) || 0), 0) || 0;
  const totalPanels = table.rows?.reduce((sum, row) => sum + (parseInt(row.panels) || 0), 0) || 0;
  const totalConsPlanned = table.rows?.reduce((sum, row) => sum + (parseFloat(row.consPlanned) || 0), 0) || 0;

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
        {totalRolls} {t('table.rolls')}, {totalPanels} {t('table.panels')}, {totalConsPlanned.toFixed(1)} {t('table.cons')}
      </Typography>
    </Box>
  );
};

export default BiasActionRowReadOnly;
