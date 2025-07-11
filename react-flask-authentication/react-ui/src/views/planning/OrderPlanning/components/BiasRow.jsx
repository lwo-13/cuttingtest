import React, { useState } from 'react';
import { TableRow, TableCell, TextField, Typography, IconButton } from '@mui/material';
import { DeleteOutline, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import SizeSelectionDialog from './SizeSelectionDialog';

const BiasRow = ({
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
    maxWidth: '120px',
    textAlign: 'center',
    "& input": { textAlign: "center", fontWeight: "normal" }
  };

  const handleChange = (field, pattern, maxLength) => (e) => {
    let value = e.target.value.replace(pattern, '').slice(0, maxLength);
    handleInputChange(tableId, rowId, field, value);
    setUnsavedChanges(true);
  };

  return (
    <TableRow key={rowId} sx={{ height: '70px' }}>
      {/* Pieces */}
      <TableCell sx={{ padding: '0px', textAlign: 'center' }}>
        <TextField
          variant="standard"
          value={row.pieces || ""}
          disabled={!editable}
          onChange={handleChange("pieces", /\D/g, 7)}
          sx={inputSx}
        />
      </TableCell>

      {/* Usable Width */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.usableWidth || ""}
          disabled={!editable}
          onChange={handleChange("usableWidth", /\D/g, 3)}
          sx={inputSx}
        />
      </TableCell>

      {/* Gross Length */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="standard"
          value={row.grossLength || ""}
          disabled={!editable}
          onChange={handleChange("grossLength", /[^0-9.,]/g, 6)}
          sx={inputSx}
        />
      </TableCell>

      {/* Pcs Seam to Seam */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="standard"
          value={row.pcsSeamtoSeam || ""}
          disabled={!editable}
          onChange={handleChange("pcsSeamtoSeam", /[^0-9.]/g, 4)}
          sx={{
            ...inputSx,
            input: {
              color: row.isPcsSeamCalculated ? 'gray' : 'black',
              fontStyle: row.isPcsSeamCalculated ? 'italic' : 'normal'
            }
          }}
        />
      </TableCell>

      {/* Collaretto Width */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.collarettoWidth || ""}
          disabled={!editable}
          onChange={handleChange("collarettoWidth", /\D/g, 4)}
          sx={inputSx}
        />
      </TableCell>

      {/* Scrap Rolls */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.scrapRoll ?? ""}
          disabled={!editable}
          onChange={handleChange("scrapRoll", /\D/g, 1)}
          sx={inputSx}
        />
      </TableCell>

      {/* N° Rolls */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>{row.rolls || ""}</Typography>
      </TableCell>

      {/* N° Panels */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>{row.panels || ""}</Typography>
      </TableCell>

      {/* Consumption */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>
          {row.consumption && parseFloat(row.consumption) !== 0
            ? parseFloat(row.consumption).toFixed(1)
            : ""}
        </Typography>
      </TableCell>

      {/* Bagno */}
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

      {/* Status Icon */}
      <TableCell sx={{ textAlign: 'center', padding: '4px' }}>
        {editable ? (
          <IconButton
            onClick={() => {
              const newStatus = row.status === 'ready' ? 'not_ready' : 'ready';
              handleInputChange(tableId, rowId, "status", newStatus);
              setUnsavedChanges(true);
            }}
            sx={{
              color: row.status === 'ready' ? 'success.main' : 'grey.400',
              '&:hover': {
                color: row.status === 'ready' ? 'success.dark' : 'grey.600'
              }
            }}
          >
            {row.status === 'ready' ? <CheckCircle /> : <RadioButtonUnchecked />}
          </IconButton>
        ) : (
          <IconButton disabled>
            {row.status === 'ready' ? <CheckCircle color="disabled" /> : <RadioButtonUnchecked color="disabled" />}
          </IconButton>
        )}
      </TableCell>

      {/* Delete */}
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

export default BiasRow;