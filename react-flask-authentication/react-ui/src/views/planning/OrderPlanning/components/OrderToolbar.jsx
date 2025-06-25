import React from 'react';
import { Grid, TextField, Autocomplete, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useOrderAuditInfo from './OrderAuditInfo';

const OrderToolbar = ({
  styleOptions = [],
  selectedStyle,
  onStyleChange,
  orderOptions = [],
  filteredOrders = [],
  selectedOrder,
  selectedSeason,
  selectedBrand,
  selectedColorCode,
  onOrderChange
}) => {
  const { t } = useTranslation();

  // Get audit information using the hook
  const auditInfo = useOrderAuditInfo(selectedOrder?.id);

  return (
    <Box sx={{
      '@media print': {
        width: '100%',
        '& .MuiGrid-container': {
          flexWrap: 'nowrap !important',
          width: '100%'
        }
      }
    }}>
      <Grid container spacing={1} justifyContent="flex-start" alignItems="center" sx={{
        '@media print': {
          flexWrap: 'nowrap !important',
          width: '100%'
        }
      }}>
        {/* Order Selection */}
        <Grid item xs={6} sm={4} md={2.5}>
          <Autocomplete
            options={filteredOrders.length > 0 ? filteredOrders : orderOptions}
            getOptionLabel={(option) => option?.id || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedOrder || null}
            onChange={(event, newValue) => onOrderChange(newValue || null)}
            renderInput={(params) => (
              <TextField {...params} label={t('orderPlanning.orderCommessa', 'Order/Commessa')} variant="outlined" />
            )}
            sx={{ width: '100%', "& .MuiAutocomplete-input": { fontWeight: 'normal' } }}
          />
        </Grid>

      {/* Style Dropdown*/}
      <Grid item xs={3} sm={2} md={1.5}>
        <Autocomplete
          options={styleOptions}
          value={selectedStyle || ''}
          onChange={(e, newValue) => {
            const newVal = newValue || '';
            if (newVal !== selectedStyle) {
              onStyleChange(newVal, true); // ✅ only fire when it changes
            }
          }}
          renderInput={(params) => <TextField {...params} label={t('orderPlanning.style', 'Style')} variant="outlined" fullWidth />}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Color */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label={t('orderPlanning.color', 'Color')}
          variant="outlined"
          value={selectedColorCode || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Season */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label={t('orderPlanning.season', 'Season')}
          variant="outlined"
          value={selectedSeason || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Brand */}
      <Grid item xs={3} sm={2} md={1.5}>
        <TextField
          label={t('orderPlanning.brand', 'Brand')}
          variant="outlined"
          value={selectedBrand || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '60px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Grid>

      {/* Order Audit Information */}
      {selectedOrder && (
        <>
          <Grid item xs={3} sm={2} md={1.5}>
            {auditInfo.createdBy}
          </Grid>
          <Grid item xs={3} sm={2} md={1.5}>
            {auditInfo.lastModifiedBy}
          </Grid>
        </>
      )}

      </Grid>
    </Box>
  );
};

export default OrderToolbar;