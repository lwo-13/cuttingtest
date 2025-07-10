import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Grid
} from '@mui/material';

const SizeSelectionDialog = ({ open, onClose, onSave, currentSizes, orderSizes }) => {
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // Parse current sizes string into an object
  useEffect(() => {
    if (currentSizes === 'ALL' || !currentSizes) {
      // If ALL is selected, check all sizes
      const allSizes = {};
      orderSizes.forEach(size => {
        allSizes[size] = true;
      });
      setSelectedSizes(allSizes);
      setSelectAll(true);
    } else {
      // Parse the sizes string (e.g., "S-L-XL") into an object
      const sizeObj = {};
      orderSizes.forEach(size => {
        sizeObj[size] = currentSizes.split('-').includes(size);
      });
      setSelectedSizes(sizeObj);
      setSelectAll(Object.values(sizeObj).every(Boolean));
    }
  }, [currentSizes, orderSizes, open]);

  const handleSizeChange = (size) => {
    const newSelectedSizes = {
      ...selectedSizes,
      [size]: !selectedSizes[size]
    };
    setSelectedSizes(newSelectedSizes);
    
    // Update selectAll based on whether all sizes are selected
    setSelectAll(Object.values(newSelectedSizes).every(Boolean));
  };

  const handleSelectAllChange = () => {
    const newSelectAll = !selectAll;
    const newSelectedSizes = {};
    
    orderSizes.forEach(size => {
      newSelectedSizes[size] = newSelectAll;
    });
    
    setSelectAll(newSelectAll);
    setSelectedSizes(newSelectedSizes);
  };

  const handleSave = () => {
    // If all sizes are selected, return "ALL"
    if (selectAll) {
      onSave("ALL");
      return;
    }
    
    // Otherwise, create a string like "S-L-XL" with selected sizes
    const selectedSizesArray = Object.entries(selectedSizes)
      .filter(([_, isSelected]) => isSelected)
      .map(([size]) => size);
    
    if (selectedSizesArray.length === 0) {
      // If no sizes selected, default to "ALL"
      onSave("ALL");
    } else {
      onSave(selectedSizesArray.join('-'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h5">Select Sizes</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectAll}
                onChange={handleSelectAllChange}
                color="secondary"
              />
            }
            label={<Typography sx={{ fontWeight: 'bold' }}>All Sizes</Typography>}
          />
        </Box>
        <Grid container spacing={1}>
          {orderSizes.map((size) => (
            <Grid item xs={6} key={size}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedSizes[size] || false}
                    onChange={() => handleSizeChange(size)}
                    color="primary"
                  />
                }
                label={size}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} color="secondary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SizeSelectionDialog;
