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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import CollarettoPrintLabel from './CollarettoPrintLabel';

// ==============================|| COLLARETTO OPS - CREATE ||============================== //

const CollarettoOpsCreate = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state - Destination selection
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [collaretos, setCollaretos] = useState([]);
  const [collaretosLoading, setCollaretosLoading] = useState(false);
  const [collaretosError, setCollaretosError] = useState(null);

  // Batch selection modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState(null);

  // Configuration screen state
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [collarettoDetails, setCollarettoDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [editedRows, setEditedRows] = useState([]);

  // Print dialog state
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedRowForPrint, setSelectedRowForPrint] = useState(null);

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
        setError(t('collarettoOps.create.errorFetchingOrders'));
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setError(t('collarettoOps.create.errorFetchingOrders') + ' ' + (err.response?.data?.message || err.message));
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

  const handleCreateCollaretto = async (orderId) => {
    console.log('Create collaretto for order:', orderId);

    try {
      setCollaretosLoading(true);
      setCollaretosError(null);
      setSelectedOrder(orderId);
      setModalOpen(true);

      console.log('🔍 Fetching collaretos for order:', orderId);

      const response = await axios.get(`/collaretto/logistic/collaretos_by_order/${orderId}`);

      if (response.data.success) {
        const collaretosData = response.data.data || [];
        setCollaretos(collaretosData);
        console.log('📊 Collaretos loaded:', collaretosData.length);
      } else {
        setCollaretosError(t('collarettoOps.create.errorFetchingCollaretos'));
      }
    } catch (err) {
      console.error('❌ Error fetching collaretos:', err);
      setCollaretosError(t('collarettoOps.create.errorFetchingCollaretos') + ' ' + (err.response?.data?.message || err.message));
    } finally {
      setCollaretosLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
    setCollaretos([]);
    setCollaretosError(null);
  };

  const handleSelectDestination = async (destinationGroup) => {
    console.log('Selected destination group:', destinationGroup);

    try {
      setBatchesLoading(true);
      setBatchesError(null);
      setSelectedDestination(destinationGroup.destination);

      // Close the destination modal but keep selectedOrder
      setModalOpen(false);

      // Open the batch selection modal
      setBatchModalOpen(true);

      console.log('🔍 Fetching batches for destination:', destinationGroup.destination);

      const response = await axios.get(`/collaretto/logistic/batches_by_destination/${selectedOrder}/${destinationGroup.destination}`);

      if (response.data.success) {
        const batchesData = response.data.data || [];
        setBatches(batchesData);
        console.log('📊 Batches loaded:', batchesData.length);
      } else {
        setBatchesError(t('collarettoOps.create.errorFetchingBatches'));
      }
    } catch (err) {
      console.error('❌ Error fetching batches:', err);
      setBatchesError(t('collarettoOps.create.errorFetchingBatches') + ' ' + (err.response?.data?.message || err.message));
    } finally {
      setBatchesLoading(false);
    }
  };

  const handleCloseBatchModal = () => {
    setBatchModalOpen(false);
    setSelectedDestination(null);
    setBatches([]);
    setBatchesError(null);
  };

  const handleSelectBatch = async (batch) => {
    console.log('Selected batch:', batch);

    try {
      setDetailsLoading(true);
      setDetailsError(null);
      setSelectedBatch(batch);

      // Close the batch modal
      handleCloseBatchModal();

      // Open the configuration screen
      setConfigOpen(true);

      // Fetch collaretto details filtered by order, destination, and bagno
      console.log('🔍 Fetching collaretto details for order:', selectedOrder, 'destination:', selectedDestination, 'bagno:', batch.bagno);

      const response = await axios.get(`/collaretto/logistic/collaretto_details_by_batch/${selectedOrder}/${selectedDestination}/${batch.bagno}`);

      if (response.data.success) {
        const details = response.data.data;
        setCollarettoDetails(details);
        setEditedRows(details.rows || []);
        console.log('📊 Collaretto details loaded:', details);
        console.log('📊 Number of rows:', details.rows?.length);
      } else {
        setDetailsError(t('collarettoOps.create.errorFetchingDetails'));
      }
    } catch (err) {
      console.error('❌ Error fetching collaretto details:', err);
      setDetailsError(t('collarettoOps.create.errorFetchingDetails') + ' ' + (err.response?.data?.message || err.message));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseConfig = () => {
    setConfigOpen(false);
    setSelectedBatch(null);
    setCollarettoDetails(null);
    setEditedRows([]);
    setDetailsError(null);
  };

  // Print handlers
  const handlePrintLabel = (row) => {
    setSelectedRowForPrint(row);
    setPrintDialogOpen(true);
  };

  const handleClosePrintDialog = () => {
    setPrintDialogOpen(false);
    setSelectedRowForPrint(null);
  };

  const handleFieldChange = (rowIndex, field, value) => {
    const updatedRows = [...editedRows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [field]: value
    };
    setEditedRows(updatedRows);
    console.log('📝 Field changed:', field, '=', value, 'Row:', updatedRows[rowIndex]);
  };

  const handleSaveChanges = async () => {
    try {
      console.log('💾 Saving collaretto changes...');
      console.log('📤 Sending rows:', editedRows);
      console.log('📤 First row details:', JSON.stringify(editedRows[0], null, 2));

      const response = await axios.put('/collaretto/logistic/update_collaretto_details', {
        rows: editedRows
      });

      if (response.data.success) {
        console.log('✅ Changes saved successfully');
        alert(t('collarettoOps.create.changesSavedSuccessfully'));

        // Refresh the data from the backend to show updated cons_actual
        if (selectedBatch && selectedOrder && selectedDestination) {
          console.log('🔄 Refreshing collaretto details...');
          const refreshResponse = await axios.get(`/collaretto/logistic/collaretto_details_by_batch/${selectedOrder}/${selectedDestination}/${selectedBatch.bagno}`);
          if (refreshResponse.data.success) {
            const details = refreshResponse.data.data;
            setCollarettoDetails(details);
            setEditedRows(details.rows || []);
            console.log('✅ Data refreshed');
          }
        }
      } else {
        alert(t('collarettoOps.create.failedToSaveChanges'));
      }
    } catch (err) {
      console.error('❌ Error saving changes:', err);
      console.error('❌ Error response:', err.response?.data);
      alert(t('collarettoOps.create.errorSavingChanges') + ' ' + (err.response?.data?.msg || err.response?.data?.message || err.message));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <MainCard title={t('collarettoOps.create.title')}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            {t('collarettoOps.create.loadingOrders')}
          </Typography>
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title={t('collarettoOps.create.title')}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={t('collarettoOps.create.title')}
      secondary={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('collarettoOps.create.searchOrders')}
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
          <Tooltip title={t('common.refresh')}>
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
            {loading ? t('common.loading') : `${filteredOrders.length} ${t('collarettoOps.create.ordersLoaded')}`}
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
                    {t('collarettoOps.create.order')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    {t('spreader.destination')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    {t('table.status')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                    {t('collarettoOps.create.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      {t('collarettoOps.create.loadingOrders')}
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? t('collarettoOps.create.noOrdersFound') : t('collarettoOps.create.noOrdersFound')}
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
                          <Tooltip title={t('collarettoOps.create.viewOrder')}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewOrder(order.order_commessa)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('collarettoOps.create.createCollaretto')}>
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

      {/* Collaretto Selection Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h3">
            {t('collarettoOps.create.selectCollarettoTitle')} {selectedOrder}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {collaretosLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                {t('collarettoOps.create.loadingCollaretos')}
              </Typography>
            </Box>
          ) : collaretosError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {collaretosError}
            </Alert>
          ) : collaretos.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {t('collarettoOps.create.noCollaretosFound')}
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {collaretos.map((group, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleSelectDestination(group)}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {t('spreader.destination')}: {group.destination}
                            </Typography>
                            <Chip
                              label={`${group.typeLabel} (${group.count})`}
                              size="small"
                              color={
                                group.itemType === 'CA' ? 'primary' :
                                group.itemType === 'CW' ? 'secondary' :
                                'success'
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('collarettoOps.create.fabric')}: {group.fabricType} - {group.fabricCode} - {group.fabricColor}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('collarettoOps.create.dyeLot')}: {group.dyeLot || t('table.na')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('orderPlanning.productionCenter')}: {group.productionCenter} / {group.cuttingRoom}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Selection Modal */}
      <Dialog
        open={batchModalOpen}
        onClose={handleCloseBatchModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h3">
            {t('collarettoOps.create.selectBatchTitle')} {selectedDestination?.destination}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {batchesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                {t('collarettoOps.create.loadingBatches')}
              </Typography>
            </Box>
          ) : batchesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {batchesError}
            </Alert>
          ) : batches.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {t('collarettoOps.create.noBatchesFound')}
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {batches.map((batch, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleSelectBatch(batch)}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {t('table.bagno')}: {batch.bagno}
                            </Typography>
                            <Chip
                              label={`${batch.count} ${t('collarettoOps.create.rows')}`}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('collarettoOps.create.fabric')}: {batch.fabricType} - {batch.fabricCode} - {batch.fabricColor}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('orderPlanning.productionCenter')}: {batch.productionCenter} / {batch.cuttingRoom}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBatchModal} color="primary">
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collaretto Configuration/Edit Modal */}
      <Dialog
        open={configOpen}
        onClose={handleCloseConfig}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h3">
              {t('collarettoOps.create.configureCollaretto')} {selectedBatch?.destination} - {t('table.bagno')}: {selectedBatch?.bagno} ({collarettoDetails?.typeLabel})
            </Typography>
            <Chip
              label={selectedBatch?.typeLabel}
              color={
                selectedBatch?.itemType === 'CA' ? 'primary' :
                selectedBatch?.itemType === 'CW' ? 'secondary' :
                'success'
              }
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                {t('collarettoOps.create.loadingDetails')}
              </Typography>
            </Box>
          ) : detailsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detailsError}
            </Alert>
          ) : collarettoDetails ? (
            <Box>
              {/* Header Information */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('collarettoOps.create.productionOrder')}:</strong> {collarettoDetails.orderCommessa}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('collarettoOps.create.fabric')}:</strong> {collarettoDetails.fabricType} - {collarettoDetails.fabricCode} - {collarettoDetails.fabricColor}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('collarettoOps.create.dyeLot')}:</strong> {collarettoDetails.dyeLot || t('table.na')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('spreader.destination')}:</strong> {collarettoDetails.destination || t('table.na')}
                </Typography>
              </Box>

              {/* Editable Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('collarettoOps.create.collarettoNumber')}</TableCell>
                      <TableCell>{t('table.pieces')}</TableCell>
                      <TableCell>{t('table.usableWidth')}</TableCell>
                      <TableCell>{t('table.grossLength')}</TableCell>
                      <TableCell>{t('table.collarettoWidth')}</TableCell>
                      {/* Only show pcs_seam for Weft (CW) and Bias (CB) */}
                      {collarettoDetails?.itemType !== 'CA' && (
                        <TableCell>{t('table.pcsSeamtoSeam')}</TableCell>
                      )}
                      <TableCell>{t('table.scrapRolls')}</TableCell>
                      <TableCell>{t('collarettoOps.create.rollsPlanned')}</TableCell>
                      <TableCell>{t('collarettoOps.create.rollsActual')}</TableCell>
                      <TableCell>{t('collarettoOps.create.consPlanned')}</TableCell>
                      <TableCell>{t('collarettoOps.create.consActual')}</TableCell>
                      <TableCell>{t('table.sizes')}</TableCell>
                      <TableCell align="center">{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editedRows.map((row, index) => (
                      <TableRow key={row.rowId}>
                        <TableCell>{row.collarettoId}</TableCell>
                        <TableCell>{row.pieces || ''}</TableCell>
                        <TableCell>{row.usableWidth || ''}</TableCell>
                        <TableCell>{row.grossLength || ''}</TableCell>
                        <TableCell>{row.rollWidth || ''}</TableCell>
                        {/* Only show pcs_seam for Weft (CW) and Bias (CB) */}
                        {collarettoDetails?.itemType !== 'CA' && (
                          <TableCell>{row.pcsSeam || ''}</TableCell>
                        )}
                        <TableCell>{row.scrapRolls || ''}</TableCell>
                        <TableCell>{row.rollsPlanned || ''}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.rollsActual || ''}
                            onChange={(e) => handleFieldChange(index, 'rollsActual', e.target.value)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>{row.consPlanned || ''}</TableCell>
                        <TableCell>{row.consActual || ''}</TableCell>
                        <TableCell>{row.applicableSizes || 'ALL'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title={t('collarettoOps.create.printLabel')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePrintLabel(row)}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveChanges}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            {t('collarettoOps.create.saveChanges')}
          </Button>
          <Button
            onClick={handlePrint}
            variant="contained"
            color="success"
            startIcon={<PrintIcon />}
          >
            {t('collarettoOps.create.print')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Label Dialog */}
      <Dialog
        open={printDialogOpen}
        onClose={handleClosePrintDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('collarettoOps.create.printLabel')}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
              '@media print': {
                p: 0
              }
            }}
          >
            <CollarettoPrintLabel
              collarettoDetails={collarettoDetails}
              row={selectedRowForPrint}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ '@media print': { display: 'none' } }}>
          <Button onClick={handleClosePrintDialog} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handlePrint}
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
          >
            {t('collarettoOps.create.print')}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default CollarettoOpsCreate;
