import React, { useState } from 'react';
import { TableRow, TableCell, TextField, Typography, IconButton } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import SizeSelectionDialog from './SizeSelectionDialog';

const AlongRow = ({
  row,
  rowId,
  table,
  tableId,
  handleInputChange,
  handleRemoveRow,
  setUnsavedChanges,
  orderSizes = []
}) => {
  const editable = row.isEditable !== false;
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);

  const inputSx = {
    width: '100%',
    minWidth: '65px',
    maxWidth: '80px',
    textAlign: 'center',
    "& input": { textAlign: "center", fontWeight: "normal" }
  };

  const handleChange = (field, pattern, maxLength) => (e) => {
    const value = e.target.value.replace(pattern, '').slice(0, maxLength);
    handleInputChange(tableId, rowId, field, value);
    setUnsavedChanges(true);
  };

  return (
    <TableRow key={rowId} sx={{ height: '70px' }}>
      <TableCell sx={{ padding: '0px', textAlign: 'center' }}>
        <TextField
          variant="standard"
          value={row.pieces || ""}
          disabled={!editable}
          onChange={handleChange("pieces", /\D/g, 7)}
          sx={inputSx}
        />
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.usableWidth || ""}
          disabled={!editable}
          onChange={handleChange("usableWidth", /\D/g, 3)}
          sx={inputSx}
        />
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="standard"
          value={row.theoreticalConsumption || ""}
          disabled={!editable}
          onChange={handleChange("theoreticalConsumption", /[^0-9.,]/g, 6)}
          sx={inputSx}
        />
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.collarettoWidth || ""}
          disabled={!editable}
          onChange={handleChange("collarettoWidth", /\D/g, 4)}
          sx={inputSx}
        />
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.scrapRoll ?? ""}
          disabled={!editable}
          onChange={handleChange("scrapRoll", /\D/g, 1)}
          sx={inputSx}
        />
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.rolls || ""}
        </Typography>
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.metersCollaretto && !isNaN(row.metersCollaretto)
            ? parseFloat(row.metersCollaretto).toFixed(1)
            : ""}
        </Typography>
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.consumption && !isNaN(row.consumption) && parseFloat(row.consumption) !== 0
            ? parseFloat(row.consumption).toFixed(1)
            : ""}
        </Typography>
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.bagno || ""}
          disabled={!editable}
          onChange={(e) => {
            handleInputChange(tableId, rowId, "bagno", e.target.value);
            setUnsavedChanges(true);
          }}
          sx={{
            width: '100%',
            minWidth: '90px',
            maxWidth: '120px',
            textAlign: 'center',
            "& input": { textAlign: "center", fontWeight: "normal" }
          }}
        />
      </TableCell>

      {/* Sizes */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <Typography
          onClick={() => editable && setSizeDialogOpen(true)}
          sx={{
            fontWeight: 'bold',
            color: (row.sizes === 'ALL' || !row.sizes) ? 'secondary.main' : 'primary.main',
            minWidth: '80px',
            cursor: editable ? 'pointer' : 'default',
            '&:hover': editable ? {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            } : {}
          }}
        >
          {row.sizes || "ALL"}
        </Typography>
      </TableCell>

      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <IconButton
          onClick={() => {
            handleRemoveRow(tableId, rowId);
            setUnsavedChanges(true);
          }}
          color="error"
          disabled={!editable || table.rows.length === 1}
        >
          <DeleteOutline />
        </IconButton>
      </TableCell>

      {/* Size Selection Dialog */}
      <SizeSelectionDialog
        open={sizeDialogOpen}
        onClose={() => setSizeDialogOpen(false)}
        onSave={(selectedSizes) => {
          handleInputChange(tableId, rowId, "sizes", selectedSizes);
          setUnsavedChanges(true);
          setSizeDialogOpen(false);
        }}
        currentSizes={row.sizes || "ALL"}
        orderSizes={orderSizes.map(size => size.size || size)}
      />
    </TableRow>
  );
};

export default AlongRow;


