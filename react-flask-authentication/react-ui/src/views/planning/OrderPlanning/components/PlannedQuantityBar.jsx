import React, { useState, Fragment } from 'react';
import {
  Box, Typography, Dialog, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  IconButton, Collapse, FormControlLabel, Switch, Divider
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const PlannedQuantityBar = ({
  table,
  orderSizes,
  getTablePlannedQuantities,
  getTablePlannedByBagno,
  getMetersByBagno,
  getWidthsByBagno,
  showHelpers = true,
  showActualQuantities = false, // New prop to enable actual quantities display
  // New props for fabric consumption
  alongTables = [],
  weftTables = [],
  biasTables = [],
  adhesiveTables = []
}) => {
  const [open, setOpen] = useState(false);
  const [collarettoConsumption, setCollarettoConsumption] = useState('');
  const [adhesiveConsumption, setAdhesiveConsumption] = useState('');
  const [collarettoHelperExpanded, setCollarettoHelperExpanded] = useState(false);
  const [adhesiveHelperExpanded, setAdhesiveHelperExpanded] = useState(false);
  const [showWidthColumn, setShowWidthColumn] = useState(false);
  const [fabricConsMode, setFabricConsMode] = useState(false);

  // Check if we have any real consumption data to show
  const hasRealConsumptionData = () => {
    const realConsumption = calculateRealFabricConsumption();
    return realConsumption.collarettoConsumption > 0 || realConsumption.adhesiveConsumption > 0;
  };

  const uniqueSizes = orderSizes.map(s => s.size);

  const planned = getTablePlannedQuantities(table);
  const { bagnoMap: plannedByBagno, bagnoOrder } = getTablePlannedByBagno(table);
  const { bagnoMeters: metersByBagno } = getMetersByBagno(table);
  const { bagnoWidths: widthsByBagno } = getWidthsByBagno ? getWidthsByBagno(table) : { bagnoWidths: {} };

  const hasRealQty = Object.values(planned).some(qty => qty > 0);
  if (!hasRealQty) return null;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Calculate actual quantities using actual layers (layers_a)
  const getTableActualQuantities = (table) => {
    const actualQuantities = {};
    let actualTotal = 0;

    // Initialize actual quantities for each size
    orderSizes.forEach(sizeObj => {
      actualQuantities[sizeObj.size] = 0;
    });

    // Calculate actual quantities using actual layers
    if (table.rows) {
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
    }

    return { ...actualQuantities, total: actualTotal };
  };

  // Calculate actual quantities by bagno
  const getTableActualByBagno = (table) => {
    const bagnoMap = {};
    const bagnoOrder = [];

    if (!table.rows) return { bagnoMap, bagnoOrder };

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

  // Calculate actual consumption by bagno
  const getActualMetersByBagno = (table) => {
    const bagnoMeters = {};
    const bagnoOrder = [];

    if (!table.rows) return { bagnoMeters, bagnoOrder };

    table.rows.forEach(row => {
      const bagno = row.bagno || 'Unknown';

      if (!bagnoMeters[bagno]) {
        bagnoMeters[bagno] = 0;
        bagnoOrder.push(bagno);
      }

      const actualCons = parseFloat(row.cons_actual) || 0;
      bagnoMeters[bagno] += actualCons;
    });

    return { bagnoMeters, bagnoOrder };
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

  // Calculate actual widths by bagno
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

      const consumption = parseFloat(row.cons_actual) || 0;

      if (!bagnoWidths[bagno]) {
        bagnoWidths[bagno] = {};
        if (!bagnoOrder.includes(bagno)) {
          bagnoOrder.push(bagno);
        }
      }

      if (!bagnoWidths[bagno][width]) {
        bagnoWidths[bagno][width] = {
          sizeMap: {},
          consumption: 0
        };

        orderSizes.forEach(sizeObj => {
          bagnoWidths[bagno][width].sizeMap[sizeObj.size] = 0;
        });
      }

      Object.entries(row.piecesPerSize).forEach(([size, quantity]) => {
        const numQuantity = parseInt(quantity) || 0;
        const actualPieces = numQuantity * actualLayers;

        if (bagnoWidths[bagno][width].sizeMap.hasOwnProperty(size)) {
          bagnoWidths[bagno][width].sizeMap[size] += actualPieces;
        }
      });

      bagnoWidths[bagno][width].consumption += consumption;
    });

    return { bagnoWidths, bagnoOrder };
  };

  const actualQuantities = showActualQuantities ? getTableActualQuantities(table) : {};
  const { bagnoMap: actualByBagno, bagnoOrder: actualBagnoOrder } = showActualQuantities ? getTableActualByBagno(table) : { bagnoMap: {}, bagnoOrder: [] };
  const { bagnoMeters: actualMetersByBagno } = showActualQuantities ? getActualMetersByBagno(table) : { bagnoMeters: {} };
  const { bagnoWidths: actualWidthsByBagno } = showActualQuantities ? getTableActualWidthsByBagno(table) : { bagnoWidths: {} };

  // Format numbers for better readability
  const formatNumber = (num) => {
    const rounded = Math.round(num);
    return rounded.toLocaleString();
  };

  // Calculate real fabric consumption from collaretto and adhesive tables
  const calculateRealFabricConsumption = () => {
    const fabricType = table.fabricType;
    const fabricCode = table.fabricCode;
    const fabricColor = table.fabricColor;

    if (!fabricType || !fabricCode || !fabricColor) {
      return { collarettoConsumption: 0, adhesiveConsumption: 0, consumptionByBagno: {} };
    }

    // Get list of bagnos that exist in the current mattress table
    const mattressBagnos = new Set();
    if (plannedByBagno && typeof plannedByBagno === 'object') {
      Object.keys(plannedByBagno).forEach(bagno => {
        mattressBagnos.add(bagno);
      });
    }

    let totalCollarettoConsumption = 0;
    let totalAdhesiveConsumption = 0;

    // Calculate consumption by bagno for this fabric
    const collarettoConsumptionByBagno = {};
    const adhesiveConsumptionByBagno = {};

    // Check along tables (CA)
    alongTables.forEach((alongTable, index) => {
      if (alongTable.fabricType === fabricType &&
          alongTable.fabricCode === fabricCode &&
          alongTable.fabricColor === fabricColor) {
        alongTable.rows.forEach(row => {
          const bagno = row.bagno || 'No Bagno';
          const consumption = parseFloat(row.consumption) || 0;
          if (consumption > 0 && mattressBagnos.has(bagno)) {
            collarettoConsumptionByBagno[bagno] = (collarettoConsumptionByBagno[bagno] || 0) + consumption;
            totalCollarettoConsumption += consumption;
          }
        });
      }
    });

    // Check weft tables (CT)
    weftTables.forEach((weftTable, index) => {
      if (weftTable.fabricType === fabricType &&
          weftTable.fabricCode === fabricCode &&
          weftTable.fabricColor === fabricColor) {
        weftTable.rows.forEach(row => {
          const bagno = row.bagno || 'No Bagno';
          const consumption = parseFloat(row.consumption) || 0;
          if (consumption > 0 && mattressBagnos.has(bagno)) {
            collarettoConsumptionByBagno[bagno] = (collarettoConsumptionByBagno[bagno] || 0) + consumption;
            totalCollarettoConsumption += consumption;
          }
        });
      }
    });

    // Check bias tables (CB)
    biasTables.forEach(biasTable => {
      if (biasTable.fabricType === fabricType &&
          biasTable.fabricCode === fabricCode &&
          biasTable.fabricColor === fabricColor) {
        biasTable.rows.forEach(row => {
          const bagno = row.bagno || 'No Bagno';
          const consumption = parseFloat(row.consumption) || 0;
          if (consumption > 0 && mattressBagnos.has(bagno)) {
            collarettoConsumptionByBagno[bagno] = (collarettoConsumptionByBagno[bagno] || 0) + consumption;
            totalCollarettoConsumption += consumption;
          }
        });
      }
    });

    // Check adhesive tables
    adhesiveTables.forEach((adhesiveTable, index) => {
      if (adhesiveTable.fabricType === fabricType &&
          adhesiveTable.fabricCode === fabricCode &&
          adhesiveTable.fabricColor === fabricColor) {
        adhesiveTable.rows.forEach(row => {
          const bagno = row.bagno || 'No Bagno';
          const expectedConsumption = parseFloat(row.expectedConsumption) || 0;
          if (expectedConsumption > 0 && mattressBagnos.has(bagno)) {
            adhesiveConsumptionByBagno[bagno] = (adhesiveConsumptionByBagno[bagno] || 0) + expectedConsumption;
            totalAdhesiveConsumption += expectedConsumption;
          }
        });
      }
    });

    return {
      collarettoConsumption: totalCollarettoConsumption,
      adhesiveConsumption: totalAdhesiveConsumption,
      collarettoConsumptionByBagno,
      adhesiveConsumptionByBagno
    };
  };




  const renderPlannedDetails = () => {
    const sizeElements = uniqueSizes.map(size => {
      const qty = planned[size] || 0;
      const sizeData = orderSizes.find(s => s.size === size);
      const totalOrdered = sizeData ? sizeData.qty : 1;
      const percentage = totalOrdered ? ((qty / totalOrdered) * 100).toFixed(1) : "N/A";

      return (
        <Typography key={size} variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {size}: {formatNumber(qty)} ({percentage !== "NaN" ? percentage + "%" : "N/A"})
        </Typography>
      );
    });

    const totalPcs = Object.values(planned).reduce((sum, qty) => sum + qty, 0);
    const totalOrderedPcs = orderSizes.reduce((sum, s) => sum + (s.qty || 0), 0);

    const totalPcsPct = totalOrderedPcs
    ? ((totalPcs / totalOrderedPcs) * 100).toFixed(1)
    : "N/A";


    sizeElements.push(
      <Typography key="total_pcs" variant="body2" sx={{ fontWeight: "bold", ml: 2 }}>
        Total: {formatNumber(totalPcs)} ({totalPcsPct}%)
      </Typography>
    );

    return sizeElements;
  };



  const renderBagnoTable = () => {
    const totalPerSize = {};

    // Calculate total per size across all bagni
    // Add safety check for plannedByBagno
    if (plannedByBagno && typeof plannedByBagno === 'object') {
      Object.values(plannedByBagno).forEach(sizeMap => {
        if (sizeMap && typeof sizeMap === 'object') {
          Object.entries(sizeMap).forEach(([size, qty]) => {
            totalPerSize[size] = (totalPerSize[size] || 0) + qty;
          });
        }
      });
    }

    // To calculate percentage from `orderSizes`
    const getOrderedQty = (size) => {
      const found = orderSizes.find(s => s.size === size);
      return found ? found.qty : 0;
    };

    const totalMeters = (metersByBagno && typeof metersByBagno === 'object')
      ? Object.values(metersByBagno).reduce((sum, val) => sum + val, 0)
      : 0;

    // Create expanded rows that include width information
    const expandedRows = [];

    (bagnoOrder || []).forEach(bagno => {
      const bagnoWidthData = widthsByBagno[bagno] || {};
      const bagnoSizeMap = plannedByBagno[bagno] || {};

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
              isFirstWidthRow: index === 0, // Mark the first width row to show bagno name
              bagnoRowSpan: Object.keys(bagnoWidthData).length // How many rows this bagno spans
            });
          });
      } else {
        // If width column is hidden OR no width data, show as regular bagno row
        expandedRows.push({
          bagno,
          width: null,
          sizeMap: bagnoSizeMap,
          isWidthRow: false,
          isFirstWidthRow: true, // Single row, so it shows bagno name
          bagnoRowSpan: 1
        });
      }
    });

    // Build header cells array to avoid whitespace issues
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

    if ((fabricConsMode && hasRealConsumptionData()) || collarettoConsumption || adhesiveConsumption) {
      headerCells.push(
        <TableCell key="extra-cons" align="center" sx={{ fontWeight: 'bold' }}>
          {fabricConsMode ? (
            (() => {
              const realConsumption = calculateRealFabricConsumption();
              const hasCollaretto = realConsumption.collarettoConsumption > 0;
              const hasAdhesive = realConsumption.adhesiveConsumption > 0;

              if (hasCollaretto && hasAdhesive) {
                return (
                  <Box component="span">
                    <Typography component="span" sx={{ color: '#673ab7', fontWeight: 'bold' }}>
                      With Collaretto
                    </Typography>
                    <Typography component="span" sx={{ fontWeight: 'bold' }}>
                      {' and '}
                    </Typography>
                    <Typography component="span" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      Adhesive Cons [m]
                    </Typography>
                  </Box>
                );
              } else if (hasCollaretto) {
                return (
                  <Typography component="span" sx={{ color: '#673ab7', fontWeight: 'bold' }}>
                    With Collaretto Cons [m]
                  </Typography>
                );
              } else if (hasAdhesive) {
                return (
                  <Typography component="span" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    With Adhesive Cons [m]
                  </Typography>
                );
              } else {
                return (
                  <Typography component="span" sx={{ color: 'black', fontWeight: 'bold' }}>
                    Real Fabric Cons [m]
                  </Typography>
                );
              }
            })()
          ) : collarettoConsumption && adhesiveConsumption ? (
            <Box component="span">
              <Typography component="span" sx={{ color: '#673ab7', fontWeight: 'bold' }}>
                With Collaretto
              </Typography>
              <Typography component="span" sx={{ fontWeight: 'bold' }}>
                {' and '}
              </Typography>
              <Typography component="span" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                Adhesive Cons [m]
              </Typography>
            </Box>
          ) : collarettoConsumption ? (
            <Typography component="span" sx={{ color: '#673ab7', fontWeight: 'bold' }}>
              With Collaretto Cons [m]
            </Typography>
          ) : (
            <Typography component="span" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
              With Adhesive Cons [m]
            </Typography>
          )}
        </TableCell>
      );
    }

    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>
          {expandedRows.map((row, index) => {
            const { bagno, width, sizeMap, isWidthRow, isFirstWidthRow, bagnoRowSpan } = row;
            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);

            // Use the actual consumption from the row data or real fabric consumption
            let consumption, collarettoConsForRow, adhesiveConsForRow;

            if (fabricConsMode) {
              // Use real fabric consumption from collaretto and adhesive tables
              const realConsumption = calculateRealFabricConsumption();

              // Keep the original consumption from the mattress table
              consumption = isWidthRow ? (row.consumption || 0) : (metersByBagno[bagno] || 0);

              // Add real collaretto and adhesive consumption for this bagno
              let bagnoCollarettoConsumption = realConsumption.collarettoConsumptionByBagno[bagno] || 0;
              let bagnoAdhesiveConsumption = realConsumption.adhesiveConsumptionByBagno[bagno] || 0;

              // If both fabric cons and width column are enabled, and this is a width row,
              // distribute consumption proportionally based on pieces quantity
              if (showWidthColumn && isWidthRow && (bagnoCollarettoConsumption > 0 || bagnoAdhesiveConsumption > 0)) {
                // Calculate total pieces for this bagno across all widths
                const bagnoRows = expandedRows.filter(r => r.bagno === bagno);
                const totalBagnoPieces = bagnoRows.reduce((sum, r) => {
                  return sum + Object.values(r.sizeMap).reduce((s, qty) => s + qty, 0);
                }, 0);

                // Calculate this row's proportion
                const rowPieces = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
                const proportion = totalBagnoPieces > 0 ? rowPieces / totalBagnoPieces : 0;

                // Distribute consumption proportionally
                bagnoCollarettoConsumption = bagnoCollarettoConsumption * proportion;
                bagnoAdhesiveConsumption = bagnoAdhesiveConsumption * proportion;
              }

              collarettoConsForRow = bagnoCollarettoConsumption;
              adhesiveConsForRow = bagnoAdhesiveConsumption;
            } else {
              // Use helper values (theoretical)
              consumption = isWidthRow ? (row.consumption || 0) : (metersByBagno[bagno] || 0);
              collarettoConsForRow = total * parseFloat(collarettoConsumption || 0);
              adhesiveConsForRow = total * parseFloat(adhesiveConsumption || 0);
            }

            // Build row cells array to avoid whitespace issues
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
                  {formatNumber(sizeMap[size] || 0)}
                </TableCell>
              )),
              <TableCell key="total" align="center" sx={{ fontWeight: 500 }}>
                {formatNumber(total)}
              </TableCell>,
              <TableCell key="cons" align="center" sx={{ fontWeight: 500 }}>
                {formatNumber(consumption)}
              </TableCell>
            );

            if ((fabricConsMode && hasRealConsumptionData()) || collarettoConsumption || adhesiveConsumption) {
              rowCells.push(
                <TableCell key="extra-cons" align="center" sx={{
                  fontWeight: 500,
                  backgroundColor: isWidthRow ? '#f8f9fa' : 'inherit'
                }}>
                  {fabricConsMode ? (
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Typography component="span" sx={{ color: 'black' }}>
                        {formatNumber(consumption)}
                      </Typography>
                      {collarettoConsForRow > 0 && (
                        <Typography component="span" sx={{ color: '#673ab7' }}>
                          {" + " + formatNumber(collarettoConsForRow)}
                        </Typography>
                      )}
                      {adhesiveConsForRow > 0 && (
                        <Typography component="span" sx={{ color: '#ff9800' }}>
                          {" + " + formatNumber(adhesiveConsForRow)}
                        </Typography>
                      )}
                      {(collarettoConsForRow > 0 || adhesiveConsForRow > 0) && (
                        <Typography component="span" sx={{ color: 'black' }}>
                          {" = " + formatNumber(consumption + collarettoConsForRow + adhesiveConsForRow)}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Typography component="span" sx={{ color: 'black' }}>
                        {formatNumber(consumption)}
                      </Typography>
                      {collarettoConsumption && (
                        <Typography component="span" sx={{ color: '#673ab7' }}>
                          {" + " + formatNumber(collarettoConsForRow)}
                        </Typography>
                      )}
                      {adhesiveConsumption && (
                        <Typography component="span" sx={{ color: '#ff9800' }}>
                          {" + " + formatNumber(adhesiveConsForRow)}
                        </Typography>
                      )}
                      <Typography component="span" sx={{ color: 'black' }}>
                        {" = " + formatNumber(consumption + collarettoConsForRow + adhesiveConsForRow)}
                      </Typography>
                    </Box>
                  )}
                </TableCell>
              );
            }

            return (
              <TableRow key={`${bagno}-${width || 'main'}-${index}`}>{rowCells}</TableRow>
            );
          })}
          {(() => {
            // Build totals row cells array to avoid whitespace issues
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
                const ordered = getOrderedQty(size);
                const pct = ordered ? ((total / ordered) * 100).toFixed(1) : null;

                return (
                  <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(total)} {pct ? `(${pct}%)` : ''}
                  </TableCell>
                );
              }),
              <TableCell key="total-pcs" align="center" sx={{ fontWeight: 'bold' }}>
                {formatNumber(Object.values(totalPerSize).reduce((sum, val) => sum + val, 0))}{" "}
                ({((Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) /
                    orderSizes.reduce((sum, s) => sum + (s.qty || 0), 0)) * 100).toFixed(1)}%)
              </TableCell>,
              <TableCell key="total-meters" align="center" sx={{ fontWeight: 'bold' }}>
                {formatNumber(totalMeters)}
              </TableCell>
            );

            if ((fabricConsMode && hasRealConsumptionData()) || collarettoConsumption || adhesiveConsumption) {
              if (fabricConsMode) {
                // Calculate total real consumption
                const realConsumption = calculateRealFabricConsumption();
                const totalRealCollaretto = realConsumption.collarettoConsumption;
                const totalRealAdhesive = realConsumption.adhesiveConsumption;

                totalRowCells.push(
                  <TableCell key="total-extra-cons" align="center" sx={{ fontWeight: 'bold' }}>
                    <Box>
                      <Typography component="span" sx={{ color: 'black' }}>
                        {formatNumber(totalMeters)}
                      </Typography>
                      {totalRealCollaretto > 0 && (
                        <Typography component="span" sx={{ color: '#673ab7' }}>
                          {" + " + formatNumber(totalRealCollaretto)}
                        </Typography>
                      )}
                      {totalRealAdhesive > 0 && (
                        <Typography component="span" sx={{ color: '#ff9800' }}>
                          {" + " + formatNumber(totalRealAdhesive)}
                        </Typography>
                      )}
                      {(totalRealCollaretto > 0 || totalRealAdhesive > 0) && (
                        <Typography component="span" sx={{ color: 'black' }}>
                          {" = " + formatNumber(totalMeters + totalRealCollaretto + totalRealAdhesive)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                );
              } else {
                // Use helper values (existing logic)
                totalRowCells.push(
                  <TableCell key="total-extra-cons" align="center" sx={{ fontWeight: 'bold' }}>
                    <Box>
                      <Typography component="span" sx={{ color: 'black' }}>
                        {formatNumber(totalMeters)}
                      </Typography>
                      {collarettoConsumption && (
                        <Typography component="span" sx={{ color: '#673ab7' }}>
                          {" + " + formatNumber(Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(collarettoConsumption || 0))}
                        </Typography>
                      )}
                      {adhesiveConsumption && (
                        <Typography component="span" sx={{ color: '#ff9800' }}>
                          {" + " + formatNumber(Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(adhesiveConsumption || 0))}
                        </Typography>
                      )}
                      <Typography component="span" sx={{ color: 'black' }}>
                        {" = " + formatNumber(totalMeters +
                          (Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(collarettoConsumption || 0)) +
                          (Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(adhesiveConsumption || 0))
                        )}
                      </Typography>
                    </Box>
                  </TableCell>
                );
              }
            }

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

  // Render actual quantities table (similar to planned but with actual data)
  const renderActualBagnoTable = () => {
    if (!showActualQuantities) return null;

    const totalPerSize = {};
    const plannedTotalPerSize = {};

    // Calculate total per size across all bagni for actual
    if (actualByBagno && typeof actualByBagno === 'object') {
      Object.values(actualByBagno).forEach(sizeMap => {
        if (sizeMap && typeof sizeMap === 'object') {
          Object.entries(sizeMap).forEach(([size, qty]) => {
            totalPerSize[size] = (totalPerSize[size] || 0) + qty;
          });
        }
      });
    }

    // Calculate planned totals for percentage calculation
    if (plannedByBagno && typeof plannedByBagno === 'object') {
      Object.values(plannedByBagno).forEach(sizeMap => {
        if (sizeMap && typeof sizeMap === 'object') {
          Object.entries(sizeMap).forEach(([size, qty]) => {
            plannedTotalPerSize[size] = (plannedTotalPerSize[size] || 0) + qty;
          });
        }
      });
    }

    const getOrderedQty = (size) => {
      const found = orderSizes.find(s => s.size === size);
      return found ? found.qty : 0;
    };

    const totalActualMeters = (actualMetersByBagno && typeof actualMetersByBagno === 'object')
      ? Object.values(actualMetersByBagno).reduce((sum, val) => sum + val, 0)
      : 0;

    const totalPlannedMeters = (metersByBagno && typeof metersByBagno === 'object')
      ? Object.values(metersByBagno).reduce((sum, val) => sum + val, 0)
      : 0;

    // Build expanded rows with width breakdown if enabled
    const expandedActualRows = [];
    actualBagnoOrder.forEach(bagno => {
      if (showWidthColumn && actualWidthsByBagno[bagno]) {
        const widths = Object.keys(actualWidthsByBagno[bagno]).sort((a, b) => parseFloat(a) - parseFloat(b));
        const bagnoRowSpan = widths.length;

        widths.forEach((width, widthIndex) => {
          const widthData = actualWidthsByBagno[bagno][width];
          expandedActualRows.push({
            bagno,
            width,
            sizeMap: widthData.sizeMap,
            consumption: widthData.consumption,
            isWidthRow: true,
            isFirstWidthRow: widthIndex === 0,
            bagnoRowSpan
          });
        });
      } else {
        const sizeMap = actualByBagno[bagno] || {};
        const consumption = actualMetersByBagno[bagno] || 0;
        expandedActualRows.push({
          bagno,
          width: null,
          sizeMap,
          consumption,
          isWidthRow: false,
          isFirstWidthRow: true,
          bagnoRowSpan: 1
        });
      }
    });

    // Build header cells
    const headerCells = [
      <TableCell key="bagno" align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>
    ];

    if (showWidthColumn) {
      headerCells.push(
        <TableCell key="width" align="center" sx={{ fontWeight: 'bold' }}>Width [cm]</TableCell>
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

            const rowCells = [];

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

            if (showWidthColumn) {
              rowCells.push(
                <TableCell key="width" align="center">
                  {width ? width : '-'}
                </TableCell>
              );
            }

            rowCells.push(
              ...uniqueSizes.map(size => (
                <TableCell key={size} align="center">
                  {formatNumber(sizeMap[size] || 0)}
                </TableCell>
              )),
              <TableCell key="total" align="center" sx={{ fontWeight: 500 }}>
                {formatNumber(total)}
              </TableCell>,
              <TableCell key="cons" align="center" sx={{ fontWeight: 500 }}>
                {formatNumber(consumption)}
              </TableCell>
            );

            return <TableRow key={`actual-${bagno}-${width || 'main'}-${index}`}>{rowCells}</TableRow>;
          })}

          {/* Totals Row */}
          {(() => {
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
                    {formatNumber(actualTotal)} ({percentage}%)
                  </TableCell>
                );
              }),
              <TableCell key="total-pcs" align="center" sx={{ fontWeight: 'bold' }}>
                {(() => {
                  const actualGrandTotal = Object.values(totalPerSize).reduce((sum, val) => sum + val, 0);
                  const plannedGrandTotal = Object.values(plannedTotalPerSize).reduce((sum, val) => sum + val, 0);
                  const totalPercentage = plannedGrandTotal > 0 ? ((actualGrandTotal / plannedGrandTotal) * 100).toFixed(1) : '0.0';
                  return `${formatNumber(actualGrandTotal)} (${totalPercentage}%)`;
                })()}
              </TableCell>,
              <TableCell key="total-cons" align="center" sx={{ fontWeight: 'bold' }}>
                {formatNumber(totalActualMeters)}
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
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
            {uniqueSizes.map(size => (
              <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Cut (Actual) Row - Primary Blue */}
          <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
            <TableCell align="center" sx={{ fontWeight: 500, color: '#1565c0' }}>Cut</TableCell>
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
            <TableCell align="center" sx={{ fontWeight: 500, color: '#5e35b1' }}>Not Cut</TableCell>
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
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Planned</TableCell>
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
        {renderPlannedDetails()}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent dividers>
          {/* Toggle Controls */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {hasRealConsumptionData() && (
              <FormControlLabel
                control={
                  <Switch
                    checked={fabricConsMode}
                    onChange={(e) => setFabricConsMode(e.target.checked)}
                    color="secondary"
                  />
                }
                label="Fabric Cons."
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }
                }}
              />
            )}
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
          {showActualQuantities && (
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
              Planned Quantities
            </Typography>
          )}
          {renderBagnoTable()}

          {/* Actual Quantities Section - Only show when showActualQuantities is true */}
          {showActualQuantities && (
            <>
              <Box mt={3}>
                <Divider />
              </Box>

              <Box mt={3}>
                <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                  Actual Quantities
                </Typography>
                {renderActualBagnoTable()}
              </Box>
            </>
          )}

          {/* Helpers Section - Only show in order planning and when not in fabric cons mode */}
          {showHelpers && !fabricConsMode && (
            <>
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {/* Collaretto Helper - Left */}
                <Box sx={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                  {/* Header with toggle button */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f0f0f0' }
                    }}
                    onClick={() => setCollarettoHelperExpanded(!collarettoHelperExpanded)}
                  >
                    <Typography variant="h6" sx={{ color: '#673ab7', fontWeight: 'bold' }}>
                      Collaretto Helper
                    </Typography>
                    <IconButton size="small" sx={{ ml: 1, color: '#673ab7' }}>
                      {collarettoHelperExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Collapsible content */}
                  <Collapse in={collarettoHelperExpanded}>
                    <Box sx={{ p: 2, pt: 0 }}>
                      {/* Consumption Calculator */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <TextField
                          label="Collaretto Consumption"
                          variant="outlined"
                          value={collarettoConsumption}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.,]/g, '');
                            setCollarettoConsumption(value);
                          }}
                          sx={{
                            width: '100%',
                            maxWidth: '250px',
                            "& input": {
                              textAlign: "center",
                              fontWeight: "normal"
                            },
                            "& .MuiInputBase-input": {
                              '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                                display: 'none',
                              },
                              '&[type=number]': {
                                MozAppearance: 'textfield',
                              },
                            },
                            "& .MuiFormHelperText-root": {
                              textAlign: "center"
                            }
                          }}
                          placeholder="Enter consumption value"
                          helperText="Enter the consumption value to calculate collaretto consumption per piece"
                        />
                      </Box>
                    </Box>
                  </Collapse>
                </Box>

                {/* Adhesive Helper - Right */}
                <Box sx={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                  {/* Header with toggle button */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f0f0f0' }
                    }}
                    onClick={() => setAdhesiveHelperExpanded(!adhesiveHelperExpanded)}
                  >
                    <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      Adhesive Helper
                    </Typography>
                    <IconButton size="small" sx={{ ml: 1, color: '#ff9800' }}>
                      {adhesiveHelperExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Collapsible content */}
                  <Collapse in={adhesiveHelperExpanded}>
                    <Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <TextField
                        label="Adhesive Consumption"
                        variant="outlined"
                        value={adhesiveConsumption}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.,]/g, '');
                          setAdhesiveConsumption(value);
                        }}
                        sx={{
                          width: '100%',
                          maxWidth: '250px',
                          "& input": {
                            textAlign: "center",
                            fontWeight: "normal"
                          },
                          "& .MuiInputBase-input": {
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                              display: 'none',
                            },
                            '&[type=number]': {
                              MozAppearance: 'textfield',
                            },
                          },
                          "& .MuiFormHelperText-root": {
                            textAlign: "center"
                          }
                        }}
                        placeholder="Enter consumption value"
                        helperText="Enter the consumption value to calculate adhesive consumption per piece"
                      />
                    </Box>
                  </Collapse>
                </Box>
              </Box>

              {/* Cut vs Not Cut Summary - Below Helpers */}
              {(() => {
                const cutSummary = renderCutVsNotCutSummary();
                if (!cutSummary) return null;
                return (
                  <>
                    <Box mt={3}>
                      <Divider />
                    </Box>
                    <Box mt={3}>
                      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                        Cut vs Not Cut Summary
                      </Typography>
                      {cutSummary}
                    </Box>
                  </>
                );
              })()}

            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="text">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlannedQuantityBar;

