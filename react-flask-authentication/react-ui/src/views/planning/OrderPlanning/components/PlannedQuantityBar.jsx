import React, { useState, Fragment } from 'react';
import {
  Box, Typography, Dialog, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  IconButton, Collapse, Chip
} from '@mui/material';
import { ExpandMore, ExpandLess, Add, Remove } from '@mui/icons-material';

const PlannedQuantityBar = ({ table, orderSizes, getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno, showHelpers = true }) => {
  const [open, setOpen] = useState(false);
  const [collarettoConsumption, setCollarettoConsumption] = useState('');
  const [adhesiveConsumption, setAdhesiveConsumption] = useState('');
  const [collarettoHelperExpanded, setCollarettoHelperExpanded] = useState(false);
  const [adhesiveHelperExpanded, setAdhesiveHelperExpanded] = useState(false);
  const [expandedBagnos, setExpandedBagnos] = useState({});
  const [bagnoWidths, setBagnoWidths] = useState({});

  const planned = getTablePlannedQuantities(table);
  const { bagnoMap: plannedByBagno, bagnoOrder } = getTablePlannedByBagno(table);
  const { bagnoMeters: metersByBagno } = getMetersByBagno(table);

  const hasRealQty = Object.values(planned).some(qty => qty > 0);
  if (!hasRealQty) return null;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Bagno width splitting functions
  const toggleBagnoExpansion = (bagno) => {
    setExpandedBagnos(prev => ({
      ...prev,
      [bagno]: !prev[bagno]
    }));

    // Initialize width splits if not exists
    if (!bagnoWidths[bagno]) {
      setBagnoWidths(prev => ({
        ...prev,
        [bagno]: [{ width: '', quantity: '' }]
      }));
    }
  };

  const updateBagnoWidth = (bagno, index, field, value) => {
    setBagnoWidths(prev => ({
      ...prev,
      [bagno]: prev[bagno]?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));
  };

  const addBagnoWidth = (bagno) => {
    setBagnoWidths(prev => ({
      ...prev,
      [bagno]: [...(prev[bagno] || []), { width: '', quantity: '' }]
    }));
  };

  const removeBagnoWidth = (bagno, index) => {
    setBagnoWidths(prev => ({
      ...prev,
      [bagno]: prev[bagno]?.filter((_, i) => i !== index) || []
    }));
  };



  const renderPlannedDetails = () => {
    const sizeElements = uniqueSizes.map(size => {
      const qty = planned[size] || 0;
      const sizeData = orderSizes.find(s => s.size === size);
      const totalOrdered = sizeData ? sizeData.qty : 1;
      const percentage = totalOrdered ? ((qty / totalOrdered) * 100).toFixed(1) : "N/A";

      return (
        <Typography key={size} variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {size}: {qty} ({percentage !== "NaN" ? percentage + "%" : "N/A"})
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
        Total: {totalPcs} ({totalPcsPct}%)
      </Typography>
    );

    return sizeElements;
  };

  const uniqueSizes = orderSizes.map(s => s.size);



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

    // Build header cells array to avoid whitespace issues
    const headerCells = [
      <TableCell key="bagno" align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>,
      ...uniqueSizes.map(size => (
        <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
      )),
      <TableCell key="total" align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>,
      <TableCell key="cons" align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
    ];

    if (collarettoConsumption || adhesiveConsumption) {
      headerCells.push(
        <TableCell key="extra-cons" align="center" sx={{ fontWeight: 'bold' }}>
          {collarettoConsumption && adhesiveConsumption ? (
            <Box component="span">
              <Typography component="span" sx={{ color: '#673ab7', fontWeight: 'bold' }}>
                With Collaretto
              </Typography>
              <Typography component="span" sx={{ color: 'black', fontWeight: 'bold' }}>
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
          {(bagnoOrder || []).map((bagno) => {
            const sizeMap = plannedByBagno[bagno] || {};
            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
            const mattressConsForBagno = metersByBagno[bagno] || 0;
            const collarettoConsForBagno = total * parseFloat(collarettoConsumption || 0);
            const adhesiveConsForBagno = total * parseFloat(adhesiveConsumption || 0);

            // Build row cells array to avoid whitespace issues
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

            if (collarettoConsumption || adhesiveConsumption) {
              rowCells.push(
                <TableCell key="extra-cons" align="center" sx={{ fontWeight: 500 }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <Typography component="span" sx={{ color: 'black' }}>
                      {Math.round(mattressConsForBagno)}
                    </Typography>
                    {collarettoConsumption && (
                      <Typography component="span" sx={{ color: '#673ab7' }}>
                        {" + " + Math.round(collarettoConsForBagno)}
                      </Typography>
                    )}
                    {adhesiveConsumption && (
                      <Typography component="span" sx={{ color: '#ff9800' }}>
                        {" + " + Math.round(adhesiveConsForBagno)}
                      </Typography>
                    )}
                    <Typography component="span" sx={{ color: 'black' }}>
                      {" = " + Math.round(mattressConsForBagno + collarettoConsForBagno + adhesiveConsForBagno)}
                    </Typography>
                    {/* Width splitting toggle button */}
                    {collarettoConsumption && (
                      <IconButton
                        size="small"
                        onClick={() => toggleBagnoExpansion(bagno)}
                        sx={{ ml: 0.5, color: '#673ab7' }}
                      >
                        {expandedBagnos[bagno] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              );
            }

            return (
              <Fragment key={bagno}>
                <TableRow>{rowCells}</TableRow>
                {/* Width splitting row - expands RIGHT HERE under each bagno */}
                {expandedBagnos[bagno] && collarettoConsumption && (
                  <TableRow>
                    <TableCell colSpan={uniqueSizes.length + (collarettoConsumption || adhesiveConsumption ? 3 : 2)} sx={{ p: 0, border: 'none' }}>
                      <Collapse in={expandedBagnos[bagno]}>
                        <Box sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 1, m: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#673ab7', mb: 2, textAlign: 'center' }}>
                            Bagno {bagno} - Split by Width
                          </Typography>

                          {(bagnoWidths[bagno] || []).map((widthItem, index) => {
                            // Calculate pieces from metres
                            const totalBagnoMetres = metersByBagno[bagno] || 0;
                            const totalBagnoPieces = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
                            const metresPerPiece = totalBagnoPieces > 0 ? totalBagnoMetres / totalBagnoPieces : 0;

                            const metres = parseFloat(widthItem.quantity) || 0;
                            const pieces = metresPerPiece > 0 ? metres / metresPerPiece : 0;
                            const consumption = pieces * parseFloat(collarettoConsumption);

                            return (
                              <Box key={index} display="flex" gap={2} mb={1.5} alignItems="center" justifyContent="center">
                                <TextField
                                  size="small"
                                  label="Width (cm)"
                                  placeholder="150"
                                  value={widthItem.width}
                                  onChange={(e) => updateBagnoWidth(bagno, index, 'width', e.target.value)}
                                  sx={{ width: '100px' }}
                                  type="number"
                                />
                                <TextField
                                  size="small"
                                  label="Metres"
                                  placeholder="412"
                                  value={widthItem.quantity}
                                  onChange={(e) => updateBagnoWidth(bagno, index, 'quantity', e.target.value)}
                                  sx={{ width: '100px' }}
                                  type="number"
                                  slotProps={{
                                    htmlInput: { step: 0.1 }
                                  }}
                                />
                                <Box display="flex" flexDirection="column" alignItems="center">
                                  <Typography variant="caption" color="text.secondary">
                                    {pieces.toFixed(0)} pcs
                                  </Typography>
                                  <Chip
                                    label={`${consumption.toFixed(1)}m`}
                                    size="small"
                                    sx={{ bgcolor: '#673ab7', color: 'white', minWidth: '70px' }}
                                  />
                                </Box>
                                {bagnoWidths[bagno]?.length > 1 && (
                                  <IconButton
                                    size="small"
                                    onClick={() => removeBagnoWidth(bagno, index)}
                                    sx={{ color: 'error.main' }}
                                  >
                                    <Remove />
                                  </IconButton>
                                )}
                              </Box>
                            );
                          })}

                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={1.5} borderTop="1px solid #dee2e6">
                            <Button
                              size="small"
                              startIcon={<Add />}
                              onClick={() => addBagnoWidth(bagno)}
                              variant="outlined"
                              sx={{ color: '#673ab7', borderColor: '#673ab7' }}
                            >
                              Add Width
                            </Button>

                            <Box textAlign="right">
                              <Typography variant="caption" color="text.secondary">
                                Total: {(bagnoWidths[bagno] || []).reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0).toFixed(1)}m
                              </Typography>
                              <br />
                              <Typography variant="caption" sx={{ color: '#673ab7', fontWeight: 'bold' }}>
                                Consumption: {(bagnoWidths[bagno] || []).map(w => {
                                  const metres = parseFloat(w.quantity) || 0;
                                  const totalBagnoMetres = metersByBagno[bagno] || 0;
                                  const totalBagnoPieces = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
                                  const metresPerPiece = totalBagnoPieces > 0 ? totalBagnoMetres / totalBagnoPieces : 0;
                                  const pieces = metresPerPiece > 0 ? metres / metresPerPiece : 0;
                                  return pieces * parseFloat(collarettoConsumption);
                                }).reduce((sum, cons) => sum + cons, 0).toFixed(1)}m
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {(() => {
            // Build totals row cells array to avoid whitespace issues
            const totalRowCells = [
              <TableCell key="total-label" align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>,
              ...uniqueSizes.map(size => {
                const total = totalPerSize[size] || 0;
                const ordered = getOrderedQty(size);
                const pct = ordered ? ((total / ordered) * 100).toFixed(1) : null;

                return (
                  <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                    {total} {pct ? `(${pct}%)` : ''}
                  </TableCell>
                );
              }),
              <TableCell key="total-pcs" align="center" sx={{ fontWeight: 'bold' }}>
                {Object.values(totalPerSize).reduce((sum, val) => sum + val, 0)}{" "}
                ({((Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) /
                    orderSizes.reduce((sum, s) => sum + (s.qty || 0), 0)) * 100).toFixed(1)}%)
              </TableCell>,
              <TableCell key="total-meters" align="center" sx={{ fontWeight: 'bold' }}>
                {totalMeters.toFixed(0)}
              </TableCell>
            ];

            if (collarettoConsumption || adhesiveConsumption) {
              totalRowCells.push(
                <TableCell key="total-extra-cons" align="center" sx={{ fontWeight: 'bold' }}>
                  <Box>
                    <Typography component="span" sx={{ color: 'black' }}>
                      {Math.round(totalMeters)}
                    </Typography>
                    {collarettoConsumption && (
                      <Typography component="span" sx={{ color: '#673ab7' }}>
                        {" + " + Math.round(Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(collarettoConsumption || 0))}
                      </Typography>
                    )}
                    {adhesiveConsumption && (
                      <Typography component="span" sx={{ color: '#ff9800' }}>
                        {" + " + Math.round(Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(adhesiveConsumption || 0))}
                      </Typography>
                    )}
                    <Typography component="span" sx={{ color: 'black' }}>
                      {" = " + Math.round(totalMeters +
                        (Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(collarettoConsumption || 0)) +
                        (Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) * parseFloat(adhesiveConsumption || 0))
                      )}
                    </Typography>
                  </Box>
                </TableCell>
              );
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
          {renderBagnoTable()}

          {/* Helpers Section - Only show in order planning */}
          {showHelpers && (
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

