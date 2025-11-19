import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const OperatorsConfiguration = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [newOperatorName, setNewOperatorName] = useState('');
  const [editOperatorName, setEditOperatorName] = useState('');
  const [editOperatorActive, setEditOperatorActive] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Standard dialog style
  const dialogStyle = {
    width: '400px',
    maxWidth: '90%',
    borderRadius: 3,
    p: 2
  };

  const currentOperatorType = activeTab === 0 ? 'spreader' : 'cutter';

  useEffect(() => {
    fetchOperators();
  }, [activeTab]);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/operators/?operator_type=${currentOperatorType}`);
      if (response.data.success) {
        setOperators(response.data.data || []);
      } else {
        setSnackbar({
          open: true,
          message: `Error: ${response.data.message}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `API Error: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperator = async () => {
    if (!newOperatorName.trim()) {
      setSnackbar({
        open: true,
        message: 'Operator name cannot be empty',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await axios.post('/operators/', {
        name: newOperatorName,
        operator_type: currentOperatorType,
        active: true
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Operator added successfully',
          severity: 'success'
        });
        fetchOperators();
        setOpenAddDialog(false);
        setNewOperatorName('');
      } else {
        setSnackbar({
          open: true,
          message: `Error: ${response.data.message}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `API Error: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleEditOperator = async () => {
    if (!editOperatorName.trim()) {
      setSnackbar({
        open: true,
        message: 'Operator name cannot be empty',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await axios.put(`/operators/${currentOperator.id}`, {
        name: editOperatorName,
        active: editOperatorActive
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Operator updated successfully',
          severity: 'success'
        });
        fetchOperators();
        setOpenEditDialog(false);
        setCurrentOperator(null);
      } else {
        setSnackbar({
          open: true,
          message: `Error: ${response.data.message}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `API Error: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteOperator = async () => {
    try {
      const response = await axios.delete(`/operators/${currentOperator.id}`);

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Operator deleted successfully',
          severity: 'success'
        });
        fetchOperators();
        setOpenDeleteDialog(false);
        setCurrentOperator(null);
      } else {
        setSnackbar({
          open: true,
          message: `Error: ${response.data.message}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `API Error: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleOpenEditDialog = (operator) => {
    setCurrentOperator(operator);
    setEditOperatorName(operator.name);
    setEditOperatorActive(operator.active);
    setOpenEditDialog(true);
  };

  const handleOpenDeleteDialog = (operator) => {
    setCurrentOperator(operator);
    setOpenDeleteDialog(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <MainCard title="Operators Management">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Spreader Operators" />
          <Tab label="Cutter Operators" />
        </Tabs>
      </Box>

      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body1">
          Manage operators who work on {currentOperatorType} machines. Only active operators will appear in the dropdown menu.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Operator
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {operators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No operators found. Click "Add Operator" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                operators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell>{operator.id}</TableCell>
                    <TableCell>{operator.name}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{operator.operator_type}</TableCell>
                    <TableCell>
                      <Switch
                        checked={operator.active}
                        disabled
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(operator)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDeleteDialog(operator)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Operator Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        PaperProps={{ sx: dialogStyle }}
      >
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Add a new {currentOperatorType} operator
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Operator Name"
            type="text"
            fullWidth
            value={newOperatorName}
            onChange={(e) => setNewOperatorName(e.target.value)}
            sx={{ '& .MuiInputBase-input': { fontWeight: 'normal' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddOperator} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Operator Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        PaperProps={{ sx: dialogStyle }}
      >
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Edit operator details
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Operator Name"
            type="text"
            fullWidth
            value={editOperatorName}
            onChange={(e) => setEditOperatorName(e.target.value)}
            sx={{ mb: 2, '& .MuiInputBase-input': { fontWeight: 'normal' } }}
          />
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography>Active</Typography>
            <Switch
              checked={editOperatorActive}
              onChange={(e) => setEditOperatorActive(e.target.checked)}
              color="primary"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleEditOperator} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Operator Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{ sx: dialogStyle }}
      >
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            Are you sure you want to delete operator "{currentOperator?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteOperator} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
};

export default OperatorsConfiguration;

