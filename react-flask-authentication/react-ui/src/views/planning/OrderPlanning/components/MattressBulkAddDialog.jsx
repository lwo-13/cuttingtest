import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Autocomplete,
  Grid
} from '@mui/material';

const MattressBulkAddDialog = ({ open, onClose, markerOptions, onBulkAdd }) => {
  const [width, setWidth] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [errors, setErrors] = useState({});

  // Layer planning is now the default mode
  const [totalLayers, setTotalLayers] = useState('');
  const [layersPerRow, setLayersPerRow] = useState('60');
  const [batch, setBatch] = useState('');

  // Calculate number of rows needed
  const calculateRowsNeeded = () => {
    if (!totalLayers || !layersPerRow) return 0;
    const total = parseInt(totalLayers);
    const perRow = parseInt(layersPerRow);
    if (isNaN(total) || isNaN(perRow) || perRow <= 0) return 0;
    return Math.ceil(total / perRow);
  };

  // Calculate layer package number automatically
  const layerPackageNr = calculateRowsNeeded();

  const handleClose = () => {
    // Reset form when closing
    setWidth('');
    setSelectedMarker(null);
    setErrors({});
    setTotalLayers('');
    setLayersPerRow('60');
    setBatch('');
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate layer planning fields
    const totalLayersNum = parseInt(totalLayers);
    if (!totalLayers || isNaN(totalLayersNum) || totalLayersNum <= 0) {
      newErrors.totalLayers = 'Total Layers must be a positive number';
    }

    const layersPerRowNum = parseInt(layersPerRow);
    if (!layersPerRow || isNaN(layersPerRowNum) || layersPerRowNum <= 0) {
      newErrors.layersPerRow = 'Layers per Row must be a positive number';
    }

    // Validate that we have at least one row
    const rowsNeeded = calculateRowsNeeded();
    if (rowsNeeded <= 0) {
      newErrors.totalLayers = 'Invalid layer configuration';
    }

    // Validate Width
    const widthNum = parseFloat(width);
    if (!width || isNaN(widthNum) || widthNum <= 0) {
      newErrors.width = 'Width must be a positive number';
    }

    // Validate Marker
    if (!selectedMarker) {
      newErrors.marker = 'Please select a marker';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = () => {
    if (validateForm()) {
      const bulkAddData = {
        layerPackageNr: layerPackageNr,
        width: parseFloat(width),
        selectedMarker,
        planLayersDirectly: true, // Always true now
        totalLayers: parseInt(totalLayers),
        layersPerRow: parseInt(layersPerRow),
        batch: batch.trim() || null // Optional batch field
      };
      onBulkAdd(bulkAddData);
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Grid container spacing={2}>
            {/* Total Layers */}
            <Grid item xs={6}>
              <TextField
                label="Total Layers"
                variant="outlined"
                fullWidth
                value={totalLayers}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                  setTotalLayers(value);
                  if (errors.totalLayers) {
                    setErrors(prev => ({ ...prev, totalLayers: null }));
                  }
                }}
                error={!!errors.totalLayers}
                helperText={errors.totalLayers}
                sx={{
                  "& input": { fontWeight: "normal" },
                  "& .MuiInputBase-root": {
                    "& input[type=number]": {
                      MozAppearance: "textfield",
                      "&::-webkit-outer-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                      "&::-webkit-inner-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* Layers per Row */}
            <Grid item xs={6}>
              <TextField
                label="Layers per Row"
                variant="outlined"
                fullWidth
                value={layersPerRow}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                  setLayersPerRow(value);
                  if (errors.layersPerRow) {
                    setErrors(prev => ({ ...prev, layersPerRow: null }));
                  }
                }}
                error={!!errors.layersPerRow}
                helperText={errors.layersPerRow}
                sx={{
                  "& input": { fontWeight: "normal" },
                  "& .MuiInputBase-root": {
                    "& input[type=number]": {
                      MozAppearance: "textfield",
                      "&::-webkit-outer-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                      "&::-webkit-inner-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* Width */}
            <Grid item xs={6}>
              <TextField
                label="Width [cm]"
                variant="outlined"
                fullWidth
                value={width}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9.,]/g, '')
                    .replace(/[,]+/g, '.')
                    .replace(/(\..*)\./g, '$1')
                    .slice(0, 3);
                  setWidth(value);
                  // Clear selected marker when width changes to ensure consistency
                  setSelectedMarker(null);
                  if (errors.width) {
                    setErrors(prev => ({ ...prev, width: null }));
                  }
                }}
                error={!!errors.width}
                helperText={errors.width}
                sx={{
                  "& input": { fontWeight: "normal" },
                  "& .MuiInputBase-root": {
                    "& input[type=number]": {
                      MozAppearance: "textfield",
                      "&::-webkit-outer-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                      "&::-webkit-inner-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* Batch (Optional) */}
            <Grid item xs={6}>
              <TextField
                label="Batch (Optional)"
                variant="outlined"
                fullWidth
                value={batch}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 20); // Limit to 20 characters
                  setBatch(value);
                }}
                placeholder="Enter batch number"
                sx={{
                  "& input": { fontWeight: "normal" }
                }}
              />
            </Grid>

            {/* Layer Planning Preview */}
            {totalLayers && layersPerRow && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'primary.light',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                    Preview: {calculateRowsNeeded()} rows will be created
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'primary.dark', mt: 0.5 }}>
                    {totalLayers} total layers ÷ {layersPerRow} layers per row = {calculateRowsNeeded()} rows
                  </Typography>
                  {parseInt(totalLayers) % parseInt(layersPerRow) !== 0 && (
                    <Typography variant="body2" sx={{ color: 'warning.dark', mt: 0.5 }}>
                      Last row will have {parseInt(totalLayers) % parseInt(layersPerRow)} layers
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}

            {/* Marker */}
            <Grid item xs={12}>
              <Autocomplete
                options={width
                  ? (markerOptions || [])
                      .filter(m => {
                        const markerWidthStr = m.marker_width.toString();
                        const widthStr = width.toString();
                        // Exact match or decimal extension (e.g., 153 matches 153 and 153.5, but not 1530)
                        return markerWidthStr === widthStr ||
                               (markerWidthStr.startsWith(widthStr + '.') && markerWidthStr.length > widthStr.length + 1);
                      })
                      .sort((a, b) => b.efficiency - a.efficiency)
                  : (markerOptions || []).sort((a, b) => b.efficiency - a.efficiency)}
                getOptionLabel={(option) => option.marker_name}
                renderOption={(props, option) => (
                  <li {...props}>
                    <span>{option.marker_name}</span>
                    <span style={{ color: 'gray', marginLeft: '10px', fontSize: '0.85em' }}>
                      ({option.efficiency}%)
                    </span>
                  </li>
                )}
                value={selectedMarker}
                onChange={(_, newValue) => {
                  setSelectedMarker(newValue);
                  // If width is empty and a marker is selected, populate width with marker width
                  if (newValue && !width) {
                    setWidth(newValue.marker_width.toString());
                  }
                  if (errors.marker) {
                    setErrors(prev => ({ ...prev, marker: null }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Marker Name"
                    variant="outlined"
                    error={!!errors.marker}
                    helperText={errors.marker}
                    sx={{
                      "& .MuiAutocomplete-input": { fontWeight: 'normal' }
                    }}
                  />
                )}
                sx={{ width: '100%' }}
              />
            </Grid>
          </Grid>

          {/* Buttons */}
          <Box display="flex" justifyContent="center" gap={2} mt={2}>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ minWidth: '100px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              sx={{ minWidth: '100px' }}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MattressBulkAddDialog;
