import React from 'react';
import { TableRow, TableCell, TextField, Typography } from '@mui/material';

const AdhesiveRowReadOnly = ({ row, orderSizes }) => {
  return (
    <TableRow>
      {/* Width */}
      <TableCell sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.width || ""}
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
      <TableCell sx={{ padding: '4px', minWidth: '350px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <TextField
          variant="outlined"
          value={row.markerName || ""}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            "& input": { fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Dynamic Size Columns */}
      {orderSizes.length > 0 &&
        orderSizes.map((size) => (
          <TableCell key={size.size} sx={{ minWidth: '60px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
            <TextField
              variant="outlined"
              value={row.piecesPerSize?.[size.size] || ""}
              InputProps={{ readOnly: true }}
              sx={{
                width: '100%',
                minWidth: '60px',
                maxWidth: '80px',
                textAlign: 'center',
                "& input": { textAlign: 'center', fontWeight: 'normal' }
              }}
            />
          </TableCell>
        ))
      }

      {/* Marker Length */}
      <TableCell sx={{ minWidth: '80px', maxWidth: '100px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.markerLength || ""}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            minWidth: '80px',
            maxWidth: '100px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Efficiency */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.efficiency || ""}
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

      {/* Layers */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.layers || ""}
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

      {/* Expected Consumption */}
      <TableCell sx={{ minWidth: '80px', maxWidth: '100px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {typeof row.expectedConsumption === 'number' ? row.expectedConsumption.toFixed(1) : '-'}
        </Typography>
      </TableCell>

      {/* Bagno */}
      <TableCell sx={{ minWidth: '90px', maxWidth: '120px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.bagno || '-'}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

export default AdhesiveRowReadOnly;
