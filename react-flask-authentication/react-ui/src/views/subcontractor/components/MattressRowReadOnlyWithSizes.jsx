import React from 'react';
import { TableRow, TableCell, TextField, Typography, IconButton } from '@mui/material';
import { Print } from '@mui/icons-material';

const MattressRowReadOnlyWithSizes = ({ row, orderSizes, onPrintMattress }) => {
  return (
    <TableRow>
      {/* Mattress Name (short display) */}
      <TableCell sx={{ minWidth: '120px', maxWidth: '150px', textAlign: 'center', padding: '9px' }}>
        <TextField
          variant="outlined"
          value={row.mattressName?.match(/[A-Z]{2,3}-\d{2}-\d{2,3}$/)?.[0] || ''}
          inputProps={{ readOnly: true, style: { textAlign: 'center' , fontWeight: 'normal' } }}
          sx={{ width: '100%' }}
        />
      </TableCell>

      {/* Width (KPI) */}
      <TableCell sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.width || ''}
          InputProps={{ readOnly: true }}
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
      <TableCell sx={{
        padding: '4px',
        minWidth: '250px',
        maxWidth: '400px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        <Typography sx={{ textAlign: 'center', fontWeight: 'normal' }}>
          {row.markerName || '-'}
        </Typography>
      </TableCell>

      {/* Pieces Per Size */}
      {orderSizes.map((size) => (
        <TableCell key={size.size} sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
          <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
            {row.piecesPerSize?.[size.size] || 0}
          </Typography>
        </TableCell>
      ))}

      {/* Marker Length */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.markerLength || '-'}
        </Typography>
      </TableCell>

      {/* Efficiency */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.efficiency || '-'}
        </Typography>
      </TableCell>

      {/* Planned Layers */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.layers || '-'}
        </Typography>
      </TableCell>

      {/* Planned Consumption (from DB - expectedConsumption) */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {typeof row.expectedConsumption === 'number' ? row.expectedConsumption.toFixed(1) : '-'}
        </Typography>
      </TableCell>

      {/* Actual Layers (KPI) */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.layers_a || ''}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            minWidth: '65px',
            maxWidth: '80px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Actual Consumption (calculated from actual layers) */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {typeof row.cons_actual === 'number' ? row.cons_actual.toFixed(1) : '-'}
        </Typography>
      </TableCell>

      {/* Bagno */}
      <TableCell sx={{ minWidth: '90px', maxWidth: '120px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.bagno || '-'}
        </Typography>
      </TableCell>

      {/* Print Icon */}
      <TableCell sx={{ minWidth: '60px', textAlign: 'center', padding: '4px' }}>
        <IconButton
          onClick={() => onPrintMattress && onPrintMattress(row)}
          color="primary"
          size="small"
          sx={{ padding: '4px' }}
        >
          <Print fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default MattressRowReadOnlyWithSizes;
