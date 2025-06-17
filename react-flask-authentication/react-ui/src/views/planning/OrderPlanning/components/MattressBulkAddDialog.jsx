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
  const [layerPackageNr, setLayerPackageNr] = useState('');
  const [width, setWidth] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [errors, setErrors] = useState({});

  const handleClose = () => {
    // Reset form when closing
    setLayerPackageNr('');
    setWidth('');
    setSelectedMarker(null);
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate Layer Package Nr
    const layerNum = parseInt(layerPackageNr);
    if (!layerPackageNr || isNaN(layerNum) || layerNum <= 0) {
      newErrors.layerPackageNr = 'Layer Package Nr must be a positive number';
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
      onBulkAdd(parseInt(layerPackageNr), parseFloat(width), selectedMarker);
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
            {/* Layer Package Nr */}
            <Grid item xs={6}>
              <TextField
                label="Layer Package Nr"
                variant="outlined"
                fullWidth
                value={layerPackageNr}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                  setLayerPackageNr(value);
                  if (errors.layerPackageNr) {
                    setErrors(prev => ({ ...prev, layerPackageNr: null }));
                  }
                }}
                error={!!errors.layerPackageNr}
                helperText={errors.layerPackageNr}
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
