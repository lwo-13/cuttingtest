import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const WeftActionRowReadOnly = ({ table }) => {
  const { t } = useTranslation();

  // Calculate totals for planned rolls, planned consumption, and panels
  const totalPlannedRolls = table.rows?.reduce((sum, row) => sum + (parseInt(row.rolls) || 0), 0) || 0;
  const totalPlannedCons = table.rows?.reduce((sum, row) => sum + (parseFloat(row.consPlanned) || 0), 0) || 0;
  const totalPanels = table.rows?.reduce((sum, row) => sum + (parseInt(row.panels) || 0), 0) || 0;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        p: 2
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        Planned Rolls: {totalPlannedRolls}, Planned Cons: {totalPlannedCons.toFixed(2)} m, Panels: {totalPanels}
      </Typography>
    </Box>
  );
};

export default WeftActionRowReadOnly;
