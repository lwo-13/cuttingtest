import React from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Typography,
  IconButton,
  Autocomplete
} from '@mui/material';
import { DeleteOutline, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import LockOutlined from '@mui/icons-material/LockOutlined';

const AdhesiveRow = ({
  row,
  rowId,
  tableId,
  table,
  orderSizes,
  markerOptions,
  handleInputChange,
  handleRemoveRow,
  setUnsavedChanges
}) => {
  const editable = row.isEditable !== false;

  return (
    <TableRow key={rowId}>
      {/* Width */}
      <TableCell sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.width || ""}
          disabled={!editable}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 3);
            handleInputChange(tableId, rowId, "width", value);
            handleInputChange(tableId, rowId, "markerName", ""); // clear markerName when width changes
            handleInputChange(tableId, rowId, "markerLength", ""); // optional: reset marker length too
            handleInputChange(tableId, rowId, "efficiency", "");   // optional: reset efficiency too
            handleInputChange(tableId, rowId, "piecesPerSize", {}); // ✅ reset pcs per size
            setUnsavedChanges(true);
          }}
          sx={{
            width: '100%',
            minWidth: '60px',
            maxWidth: '70px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Marker Name */}
      <TableCell sx={{ padding: '4px', minWidth: '350px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Autocomplete
          options={row.width
            ? markerOptions
                .filter(m => {
                  const markerW = parseFloat(m.marker_width);
                  const selectedW = parseFloat(row.width);
                  return markerW >= selectedW && markerW <= selectedW + 0.5;
                })
                .sort((a, b) => b.efficiency - a.efficiency)
            : markerOptions.sort((a, b) => b.efficiency - a.efficiency)}
          getOptionLabel={(option) => option.marker_name}
          renderOption={(props, option) => (
            <li {...props}>
              <span>{option.marker_name}</span>
              <span style={{ color: 'gray', marginLeft: '10px', fontSize: '0.85em' }}>({option.efficiency}%)</span>
            </li>
          )}
          value={markerOptions.find(m => m.marker_name === row.markerName) || null}
          disabled={!editable}
          onChange={(_, newValue) => {
            if (newValue) {
              handleInputChange(tableId, rowId, "markerName", newValue.marker_name);
              handleInputChange(tableId, rowId, "width", newValue.marker_width);
              handleInputChange(tableId, rowId, "markerLength", newValue.marker_length);
              handleInputChange(tableId, rowId, "efficiency", newValue.efficiency);
              handleInputChange(tableId, rowId, "piecesPerSize", newValue.size_quantities || {});
            } else {
              handleInputChange(tableId, rowId, "markerName", "");
              handleInputChange(tableId, rowId, "width", "");
              handleInputChange(tableId, rowId, "markerLength", "");
              handleInputChange(tableId, rowId, "efficiency", "");
              handleInputChange(tableId, rowId, "piecesPerSize", {});
            }
            setUnsavedChanges(true);
          }}
          renderInput={(params) => <TextField {...params} variant="outlined" />}
          sx={{
            width: '100%',
            "& .MuiAutocomplete-input": { fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Pieces Per Size */}
      {orderSizes.map((size) => (
        <TableCell
          key={size.size}
          sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}
        >
          <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
            {row.piecesPerSize[size.size] || 0}
          </Typography>
        </TableCell>
      ))}

      {/* Marker Length */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.markerLength}
        </Typography>
      </TableCell>

      {/* Efficiency */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.efficiency}
        </Typography>
      </TableCell>

      {/* Layers */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.layers || ""}
          disabled={!editable}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
            handleInputChange(tableId, rowId, "layers", value);
          }}
          sx={{
            width: '100%',
            minWidth: '65px',
            maxWidth: '80px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Expected Consumption */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.expectedConsumption ? parseFloat(row.expectedConsumption).toFixed(1) : ""}
        </Typography>
      </TableCell>

      {/* Bagno */}
      <TableCell sx={{ minWidth: '90px', maxWidth: '120px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.bagno || ""}
          disabled={!editable}
          onChange={(e) => handleInputChange(tableId, rowId, "bagno", e.target.value)}
          sx={{
            width: '100%',
            minWidth: '90px',
            maxWidth: '120px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Status Icon */}
      <TableCell sx={{ textAlign: 'center', padding: '4px' }}>
        {editable ? (
          <IconButton
            onClick={() => {
              const newStatus = row.status === 'ready' ? 'not_ready' : 'ready';
              handleInputChange(tableId, rowId, "status", newStatus);
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

      {/* Delete or Lock Icon */}
      <TableCell>
        {editable ? (
          <IconButton onClick={() => handleRemoveRow(tableId, rowId)} color="error" disabled={table.rows.length === 1}>
            <DeleteOutline />
          </IconButton>
        ) : (
          <IconButton disabled>
            <LockOutlined color="disabled" />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
};

export default AdhesiveRow;
