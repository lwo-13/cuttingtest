import React, { useEffect, useState } from 'react';
import { Typography, Autocomplete, TextField, Grid, Button, Box } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';

const ItalianRatio = () => {
  const [orderOptions, setOrderOptions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ratios, setRatios] = useState([]);

  // Additional order context
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedColorCode, setSelectedColorCode] = useState('');

  const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();

  useEffect(() => {
    axios.get('/orders/order_lines/without_ratios').then((res) => {
      const options = res.data.orders.map((id) => ({ id }));
      setOrderOptions(options);
    });
  }, []);

  useEffect(() => {
    if (!selectedOrder) {
      clearBrand();  // Reset the brand if no order is selected
      return;
    }
  
    // Get basic order info
    axios.get(`/orders/order_lines?order_commessa=${selectedOrder}`).then((res) => {
      const lines = res.data.data;
      if (lines.length > 0) {
        setSelectedSeason(lines[0].season || '');  // Set Season
        setSelectedStyle(lines[0].style || '');  // Set Style
        setSelectedColorCode(lines[0].color_code || '');  // Set Color Code
  
        // Fetch Brand if Style is found
        if (lines[0].style) {
          fetchBrandForStyle(lines[0].style);
        }
      }
    });
  
    // Reset ratios when the order is selected
    setRatios([{ size: '', theoretical_ratio: '' }]);
  }, [selectedOrder]);

  const handleRatioChange = (index, value) => {
    const updated = [...ratios];
    updated[index].theoretical_ratio = value;
    setRatios(updated);
  };

  const handleSave = () => {
    const dataToSend = ratios.map((row) => ({
      order_commessa: selectedOrder,
      ...row
    }));

    axios
      .patch('/orders/ratios/update', { data: dataToSend })
      .then(() => {
        alert('Ratios saved!');
        setSelectedOrder(null);
        setRatios([]);
        axios.get('/orders/order_lines/without_ratios').then((res) => {
          const options = res.data.orders.map((id) => ({ id }));
          setOrderOptions(options);
        });
      })
      .catch(() => alert('Error saving ratios'));
  };

  return (
    <>
      {/* Card 1 - Order Selection with Details */}
      <MainCard title="Italian Ratio">
        <OrderToolbar
          orderOptions={orderOptions}
          selectedOrder={selectedOrder}
          onOrderChange={(event, newValue) => setSelectedOrder(newValue?.id || null)}
          selectedSeason={selectedSeason}
          selectedBrand={brand}
          selectedStyle={selectedStyle}
          selectedColorCode={selectedColorCode}
        />
      </MainCard>

      <Box mt={2} />

      {/* Card 2 - Theoretical Ratio Entry */}
      {selectedOrder && (
        <MainCard>
          <Grid container direction="column" spacing={2}>
            {ratios.map((row, index) => (
              <Grid item container spacing={2} key={index} alignItems="center">
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Size"
                    value={row.size}
                    onChange={(e) => {
                      const updated = [...ratios];
                      updated[index].size = e.target.value.toUpperCase();
                      setRatios(updated);
                    }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Theoretical %"
                    type="text"
                    value={row.theoretical_ratio}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                      handleRatioChange(index, value);
                    }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => setRatios([...ratios, { size: '', theoretical_ratio: '' }])}
              >
                + Add Size
              </Button>
            </Grid>

            <Grid item sx={{ mt: 2 }}>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save Ratios
              </Button>
            </Grid>
          </Grid>
        </MainCard>
      )}
    </>
  );
};

export default ItalianRatio;
