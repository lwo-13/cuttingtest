import React, { useState, useEffect, useRef } from "react";
import axios from 'utils/axiosInstance';
import { DataGrid } from '@mui/x-data-grid';
import {
  CircularProgress, Box, Button, TextField, Dialog, DialogContent,
  IconButton, DialogTitle, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Typography, Snackbar, Alert, Paper
} from '@mui/material';
import MainCard from '../../ui-component/cards/MainCard';
import TablePagination from '@mui/material/TablePagination';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Remove the problematic backendBaseUrl calculation - use axios.defaults.baseURL directly like in OrderPlanning

// Available brands
const brands = ["CALZEDONIA", "INTIMISSIMI", "FALCONERI", "TEZENIS"];

// Custom Pagination Component with Left-Aligned Page Info
const CustomPagination = (props) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 2,
        overflow: 'hidden',
        minHeight: '52px'
      }}
    >
      <TablePagination
        {...props}
        component="div"
        sx={{
          overflow: 'hidden',
          minHeight: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          fontSize: '1.2rem',
          '.MuiTablePagination-actions button': {
            fontSize: '1.2rem',
            minWidth: '48px',
            padding: '10px'
          },
          '.MuiTablePagination-select': {
            fontSize: '1.2rem'
          }
        }}
      />
    </Box>
  );
};

// Image Upload Component
const ImageUploadComponent = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        alert("Please upload an image file");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper
        sx={{
          p: 2,
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          backgroundColor: dragActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="body1">
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop an image here, or click to select'}
        </Typography>
      </Paper>
      {selectedFile && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          sx={{ mt: 2 }}
          fullWidth
        >
          Upload Image
        </Button>
      )}
    </Box>
  );
};

// Create PadPrint Modal Component
const CreatePadPrintModal = ({ open, handleClose, onCreated }) => {
    const [formData, setFormData] = useState({
      brand: '',
      season: '',
      style: '',
      color: '',
      padprint_color: '',
      pattern: '',
      date: dayjs().format('YYYY-MM-DD')  // Set default date to today
    });
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: '',
      severity: 'success'
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
      try {
        const response = await axios.post("/padprint/create", formData);
        onCreated(response.data);
        handleClose();
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error: ${error.response?.data?.error || error.message}`,
          severity: 'error'
        });
      }
    };

    const handleImageUpload = async (file) => {
      if (!formData.pattern || !formData.padprint_color) {
        setSnackbar({
          open: true,
          message: 'Please fill in Pattern and Pad Print Color fields first',
          severity: 'warning'
        });
        return;
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('pattern', formData.pattern);
      uploadData.append('padprint_color', formData.padprint_color);

      try {
        const response = await axios.post('/padprint/upload-image-direct', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setSnackbar({
          open: true,
          message: 'Image uploaded successfully',
          severity: 'success'
        });

        // When creating a new padprint, we don't want to reload the page after image upload
        // The onImageUploaded callback is not called here to prevent page reload
      } catch (error) {
        console.error('Error uploading image:', error);
        setSnackbar({
          open: true,
          message: `Error uploading image: ${error.response?.data?.message || error.message}`,
          severity: 'error'
        });
      }
    };

    const handleCloseSnackbar = () => {
      setSnackbar({ ...snackbar, open: false });
    };

    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Pad Print</DialogTitle>
        <IconButton
          style={{ position: 'absolute', right: 8, top: 8 }}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="brand-label">Brand</InputLabel>
            <Select
              labelId="brand-label"
              id="brand-select"
              name="brand"
              value={formData.brand}
              label="Brand"
              onChange={handleChange}
              sx={{ fontWeight: 'normal' }}
            >
              {brands.map((brand) => (
                <MenuItem key={brand} value={brand}>
                  {brand}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Style" name="style" fullWidth margin="normal" value={formData.style} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
          <TextField label="Color" name="color" fullWidth margin="normal" value={formData.color} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}/>
          <TextField label="Season" name="season" fullWidth margin="normal" value={formData.season} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
          <TextField label="Pattern" name="pattern" fullWidth margin="normal" value={formData.pattern} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
          <TextField label="Pad Print Color" name="padprint_color" fullWidth margin="normal" value={formData.padprint_color} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />

          {/* Read-only Date Field */}
          <TextField
            label="Date"
            name="date"
            fullWidth
            margin="normal"
            value={formData.date}
            InputProps={{ readOnly: true }}
            sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />

          {/* Image Upload Component */}
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Upload Pad Print Image
          </Typography>
          <ImageUploadComponent onUpload={handleImageUpload} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Create</Button>
        </DialogActions>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Dialog>
    );
  };

// Edit PadPrint Modal Component
const EditPadPrintModal = ({ open, handleClose, padPrint, onUpdated, onImageUploaded }) => {
  const [formData, setFormData] = useState({ ...padPrint });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Update local state when padPrint prop changes
  useEffect(() => {
    setFormData({ ...padPrint });
  }, [padPrint]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(`/padprint/${padPrint.id}`, formData);
      console.log("PadPrint updated:", response.data);
      onUpdated(response.data);
      handleClose();
    } catch (error) {
      console.error("Error updating pad print:", error.response ? error.response.data : error.message);
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleImageUpload = async (file) => {
    if (!formData.pattern || !formData.padprint_color) {
      setSnackbar({
        open: true,
        message: 'Pattern and Pad Print Color are required for image upload',
        severity: 'warning'
      });
      return;
    }

    try {
      // First try to upload directly to the padprint ID
      const uploadData = new FormData();
      uploadData.append('file', file);

      const response = await axios.post(`/padprint/upload-image/${padPrint.id}`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSnackbar({
        open: true,
        message: 'Image uploaded successfully',
        severity: 'success'
      });

      // Refresh the padprint data to show the new image
      const updatedPadPrint = { ...formData, image_url: response.data.image_url };
      onUpdated(updatedPadPrint);

      // Also refresh the entire data list
      if (onImageUploaded) {
        onImageUploaded();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({
        open: true,
        message: `Error uploading image: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Pad Print</DialogTitle>
      <IconButton
        style={{ position: 'absolute', right: 8, top: 8 }}
        onClick={handleClose}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent>
        <TextField label="Brand" name="brand" fullWidth margin="normal" value={formData.brand} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
        <TextField label="Style" name="style" fullWidth margin="normal" value={formData.style} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
        <TextField label="Color" name="color" fullWidth margin="normal" value={formData.color} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
        <TextField label="Season" name="season" fullWidth margin="normal" value={formData.season} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
        <TextField label="Pattern" name="pattern" fullWidth margin="normal" value={formData.pattern} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />
        <TextField label="Pad Print Color" name="padprint_color" fullWidth margin="normal" value={formData.padprint_color} onChange={handleChange} sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }} />

        {/* Current Image Preview */}
        {formData.image_url && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1">Current Image</Typography>
            <img
              src={formData.image_url.startsWith('http')
                ? formData.image_url
                : `${axios.defaults.baseURL}padprint/image/${formData.image_url}`
              }
              alt="Current Pad Print"
              style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', marginTop: '8px' }}
            />
          </Box>
        )}

        {/* Image Upload Component */}
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          {formData.image_url ? 'Replace Image' : 'Upload Image'}
        </Typography>
        <ImageUploadComponent onUpload={handleImageUpload} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Save</Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

// Bulk Image Upload Modal Component
const BulkImageUploadModal = ({ open, handleClose, onSuccess }) => {
  const [selectedPattern, setSelectedPattern] = useState('');
  const [selectedPadprintColor, setSelectedPadprintColor] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [patterns, setPatterns] = useState([]);
  const [padprintColors, setPadprintColors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch unique patterns and padprint colors when modal opens
  useEffect(() => {
    if (open) {
      fetchPatternsAndColors();
    }
  }, [open]);

  const fetchPatternsAndColors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/padprint/all');
      const data = response.data;

      if (Array.isArray(data)) {
        // Extract unique patterns and padprint colors
        const uniquePatterns = [...new Set(data.map(item => item.pattern))].filter(Boolean).sort();
        const uniquePadprintColors = [...new Set(data.map(item => item.padprint_color))].filter(Boolean).sort();

        setPatterns(uniquePatterns);
        setPadprintColors(uniquePadprintColors);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!selectedPattern || !selectedPadprintColor) {
      setSnackbar({
        open: true,
        message: 'Please select both Pattern and Pad Print Color',
        severity: 'warning'
      });
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('pattern', selectedPattern);
    uploadData.append('padprint_color', selectedPadprintColor);

    try {
      await axios.post('/padprint/upload-image-direct', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSnackbar({
        open: true,
        message: 'Image uploaded successfully',
        severity: 'success'
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({
        open: true,
        message: `Error uploading image: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Pad Print Image</DialogTitle>
      <IconButton
        style={{ position: 'absolute', right: 8, top: 8 }}
        onClick={handleClose}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel id="pattern-label">Pattern</InputLabel>
              <Select
                labelId="pattern-label"
                id="pattern-select"
                value={selectedPattern}
                label="Pattern"
                onChange={(e) => setSelectedPattern(e.target.value)}
                sx={{ fontWeight: 'normal' }}
              >
                {patterns.map((pattern) => (
                  <MenuItem key={pattern} value={pattern}>
                    {pattern}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="padprint-color-label">Pad Print Color</InputLabel>
              <Select
                labelId="padprint-color-label"
                id="padprint-color-select"
                value={selectedPadprintColor}
                label="Pad Print Color"
                onChange={(e) => setSelectedPadprintColor(e.target.value)}
                sx={{ fontWeight: 'normal' }}
              >
                {padprintColors.map((color) => (
                  <MenuItem key={color} value={color}>
                    {color}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Upload Image
            </Typography>
            <ImageUploadComponent onUpload={handleImageUpload} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

// Main Component for PadPrints
const PadPrints = () => {
  const { brand } = useParams();
  const [padPrints, setPadPrints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [editingPadPrint, setEditingPadPrint] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check for filter in URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedFilter = params.get('filter');
    if (savedFilter) {
      setFilterText(savedFilter);
    }
  }, []);

  // Function to reload the page while preserving the filter
  const reloadPageWithFilter = () => {
    // Save current filter to URL
    const url = new URL(window.location.href);
    if (filterText) {
      url.searchParams.set('filter', filterText);
    } else {
      url.searchParams.delete('filter');
    }

    // Update URL without reloading
    window.history.replaceState({}, '', url.toString());

    // Then reload the page
    window.location.reload();
  };

  // Adjust table height dynamically
  useEffect(() => {
    const handleResize = () => {
      setTableHeight(window.innerHeight - 260);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch PadPrint items from the API
  const fetchItems = async () => {
    try {
      const response = await axios.get('/padprint/all');
      const data = response.data;

      if (!Array.isArray(data)) throw new Error("Unexpected response format");

      const filteredByBrand = brand
        ? data.filter((item) => item.brand?.toUpperCase() === brand.toUpperCase())
        : data;

      setPadPrints(filteredByBrand);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [brand]);

  // Filter items based on filter text
  const filteredItems = padPrints.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const handleOpen = (imgUrl) => {
    setSelectedImage(imgUrl);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Delete a pad print
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Do you really want to delete this pad-print?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/padprint/${id}`);
      setPadPrints(prev => prev.filter(item => item.id !== id));
      setSnackbar({
        open: true,
        message: 'Pad print deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error("Error deleting pad print:", error.response ? error.response.data : error.message);
      setSnackbar({
        open: true,
        message: `Error deleting pad print: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  // Define DataGrid columns, including an actions column for Edit/Delete
  const columns = [
    { field: 'brand', headerName: 'Brand', width: 150 },
    { field: 'style', headerName: 'Style', width: 150 },
    { field: 'season', headerName: 'Season', width: 120 },
    { field: 'color', headerName: 'Color', width: 120 },
    { field: 'pattern', headerName: 'Pattern', width: 150 },
    { field: 'padprint_color', headerName: 'Pad Print Color', width: 150 },
    {
      field: 'date',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => {
        const rawDate = params.row?.date;
        return rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : 'N/A';
      }
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 150,
      renderCell: (params) => {
        if (params.row.padprint_color === 'NO') return "";
        if (!params.value) return "Missing Image";
        // Use the same pattern as OrderPlanning - axios.defaults.baseURL directly
        const imageUrl = params.value.startsWith("http")
          ? params.value
          : `${axios.defaults.baseURL}padprint/image/${params.value}`;
        return (
          <img
            src={imageUrl}
            alt={`${params.row.brand} ${params.row.style}`}
            style={{ width: '50px', height: '50px', objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => handleOpen(imageUrl)}
            onError={(e) => {
              if (!e.target.dataset.retry) {
                e.target.dataset.retry = "true";
                // Use axios.defaults.baseURL for fallback image too
                e.target.src = `${axios.defaults.baseURL.replace('/api/', '/')}/static/placeholder.png`;
              }
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => {
        const padPrint = params.row;
        return (
          <Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setOpenEditModal(true);
                setEditingPadPrint(padPrint);
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => handleDelete(padPrint.id)}
              sx={{ ml: 1 }}
            >
              Delete
            </Button>
          </Box>
        );
      }
    }
  ];

  return (
    <MainCard
      title={`Pad Prints - ${brand ? brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase() : ""}`}
      secondary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Filter"
            variant="outlined"
            size="small"
            value={filterText}
            onChange={(e) => {
              const newFilter = e.target.value;
              setFilterText(newFilter);

              // Update URL with filter value without reloading
              const url = new URL(window.location.href);
              if (newFilter) {
                url.searchParams.set('filter', newFilter);
              } else {
                url.searchParams.delete('filter');
              }
              window.history.replaceState({}, '', url.toString());
            }}
            sx={{ width: 250, '& input': { fontWeight: 'normal' } }}
          />
          <Button variant="contained" onClick={() => setOpenCreateModal(true)}>
            Create New
          </Button>
          {/* Upload Image button commented out as requested
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpenUploadModal(true)}
            startIcon={<CloudUploadIcon />}
          >
            Upload Image
          </Button>
          */}
        </Box>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress />
        </Box>
      ) : (
        <div style={{ height: tableHeight, width: '100%' }}>
          <DataGrid
            getRowId={(row) => row.id}
            rows={filteredItems}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            pagination
            sx={{
              '& .MuiTablePagination-root': {
                overflow: 'hidden',
                minHeight: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }
            }}
            components={{ Pagination: CustomPagination }}
          />
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <IconButton
          style={{ position: 'absolute', right: 8, top: 8 }}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <img src={selectedImage} alt="Pad Print Full" style={{ width: '100%', height: 'auto' }} />
        </DialogContent>
      </Dialog>

      {/* Create PadPrint Modal */}
      {openCreateModal && (
        <CreatePadPrintModal
          open={openCreateModal}
          handleClose={() => setOpenCreateModal(false)}
          onCreated={(newPadPrint) => {
            // Just update the state without reloading when creating a new padprint
            setPadPrints(prev => [...prev, newPadPrint]);
            setSnackbar({
              open: true,
              message: 'Pad print created successfully',
              severity: 'success'
            });
          }}
        />
      )}

      {/* Edit PadPrint Modal */}
      {openEditModal && editingPadPrint && (
        <EditPadPrintModal
          open={openEditModal}
          handleClose={() => setOpenEditModal(false)}
          padPrint={editingPadPrint}
          onUpdated={(updatedPadPrint) => {
            setPadPrints(prev =>
              prev.map(item => (item.id === updatedPadPrint.id ? updatedPadPrint : item))
            );
            setSnackbar({
              open: true,
              message: 'Pad print updated successfully',
              severity: 'success'
            });
          }}
          onImageUploaded={() => {
            // Reload the page while preserving the filter
            reloadPageWithFilter();
          }}
        />
      )}

      {/* Bulk Image Upload Modal */}
      {openUploadModal && (
        <BulkImageUploadModal
          open={openUploadModal}
          handleClose={() => setOpenUploadModal(false)}
          onSuccess={() => {
            // Reload the page while preserving the filter
            reloadPageWithFilter();
          }}
        />
      )}

      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
};

export default PadPrints;
