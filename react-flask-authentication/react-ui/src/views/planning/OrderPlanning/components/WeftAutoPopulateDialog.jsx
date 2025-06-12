import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material';

const WeftAutoPopulateDialog = ({ open, onClose, table, mattressTables = [], orderSizes = [], onApply }) => {
  const [formData, setFormData] = useState({
    collarettoTypes: {
      usableWidth: '',
      grossLength: '',
      pcsSeamtoSeam: '',
      rewoundWidth: '',
      collarettoWidth: '',
      scrapRolls: ''
    },
    sizeSplitting: orderSizes.reduce((acc, sizeObj) => {
      acc[sizeObj.size] = false;
      return acc;
    }, {})
  });

  const handleInputChange = (field, subField = null) => (event) => {
    if (subField) {
      let value = event.target.value;

      // Apply the same validation logic as WeftRow component
      if (subField === 'usableWidth') {
        // Max 3 characters, only numbers
        value = value.replace(/\D/g, '').slice(0, 3);
      } else if (subField === 'grossLength') {
        // Numbers and comma/dot, max 6 characters, replace comma with dot
        value = value.replace(/[^0-9.,]/g, '').replace(',', '.').slice(0, 6);
      } else if (subField === 'pcsSeamtoSeam') {
        // Numbers and dot only, max 4 characters
        value = value.replace(/[^0-9.]/g, '').slice(0, 4);
      } else if (subField === 'rewoundWidth') {
        // Special handling like in WeftRow: replace comma with dot, only numbers and dot, max 4 characters
        value = value.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 4);
      } else if (subField === 'collarettoWidth') {
        // Only numbers, max 4 characters
        value = value.replace(/\D/g, '').slice(0, 4);
      } else if (subField === 'scrapRolls') {
        // Only numbers, max 1 character
        value = value.replace(/\D/g, '').slice(0, 1);
      }

      // Handle nested collarettoTypes fields
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value
        }
      }));
    }
  };

  const handleSizeChange = (size) => (event) => {
    setFormData(prev => ({
      ...prev,
      sizeSplitting: {
        ...prev.sizeSplitting,
        [size]: event.target.checked
      }
    }));
  };

  const handleApply = () => {
    onApply(formData);
  };

  const handleClose = () => {
    // Reset form data when closing
    setFormData({
      collarettoTypes: {
        usableWidth: '',
        grossLength: '',
        pcsSeamtoSeam: '',
        rewoundWidth: '',
        collarettoWidth: '',
        scrapRolls: ''
      },
      sizeSplitting: orderSizes.reduce((acc, sizeObj) => {
        acc[sizeObj.size] = false;
        return acc;
      }, {})
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          width: '600px',
          maxWidth: '90vw'
        }
      }}
    >

      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Collaretto Info Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                Collaretto Info
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {/* Usable Width [cm] */}
                <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <TextField
                    label="Usable Width [cm]"
                    variant="outlined"
                    size="small"
                    value={formData.collarettoTypes.usableWidth}
                    onChange={handleInputChange('collarettoTypes', 'usableWidth')}
                    sx={{
                      width: '180px',
                      "& input": { fontWeight: "normal", textAlign: "center" }
                    }}
                  />
                </Grid>

                {/* Gross Length [m] */}
                <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <TextField
                    label="Gross Length [m]"
                    variant="outlined"
                    size="small"
                    value={formData.collarettoTypes.grossLength}
                    onChange={handleInputChange('collarettoTypes', 'grossLength')}
                    sx={{
                      width: '180px',
                      "& input": { fontWeight: "normal", textAlign: "center" }
                    }}
                  />
                </Grid>

                {/* Pcs Seam to Seam */}
                <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <TextField
                    label="Pcs Seam to Seam"
                    variant="outlined"
                    size="small"
                    value={formData.collarettoTypes.pcsSeamtoSeam}
                    onChange={handleInputChange('collarettoTypes', 'pcsSeamtoSeam')}
                    sx={{
                      width: '180px',
                      "& input": { fontWeight: "normal", textAlign: "center" }
                    }}
                  />
                </Grid>

                {/* Rewound Width [m] */}
                <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <TextField
                    label="Rewound Width [m]"
                    variant="outlined"
                    size="small"
                    value={formData.collarettoTypes.rewoundWidth}
                    onChange={handleInputChange('collarettoTypes', 'rewoundWidth')}
                    sx={{
                      width: '180px',
                      "& input": { fontWeight: "normal", textAlign: "center" }
                    }}
                  />
                </Grid>

                {/* Collaretto Width [mm] */}
                <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <TextField
                    label="Collaretto Width [mm]"
                    variant="outlined"
                    size="small"
                    value={formData.collarettoTypes.collarettoWidth}
                    onChange={handleInputChange('collarettoTypes', 'collarettoWidth')}
                    sx={{
                      width: '180px',
                      "& input": { fontWeight: "normal", textAlign: "center" }
                    }}
                  />
                </Grid>

                {/* Scrap Rolls */}
                <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <TextField
                    label="Scrap Rolls"
                    variant="outlined"
                    size="small"
                    value={formData.collarettoTypes.scrapRolls}
                    onChange={handleInputChange('collarettoTypes', 'scrapRolls')}
                    sx={{
                      width: '180px',
                      "& input": { fontWeight: "normal", textAlign: "center" }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>



            {/* Size Splitting */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                Size Splitting
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {orderSizes.map((sizeObj) => (
                  <Grid item xs={6} sm={4} md={3} key={sizeObj.size} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.sizeSplitting[sizeObj.size] || false}
                          onChange={handleSizeChange(sizeObj.size)}
                          sx={{
                            color: 'primary.main',
                            '&.Mui-checked': {
                              color: 'primary.main',
                            }
                          }}
                        />
                      }
                      label={`Size ${sizeObj.size}`}
                      sx={{
                        "& .MuiFormControlLabel-label": { fontWeight: "normal" }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            height: '40px',
            textTransform: 'none'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          sx={{ 
            height: '40px',
            textTransform: 'none'
          }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeftAutoPopulateDialog;
