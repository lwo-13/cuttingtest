import React from 'react';
import { Grid, TextField, Button, Box, Typography } from '@mui/material';
import { Edit } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';

const CuttingRoomInfo = ({
  productionCenter,
  cuttingRoom,
  destination,
  onChangeSelection,
  orderSizes = [],
  tables = []
}) => {
  // Always show production center and cutting room
  // Only show destination for ZALLI and DELICIA (cutting rooms with multiple destinations)
  const shouldShowDestination = cuttingRoom === 'ZALLI' || cuttingRoom === 'DELICIA';

  // Calculate destination-specific quantities from mattress tables with fabric type 01
  const calculateDestinationQuantities = () => {
    if (!orderSizes.length || !tables.length || !cuttingRoom) {
      return orderSizes.map(size => ({ size: size.size, qty: 0 }));
    }

    // Since tables are already filtered by production center at API level,
    // we only need to filter by fabric type "01"
    const matchingTables = tables.filter(table => table.fabricType === '01');

    // Calculate planned quantities for each size
    const sizeQuantities = {};
    orderSizes.forEach(size => {
      sizeQuantities[size.size] = 0;
    });

    matchingTables.forEach(table => {
      if (table.rows && table.rows.length > 0) {
        table.rows.forEach(row => {
          if (row.piecesPerSize && typeof row.piecesPerSize === 'object') {
            const layers = parseInt(row.layers) || 1;
            orderSizes.forEach(size => {
              const piecesForSize = parseInt(row.piecesPerSize[size.size]) || 0;
              const totalForSize = piecesForSize * layers;
              sizeQuantities[size.size] += totalForSize;
            });
          }
        });
      }
    });

    return orderSizes.map(size => ({
      size: size.size,
      qty: sizeQuantities[size.size] || 0
    }));
  };

  const destinationQuantities = calculateDestinationQuantities();
  const totalDestinationQty = destinationQuantities.reduce((sum, size) => sum + size.qty, 0);

  return (
    <MainCard title="Production Center">
      <Grid container spacing={2}>
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Production Center"
            value={productionCenter || ''}
            placeholder="Not assigned"
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Grid>
        <Grid item xs={6} sm={2.5} md={1.5}>
          <TextField
            label="Cutting Room"
            value={cuttingRoom || ''}
            placeholder="Not assigned"
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Grid>
        {shouldShowDestination && (
          <Grid item xs={6} sm={2.5} md={1.5}>
            <TextField
              label="Destination"
              value={destination || ''}
              placeholder="Not assigned"
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
              sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
            />
          </Grid>
        )}

        {onChangeSelection && (
          <Grid item xs="auto">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Edit />}
              onClick={onChangeSelection}
              size="small"
              sx={{
                height: '48px',
                px: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none'
                }
              }}
            >
              Change Selection
            </Button>
          </Grid>
        )}
      </Grid>

      {/* Destination-Specific Quantities */}
      {totalDestinationQty > 0 && (
        <Box
          mt={3}
          p={2}
          sx={{
            background: '#f5f5f5',
            borderRadius: '8px'
          }}
        >
          <Grid container spacing={2} sx={{
            flexWrap: 'nowrap !important',
            width: '100% !important',
            maxWidth: '100% !important',
            '& .MuiGrid-item': {
              flexShrink: 1,
              minWidth: 0,
              maxWidth: 'none !important'
            }
          }}>
            {/* Total Field */}
            <Grid item xs={4} sm={3} md={1.4}>
              <TextField
                label="Total"
                variant="outlined"
                value={totalDestinationQty}
                InputProps={{ readOnly: true }}
                sx={{ width: '100%' }}
              />
            </Grid>

            {destinationQuantities.map((size, index) => {
              const percentage = totalDestinationQty ? Math.round((size.qty / totalDestinationQty) * 100) : 0;

              return (
                <Grid item xs={4} sm={3} md={1.4} key={index}>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      label={`Size: ${size.size}`}
                      variant="outlined"
                      value={size.qty}
                      InputProps={{ readOnly: true }}
                      sx={{ width: '100%' }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 12,
                        fontWeight: 'bold',
                        color: '#12239e',
                        pointerEvents: 'none',
                      }}
                    >
                      {percentage}%
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </MainCard>
  );
};

export default CuttingRoomInfo;
