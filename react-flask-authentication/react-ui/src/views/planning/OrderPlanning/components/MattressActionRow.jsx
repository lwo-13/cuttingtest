import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';

const MattressActionRow = ({ 
  avgConsumption, 
  tableIndex, 
  isTableEditable, 
  table, 
  handleAddRow, 
  handleRemoveTable 
}) => {
  return (
    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
      
      {/* Avg. Consumption Display */}
      {avgConsumption[tableIndex] && avgConsumption[tableIndex] > 0 ? (
        <Box p={1} sx={{ padding: "4px 8px", minWidth: "140px", textAlign: "center", width: "fit-content" }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Avg Cons: {avgConsumption[tableIndex]} m/pc
          </Typography>
        </Box>
      ) : (
        <Box sx={{ minWidth: "140px" }} />
      )}

      {/* Action Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={() => handleAddRow(tableIndex)}
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
