import React from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

const FabricCodeDropdown = ({
  value,
  onChange,
  onColorChange,
  disabled,
  bomFabrics,
  loading,
  getColorCodeForFabric,
  fetchBomFabrics, // Add function to trigger fetch
  sx = {}
}) => {
  const { t } = useTranslation();

  const handleFabricChange = (event, newValue, reason) => {
    const selectedFabricCode = newValue?.item_code || '';
    const selectedColorCode = newValue?.color_code || '';

    // Update fabric code
    onChange(selectedFabricCode);

    // Only auto-populate fabric color if user actively selected from dropdown
    // Check for 'selectOption' reason to ensure it's a user selection, not initialization
    if (onColorChange && selectedColorCode && newValue && reason === 'selectOption') {
      onColorChange(selectedColorCode);
      console.log('🎨 User selected fabric from dropdown - auto-populating color:', {
        fabricCode: selectedFabricCode,
        colorCode: selectedColorCode,
        reason: reason
      });
    } else if (reason !== 'selectOption') {
      console.log('📋 Fabric code loaded from existing data - not auto-populating color:', {
        fabricCode: selectedFabricCode,
        reason: reason
      });
    }
  };

  // Create option for current value - always display the saved value
  const selectedOption = value ? { item_code: value, color_code: '', label: value } : null;

  const handleDropdownOpen = () => {
    // Only fetch BOM fabrics when user opens the dropdown
    if (fetchBomFabrics && bomFabrics.length === 0 && !loading) {
      console.log('📋 User opened fabric dropdown - fetching BOM fabrics...');
      fetchBomFabrics();
    }
  };

  return (
    <Autocomplete
      options={bomFabrics}
      getOptionLabel={(option) => option.item_code || ''}
      value={selectedOption}
      disabled={disabled || loading}
      onChange={handleFabricChange}
      onOpen={handleDropdownOpen}
      loading={loading}
      freeSolo={bomFabrics.length === 0} // Allow free text when no BOM data loaded
      onInputChange={(event, newInputValue, reason) => {
        // Handle manual typing when no BOM data is available
        if (reason === 'input' && bomFabrics.length === 0) {
          onChange(newInputValue);
        }
      }}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={t('orderPlanning.fabricCode', 'Fabric Code')} 
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.item_code}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
              {option.item_code}
            </div>
            {option.color_code && (
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#666', 
                fontStyle: 'italic' 
              }}>
                Color: {option.color_code}
              </div>
            )}
          </div>
        </li>
      )}
      isOptionEqualToValue={(option, value) => option.item_code === value?.item_code}
      noOptionsText={
        loading 
          ? t('orderPlanning.loadingFabrics', 'Loading fabrics...') 
          : t('orderPlanning.noFabricsFound', 'No fabric items found in BOM')
      }
      sx={{
        width: '100%',
        minWidth: '60px',
        "& .MuiAutocomplete-input": { fontWeight: 'normal' },
        ...sx
      }}
    />
  );
};

export default FabricCodeDropdown;
