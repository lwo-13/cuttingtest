import React, { useEffect, useState } from 'react';
import { Typography, Autocomplete, TextField, Grid, Button, Box } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'axios';

const ItalianRatio = () => {
  const [orderOptions, setOrderOptions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ratios, setRatios] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/orders/ratios/todo').then((res) => {
      const options = res.data.orders.map((id) => ({ id }));
      setOrderOptions(options);
    });
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;
    axios.get(`http://127.0.0.1:5000/api/orders/ratios/${selectedOrder}`).then((res) => {
      setRatios(res.data.data);
    });
  }, [selectedOrder]);

  const handleRatioChange = (index, value) => {
    const updated = [...ratios];
    updated[index].theoretical_ratio = value;
    setRatios(updated);
  };

  const handleSave = () => {
    axios
      .patch('http://127.0.0.1:5000/api/orders/ratios/update', { data: ratios })
      .then(() => {
        alert('Ratios saved!');
        setSelectedOrder(null);
        setRatios([]);
        axios.get('http://127.0.0.1:5000/api/orders/ratios/todo').then((res) => {
          const options = res.data.orders.map((id) => ({ id }));
          setOrderOptions(options);
        });
      })
      .catch(() => alert('Error saving ratios'));
  };

  return (
    <>
      {/* Card 1 - Order Selection */}
      <MainCard title="Italian Ratio">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              options={orderOptions}
              getOptionLabel={(option) => option.id}
              value={orderOptions.find((order) => order.id === selectedOrder) || null}
              onChange={(event, newValue) => setSelectedOrder(newValue?.id || null)}
              renderInput={(params) => <TextField {...params} label="Select Order" variant="outlined" />}
              fullWidth
            />
          </Grid>
        </Grid>
      </MainCard>

      <Box mt={2} />

      {/* Card 2 - Theoretical Ratio Entry */}
      {selectedOrder && ratios.length > 0 && (
        <MainCard>
            <Grid container direction="column" spacing={2}>
            {ratios.map((row, index) => (
                <Grid item container spacing={2} key={index} alignItems="center">
                <Grid item xs={6} sm={3}>
                    <Typography>Size: {row.size}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField
                    label="Theoretical %"
                    type="number"
                    value={row.theoretical_ratio}
                    onChange={(e) => handleRatioChange(index, parseFloat(e.target.value) || 0)}
                    fullWidth
                    />
                </Grid>
                </Grid>
            ))}

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

