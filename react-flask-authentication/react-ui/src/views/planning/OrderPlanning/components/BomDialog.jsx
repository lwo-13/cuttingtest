import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'utils/axiosInstance';

const BomDialog = ({ open, onClose, orderNumber }) => {
  const { t } = useTranslation();
  const [bomData, setBomData] = useState([]);
  const [colorDescriptions, setColorDescriptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && orderNumber) {
      fetchBomData();
    }
  }, [open, orderNumber]);

  const fetchBomData = async () => {
    setLoading(true);
    setError(null);

    console.log('🔍 Fetching BOM data for order:', orderNumber);

    try {
      // Fetch BOM data and color descriptions in parallel
      const [bomResponse, colorsResponse] = await Promise.all([
        axios.get(`/orders/bom/${orderNumber}`),
        axios.get('/zalli/item-descriptions')
      ]);

      console.log('📋 BOM API response:', bomResponse.data);
      console.log('🎨 Colors API response:', colorsResponse.data);

      if (bomResponse.data.success) {
        setBomData(bomResponse.data.data);
        console.log('✅ BOM data loaded:', bomResponse.data.data.length, 'items');

        // Debug: Log categories to see what values we're getting
        const categories = [...new Set(bomResponse.data.data.map(item => item.category))];
        console.log('📋 BOM categories found:', categories);

        // Debug: Log sample items
        bomResponse.data.data.slice(0, 3).forEach((item, index) => {
          console.log(`📋 Sample BOM item ${index + 1}:`, {
            item: item.item,
            category: item.category,
            quantity: item.quantity,
            color_code: item.color_code
          });
        });
      } else {
        setError(bomResponse.data.msg || 'Failed to fetch BOM data');
        console.log('❌ BOM API error:', bomResponse.data.msg);
      }

      // Process color descriptions
      if (colorsResponse.data.success) {
        const colorMap = {};
        colorsResponse.data.data.forEach(color => {
          colorMap[color.Code] = color.Description;
        });
        setColorDescriptions(colorMap);
        console.log('✅ Color descriptions loaded:', Object.keys(colorMap).length, 'colors');
      }

    } catch (err) {
      console.error('❌ Error fetching BOM data:', err);
      setError('Failed to fetch BOM data');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBomData([]);
    setColorDescriptions({});
    setError(null);
    onClose();
  };

  // Group BOM data by category
  const groupedBomData = bomData.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const getCategoryColor = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    const colors = {
      'fabric': 'primary',
      'trim': 'secondary',
      'hardware': 'warning',
      'padprint': 'info',
      'other': 'default'
    };
    return colors[categoryLower] || 'default';
  };

  const formatColorDisplay = (colorCode) => {
    if (!colorCode) return '-';
    const description = colorDescriptions[colorCode];
    return description ? `${colorCode} - ${description}` : colorCode;
  };

  const getColumnName = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('fabric')) {
      return t('orderPlanning.bomConsumption', 'Consumption [m/pc]');
    }
    return t('orderPlanning.bomQuantity', 'Quantity');
  };

  const shouldShowQuantityColumn = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    // Hide quantity column for padprint items
    return !categoryLower.includes('padprint');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box flex={1} />
          <Typography
            component="div"
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              flex: 1,
              fontSize: '1.125rem'
            }}
          >
            {t('orderPlanning.bomTitle', 'Bill of Materials')}
          </Typography>
          <Box flex={1} display="flex" justifyContent="flex-end">
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && bomData.length === 0 && (
          <Alert severity="info">
            {t('orderPlanning.noBomData', 'No BOM data found for this order')}
          </Alert>
        )}

        {!loading && !error && bomData.length > 0 && (
          <Box>
            {Object.entries(groupedBomData).map(([category, items]) => (
              <Box key={category} mb={3}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip 
                    label={category} 
                    color={getCategoryColor(category)}
                    variant="outlined"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </Typography>
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
                          {t('orderPlanning.bomItem', 'Item')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '45%' }}>
                          {t('orderPlanning.bomColor', 'Color')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>
                          {shouldShowQuantityColumn(category) ? getColumnName(category) : ''}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={`${category}-${index}`} hover>
                          <TableCell sx={{ width: '30%' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {item.item}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: '45%' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontStyle: 'italic',
                                color: 'text.secondary'
                              }}
                            >
                              {formatColorDisplay(item.color_code)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: '25%' }}>
                            {shouldShowQuantityColumn(category) ? (
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {item.quantity}
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'transparent' }}>
                                -
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BomDialog;
