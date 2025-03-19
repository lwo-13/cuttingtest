import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Box, Button, TextField } from '@mui/material';
import MainCard from '../../ui-component/cards/MainCard';
import TablePagination from '@mui/material/TablePagination';

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

const PadPrints = () => {
    const [padPrints, setPadPrints] = useState([]);  // ✅ State for pad prints
    const [loading, setLoading] = useState(true);  // ✅ Loading state to manage fetching
    const [filterText, setFilterText] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);  // Store selected row ids
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedId, setSelectedId] = useState("");  // Unique id based on selection

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
            const response = await fetch("http://127.0.0.1:5000/api/padprint/all");
            const data = await response.json();
            console.log("Fetched data:", data); // Debugging

            if (!Array.isArray(data)) {
                throw new Error("Unexpected response format, expected an array");
            }

            setPadPrints(data);  // ✅ Successfully set data in state
            setLoading(false);  // ✅ Update loading state after data fetch
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setLoading(false);  // Ensure loading state is false even in case of error
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);  // Fetch data on component mount

    // Filter items based on filter text
    const filteredItems = padPrints.filter(item =>
        Object.values(item).some(value =>
            String(value).toLowerCase().includes(filterText.toLowerCase())
        )
    );

    // Define DataGrid columns
    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'brand', headerName: 'Brand', width: 150 },
        { field: 'style', headerName: 'Style', width: 150 },
        { field: 'color', headerName: 'Color', width: 120 },
        { field: 'padprint_color', headerName: 'PadPrint Color', width: 150 },
        { field: 'pattern', headerName: 'Pattern', width: 150 },
        { field: 'season', headerName: 'Season', width: 120 },
        { 
            field: 'date',
            headerName: 'Date',
            width: 150,
            valueGetter: (params) => {
                // Ensure params.row is defined and has a valid 'date' property
                const date = params.row && params.row.date ? new Date(params.row.date) : null;
                return date && !isNaN(date.getTime()) ? date.toLocaleDateString() : "N/A"; // Return formatted date or "N/A"
            }
        },
        {
            field: 'image_url',
            headerName: 'Image',
            width: 150,
            renderCell: (params) => {
                if (!params.value) {
                    return "No image";
                }
                const imageUrl = params.value.startsWith("http")
                    ? params.value
                    : `http://127.0.0.1:5000/${params.value}`;

                return (
                    <img
                        src={imageUrl}
                        alt={`${params.row.brand} ${params.row.style}`}
                        style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                        onError={(e) => { 
                            if (!e.target.dataset.retry) {
                                e.target.dataset.retry = "true";
                                e.target.src = "http://127.0.0.1:5000/static/placeholder.png"; 
                            }
                        }}
                    />
                );
            }
        }
    ];

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Handle image upload
    const handleImageUpload = async () => {
        if (!selectedFile || !selectedId.toString().trim()) {
            console.error("Please select a file and choose an item.");
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(
                `http://127.0.0.1:5000/api/image-upload/upload-image/${selectedId}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            console.log('Image uploaded successfully:', response.data);
        } catch (error) {
            console.error('Error uploading image:', error.response ? error.response.data : error.message);
        }
    };

    // Update selected rows and set the selected id
    const handleSelectionChange = (newSelection) => {
        setSelectedItems(newSelection);
        if (newSelection.length === 1) {
            setSelectedId(newSelection[0]);
        } else {
            setSelectedId("");
        }
    };

    return (
        <MainCard title="Pad Prints">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingBottom: 2,
                }}
            >
                <TextField
                    label="Filter"
                    variant="outlined"
                    size="small"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    sx={{ width: 250, '& input': { fontWeight: 'normal' } }}
                />
                <Button
                    variant="contained"
                    component="label"
                    sx={{ marginLeft: 2 }}
                >
                    Select Image
                    <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                </Button>
                {selectedFile && (
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ marginLeft: 2 }}
                        onClick={handleImageUpload}
                    >
                        Upload Image
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <div style={{ height: tableHeight, width: '100%' }}>
                    <DataGrid
                        rows={filteredItems}
                        columns={columns}
                        pageSize={25}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        pagination
                        checkboxSelection
                        onRowSelectionModelChange={handleSelectionChange}
                        selectionModel={selectedItems}
                        components={{ Pagination: CustomPagination }}
                    />
                </div>
            )}
        </MainCard>
    );
};

export default PadPrints;
