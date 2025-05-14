import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';

const MattressActionRow = ({ 
  avgConsumption, 
  tableId, 
  isTableEditable, 
  table, 
  handleAddRow, 
  handleRemoveTable 
}) => {

  const totalConsumption = table.rows.reduce((sum, row) => {
    const value = parseFloat(row.expectedConsumption);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  return (
    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
      
      {/* Consumption Info */}
      {avgConsumption > 0 && totalConsumption > 0 && (
        <Box
          display="flex"
          gap={2}
          flexWrap="nowrap" // 🔒 disables line wrap
          alignItems="center"
          sx={{ padding: '4px 8px', minWidth: '240px', width: 'fit-content' }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
          >
            Avg Cons: {avgConsumption.toFixed(2)} m/pc
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
          >
            Total Cons: {totalConsumption.toFixed(0)} m
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={() => handleAddRow(tableId)}
        >
          Add Row
        </Button>

        {isTableEditable(table) && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleRemoveTable(table.id)}
          >
            Remove
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default MattressActionRow;
