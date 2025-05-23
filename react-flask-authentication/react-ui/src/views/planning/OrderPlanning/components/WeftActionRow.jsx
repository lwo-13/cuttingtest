import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';

const WeftActionRow = ({
  tableId,
  table,
  isTableEditable,
  handleAddRowWeft,
  handleRemoveWeft,
  setUnsavedChanges
}) => {
  const editable = isTableEditable(table);

  const totalConsumption = table.rows.reduce((sum, row) => {
    const val = parseFloat(row.consumption);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <Box
      mt={2}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
    >
      {/* Left side: Total Consumption */}
      <Box sx={{ minWidth: '200px', height: '32px' }}>
        {totalConsumption > 0 && (
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
          >
            Total Cons: {totalConsumption.toFixed(0)} m
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
            handleAddRowWeft(tableId);
            setUnsavedChanges(true);
          }}
        >
          Add Row
        </Button>

        {editable && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              handleRemoveWeft(tableId);
              setUnsavedChanges(true);
            }}
          >
            Remove
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default WeftActionRow;

