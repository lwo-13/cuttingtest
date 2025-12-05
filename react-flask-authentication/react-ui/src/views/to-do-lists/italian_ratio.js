import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Typography, Autocomplete, TextField, Grid, Button, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, Alert, CircularProgress
 } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';

import { useBadgeCount } from '../../contexts/BadgeCountContext';

const basicSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const shoSizes = ['XSSHO', 'SSHO', 'MSHO', 'LSHO', 'XLSHO'];
const mergedSizes = ['XS/S', 'S/M', 'M/L'];
const vSizes = ['V25', 'V30', 'V40'];
const doubleSizes = ['2', '3-4', '5-6', '7-8', '9-10', '11-12'];
const rangeSizes = ['2-3', '4-5', '6-7', '8-9', '10-11', '12-13'];
const letteredSizes = [
  '0D', '1A', '1B', '1C', '1D', '1E',
  '2A', '2B', '2C', '2D', '2E',
  '3A', '3B', '3C', '3D', '3E',
  '4A', '4B', '4C', '4D', '4E',
  '5A', '5B', '5C', '5D', '5E',
  '6B', '6C'
];
const numericSizes = ['38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58'];
const slashSizes = ['2/3', '4/5', '6/7', '8/9', '10/11', '12/13'];
const collantSizes = ['1/2', '3/4'];
const numberSeriesSizes = ['1', '2', '3', '4', '5', '6', '7', '8', '10', '12', '14'];
const falcSizes = ['XS', 'S', 'M', 'L', 'LL', 'LLL'];
const extraSizes = ['000', 'ML', 'SM', 'TU', 'UN', 'X/XXL'];

const allGroups = {
  Basic: basicSizes,
  SHO: shoSizes,
  Merged: mergedSizes,
  V: vSizes,
  Double: doubleSizes,
  Range: rangeSizes,
  Lettered: letteredSizes,
  Numeric: numericSizes,
  Slash: slashSizes,
  Collant: collantSizes,
  NumberSeries: numberSeriesSizes,
  Extra: extraSizes,
  Falc : falcSizes
};

const ItalianRatio = () => {
  const [orderOptions, setOrderOptions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ratios, setRatios] = useState([]);

  // Additional order context
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedColorCode, setSelectedColorCode] = useState('');

  const [styleOptions, setStyleOptions] = useState([]);
  const [styleTouched, setStyleTouched] = useState(false);

  const lastStyleRef = useRef('');

  const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();

  const [availableSizes, setAvailableSizes] = useState([]);

  const [fetchedSizes, setFetchedSizes] = useState([]);

  // Pop up
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Snackbar
  const [openError, setOpenError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openSuccess, setOpenSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-populate loading state
  const [autoPopulateLoading, setAutoPopulateLoading] = useState(false);

  // Match details dialog
  const [matchDetailsOpen, setMatchDetailsOpen] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);

  // Auto-save trigger
  const [shouldAutoSave, setShouldAutoSave] = useState(false);

  const { orderRatioPendingCount, refreshOrderRatioCount } = useBadgeCount();

  useEffect(() => {
    axios.get('/orders/order_lines/without_ratios').then((res) => {
      const orders = res.data.orders; // [{ id, style }]
      setOrderOptions(orders);

      // ✅ Derive unique styles from that list
      const uniqueStyles = [...new Set(orders.map(order => order.style).filter(Boolean))].sort();
      setStyleOptions(uniqueStyles);
    });
  }, []);

  useEffect(() => {
    if (!selectedOrder?.id) {
      clearBrand();
      setSelectedSeason('');
      setSelectedColorCode('');
      setFetchedSizes([]);

      if (!styleTouched) {
        setSelectedStyle('');
        lastStyleRef.current = ''; // ✅ clear style tracker
      }

      return;
    }

    axios.get(`/orders/order_lines?order_commessa=${selectedOrder.id}`).then((res) => {
      const lines = res.data.data;
      if (lines.length > 0) {
        setSelectedSeason(lines[0].season || '');
        if (!styleTouched) {
          setSelectedStyle(lines[0].style || '');
          lastStyleRef.current = lines[0].style || '';
        }
        setSelectedColorCode(lines[0].color_code || '');
        if (lines[0].style) fetchBrandForStyle(lines[0].style);
        const sizes = [...new Set(lines.map((line) => line.size))];
        setFetchedSizes(sizes);
      }
    });

    setRatios([{ size: '', theoretical_ratio: '' }, { size: '', theoretical_ratio: '' }, { size: '', theoretical_ratio: '' }]);
  }, [selectedOrder?.id]); // 👈 track the ID

  // Auto-save effect - triggers a few seconds after dialog is closed
  useEffect(() => {
    if (!shouldAutoSave) return;

    const timer = setTimeout(() => {
      // Validate ratios before auto-saving
      if (!selectedOrder?.id) {
        setShouldAutoSave(false);
        return;
      }

      const totalRatio = ratios.reduce((sum, row) => sum + parseFloat(row.theoretical_ratio || 0), 0);

      if (totalRatio !== 100) {
        setErrorMessage(`Total percentage must be 100%. Currently: ${totalRatio}%`);
        setOpenError(true);
        setShouldAutoSave(false);
        return;
      }

      const dataToSend = ratios.map((row) => ({
        order_commessa: selectedOrder?.id,
        size: row.size,
        theoretical_ratio: parseFloat(row.theoretical_ratio || 0)
      }));

      axios
        .patch('/orders/ratios/update', { data: dataToSend })
        .then(() => {
          setSuccessMessage('Ratios auto-saved!');
          setOpenSuccess(true);
          refreshOrderRatioCount();
          setSelectedOrder(null);
          setRatios([]);

          // 🔁 Trigger full page reload
          window.location.reload();
        })
        .catch(() => {
          setErrorMessage('Error auto-saving ratios');
          setOpenError(true);
        })
        .finally(() => {
          setShouldAutoSave(false);
        });
    }, 500); // 0.5 seconds delay

    return () => clearTimeout(timer);
  }, [shouldAutoSave, selectedOrder, ratios, refreshOrderRatioCount]);

  useEffect(() => {
    if (!fetchedSizes.length) return;

    let filteredGroups = { ...allGroups };

    if (brand?.trim().toUpperCase() === 'FALCONERI') {
      const { Basic, ...rest } = filteredGroups;
      filteredGroups = rest;
    }

    const matchedGroup = Object.entries(filteredGroups).find(([_, groupSizes]) =>
      fetchedSizes.every((size) => groupSizes.includes(size))
    );

    setAvailableSizes(matchedGroup ? matchedGroup[1] : []);
  }, [brand, fetchedSizes]);

  // Auto-populate function
  const handleAutoPopulate = async () => {
    if (!selectedOrder?.id) {
      setErrorMessage('Please select an order first');
      setOpenError(true);
      return;
    }

    setAutoPopulateLoading(true);
    try {
      const response = await axios.post(`/orders/ratios/auto_populate/${selectedOrder.id}`);

      if (response.data.success) {
        // Update the ratios state with the auto-populated data
        const autoPopulatedRatios = response.data.ratios.map(r => ({
          size: r.size,
          theoretical_ratio: r.theoretical_ratio
        }));
        setRatios(autoPopulatedRatios);

        // Store match details and show dialog
        setMatchDetails(response.data.match_details);
        setMatchDetailsOpen(true);

        // Keep the order selected so user can review and save manually
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Failed to auto-populate ratios';
      setErrorMessage(errorMsg);
      setOpenError(true);
    } finally {
      setAutoPopulateLoading(false);
    }
  };

  const handleSave = () => {
    const isValid = ratios.every(
      (row) => row.size && row.theoretical_ratio && !isNaN(Number(row.theoretical_ratio))
    );

    if (!isValid) {
      setErrorMessage('Please fill out all sizes and valid ratios before saving.');
      setOpenError(true);
      return;
    }

    const totalRatio = ratios.reduce((sum, row) => sum + parseFloat(row.theoretical_ratio || 0), 0);

    if (totalRatio !== 100) {
      setErrorMessage(`Total percentage must be 100%. Currently: ${totalRatio}%`);
      setOpenError(true);
      return;
    }

    const dataToSend = ratios.map((row) => ({
      order_commessa: selectedOrder?.id,
      size: row.size,
      theoretical_ratio: parseFloat(row.theoretical_ratio || 0)
    }));

    axios
      .patch('/orders/ratios/update', { data: dataToSend })
      .then(() => {
        setSuccessMessage('Ratios saved!');
        setOpenSuccess(true);
        refreshOrderRatioCount();
        setSelectedOrder(null);
        setRatios([]);

        // 🔁 Trigger full page reload
        window.location.reload();
      })
      .catch(() => {
        setErrorMessage('Error saving ratios');
        setOpenError(true)
      });
  };

  const filteredOrders = useMemo(() =>
    orderOptions?.filter(o => !selectedStyle || o.style === selectedStyle) || [],
    [orderOptions, selectedStyle]
  );

  const handleCloseError = () => setOpenError(false);
  const handleCloseSuccess = () => setOpenSuccess(false);

  const handleRatioChange = (index, value) => {
    const updated = [...ratios];
    updated[index].theoretical_ratio = value;
    setRatios(updated);
  };

  // Handle match details dialog close - trigger auto-save
  const handleCloseMatchDetails = () => {
    setMatchDetailsOpen(false);
    setShouldAutoSave(true); // Trigger auto-save after a few seconds
  };

  return (
    <>
      {/* Card 1 - Order Selection with Details */}
      <MainCard title="Italian Ratio">
        <Grid item xs={12} sm={6}>
          <OrderToolbar
            styleOptions={styleOptions}
            selectedStyle={selectedStyle}
            onStyleChange={(newStyle, touched = false) => {
              if (!touched || !newStyle || newStyle === lastStyleRef.current) return;

              lastStyleRef.current = newStyle;
              setStyleTouched(true);
              setSelectedStyle(newStyle);

              // Clear order if it doesn't match new style
              const matchingOrders = orderOptions.filter(order => order.style === newStyle);
              if (!matchingOrders.some(order => order.id === selectedOrder?.id)) {
                setSelectedOrder(null);
              }
            }}
            orderOptions={filteredOrders}
            selectedOrder={selectedOrder}
            onOrderChange={(newValue) => {
              setSelectedOrder(newValue || null); // ✅
              setStyleTouched(false);
              console.log("✅ selectedOrder set to:", newValue);
            }}
            selectedSeason={selectedSeason}
            selectedBrand={brand}
            selectedColorCode={selectedColorCode}
          />
        </Grid>
      </MainCard>

      <Box mt={2} />

      {/* Auto-Populate Card */}
      {selectedOrder && (
        <>
          <MainCard>
            <Grid container direction="column" spacing={2}>
              <Grid item>
                <Typography variant="h4" gutterBottom>
                  Auto-Populate from Similar Order
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Automatically populate ratios by finding an existing order with the same style, sizes, and fabric BOM.
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={autoPopulateLoading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                  onClick={handleAutoPopulate}
                  disabled={autoPopulateLoading}
                >
                  {autoPopulateLoading ? 'Searching...' : 'Auto-Populate Ratios'}
                </Button>
              </Grid>
            </Grid>
          </MainCard>

          <Box mt={2} />
        </>
      )}

      {/* Card 2 - Theoretical Ratio Entry */}
      {selectedOrder && (
        <MainCard>
          <Grid container direction="column" spacing={2}>
            {ratios.map((row, index) => (
              <Grid item container spacing={2} key={index} alignItems="center">
                <Grid item xs={4} sm={2}>
                  <Autocomplete
                    options={availableSizes.filter(
                      (option) => !ratios.some((row, i) => row.size === option && i !== index)
                    )}
                    value={row.size}
                    onChange={(e, newValue) => {
                      const updated = [...ratios];
                      updated[index].size = newValue || '';
                      setRatios(updated);
                    }}
                    renderInput={(params) => <TextField {...params} label="Size" fullWidth />}
                  />
                </Grid>
                <Grid item xs={4} sm={2}>
                  <TextField
                    label="Italian %"
                    type="text"
                    value={row.theoretical_ratio}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const value = rawValue
                        .replace(/[^0-9.]/g, '')
                        .replace(/^(\d*\.\d?).*$/, '$1')
                        .slice(0, 4);
                      handleRatioChange(index, value);
                    }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2} sm={1}>
                  <IconButton onClick={() => {
                    const updated = [...ratios];
                    updated.splice(index, 1);
                    setRatios(updated);
                    }}
                    disabled={ratios.length === 1}
                  >
                    <CloseIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Grid item container spacing={2} direction="row">
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={() => setRatios([...ratios, { size: '', theoretical_ratio: '' }])}
                >
                  +
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setConfirmOpen(true)}
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </MainCard>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogContent>
          <DialogContentText>
            Are you sure all the information is correct?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              handleSave();
            }}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Match Details Dialog */}
      <Dialog
        open={matchDetailsOpen}
        onClose={handleCloseMatchDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h3" color="secondary">
            ✅ Match Found!
          </Typography>
        </DialogTitle>
        <DialogContent>
          {matchDetails && (
            <Grid container spacing={3}>
              {/* Target Order Section */}
              <Grid item xs={12}>
                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                  Your Order: {matchDetails.target_order}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Style:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{matchDetails.target_style}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Fabric BOM with Consumption ({matchDetails.target_bom_count} items):
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {matchDetails.target_bom_items.join(', ')}
                  {matchDetails.target_bom_count > 10 && '...'}
                </Typography>
              </Grid>

              {/* Divider */}
              <Grid item xs={12}>
                <Box sx={{ borderTop: '2px solid', borderColor: 'secondary.main', my: 1 }} />
              </Grid>

              {/* Matched Order Section */}
              <Grid item xs={12}>
                <Typography variant="h4" gutterBottom sx={{ color: 'secondary.main' }}>
                  Matched Order: {matchDetails.matched_order}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Style:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{matchDetails.matched_style}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Fabric BOM with Consumption ({matchDetails.matched_bom_count} items):
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {matchDetails.matched_bom_items.join(', ')}
                  {matchDetails.matched_bom_count > 10 && '...'}
                </Typography>
              </Grid>

              {/* Comparison Summary */}
              <Grid item xs={12}>
                <Box sx={{ borderTop: '2px solid', borderColor: 'success.main', my: 1 }} />
                <Typography variant="h5" gutterBottom sx={{ color: 'success.main' }}>
                  ✓ Match Criteria
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2">
                  ✓ Same Style: <strong>{matchDetails.target_style}</strong>
                </Typography>
                <Typography variant="body2">
                  ✓ Same Fabric BOM with Consumption: <strong>{matchDetails.target_bom_count} items with identical quantities</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Note: Matching fabric consumption values indicates the same size ratio distribution used for costing.
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseMatchDetails}
            color="primary"
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openError}
        autoHideDuration={5000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={openSuccess}
        autoHideDuration={5000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: '100%', padding: "12px 16px", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ItalianRatio;

