import React from 'react';
import { TableRow, TableCell, TextField, Typography, IconButton } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

const BiasRow = ({
  row,
  rowId,
  table,
  tableId,
  handleInputChange,
  handleRemoveRow,
  setUnsavedChanges
}) => {
  const editable = row.isEditable !== false;

  const inputSx = {
    width: '100%',
    minWidth: '65px',
    maxWidth: '120px',
    textAlign: 'center',
    "& input": { textAlign: "center", fontWeight: "normal" }
  };

  const handleChange = (field, pattern, maxLength) => (e) => {
    let value = e.target.value.replace(pattern, '').slice(0, maxLength);
    if (field === "rewoundWidth") {
      value = value.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 4);
    }
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
          value={row.totalWidth || ""}
          disabled={!editable}
          onChange={handleChange("totalWidth", /\D/g, 3)}
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

      {/* Rewound Width */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.rewoundWidth || ""}
          disabled={!editable}
          onChange={handleChange("rewoundWidth")}
          sx={inputSx}
        />
      </TableCell>

      {/* Scrap Rolls */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          value={row.scrapRoll || ""}
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
    </TableRow>
  );
};

export default BiasRow;