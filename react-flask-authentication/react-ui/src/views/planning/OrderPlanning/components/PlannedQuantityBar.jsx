import React, { useState, Fragment } from 'react';
import {
  Box, Typography, Dialog, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  IconButton, Collapse, FormControlLabel, Switch
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

          {renderBagnoTable()}

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

