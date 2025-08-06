import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BiasTableHeaderReadOnly = () => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>Collaretto ID</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Usable Width [cm]</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Collaretto Width [mm]</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>Scrap Rolls</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>N° Rolls</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>N° Panels</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Cons [m]</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Bagno</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Sizes</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default BiasTableHeaderReadOnly;
