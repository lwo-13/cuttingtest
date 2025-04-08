import React from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Typography,
  IconButton,
  Autocomplete
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import LockOutlined from '@mui/icons-material/LockOutlined';

const MattressRow = ({
  row,
  rowIndex,
  tableIndex,
  table,
  orderSizes,
  markerOptions,
  isTableEditable,
  setTables,
  handleInputChange,
  handleRemoveRow,
  updateExpectedConsumption,
  setUnsavedChanges
}) => {
  const editable = row.isEditable !== false;

  return (
    <TableRow key={rowIndex}>
      {/* Width */}
      <TableCell sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.width || ""}
          disabled={!editable}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 3);
            setTables(prev => {
              const updated = [...prev];
              const rows = [...updated[tableIndex].rows];
              rows[rowIndex] = { ...rows[rowIndex], width: value, markerName: "" };
              updated[tableIndex].rows = rows;
              return updated;
            });
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
            setTables(prev => {
              const updated = [...prev];
              const rows = [...updated[tableIndex].rows];
              if (newValue) {
                rows[rowIndex] = {
                  ...rows[rowIndex],
                  markerName: newValue.marker_name,
                  width: newValue.marker_width,
                  markerLength: newValue.marker_length,
                  efficiency: newValue.efficiency,
                  piecesPerSize: newValue.size_quantities || {}
                };
              } else {
                rows[rowIndex] = { ...rows[rowIndex], markerName: "", width: "", markerLength: "", efficiency: "", piecesPerSize: {} };
              }
              updated[tableIndex].rows = rows;
              return updated;
            });
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
            handleInputChange(tableIndex, rowIndex, "layers", value);
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
          {row.expectedConsumption}
        </Typography>
      </TableCell>

      {/* Bagno */}
      <TableCell sx={{ minWidth: '90px', maxWidth: '120px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.bagno || ""}
          disabled={!editable}
          onChange={(e) => handleInputChange(tableIndex, rowIndex, "bagno", e.target.value)}
          sx={{
            width: '100%',
            minWidth: '90px',
            maxWidth: '120px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Delete or Lock Icon */}
      <TableCell>
        {editable ? (
          <IconButton onClick={() => handleRemoveRow(tableIndex, rowIndex)} color="error" disabled={table.rows.length === 1}>
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

export default MattressRow;