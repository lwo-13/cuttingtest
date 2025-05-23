import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';

const WeftTableHeader = () => (
  <TableHead>
    <TableRow sx={{ height: "50px" }}>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Pieces</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Usable Width [cm]</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Gross Length [m]</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Pcs Seam to Seam</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Panel Length [m]</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Collaretto Width [mm]</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Scrap Rolls</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>N° Rolls</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>N° Panels</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Cons [m]</TableCell>
      <TableCell align="center" sx={{ padding: "2px 6px" }}>Bagno</TableCell>
      <TableCell /> {/* empty cell for actions or buttons */}
    </TableRow>
  </TableHead>
);

export default WeftTableHeader;
