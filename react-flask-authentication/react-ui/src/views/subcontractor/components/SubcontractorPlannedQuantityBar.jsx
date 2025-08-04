import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Table, TableBody, TableRow, TableCell, TableHead, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';

const SubcontractorPlannedQuantityBar = ({ table, orderSizes, getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Get planned quantities (same as original)
  const plannedQuantities = getTablePlannedQuantities ? getTablePlannedQuantities(table) : {};
  const plannedByBagno = getTablePlannedByBagno ? getTablePlannedByBagno(table) : { bagnoMap: {}, bagnoOrder: [] };
  const metersByBagno = getMetersByBagno ? getMetersByBagno(table) : { bagnoMeters: {}, bagnoOrder: [] };

  // Calculate actual quantities using actual layers
  const getTableActualQuantities = (table) => {
    const actualQuantities = {};
    let actualTotal = 0;

    // Initialize actual quantities for each size
    orderSizes.forEach(sizeObj => {
      actualQuantities[sizeObj.size] = 0;
    });

    // Calculate actual quantities using actual layers
    table.rows.forEach(row => {
      if (row.piecesPerSize) {
        Object.entries(row.piecesPerSize).forEach(([size, quantity]) => {
          const numQuantity = parseInt(quantity) || 0;
          const actualLayers = parseFloat(row.layers_a) || 0;
          const actualPieces = numQuantity * actualLayers;

          if (actualQuantities.hasOwnProperty(size)) {
            actualQuantities[size] += actualPieces;
          }
          actualTotal += actualPieces;
        });
      }
    });

    return { ...actualQuantities, total: actualTotal };
  };

  // Calculate actual quantities by bagno
  const getTableActualByBagno = (table) => {
    const bagnoMap = {};
    const bagnoOrder = [];

    table.rows.forEach(row => {
      const bagno = row.bagno || 'Unknown';

      if (!bagnoMap[bagno]) {
        bagnoMap[bagno] = {};
        bagnoOrder.push(bagno);

        // Initialize sizes for this bagno
        orderSizes.forEach(sizeObj => {
          bagnoMap[bagno][sizeObj.size] = 0;
        });
      }

      if (row.piecesPerSize) {
        Object.entries(row.piecesPerSize).forEach(([size, quantity]) => {
          const numQuantity = parseInt(quantity) || 0;
          const actualLayers = parseFloat(row.layers_a) || 0;
          const actualPieces = numQuantity * actualLayers;

          if (bagnoMap[bagno].hasOwnProperty(size)) {
            bagnoMap[bagno][size] += actualPieces;
          }
        });
      }
    });

    return { bagnoMap, bagnoOrder };
  };

  const actualQuantities = getTableActualQuantities(table);
  const actualByBagno = getTableActualByBagno(table);

  const uniqueSizes = orderSizes.map(s => s.size);

  // Render planned bagno table - same format as original PlannedQuantityBar
  const renderPlannedBagnoTable = () => {
    const totalPerSize = {};

    // Calculate total per size across all bagni
    if (plannedByBagno.bagnoMap && typeof plannedByBagno.bagnoMap === 'object') {
      Object.values(plannedByBagno.bagnoMap).forEach(sizeMap => {
        if (sizeMap && typeof sizeMap === 'object') {
          Object.entries(sizeMap).forEach(([size, qty]) => {
            totalPerSize[size] = (totalPerSize[size] || 0) + qty;
          });
        }
      });
    }

    const totalMeters = (metersByBagno.bagnoMeters && typeof metersByBagno.bagnoMeters === 'object')
      ? Object.values(metersByBagno.bagnoMeters).reduce((sum, val) => sum + val, 0)
      : 0;

    // Build header cells array - same as original
    const headerCells = [
      <TableCell key="bagno" align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>,
      ...uniqueSizes.map(size => (
        <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
      )),
      <TableCell key="total" align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>,
      <TableCell key="cons" align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
    ];

    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>
          {(plannedByBagno.bagnoOrder || []).map((bagno) => {
            const sizeMap = plannedByBagno.bagnoMap[bagno] || {};
            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
            const mattressConsForBagno = metersByBagno.bagnoMeters[bagno] || 0;

            // Build row cells array - same as original
            const rowCells = [
              <TableCell key="bagno" align="center">{bagno}</TableCell>,
              ...uniqueSizes.map(size => (
                <TableCell key={size} align="center">
                  {sizeMap[size] || 0}
                </TableCell>
              )),
              <TableCell key="total" align="center" sx={{ fontWeight: 500 }}>{total}</TableCell>,
              <TableCell key="cons" align="center" sx={{ fontWeight: 500 }}>
                {mattressConsForBagno.toFixed(0)}
              </TableCell>
            ];

            return <TableRow key={bagno}>{rowCells}</TableRow>;
          })}
          {(() => {
            // Build totals row cells array - same as original
            const totalRowCells = [
              <TableCell key="total-label" align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>,
              ...uniqueSizes.map(size => {
                const total = totalPerSize[size] || 0;
                return (
                  <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                    {total}
                  </TableCell>
                );
              }),
              <TableCell key="total-pcs" align="center" sx={{ fontWeight: 'bold' }}>
                {Object.values(totalPerSize).reduce((sum, val) => sum + val, 0)}
              </TableCell>,
              <TableCell key="total-cons" align="center" sx={{ fontWeight: 'bold' }}>
                {Math.round(totalMeters)}
              </TableCell>
            ];

            return (
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                {totalRowCells}
              </TableRow>
            );
          })()}
        </TableBody>
      </Table>
    );
  };

  // Render actual bagno table - same format but with actual data
  const renderActualBagnoTable = () => {
    const totalPerSize = {};

    // Calculate total per size across all bagni for actual quantities
    if (actualByBagno.bagnoMap && typeof actualByBagno.bagnoMap === 'object') {
      Object.values(actualByBagno.bagnoMap).forEach(sizeMap => {
        if (sizeMap && typeof sizeMap === 'object') {
          Object.entries(sizeMap).forEach(([size, qty]) => {
            totalPerSize[size] = (totalPerSize[size] || 0) + qty;
          });
        }
      });
    }

    const totalActualMeters = table.rows.reduce((sum, row) => sum + (parseFloat(row.cons_actual) || 0), 0);

    // Build header cells array - same as original
    const headerCells = [
      <TableCell key="bagno" align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>,
      ...uniqueSizes.map(size => (
        <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
      )),
      <TableCell key="total" align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>,
      <TableCell key="cons" align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
    ];

    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>
          {(actualByBagno.bagnoOrder || []).map((bagno) => {
            const sizeMap = actualByBagno.bagnoMap[bagno] || {};
            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);

            // Calculate actual consumption for this bagno
            const actualConsForBagno = table.rows
              .filter(row => (row.bagno || 'Unknown') === bagno)
              .reduce((sum, row) => sum + (parseFloat(row.cons_actual) || 0), 0);

            // Build row cells array - same as original
            const rowCells = [
              <TableCell key="bagno" align="center">{bagno}</TableCell>,
              ...uniqueSizes.map(size => (
                <TableCell key={size} align="center">
                  {sizeMap[size] || 0}
                </TableCell>
              )),
              <TableCell key="total" align="center" sx={{ fontWeight: 500 }}>{total}</TableCell>,
              <TableCell key="cons" align="center" sx={{ fontWeight: 500 }}>
                {actualConsForBagno.toFixed(0)}
              </TableCell>
            ];

            return <TableRow key={bagno}>{rowCells}</TableRow>;
          })}
          {(() => {
            // Calculate planned totals for percentage comparison
            const plannedTotalPerSize = {};
            if (plannedByBagno.bagnoMap && typeof plannedByBagno.bagnoMap === 'object') {
              Object.values(plannedByBagno.bagnoMap).forEach(sizeMap => {
                if (sizeMap && typeof sizeMap === 'object') {
                  Object.entries(sizeMap).forEach(([size, qty]) => {
                    plannedTotalPerSize[size] = (plannedTotalPerSize[size] || 0) + qty;
                  });
                }
              });
            }

            const plannedTotalMeters = (metersByBagno.bagnoMeters && typeof metersByBagno.bagnoMeters === 'object')
              ? Object.values(metersByBagno.bagnoMeters).reduce((sum, val) => sum + val, 0)
              : 0;

            // Build totals row cells array with percentages
            const totalRowCells = [
              <TableCell key="total-label" align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>,
              ...uniqueSizes.map(size => {
                const actualTotal = totalPerSize[size] || 0;
                const plannedTotal = plannedTotalPerSize[size] || 0;
                const percentage = plannedTotal > 0 ? ((actualTotal / plannedTotal) * 100).toFixed(1) : '0.0';
                return (
                  <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                    {actualTotal} ({percentage}%)
                  </TableCell>
                );
              }),
              <TableCell key="total-pcs" align="center" sx={{ fontWeight: 'bold' }}>
                {(() => {
                  const actualGrandTotal = Object.values(totalPerSize).reduce((sum, val) => sum + val, 0);
                  const plannedGrandTotal = Object.values(plannedTotalPerSize).reduce((sum, val) => sum + val, 0);
                  const totalPercentage = plannedGrandTotal > 0 ? ((actualGrandTotal / plannedGrandTotal) * 100).toFixed(1) : '0.0';
                  return `${actualGrandTotal} (${totalPercentage}%)`;
                })()}
              </TableCell>,
              <TableCell key="total-cons" align="center" sx={{ fontWeight: 'bold' }}>
                {(() => {
                  const consPercentage = plannedTotalMeters > 0 ? ((totalActualMeters / plannedTotalMeters) * 100).toFixed(1) : '0.0';
                  return `${Math.round(totalActualMeters)} (${consPercentage}%)`;
                })()}
              </TableCell>
            ];

            return (
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                {totalRowCells}
              </TableRow>
            );
          })()}
        </TableBody>
      </Table>
    );
  };

  // Create display elements (actual vs planned) - same format as original
  const renderActualDetails = () => {
    const uniqueSizes = orderSizes.map(s => s.size);
    const sizeElements = uniqueSizes.map(size => {
      const planned = plannedQuantities[size] || 0;
      const actual = actualQuantities[size] || 0;
      const percentage = planned > 0 ? ((actual / planned) * 100).toFixed(1) : '0.0';

      return (
        <Typography key={size} variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {size}: {actual} ({percentage !== "NaN" ? percentage + "%" : "N/A"})
        </Typography>
      );
    });

    const plannedTotal = plannedQuantities.total || 0;
    const actualTotal = actualQuantities.total || 0;
    const totalPercentage = plannedTotal > 0 ? ((actualTotal / plannedTotal) * 100).toFixed(1) : '0.0';

    sizeElements.push(
      <Typography key="total_pcs" variant="body2" sx={{ fontWeight: "bold", ml: 2 }}>
        Total: {actualTotal} ({totalPercentage}%)
      </Typography>
    );

    return sizeElements;
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Box
        onClick={handleOpen}
        display="flex"
        gap={2}
        className="planned-quantity-bar"
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
        {renderActualDetails()}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent dividers>
          {/* Planned Quantities Table - same format as original */}
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {t('subcontractor.plannedQuantities', 'Planned Quantities')}
          </Typography>
          {renderPlannedBagnoTable()}

          <Box mt={3}>
            <Divider />
          </Box>

          {/* Actual Quantities Table - new table with same format */}
          <Box mt={3}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              {t('subcontractor.actualQuantities', 'Actual Quantities')}
            </Typography>
            {renderActualBagnoTable()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {t('common.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubcontractorPlannedQuantityBar;
