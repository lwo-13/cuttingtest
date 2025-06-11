import React from 'react';
import { Grid, Autocomplete, TextField, Button, Box } from '@mui/material';
import { FilterAlt } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import { useTranslation } from 'react-i18next';

const ProductionCenterFilter = ({
  combinations = [],
  selectedCuttingRoom,
  selectedDestination,
  onCuttingRoomChange,
  onDestinationChange,
  onApplyFilter,
  loading = false
}) => {
  const { t } = useTranslation();

  // Get unique cutting rooms from combinations
  const cuttingRoomOptions = [...new Set(combinations.map(c => c.cutting_room))].map(cr => ({
    value: cr,
    label: cr
  }));

  // Get destinations for selected cutting room
  const destinationOptions = selectedCuttingRoom
    ? combinations
        .filter(c => c.cutting_room === selectedCuttingRoom)
        .map(c => ({ value: c.destination, label: c.destination }))
    : [];

  // Get production center for display (from first matching combination)
  const selectedCombo = combinations.find(c =>
    c.cutting_room === selectedCuttingRoom && c.destination === selectedDestination
  );
  const displayProductionCenter = selectedCombo?.production_center ||
    (selectedCuttingRoom ? combinations.find(c => c.cutting_room === selectedCuttingRoom)?.production_center || '' : '');

  // Auto-select destination if cutting room has only one destination
  React.useEffect(() => {
    if (selectedCuttingRoom && destinationOptions.length === 1) {
      onDestinationChange(destinationOptions[0].value);
    }
  }, [selectedCuttingRoom, destinationOptions, onDestinationChange]);

  const isApplyDisabled = !selectedCuttingRoom || !selectedDestination || loading;



  return (
    <MainCard title="Production Center">
      <Grid container spacing={2}>
        <Grid item xs={3} sm={2} md={1.5}>
          <TextField
            label="Production Center"
            value={displayProductionCenter}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Grid>

        <Grid item xs={6} sm={2.5} md={1.5}>
          <Autocomplete
            options={cuttingRoomOptions}
            getOptionLabel={(option) => option.label}
            value={cuttingRoomOptions.find(opt => opt.value === selectedCuttingRoom) || null}
            onChange={(event, newValue) => {
              onCuttingRoomChange(newValue?.value || null);
              // Reset destination when cutting room changes
              onDestinationChange(null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cutting Room"
                variant="outlined"
                fullWidth
                sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
              />
            )}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={6} sm={2.5} md={1.5}>
          <Autocomplete
            options={destinationOptions}
            getOptionLabel={(option) => option.label}
            value={destinationOptions.find(opt => opt.value === selectedDestination) || null}
            onChange={(event, newValue) => {
              onDestinationChange(newValue?.value || null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Destination"
                variant="outlined"
                fullWidth
                sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
              />
            )}
            disabled={!selectedCuttingRoom || loading}
          />
        </Grid>

        <Grid item xs="auto">
          <Button
            variant="contained"
            color="primary"
            startIcon={<FilterAlt />}
            onClick={onApplyFilter}
            disabled={isApplyDisabled}
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
            {loading ? 'Loading...' : 'Apply Filter'}
          </Button>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default ProductionCenterFilter;
