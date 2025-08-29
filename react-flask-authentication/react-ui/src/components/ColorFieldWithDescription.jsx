import React, { useState, useEffect, memo } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import useItemDescriptions from 'hooks/useItemDescriptions';

/**
 * Reusable color field component with description lookup
 * Supports both read-only and editable modes with debounced search
 */
const ColorFieldWithDescription = ({
  label = "Color",
  value = "",
  onChange,
  readOnly = false,
  debounceMs = 400,
  minCharsForSearch = 3,
  sx = {},
  ...textFieldProps
}) => {
  const { getColorDescription } = useItemDescriptions();
  const [displayValue, setDisplayValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce logic for editable fields
  useEffect(() => {
    if (readOnly) {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(displayValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [displayValue, debounceMs, readOnly, value]);

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Handle input changes for editable fields
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    // Extract only the color code part (before any space)
    const colorCodeOnly = newValue.split(' ')[0];
    setDisplayValue(colorCodeOnly);

    if (onChange) {
      // Create a new event with only the color code
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: colorCodeOnly
        }
      };
      onChange(syntheticEvent);
    }
  };

  // Determine which value to use for description lookup
  const lookupValue = readOnly ? value : debouncedValue;

  // Get description and create display value
  const description = lookupValue ? getColorDescription(lookupValue) : '';
  const shouldShowDescription = readOnly
    ? lookupValue && description
    : lookupValue && lookupValue.length >= minCharsForSearch && description;

  // Create the display value - just the color code
  const getDisplayValue = () => {
    if (readOnly) {
      return value;
    } else {
      return displayValue;
    }
  };

  // Debug logging (remove in production) - reduced frequency
  // if (lookupValue && process.env.NODE_ENV === 'development') {
  //   console.log('ColorField Debug:', {
  //     lookupValue,
  //     description,
  //     shouldShowDescription,
  //     readOnly,
  //     finalDisplayValue: getDisplayValue()
  //   });
  // }

  return (
    <Box sx={{ position: 'relative', width: '100%', ...sx }}>
      <TextField
        label={label}
        variant="outlined"
        value={getDisplayValue()}
        onChange={readOnly ? undefined : handleInputChange}
        InputProps={{
          readOnly: readOnly,
          sx: {
            "& input": {
              fontWeight: 'normal',
              fontFamily: 'inherit',
              // Always reserve space for description to prevent layout shift
              paddingRight: '50%'
            }
          }
        }}
        sx={{
          width: '100%',
          "& .MuiInputBase-input": {
            fontWeight: 'normal'
          }
        }}
        {...textFieldProps}
      />
      {shouldShowDescription && (
        <Typography
          component="span"
          sx={{
            position: 'absolute',
            left: `${(lookupValue?.length || 4) * 8 + 24}px`, // Position after color code
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.875rem', // Same size as input text
            color: 'text.secondary',
            maxWidth: '45%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default memo(ColorFieldWithDescription);
