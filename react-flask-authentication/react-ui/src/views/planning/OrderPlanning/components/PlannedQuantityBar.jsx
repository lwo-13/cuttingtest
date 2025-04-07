import React, { useState } from 'react';
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';

const PlannedQuantityBar = ({ table, orderSizes, getTablePlannedQuantities, getTablePlannedByBagno }) => {
  const [open, setOpen] = useState(false);
  const planned = getTablePlannedQuantities(table);
  const plannedByBagno = getTablePlannedByBagno(table);

  const hasRealQty = Object.values(planned).some(qty => qty > 0);
  if (!hasRealQty) return null;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const renderPlannedDetails = () =>
    Object.entries(planned).map(([size, qty]) => {
      const sizeData = orderSizes.find(s => s.size === size);
      const totalOrdered = sizeData ? sizeData.qty : 1;
      const percentage = totalOrdered ? ((qty / totalOrdered) * 100).toFixed(1) : "N/A";

      return (
        <Typography key={size} variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {size}: {qty} ({percentage !== "NaN" ? percentage + "%" : "N/A"})
        </Typography>
      );
    });

  const uniqueSizes = Array.from(
    new Set(Object.values(plannedByBagno).flatMap(obj => Object.keys(obj)))
  );

  const renderBagnoTable = () => {
    const totalPerSize = {};
  
    // Calculate total per size across all bagni
    Object.values(plannedByBagno).forEach(sizeMap => {
      Object.entries(sizeMap).forEach(([size, qty]) => {
        totalPerSize[size] = (totalPerSize[size] || 0) + qty;
      });
    });
  
    // To calculate percentage from `orderSizes`
    const getOrderedQty = (size) => {
      const found = orderSizes.find(s => s.size === size);
      return found ? found.qty : 0;
    };
  
    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>
            {uniqueSizes.map(size => (
              <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(plannedByBagno).map(([bagno, sizeMap]) => (
            <TableRow key={bagno}>
              <TableCell align="center">{bagno}</TableCell>
              {uniqueSizes.map(size => (
                <TableCell key={size} align="center">
                  {sizeMap[size] || 0}
                </TableCell>
              ))}
            </TableRow>
          ))}
  
          {/* 🔽 Totals Row */}
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
            {uniqueSizes.map(size => {
              const total = totalPerSize[size] || 0;
              const ordered = getOrderedQty(size);
              const pct = ordered ? ((total / ordered) * 100).toFixed(1) : null;
  
              return (
                <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                  {total} {pct ? `(${pct}%)` : ''}
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <Box
        onClick={handleOpen}
        display="flex"
        gap={2}
        sx={{
          backgroundColor: "#EFEFEF",
          padding: "4px 8px",
          borderRadius: "8px",
          flexWrap: "wrap",
          maxWidth: "50%",
          justifyContent: "flex-end",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer",
          '&:hover': {
            backgroundColor: "#e0e0e0"
          }
        }}
      >
        {renderPlannedDetails()}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent dividers>
          {renderBagnoTable()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="text">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlannedQuantityBar;

