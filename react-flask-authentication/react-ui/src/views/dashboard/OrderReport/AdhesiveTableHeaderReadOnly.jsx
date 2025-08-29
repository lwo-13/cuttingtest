import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';

const AdhesiveTableHeaderReadOnly = ({ orderSizes }) => {
  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>Adhesive</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>Width [cm]</TableCell>
        <TableCell align="center" sx={{ minWidth: '150px', maxWidth: '400px', width: 'auto' }}>Marker Name</TableCell>

        <TableCell align="center" sx={{ minWidth: '100px' }}>Length [m]</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>Eff %</TableCell>

        <TableCell align="center">Planned Layers</TableCell>
        <TableCell align="center">Actual Layers</TableCell>
        <TableCell align="center">Planned Pcs</TableCell>
        <TableCell align="center">Actual Pcs</TableCell>

        <TableCell align="center">Planned Cons [m]</TableCell>
        <TableCell align="center">Actual Cons [m]</TableCell>
        {/* <TableCell align="center">Real Cons [m]</TableCell> */}

        <TableCell align="center">Bagno</TableCell>
        <TableCell align="center" sx={{ minWidth: '150px' }}>Progress</TableCell>

      </TableRow>
    </TableHead>
  );
};

export default AdhesiveTableHeaderReadOnly;
