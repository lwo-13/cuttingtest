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
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);  // Store selected items (array of item_no)
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedFile, setSelectedFile] = useState(null);
    const [itemNo, setItemNo] = useState("");  // This will be set based on row selection

    // Adjust table height dynamically
    useEffect(() => {
        const handleResize = () => {
            setTableHeight(window.innerHeight - 260);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:5000/api/zalli/items");
                const filteredItems = response.data.filter(item =>
                    item.item_no.startsWith("AK") ||
                    item.item_no.startsWith("AY") ||
                    item.item_no.startsWith("ETI")
                );

                // Ensure each row has a unique 'id' property
                const itemsWithId = filteredItems.map(item => ({
                    ...item,
                    id: item.item_no // Use 'item_no' as the unique id
                }));

                setItems(itemsWithId);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    // Filtered items based on the filter text
    const filteredItems = items.filter(item =>
        Object.values(item).some(value =>
            value.toString().toLowerCase().includes(filterText.toLowerCase())
        )
    );

    // Table Columns
    const columns = [
        { field: 'item_no', headerName: 'Item No', width: 180 },
        { field: 'description', headerName: 'Description', width: 250 },
        { field: 'quantity', headerName: 'Quantity', width: 120 },
{
        field: 'image_url',
        headerName: 'Image',
        width: 150,
        renderCell: (params) => {
            if (!params.value) {
                return "No image";
            }
    
            // Ensure correct image URL
            const imageUrl = params.value.startsWith("http")
                ? params.value
                : `http://127.0.0.1:5000/${params.value}`;
    
            return (
                <img
                    src={imageUrl}
                    alt={params.row.description}
                    style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    onError={(e) => { 
                        if (!e.target.dataset.retry) {
                            e.target.dataset.retry = "true";  // Set flag to prevent infinite loop
                            e.target.src = "http://127.0.0.1:5000/static/placeholder.png"; 
                        }
                    }}
                />
            );
        }
    }
    ];
    

    // Handle file selection separately
    const handleFileChange = (e) => {
        if(e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Handle image upload after file is selected and an item is chosen
    const handleImageUpload = async () => {
        if (!selectedFile || !itemNo.trim()) {
            console.error("Please select a file and choose an item.");
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        // Debug logs to ensure correct values
        console.log('Selected file:', selectedFile);
        console.log('Uploading for item number:', itemNo);

        try {
            const response = await axios.post(
                `http://127.0.0.1:5000/api/image-upload/upload-image/${itemNo}`,  // URL with itemNo
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            console.log('Image uploaded successfully:', response.data);
        } catch (error) {
            console.error('Error uploading image:', error.response ? error.response.data : error.message);
        }
    };

    // Update selection and set itemNo if one row is selected
    const handleSelectionChange = (newSelection) => {
        setSelectedItems(newSelection);
        if (newSelection.length === 1) {
            setItemNo(newSelection[0]);  // Because id is item_no
        } else {
            setItemNo("");
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
                    sx={{
                        width: 250,
                        '& input': { fontWeight: 'normal' }
                    }}
                />

                {/* File Selection Button */}
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

                {/* Only show the Upload button if a file is selected */}
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
                        sx={{
                            '& .MuiTablePagination-root': {
                                overflow: 'hidden',
                                minHeight: '52px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                            }
                        }}
                        components={{
                            Pagination: CustomPagination
                        }}
                    />
                </div>
            )}
        </MainCard>
    );
};

export default PadPrints;
