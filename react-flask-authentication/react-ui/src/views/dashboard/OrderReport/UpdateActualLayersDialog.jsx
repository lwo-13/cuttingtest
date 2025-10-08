import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'utils/axiosInstance';

const UpdateActualLayersDialog = ({ open, onClose, row, onSuccess }) => {
  const { t } = useTranslation();
  const [actualLayers, setActualLayers] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open && row) {
      setActualLayers(row.layers_a || '');
    }
  }, [open, row]);

  const handleClose = () => {
    if (!saving) {
      setActualLayers('');
      onClose();
    }
  };

  const handleSave = async () => {
    if (!actualLayers || parseFloat(actualLayers) <= 0) {
      setSnackbar({
        open: true,
        message: t('orderReport.invalidActualLayers', 'Please enter a valid number of layers'),
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post('/mattress/update_actual_layers_only', {
        updates: [{
          row_id: row.id,
          layers_a: parseFloat(actualLayers)
        }]
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: t('orderReport.actualLayersUpdated', 'Actual layers updated successfully'),
          severity: 'success'
        });
        
        // Call onSuccess to refresh the data
        if (onSuccess) {
          onSuccess();
        }
        
        // Close dialog after a short delay
        setTimeout(() => {
          handleClose();
        }, 500);
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || t('orderReport.updateFailed', 'Failed to update actual layers'),
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating actual layers:', error);
      setSnackbar({
        open: true,
        message: t('orderReport.updateError', 'An error occurred while updating actual layers'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!row) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              {t('orderReport.updateActualLayers', 'Update Actual Layers')}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('table.mattress', 'Mattress')}: <strong>{row.mattressName}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('table.plannedLayers', 'Planned Layers')}: <strong>{row.layers || '-'}</strong>
              </Typography>
              {row.layers_a && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('table.currentActualLayers', 'Current Actual Layers')}: <strong>{row.layers_a}</strong>
                </Typography>
              )}
            </Box>

            <TextField
              label={t('table.actualLayers', 'Actual Layers')}
              type="text"
              fullWidth
              value={actualLayers}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setActualLayers(value);
              }}
              autoFocus
              sx={{
                mt: 2,
                "& .MuiInputBase-input": { fontWeight: 'normal' }
              }}
              disabled={saving}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={saving}
            sx={{ fontWeight: 'normal' }}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={saving}
            sx={{ fontWeight: 'normal' }}
          >
            {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateActualLayersDialog;

