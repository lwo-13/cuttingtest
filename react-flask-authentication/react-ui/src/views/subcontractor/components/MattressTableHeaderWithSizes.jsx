import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';

const MattressTableHeaderWithSizes = ({ orderSizes }) => {
  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>Mattress</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>Width [cm]</TableCell>
        <TableCell align="center" sx={{ minWidth: '250px' }}>Marker Name</TableCell>

        {/* Dynamic Sizes */}
        {orderSizes.length > 0 &&
          orderSizes.map((size) => (
            <TableCell align="center" key={size.size}>
              {size.size || "N/A"}
            </TableCell>
          ))
        }

        <TableCell align="center" sx={{ minWidth: '100px' }}>Length [m]</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>Eff %</TableCell>

        <TableCell align="center">Planned Layers</TableCell>
        <TableCell align="center">Planned Cons [m]</TableCell>
        <TableCell align="center">Actual Layers</TableCell>
        <TableCell align="center">Actual Cons [m]</TableCell>

        <TableCell align="center">Bagno</TableCell>
        <TableCell align="center" sx={{ minWidth: '40px' }}></TableCell>
        <TableCell align="center" sx={{ minWidth: '40px' }}></TableCell>
        <TableCell align="center" sx={{ minWidth: '40px' }}></TableCell>
        <TableCell align="center" sx={{ minWidth: '40px' }}></TableCell>

      </TableRow>
    </TableHead>
  );
};

export default MattressTableHeaderWithSizes;
