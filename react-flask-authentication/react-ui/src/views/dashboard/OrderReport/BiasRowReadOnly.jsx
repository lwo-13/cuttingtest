import React from 'react';
import { TableRow, TableCell, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BiasRowReadOnly = ({ row }) => {
  const { t } = useTranslation();

  return (
    <TableRow>
      {/* Collaretto ID */}
      <TableCell sx={{ minWidth: '100px', maxWidth: '120px', textAlign: 'center', padding: '9px' }}>
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

      {/* Pieces */}
      <TableCell sx={{ minWidth: '60px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal' }}>{row.pieces || ""}</Typography>
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
            "& input": { textAlign: 'center', fontWeight: 'normal' },
            "& .MuiOutlinedInput-root": {
              borderRadius: '8px',
              backgroundColor: '#f5f5f5'
            }
          }}
        />
      </TableCell>

      {/* Collaretto Width [mm] */}
      <TableCell sx={{ textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal' }}>{row.rollWidth || ""}</Typography>
      </TableCell>

      {/* Scrap Rolls */}
      <TableCell sx={{ textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal' }}>{row.scrapRolls || ""}</Typography>
      </TableCell>

      {/* Rolls Planned */}
      <TableCell sx={{ textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal' }}>{row.rolls || ""}</Typography>
      </TableCell>

      {/* Rolls Actual */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.rollsActual || ''}
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

      {/* N° Panels */}
      <TableCell sx={{ textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal' }}>{row.panels || ""}</Typography>
      </TableCell>

      {/* Cons Planned */}
      <TableCell sx={{ textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal' }}>{row.consPlanned || ""}</Typography>
      </TableCell>

      {/* Cons Actual */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.consActual ? parseFloat(row.consActual).toFixed(2) : ''}
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



      {/* Bagno */}
      <TableCell sx={{ minWidth: '80px', maxWidth: '100px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.bagno || t('table.noBagno')}
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
          {row.sizes || t('table.all')}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

export default BiasRowReadOnly;
