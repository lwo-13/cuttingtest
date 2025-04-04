import React, { useState, useEffect } from "react";
import axios from 'utils/axiosInstance';
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Box, Button, TextField, Dialog, DialogContent, IconButton, DialogTitle, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import MainCard from '../../ui-component/cards/MainCard';
import TablePagination from '@mui/material/TablePagination';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';


// Available brands
const brands = ["Calzedonia", "Intimissimi", "Falconeri", "Tezenis"];

// Custom Pagination Component
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
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = async () => {
      try {
        const response = await axios.post("/padprint/", formData);
        console.log("PadPrint created:", response.data);
        onCreated(response.data);
        handleClose();
      } catch (error) {
        console.error("Error creating pad print:", error.response ? error.response.data : error.message);
      }
    };
  
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Pad Print</DialogTitle>
        <DialogContent>
          {/* Brand Dropdown */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Brand</InputLabel>
            <Select name="brand" value={formData.brand} onChange={handleChange}>
              {brands.map((brand) => (
                <MenuItem key={brand} value={brand}>{brand}</MenuItem>
              ))}
            </Select>
          </FormControl>
  
          <TextField label="Season" name="season" fullWidth margin="normal" value={formData.season} onChange={handleChange} />
          <TextField label="Style" name="style" fullWidth margin="normal" value={formData.style} onChange={handleChange} />
          <TextField label="Color" name="color" fullWidth margin="normal" value={formData.color} onChange={handleChange} />
          <TextField label="Pad Print Color" name="padprint_color" fullWidth margin="normal" value={formData.padprint_color} onChange={handleChange} />
          <TextField label="Pattern" name="pattern" fullWidth margin="normal" value={formData.pattern} onChange={handleChange} />
  
          {/* Read-only Date Field */}
          <TextField 
            label="Date" 
            name="date" 
            fullWidth 
            margin="normal" 
            value={formData.date} 
            InputProps={{ readOnly: true }} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Create</Button>
        </DialogActions>
      </Dialog>
    );
  };

// Edit PadPrint Modal Component
const EditPadPrintModal = ({ open, handleClose, padPrint, onUpdated }) => {
  const [formData, setFormData] = useState({ ...padPrint });

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
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Edit Pad Print</DialogTitle>
      <DialogContent>
        <TextField label="Brand" name="brand" fullWidth margin="normal" value={formData.brand} onChange={handleChange} />
        <TextField label="Season" name="season" fullWidth margin="normal" value={formData.season} onChange={handleChange} />
        <TextField label="Style" name="style" fullWidth margin="normal" value={formData.style} onChange={handleChange} />
        <TextField label="Color" name="color" fullWidth margin="normal" value={formData.color} onChange={handleChange} />
        <TextField label="Pad Print Color" name="padprint_color" fullWidth margin="normal" value={formData.padprint_color} onChange={handleChange} />
        <TextField label="Pattern" name="pattern" fullWidth margin="normal" value={formData.pattern} onChange={handleChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Component for PadPrints
const PadPrints = () => {
  const { brand } = useParams();
  const [padPrints, setPadPrints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingPadPrint, setEditingPadPrint] = useState(null);

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
      const response = await fetch("/padprint/all");
      const data = await response.json();
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

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile || selectedItems.length === 0) {
      console.error("Please select a file and choose at least one item.");
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
  
    try {
      // Iterate over each selected item and upload the image
      for (const id of selectedItems) {
        const response = await axios.post(
          `/padprint/upload-image/${id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        console.log(`Image uploaded successfully for item ID ${id}:`, response.data);
      }
      setSelectedFile(null);
      setSelectedItems([]);  // Clear selection after upload
      fetchItems();
    } catch (error) {
      console.error('Error uploading image:', error.response ? error.response.data : error.message);
    }
  };

  // Update selected rows and set the selected id
  const handleSelectionChange = (newSelection) => {
    setSelectedItems(newSelection);
  };

  const handleOpen = (imgUrl) => {
    setSelectedImage(imgUrl);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Delete a pad print
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Do you really want to delete this pad-print?");
    if (!confirmDelete) return;
  
    try {
      await axios.delete(`/padprint/${id}`);
      setPadPrints(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting pad print:", error.response ? error.response.data : error.message);
    }
  };

  // Define DataGrid columns, including an actions column for Edit/Delete
  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'brand', headerName: 'Brand', width: 150 },
    { field: 'season', headerName: 'Season', width: 120 },
    { field: 'style', headerName: 'Style', width: 150 },
    { field: 'color', headerName: 'Color', width: 120 },
    { field: 'padprint_color', headerName: 'Pad Print Color', width: 150 },
    { field: 'pattern', headerName: 'Pattern', width: 150 },
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
        const imageUrl = params.value.startsWith("http")
          ? params.value
          : `/padprint/uploads/${params.value.split('/').pop()}`;
        return (
          <img
            src={imageUrl}
            alt={`${params.row.brand} ${params.row.style}`}
            style={{ width: '50px', height: '50px', objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => handleOpen(imageUrl)}
            onError={(e) => {
              if (!e.target.dataset.retry) {
                e.target.dataset.retry = "true";
                e.target.src = "http://172.27.57.210:5000/static/placeholder.png";
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
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ width: 250, '& input': { fontWeight: 'normal' } }}
          />
          <Button variant="contained" onClick={() => setOpenCreateModal(true)}>
            Create New
          </Button>
          <Button variant="contained" component="label">
            Select Image
            <input type="file" hidden onChange={handleFileChange} accept="image/*" />
          </Button>
          {selectedFile && (
            <Button variant="contained" color="primary" onClick={handleImageUpload}>
              Upload Image
            </Button>
          )}
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
            checkboxSelection
            onRowSelectionModelChange={handleSelectionChange}
            selectionModel={selectedItems}
            components={{ Pagination: CustomPagination }}
          />
        </div>
      )}
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
      {openCreateModal && (
        <CreatePadPrintModal
          open={openCreateModal}
          handleClose={() => setOpenCreateModal(false)}
          onCreated={(newPadPrint) => {
            setPadPrints(prev => [...prev, newPadPrint]);
          }}
        />
      )}
      {openEditModal && editingPadPrint && (
        <EditPadPrintModal
          open={openEditModal}
          handleClose={() => setOpenEditModal(false)}
          padPrint={editingPadPrint}
          onUpdated={(updatedPadPrint) => {
            setPadPrints(prev =>
              prev.map(item => (item.id === updatedPadPrint.id ? updatedPadPrint : item))
            );
          }}
        />
      )}
    </MainCard>
  );
};

export default PadPrints;
