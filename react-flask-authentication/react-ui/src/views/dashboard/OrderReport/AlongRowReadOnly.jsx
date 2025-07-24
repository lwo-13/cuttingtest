import React from 'react';
import { TableRow, TableCell, TextField, Typography } from '@mui/material';

const AlongRowReadOnly = ({ row }) => {


  return (
    <TableRow>
      {/* Collaretto ID */}
      <TableCell sx={{ minWidth: '100px', maxWidth: '120px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.collarettoId || ""}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            minWidth: '100px',
            maxWidth: '120px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' },
            "& .MuiOutlinedInput-root": {
              borderRadius: '8px',
              backgroundColor: '#f5f5f5'
            }
          }}
        />
      </TableCell>

      {/* Usable Width */}
      <TableCell sx={{ minWidth: '80px', maxWidth: '100px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.usableWidth || ""}
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

      {/* Collaretto Width */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>{row.collarettoWidth || ""}</Typography>
      </TableCell>

      {/* Scrap Rolls */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>{row.scrapRoll || ""}</Typography>
      </TableCell>

      {/* N° Rolls */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>{row.rolls || ""}</Typography>
      </TableCell>

      {/* Actual N° Rolls */}
      <TableCell sx={{ minWidth: '80px', maxWidth: '100px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.actualRolls || ""}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            minWidth: '80px',
            maxWidth: '100px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' },
            "& .MuiOutlinedInput-root": {
              borderRadius: '8px',
              backgroundColor: '#f5f5f5'
            }
          }}
        />
      </TableCell>

      {/* Total Collaretto */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>{row.totalCollaretto || ""}</Typography>
      </TableCell>

      {/* Cons */}
      <TableCell align="center">
        <Typography sx={{ fontWeight: 'normal' }}>{row.consPlanned || ""}</Typography>
      </TableCell>

      {/* Bagno */}
      <TableCell sx={{ minWidth: '80px', maxWidth: '100px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.bagno || 'no bagno'}
        </Typography>
      </TableCell>

      {/* Sizes */}
      <TableCell sx={{ padding: '4px', textAlign: 'center' }}>
        <Typography
          sx={{
            fontWeight: 'bold',
            color: (row.sizes === 'ALL' || !row.sizes) ? 'secondary.main' : 'primary.main',
            minWidth: '80px'
          }}
        >
          {row.sizes || "ALL"}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

export default AlongRowReadOnly;
