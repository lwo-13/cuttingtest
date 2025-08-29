import React, { useState } from 'react';
import { Box, TextField, Typography, Paper, Button, Grid } from '@mui/material';
import useItemDescriptions from 'hooks/useItemDescriptions';
import ColorFieldWithDescription from './ColorFieldWithDescription';

/**
 * Test component to verify color description functionality
 * This can be temporarily added to any page to test the API
 */
const TestColorDescription = () => {
  const { itemDescriptions, loading, error, getColorDescription } = useItemDescriptions();
  const [testColor, setTestColor] = useState('I8916');
  const [editableColor, setEditableColor] = useState('');

  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Color Description Test Component
      </Typography>
      
      {/* API Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>API Status:</strong> {loading ? 'Loading...' : error ? `Error: ${error}` : `Loaded ${itemDescriptions.size} descriptions`}
        </Typography>
      </Box>

      {/* Manual Test */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Manual Lookup Test:</Typography>
        <TextField
          label="Enter Color Code"
          value={testColor}
          onChange={(e) => setTestColor(e.target.value.toUpperCase())}
          sx={{ mr: 2 }}
        />
        <Button 
          variant="outlined" 
          onClick={() => {
            const desc = getColorDescription(testColor);
            alert(desc ? `${testColor}: ${desc}` : `No description found for ${testColor}`);
          }}
        >
          Test Lookup
        </Button>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Current result: {getColorDescription(testColor) || 'No description found'}
        </Typography>
      </Box>

      {/* Read-only ColorField Test */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Read-only ColorField Test (Inline Description):</Typography>
        <ColorFieldWithDescription
          label="Read-only Color"
          value={testColor}
          readOnly={true}
          sx={{ maxWidth: 400 }}
        />
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          Expected: Color code in black + description in grey (e.g., "I8916" + " METALIC")
        </Typography>
      </Box>

      {/* Editable ColorField Test */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Editable ColorField Test (3+ chars, 400ms debounce):</Typography>
        <ColorFieldWithDescription
          label="Editable Color"
          value={editableColor}
          onChange={(e) => {
            console.log('onChange received:', e.target.value);
            setEditableColor(e.target.value);
          }}
          readOnly={false}
          debounceMs={400}
          minCharsForSearch={3}
          sx={{ maxWidth: 400 }}
        />
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          Type a color code. Description should appear inline after 3+ chars. onChange should only receive color code.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Current value: "{editableColor}"
        </Typography>
      </Box>

      {/* Sample Data with Test Buttons */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>Sample Color Codes to Test:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {[
            { code: 'I8916', desc: 'METALIC' },
            { code: '439C', desc: 'VERDE SALVIA' },
            { code: '842U', desc: 'ST.MAXI BANDANA' },
            { code: '872I', desc: 'SUGARPAPER BLUE/AZZURRO' },
            { code: 'K332', desc: 'LATTE ST.BISCOTTI' },
            { code: 'MA0059', desc: 'TABACO F MA0059' }
          ].map(({ code, desc }) => (
            <Button
              key={code}
              variant="outlined"
              size="small"
              onClick={() => setTestColor(code)}
              sx={{ fontSize: '0.7rem' }}
            >
              {code} - {desc}
            </Button>
          ))}
        </Box>

        {/* Test Different Field Widths */}
        <Typography variant="subtitle1" gutterBottom>Test Different Field Widths:</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ maxWidth: 200 }}>
            <Typography variant="body2" gutterBottom>Narrow (200px):</Typography>
            <ColorFieldWithDescription
              label="Narrow Color"
              value={testColor}
              readOnly={true}
              sx={{ width: '100%' }}
            />
          </Box>
          <Box sx={{ maxWidth: 300 }}>
            <Typography variant="body2" gutterBottom>Medium (300px):</Typography>
            <ColorFieldWithDescription
              label="Medium Color"
              value={testColor}
              readOnly={true}
              sx={{ width: '100%' }}
            />
          </Box>
          <Box sx={{ maxWidth: 400 }}>
            <Typography variant="body2" gutterBottom>Wide (400px):</Typography>
            <ColorFieldWithDescription
              label="Wide Color"
              value={testColor}
              readOnly={true}
              sx={{ width: '100%' }}
            />
          </Box>
        </Box>

        {/* Responsive Grid Test */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Responsive Grid Test (like in actual tables):</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4} sm={3} md={2}>
            <ColorFieldWithDescription
              label="Fabric Color"
              value={testColor}
              readOnly={true}
              sx={{ width: '100%', minWidth: '80px' }}
            />
          </Grid>
          <Grid item xs={3} sm={2} md={1.8}>
            <TextField
              label="Fabric Code"
              value="TF00114"
              InputProps={{ readOnly: true }}
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={3} sm={2} md={1.2}>
            <TextField
              label="Fabric Type"
              value="01"
              InputProps={{ readOnly: true }}
              sx={{ width: '100%' }}
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default TestColorDescription;
