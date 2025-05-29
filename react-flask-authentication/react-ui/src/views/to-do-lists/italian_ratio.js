import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Typography, Autocomplete, TextField, Grid, Button, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, Alert
 } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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

  const handleRatioChange = (index, value) => {
    const updated = [...ratios];
    updated[index].theoretical_ratio = value;
    setRatios(updated);
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

              // Clear order if it doesn’t match new style
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
