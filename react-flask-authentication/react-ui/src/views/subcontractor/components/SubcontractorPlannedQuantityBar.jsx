import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Table, TableBody, TableRow, TableCell, TableHead, Divider, FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

const SubcontractorPlannedQuantityBar = ({ table, orderSizes, getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno, getWidthsByBagno }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showWidthColumn, setShowWidthColumn] = useState(false);

  // Get planned quantities (same as original)
  const plannedQuantities = getTablePlannedQuantities ? getTablePlannedQuantities(table) : {};
  const plannedByBagno = getTablePlannedByBagno ? getTablePlannedByBagno(table) : { bagnoMap: {}, bagnoOrder: [] };
  const metersByBagno = getMetersByBagno ? getMetersByBagno(table) : { bagnoMeters: {}, bagnoOrder: [] };
  const { bagnoWidths: widthsByBagno } = getWidthsByBagno ? getWidthsByBagno(table) : { bagnoWidths: {} };

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

  // Calculate actual widths by bagno (similar to planned widths)
  const getTableActualWidthsByBagno = (table) => {
    const bagnoWidths = {};
    const bagnoOrder = [];

    if (!table || !table.rows) {
      return { bagnoWidths, bagnoOrder };
    }

    table.rows.forEach(row => {
      const bagno = row.bagno || 'Unknown';
      const width = row.width ? parseFloat(row.width) : null;

      if (!width || !row.piecesPerSize || typeof row.piecesPerSize !== 'object') {
        return;
      }

      const actualLayers = parseFloat(row.layers_a) || 0;
      if (actualLayers <= 0) return;

      const consumption = parseFloat(row.cons_actual || row.expectedConsumption) || 0;

      if (!bagnoWidths[bagno]) {
        bagnoWidths[bagno] = {};
        bagnoOrder.push(bagno);
      }

      if (!bagnoWidths[bagno][width]) {
        bagnoWidths[bagno][width] = {
          sizeMap: {},
          consumption: 0
        };
      }

      bagnoWidths[bagno][width].consumption += consumption;

      Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
        const pieces = parseInt(pcs) || 0;
        if (pieces <= 0) return;

        const total = pieces * actualLayers;
        bagnoWidths[bagno][width].sizeMap[size] = (bagnoWidths[bagno][width].sizeMap[size] || 0) + total;
      });
    });

    return { bagnoWidths, bagnoOrder };
  };

  // Calculate cut vs not cut summary by size
  const getCutVsNotCutSummary = () => {
    const summary = {
      cut: {},      // Actual quantities (layers_a)
      notCut: {},   // Planned - Actual
      planned: {}   // Total planned quantities
    };

    // Initialize for each size
    orderSizes.forEach(sizeObj => {
      summary.cut[sizeObj.size] = 0;
      summary.notCut[sizeObj.size] = 0;
      summary.planned[sizeObj.size] = 0;
    });

    if (!table.rows) return summary;

    table.rows.forEach(row => {
      if (!row.piecesPerSize) return;

      Object.entries(row.piecesPerSize).forEach(([size, quantity]) => {
        const pcsPerLayer = parseInt(quantity) || 0;
        const plannedLayers = parseInt(row.layers) || 0;
        const actualLayers = parseFloat(row.layers_a) || 0;

        const plannedPcs = pcsPerLayer * plannedLayers;
        const actualPcs = pcsPerLayer * actualLayers;
        const notCutPcs = plannedPcs - actualPcs;

        if (summary.planned.hasOwnProperty(size)) {
          summary.planned[size] += plannedPcs;
          summary.cut[size] += actualPcs;
          summary.notCut[size] += notCutPcs > 0 ? notCutPcs : 0;
        }
      });
    });

    return summary;
  };

  const actualQuantities = getTableActualQuantities(table);
  const actualByBagno = getTableActualByBagno(table);
  const actualWidthsByBagno = getTableActualWidthsByBagno(table);

  const uniqueSizes = orderSizes.map(s => s.size);

  // Render planned bagno table with width functionality
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

    // Create expanded rows that include width information
    const expandedRows = [];

    (plannedByBagno.bagnoOrder || []).forEach(bagno => {
      const bagnoWidthData = widthsByBagno[bagno] || {};
      const bagnoSizeMap = plannedByBagno.bagnoMap[bagno] || {};

      if (showWidthColumn && Object.keys(bagnoWidthData).length > 0) {
        // If width column is shown and bagno has width data, create separate rows for each width
        Object.entries(bagnoWidthData)
          .sort(([a], [b]) => parseFloat(a) - parseFloat(b)) // Sort by width ascending
          .forEach(([width, widthData], index) => {
            expandedRows.push({
              bagno,
              width: parseFloat(width),
              sizeMap: widthData.sizeMap,
              consumption: widthData.consumption,
              isWidthRow: true,
              isFirstWidthRow: index === 0,
              bagnoRowSpan: Object.keys(bagnoWidthData).length
            });
          });
      } else {
        // If width column is hidden OR no width data, show as regular bagno row
        expandedRows.push({
          bagno,
          width: null,
          sizeMap: bagnoSizeMap,
          consumption: metersByBagno.bagnoMeters[bagno] || 0,
          isWidthRow: false,
          isFirstWidthRow: true,
          bagnoRowSpan: 1
        });
      }
    });

    // Build header cells array
    const headerCells = [
      <TableCell key="bagno" align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>
    ];

    if (showWidthColumn) {
      headerCells.push(
        <TableCell key="width" align="center" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Width [cm]</TableCell>
      );
    }

    headerCells.push(
      ...uniqueSizes.map(size => (
        <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
      )),
      <TableCell key="total" align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>,
      <TableCell key="cons" align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
    );

    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>
          {expandedRows.map((row, index) => {
            const { bagno, width, sizeMap, consumption, isWidthRow, isFirstWidthRow, bagnoRowSpan } = row;
            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);

            // Build row cells array
            const rowCells = [];

            // Bagno cell - only show on first row of each bagno group
            if (isFirstWidthRow) {
              rowCells.push(
                <TableCell
                  key="bagno"
                  align="center"
                  rowSpan={bagnoRowSpan}
                  sx={{
                    fontWeight: 500,
                    verticalAlign: 'middle'
                  }}
                >
                  {bagno}
                </TableCell>
              );
            }

            // Add width cell if width column is shown
            if (showWidthColumn) {
              rowCells.push(
                <TableCell key="width" align="center">
                  {width ? width : '-'}
                </TableCell>
              );
            }

            // Add remaining cells
            rowCells.push(
              ...uniqueSizes.map(size => (
                <TableCell key={size} align="center">
                  {sizeMap[size] || 0}
                </TableCell>
              )),
              <TableCell key="total" align="center" sx={{ fontWeight: 500 }}>
                {total}
              </TableCell>,
              <TableCell key="cons" align="center" sx={{ fontWeight: 500 }}>
                {consumption.toFixed(1)}
              </TableCell>
            );

            return <TableRow key={`planned-${bagno}-${width || 'main'}-${index}`}>{rowCells}</TableRow>;
          })}
          {(() => {
            // Build totals row cells array
            const totalRowCells = [
              <TableCell key="total-label" align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
            ];

            if (showWidthColumn) {
              totalRowCells.push(
                <TableCell key="total-width" align="center" sx={{ fontWeight: 'bold' }}>-</TableCell>
              );
            }

            totalRowCells.push(
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
            );

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

  // Render actual bagno table with width functionality
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

    // Create expanded rows for actual data
    const expandedActualRows = [];

    (actualByBagno.bagnoOrder || []).forEach(bagno => {
      const bagnoWidthData = actualWidthsByBagno.bagnoWidths[bagno] || {};
      const bagnoSizeMap = actualByBagno.bagnoMap[bagno] || {};

      if (showWidthColumn && Object.keys(bagnoWidthData).length > 0) {
        // If width column is shown and bagno has width data, create separate rows for each width
        Object.entries(bagnoWidthData)
          .sort(([a], [b]) => parseFloat(a) - parseFloat(b)) // Sort by width ascending
          .forEach(([width, widthData], index) => {
            expandedActualRows.push({
              bagno,
              width: parseFloat(width),
              sizeMap: widthData.sizeMap,
              consumption: widthData.consumption,
              isWidthRow: true,
              isFirstWidthRow: index === 0,
              bagnoRowSpan: Object.keys(bagnoWidthData).length
            });
          });
      } else {
        // If width column is hidden OR no width data, show as regular bagno row
        const actualConsForBagno = table.rows
          .filter(row => (row.bagno || 'Unknown') === bagno)
          .reduce((sum, row) => sum + (parseFloat(row.cons_actual) || 0), 0);

        expandedActualRows.push({
          bagno,
          width: null,
          sizeMap: bagnoSizeMap,
          consumption: actualConsForBagno,
          isWidthRow: false,
          isFirstWidthRow: true,
          bagnoRowSpan: 1
        });
      }
    });

    // Build header cells array
    const headerCells = [
      <TableCell key="bagno" align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>
    ];

    if (showWidthColumn) {
      headerCells.push(
        <TableCell key="width" align="center" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Width [cm]</TableCell>
      );
    }

    headerCells.push(
      ...uniqueSizes.map(size => (
        <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
      )),
      <TableCell key="total" align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>,
      <TableCell key="cons" align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
    );

    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>
          {expandedActualRows.map((row, index) => {
            const { bagno, width, sizeMap, consumption, isWidthRow, isFirstWidthRow, bagnoRowSpan } = row;
            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);

            // Build row cells array
            const rowCells = [];

            // Bagno cell - only show on first row of each bagno group
            if (isFirstWidthRow) {
              rowCells.push(
                <TableCell
                  key="bagno"
                  align="center"
                  rowSpan={bagnoRowSpan}
                  sx={{
                    fontWeight: 500,
                    verticalAlign: 'middle'
                  }}
                >
                  {bagno}
                </TableCell>
              );
            }

            // Add width cell if width column is shown
            if (showWidthColumn) {
              rowCells.push(
                <TableCell key="width" align="center">
                  {width ? width : '-'}
                </TableCell>
              );
            }

            // Add remaining cells
            rowCells.push(
              ...uniqueSizes.map(size => (
                <TableCell key={size} align="center">
                  {sizeMap[size] || 0}
                </TableCell>
              )),
              <TableCell key="total" align="center" sx={{ fontWeight: 500 }}>
                {total}
              </TableCell>,
              <TableCell key="cons" align="center" sx={{ fontWeight: 500 }}>
                {consumption.toFixed(1)}
              </TableCell>
            );

            return <TableRow key={`actual-${bagno}-${width || 'main'}-${index}`}>{rowCells}</TableRow>;
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
              <TableCell key="total-label" align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
            ];

            if (showWidthColumn) {
              totalRowCells.push(
                <TableCell key="total-width" align="center" sx={{ fontWeight: 'bold' }}>-</TableCell>
              );
            }

            totalRowCells.push(
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
            );

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

  // Render cut vs not cut summary table
  const renderCutVsNotCutSummary = () => {
    const summary = getCutVsNotCutSummary();

    const totalPlanned = Object.values(summary.planned).reduce((sum, val) => sum + val, 0);
    const totalCut = Object.values(summary.cut).reduce((sum, val) => sum + val, 0);
    const totalNotCut = Object.values(summary.notCut).reduce((sum, val) => sum + val, 0);

    // Only show if there are some actual quantities (something has been cut)
    if (totalCut === 0 && totalNotCut === 0) return null;

    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('common.status', 'Status')}</TableCell>
            {uniqueSizes.map(size => (
              <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('common.total', 'Total')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Cut (Actual) Row - Primary Blue */}
          <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
            <TableCell align="center" sx={{ fontWeight: 500, color: '#1565c0' }}>{t('common.cut', 'Cut')}</TableCell>
            {uniqueSizes.map(size => (
              <TableCell key={size} align="center" sx={{ color: '#1565c0' }}>
                {summary.cut[size] || 0}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
              {totalCut}
            </TableCell>
          </TableRow>
          {/* Not Cut (Remaining) Row - Secondary Purple */}
          <TableRow sx={{ backgroundColor: '#ede7f6' }}>
            <TableCell align="center" sx={{ fontWeight: 500, color: '#5e35b1' }}>{t('common.notCut', 'Not Cut')}</TableCell>
            {uniqueSizes.map(size => (
              <TableCell key={size} align="center" sx={{ color: '#5e35b1' }}>
                {summary.notCut[size] || 0}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#5e35b1' }}>
              {totalNotCut}
            </TableCell>
          </TableRow>
          {/* Total Planned Row - Grey */}
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('common.totalPlanned', 'Total Planned')}</TableCell>
            {uniqueSizes.map(size => (
              <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                {summary.planned[size] || 0}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              {totalPlanned}
            </TableCell>
          </TableRow>
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
          maxWidth: "100%",
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
          {/* Width Column Toggle */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showWidthColumn}
                  onChange={(e) => setShowWidthColumn(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Width Column"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
            />
          </Box>

          {/* Planned Quantities Table */}
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

          {/* Cut vs Not Cut Summary */}
          <Box mt={3}>
            <Divider />
          </Box>
          <Box mt={3}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
              {t('common.cutVsNotCutSummary', 'Cut vs Not Cut Summary')}
            </Typography>
            {renderCutVsNotCutSummary()}
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
