import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AlongTableHeaderReadOnly = () => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>Collaretto ID</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Usable Width [cm]</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Collaretto Width [mm]</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>Scrap Rolls</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>Planned N° Rolls</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Actual N° Rolls</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Total Collaretto [m]</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>Cons [m]</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Bagno</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Sizes</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default AlongTableHeaderReadOnly;
