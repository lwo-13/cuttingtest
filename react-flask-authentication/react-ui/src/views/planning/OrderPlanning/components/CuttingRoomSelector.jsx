import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const CuttingRoomSelector = ({ productionCenter, setProductionCenter, cuttingRoom, setCuttingRoom, destination, setDestination }) => {
  const handleProductionCenterChange = (e) => {
    const value = e.target.value;
    setProductionCenter(value);

    if (value === 'PXE1') {
      setCuttingRoom('Zalli');
      setDestination(''); // Reset destination
    } else {
      setCuttingRoom('');
      setDestination('');
    }
  };

  return (
    <MainCard title="Cutting Room">
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={3} sm={2} md={1.5}>
          <FormControl fullWidth>
            <InputLabel id="production-center-label">Production Center</InputLabel>
            <Select
              labelId="production-center-label"
              id="production-center"
              value={productionCenter}
              label="Production Center"
              onChange={handleProductionCenterChange}
              sx={{
                    fontWeight: 'normal',
                    '& .MuiSelect-select': {
                    fontWeight: 'normal'
                    }
                }}
            >
              <MenuItem value="PXE1" sx={{ fontWeight: 'normal' }}>PXE1</MenuItem>
              <MenuItem value="PXE3" sx={{ fontWeight: 'normal' }}>PXE3</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={4} md={2.5}>
          <FormControl fullWidth disabled={productionCenter === ''}>
            <InputLabel id="cutting-room-label">Cutting Room</InputLabel>
            <Select
              labelId="cutting-room-label"
              id="cutting-room"
              value={cuttingRoom}
              label="Cutting Room"
              onChange={(e) => setCuttingRoom(e.target.value)}
              sx={{
                    fontWeight: 'normal',
                    '& .MuiSelect-select': {
                    fontWeight: 'normal'
                    }
                }}
            >
              {productionCenter === 'PXE1' && (
                <MenuItem value="ZALLI">ZALLI</MenuItem>
              )}
              {productionCenter === 'PXE3' && [
                'DELITSIYA FASHION LTD',
                'SYNA STYLE LTD',
                'IDEAL FASHION LTD',
                'SYNA FASHION LTD',
                'VEGA TEX LTD',
                'ZEYNTEX OOD',
                'Вайде Молла  ЕООД',
                'ВЕРОНА - РН  ООД',
                'ИХ-65 Хаджиоли  ЕООД',
                'НАДЖИ-1 ЕООД',
                'Рила Текстил  ЕООД',
                'САБРИ 89  ЕООД',
                'Сунай  ООД',
                'Текстил Кънстракшън ЕООД',
                'Юмер и син  ЕООД'
              ].map((room) => (
                <MenuItem key={room} value={room}>{room}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {productionCenter === 'PXE1' && (
          <Grid item xs={6} sm={4} md={2.5}>
            <FormControl fullWidth>
              <InputLabel id="destination-label">Destination</InputLabel>
              <Select
                labelId="destination-label"
                id="destination"
                value={destination}
                label="Destination"
                onChange={(e) => setDestination(e.target.value)}
                sx={{
                    fontWeight: 'normal',
                    '& .MuiSelect-select': {
                    fontWeight: 'normal'
                    }
                }}
              >
                <MenuItem value="ZALLI 1">ZALLI 1</MenuItem>
                <MenuItem value="ZALLI 2">ZALLI 2</MenuItem>
                <MenuItem value="ZALLI 3">ZALLI 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </MainCard>
  );
};

export default CuttingRoomSelector;