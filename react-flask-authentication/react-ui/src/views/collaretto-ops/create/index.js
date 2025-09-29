import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

// ==============================|| COLLARETTO OPS - CREATE ||============================== //

const CollarettoOpsCreate = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching orders with collaretto for PXE3...');

      // Use the same endpoint as the logistic page
      const response = await axios.get('/collaretto/logistic/orders_by_production_center/PXE3');

      if (response.data.success) {
        const ordersData = response.data.data || [];
        setOrders(ordersData);
        setFilteredOrders(ordersData);
        console.log('📊 Orders loaded:', ordersData.length);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setError('Error fetching orders: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders with collaretto for PXE3
  useEffect(() => {
    fetchOrders();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order =>
        order.order_commessa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const formatOrderId = (orderId) => {
    if (!orderId) return '';
    // Show last 6 digits if order ID is longer than 6 characters
    return orderId.length > 6 ? orderId.slice(-6) : orderId;
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleViewOrder = (orderId) => {
    console.log('View order:', orderId);
    // TODO: Navigate to order details or open modal
  };

  const handleCreateCollaretto = (orderId) => {
    console.log('Create collaretto for order:', orderId);
    // TODO: Open create collaretto dialog/form
  };

  if (loading) {
    return (
      <MainCard title="Collaretto Create">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading orders...
          </Typography>
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Collaretto Create">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </MainCard>
    );
  }

  return (
    <MainCard
      title="Collaretto Create"
      secondary={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <Box>
        {/* Status Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading...' : `Found ${filteredOrders.length} of ${orders.length} orders`}
          </Typography>
        </Box>

        {/* Orders Table */}
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    Order ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    Destination
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'No orders found matching your search' : 'No orders found with collaretto tables for PXE3'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <TableRow key={order.order_commessa || index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary" sx={{ fontFamily: 'monospace' }}>
                          {order.order_commessa}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {order.destination || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Has Collaretto"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Order Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewOrder(order.order_commessa)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Create Collaretto">
                            <IconButton
                              size="small"
                              onClick={() => handleCreateCollaretto(order.order_commessa)}
                              color="success"
                            >
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </MainCard>
  );
};

export default CollarettoOpsCreate;
