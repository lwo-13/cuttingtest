import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const AlongActionRow = ({
  tableId,
  table,
  isTableEditable,
  handleAddRowAlong,
  handleRemoveAlongTable,
  setUnsavedChanges
}) => {
  const { t } = useTranslation();
  const editable = isTableEditable(table);

  const totalConsumption = table.rows.reduce((sum, row) => {
    const val = parseFloat(row.consumption);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Grouping by collaretto type: grossLength + collarettoWidth
  const groupedStats = {};

  table.rows.forEach((row) => {
    const gross = parseFloat(row.theoreticalConsumption);
    const width = parseFloat(row.collarettoWidth);
    const consumption = parseFloat(row.consumption);
    const pieces = parseFloat(row.pieces);

    if (isNaN(gross) || isNaN(width) || isNaN(consumption) || isNaN(pieces)) return;

    const key = `${gross.toFixed(2)}-${width.toFixed(0)}`;

    if (!groupedStats[key]) {
      groupedStats[key] = { totalCons: 0, totalPcs: 0 };
    }

    groupedStats[key].totalCons += consumption;
    groupedStats[key].totalPcs += pieces;
  });

  // Friendly labels
  const typeLabels = {};
  let typeIndex = 0;
  Object.keys(groupedStats).forEach((key) => {
    typeLabels[key] = `Type ${String.fromCharCode(65 + typeIndex++)}`;
  });

  return (
    <Box
      mt={2}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
    >
      {/* Left side: Avg Consumption Summary */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', minHeight: '32px' }}>
        {Object.entries(groupedStats).map(([key, stats]) => {
          const avg = stats.totalPcs > 0 ? stats.totalCons / stats.totalPcs : 0;
          return (
            <Typography key={key} variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              ({key}): {t('orderPlanning.avgConsumption', 'Avg Consumption')} {avg.toFixed(3)} m/pc
            </Typography>
          );
        })}

        {totalConsumption > 0 && (
          <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {t('orderPlanning.totalConsumption', 'Total Consumption')}: {totalConsumption.toFixed(0)} m
          </Typography>
        )}
      </Box>

      {/* Right side: Action Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={() => {
            handleAddRowAlong(tableId);
            setUnsavedChanges(true);
          }}
        >
          {t('orderPlanning.addRow', 'Add Row')}
        </Button>

        {editable && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              handleRemoveAlongTable(tableId);
              setUnsavedChanges(true);
            }}
          >
            {t('orderPlanning.removeTable', 'Remove Table')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default AlongActionRow;