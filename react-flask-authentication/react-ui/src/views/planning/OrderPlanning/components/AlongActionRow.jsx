import React from 'react';
import { Box, Button } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';

const AlongActionRow = ({
  tableId,
  table,
  isTableEditable,
  handleAddRowAlong,
  handleRemoveAlongTable,
  setUnsavedChanges
}) => {
  const editable = isTableEditable(table);

  return (
    <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
      {/* Add Row */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddCircleOutline />}
        onClick={() => {
          handleAddRowAlong(tableId);
          setUnsavedChanges(true);
        }}
      >
        Add Row
      </Button>

      {/* Remove Table */}
      {editable && (
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            handleRemoveAlongTable(tableId);
            setUnsavedChanges(true);
          }}
        >
          Remove
        </Button>
      )}
    </Box>
  );
};

export default AlongActionRow;
