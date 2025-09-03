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
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import MainCard from '../../ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const SpreaderOperatorManagement = () => {
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

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/operators/?type=spreader');
      if (response.data.success) {
        setOperators(response.data.data);
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
        operator_type: 'spreader',
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

  return (
    <MainCard title="Spreader Operators Management">
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body1">
          Manage operators who work on spreader machines. Only active operators will appear in the dropdown menu.
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
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {operators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No operators found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                operators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell>{operator.id}</TableCell>
                    <TableCell>{operator.name}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={operator.active ? 'success.main' : 'error.main'}
                      >
                        {operator.active ? 'Active' : 'Inactive'}
                      </Typography>
                    </TableCell>
                    <TableCell>{operator.created_at}</TableCell>
                    <TableCell>{operator.updated_at}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenEditDialog(operator)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(operator)}>
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
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} PaperProps={{ sx: dialogStyle }}>
        <DialogTitle
          sx={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 'bold', pb: 1 }}
        >
          Add New Operator
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the name of the new spreader operator.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Operator Name"
            type="text"
            fullWidth
            value={newOperatorName}
            onChange={(e) => setNewOperatorName(e.target.value)}
            sx={{
              mt: 1,
              '& .MuiInputBase-input': { fontWeight: 'normal' },
              '& .MuiInputLabel-root': { fontWeight: 'normal' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddOperator} color="primary">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Operator Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} PaperProps={{ sx: dialogStyle }}>
        <DialogTitle>Edit Operator</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Operator Name"
            type="text"
            fullWidth
            value={editOperatorName}
            onChange={(e) => setEditOperatorName(e.target.value)}
            sx={{
              '& .MuiInputBase-input': { fontWeight: 'normal' },
              '& .MuiInputLabel-root': { fontWeight: 'normal' }
            }}
          />
          <Box display="flex" alignItems="center" mt={2}>
            <Typography variant="body1" mr={2}>
              Active:
            </Typography>
            <Switch
              checked={editOperatorActive}
              onChange={(e) => setEditOperatorActive(e.target.checked)}
              color="primary"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditOperator} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: dialogStyle }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the operator "{currentOperator?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteOperator} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
};

export default SpreaderOperatorManagement;

