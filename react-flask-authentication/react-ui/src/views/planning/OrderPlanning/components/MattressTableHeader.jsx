import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';

const MattressTableHeader = ({ orderSizes }) => {
  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Width [cm]</TableCell>
        <TableCell align="center" sx={{ minWidth: '400px' }}>Marker Name</TableCell>

        {/* Dynamic Sizes */}
        {orderSizes.length > 0 &&
          orderSizes.map((size, index) => (
            <TableCell align="center" key={index}>
              {size.size || "N/A"}
            </TableCell>
          ))
        }

        <TableCell align="center" sx={{ minWidth: '100px' }}>Length [m]</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>Eff %</TableCell>
        <TableCell align="center">Layers</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>Cons [m]</TableCell>
        <TableCell align="center">Bagno</TableCell>
        <TableCell />
      </TableRow>
    </TableHead>
  );
};

export default MattressTableHeader;
