import React, { useState } from 'react';
import {
  Box, Typography, Dialog, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  IconButton, Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const PlannedQuantityBar = ({ table, orderSizes, getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno, showHelpers = true }) => {
  const [open, setOpen] = useState(false);
  const [collarettoConsumption, setCollarettoConsumption] = useState('');
  const [adhesiveConsumption, setAdhesiveConsumption] = useState('');
  const [collarettoHelperExpanded, setCollarettoHelperExpanded] = useState(false);
  const [adhesiveHelperExpanded, setAdhesiveHelperExpanded] = useState(false);
  const planned = getTablePlannedQuantities(table);
  const plannedByBagno = getTablePlannedByBagno(table);
  const metersByBagno = getMetersByBagno(table);

  const hasRealQty = Object.values(planned).some(qty => qty > 0);
  if (!hasRealQty) return null;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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

    const totalMeters = Object.values(metersByBagno).reduce((sum, val) => sum + val, 0);
  
    return (
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>
            {uniqueSizes.map(size => (
              <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
            {(collarettoConsumption || adhesiveConsumption) && (
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
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
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(plannedByBagno).map(([bagno, sizeMap]) => {
            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
            const mattressConsForBagno = metersByBagno[bagno] || 0;
            const collarettoConsForBagno = total * parseFloat(collarettoConsumption || 0);
            const adhesiveConsForBagno = total * parseFloat(adhesiveConsumption || 0);

            return (
              <TableRow key={bagno}>
                <TableCell align="center">{bagno}</TableCell>
                {uniqueSizes.map(size => (
                  <TableCell key={size} align="center">
                    {sizeMap[size] || 0}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 500 }}>{total}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 500 }}>
                  {mattressConsForBagno.toFixed(0)}
                </TableCell>
                {(collarettoConsumption || adhesiveConsumption) && (
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    <Box>
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
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
  
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
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              {Object.values(totalPerSize).reduce((sum, val) => sum + val, 0)}{" "}
              ({((Object.values(totalPerSize).reduce((sum, val) => sum + val, 0) /
                  orderSizes.reduce((sum, s) => sum + (s.qty || 0), 0)) * 100).toFixed(1)}%)
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              {totalMeters.toFixed(0)}
            </TableCell>
            {(collarettoConsumption || adhesiveConsumption) && (
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
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
            )}
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

          {/* Helpers Section - Only show in order planning */}
          {showHelpers && (
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
                  <Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

