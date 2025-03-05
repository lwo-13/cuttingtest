import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Box } from '@mui/material';
import MainCard from '../../ui-component/cards/MainCard';
import TablePagination from '@mui/material/TablePagination';

//==============================|| MARKER DATABASE PAGE ||==============================//

// Custom Pagination Component to Disable Scrolling and Keep Alignment Right
const CustomPagination = (props) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end', // ✅ Align pagination to the right
                alignItems: 'center',
                padding: 2,
                overflow: 'hidden', // ✅ Prevent scrolling
                minHeight: '52px' // ✅ Ensures enough space to prevent cut-off
            }}
        >
            <TablePagination
                {...props}
                component="div"
                sx={{
                    overflow: 'hidden', // ✅ Prevents scrolling
                    minHeight: '52px',
                    display: 'flex', // Ensures elements don’t wrap
                    alignItems: 'center',
                    justifyContent: 'flex-end', // ✅ Keeps pagination on the right
                    fontSize: '1.2rem',
                    '.MuiTablePagination-actions button': {
                        fontSize: '1.2rem', // Bigger navigation buttons
                        minWidth: '48px',   // Bigger button width
                        padding: '10px'     // More padding
                    },
                    '.MuiTablePagination-select': {
                        fontSize: '1.2rem'  // Increase dropdown font size
                    }
                }}
            />
        </Box>
    );
};

const MarkerDB = () => {
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch data from Flask API
    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/markers/marker_headers') // Adjust URL if needed
            .then((response) => {
                if (response.data.success) {
                    setMarkers(response.data.data);
                } else {
                    console.error("Failed to fetch markers");
                }
            })
            .catch((error) => console.error("Error fetching marker data:", error))
            .finally(() => setLoading(false));
    }, []);

    // Table Columns
    const columns = [
        { field: 'id', headerName: 'ID', width: 50 },
        { field: 'marker_name', headerName: 'Marker Name', width: 250 },
        { field: 'marker_width', headerName: 'Width', width: 100 },
        { field: 'marker_length', headerName: 'Length', width: 100 },
        { field: 'efficiency', headerName: 'Efficiency (%)', width: 130 },
        { field: 'total_pcs', headerName: 'Total Pieces', width: 120 },
        { field: 'creation_type', headerName: 'Creation Type', width: 150 },
        { field: 'model', headerName: 'MDL', width: 200 },
        { field: 'variant', headerName: 'Variant', width: 200 },
    ];

    return (
        <MainCard title="Marker Database">
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <div style={{ height: 500, width: '100%' }}>
                    <DataGrid
                        rows={markers}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50, 100]} // Allow user selection
                        pagination
                        disableSelectionOnClick
                        sx={{
                            '& .MuiTablePagination-root': {
                                overflow: 'hidden', // ✅ Prevents pagination scrolling
                                minHeight: '52px', // ✅ Ensures proper alignment
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end' // ✅ Keeps pagination on the right
                            }
                        }}
                        components={{
                            Pagination: CustomPagination // ✅ Custom pagination (aligned right, no scroll)
                        }}
                    />
                </div>
            )}
        </MainCard>
    );
};

export default MarkerDB;




