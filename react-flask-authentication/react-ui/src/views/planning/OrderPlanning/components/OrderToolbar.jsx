import React from 'react';
import { Grid, TextField, Autocomplete, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useOrderAuditInfo from './OrderAuditInfo';
import ColorFieldWithDescription from 'components/ColorFieldWithDescription';

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
  onOrderChange,
  onAuditRefetchReady,
  hideAuditInfo = false // New prop to hide audit information for subcontractors
}) => {
  const { t } = useTranslation();

  // Get audit information using the hook
  const auditInfo = useOrderAuditInfo(selectedOrder?.id);

  // Pass the refetch function to parent component when it's available
  React.useEffect(() => {
    if (onAuditRefetchReady && auditInfo.refetchAuditData) {
      onAuditRefetchReady(auditInfo.refetchAuditData);
    }
  }, [auditInfo.refetchAuditData, onAuditRefetchReady]);

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
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                sx={{
                  display: 'flex !important',
                  justifyContent: 'space-between !important',
                  alignItems: 'center !important',
                  width: '100% !important',
                  minHeight: '48px' // Ensure consistent height
                }}
              >
                <Box sx={{ flex: 1 }}>{option.id}</Box>
                {option.isWIP && (
                  <Box
                    sx={{
                      color: 'secondary.main', // Purple text
                      fontSize: '0.75rem',
                      fontWeight: 'normal',
                      opacity: 0.65, // 65% opacity
                      marginLeft: 'auto' // Force to the right
                    }}
                  >
                    IN PROGRESS
                  </Box>
                )}
              </Box>
            )}
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
        <ColorFieldWithDescription
          label={t('orderPlanning.color', 'Color')}
          value={selectedColorCode || ""}
          readOnly={true}
          sx={{ width: '100%', minWidth: '60px' }}
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

      {/* Order Audit Information - Only show if audit data exists */}
      {selectedOrder && !hideAuditInfo && auditInfo.hasAuditData && (
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