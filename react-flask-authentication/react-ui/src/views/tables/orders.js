import React, { useEffect, useState } from 'react';
import axios from 'utils/axiosInstance';
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Box, TextField, Typography, TablePagination } from '@mui/material';
import MainCard from '../../ui-component/cards/MainCard';

// Custom Pagination Component to Disable Scrolling and Move Page Info Left
const CustomPagination = (props) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end', // Changed to flex-start to move content left
                alignItems: 'center',
                padding: 2,
                overflow: 'hidden', // ✅ Prevents scrolling
                minHeight: '52px' // ✅ Ensures enough height to avoid cut-off elements
            }}
        >
            <TablePagination
                {...props}
                component="div"
                sx={{
                    overflow: 'hidden', // ✅ Fully removes scrolling
                    minHeight: '52px',
                    display: 'flex', // Ensures elements don't wrap
                    alignItems: 'center',
                    justifyContent: 'flex-end', // Changed to flex-start to move content left
                    fontSize: '1.2rem',   // Bigger font size
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

//==============================|| ORDERS SUMMARY PAGE ||==============================//

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState(""); // For frontend filtering
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);

    // ✅ Adjust table height dynamically when the window resizes
    useEffect(() => {
        const handleResize = () => {
            setTableHeight(window.innerHeight - 260); // ✅ Adjust based on viewport height
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch all data from API (only once)
    useEffect(() => {
        setLoading(true);
        // Use the min_prefix parameter to only fetch orders starting with 24 and onwards
        axios.get(`/orders/order_lines`, {
            params: {
                min_prefix: '24' // Only fetch orders starting with 24 and onwards
            }
        })
            .then((response) => {
                if (response.data.success) {
                    setOrders(response.data.data);
                } else {
                    console.error("Failed to fetch orders");
                }
            })
            .catch((error) => console.error("Error fetching order data:", error))
            .finally(() => setLoading(false));
    }, []);

    // Filter data locally in the frontend
    const filteredOrders = orders
        // First filter to only include orders starting with numbers 24 and onwards
        .filter(order => {
            const orderCommessa = order.order_commessa;
            // Check if it starts with a digit
            if (!/^\d/.test(orderCommessa)) {
                return false; // Skip orders that don't start with a digit
            }
            // Check if it starts with 24 or higher
            return orderCommessa >= '24';
        })
        // Then apply the user's filter text
        .filter(order =>
            Object.values(order).some(value =>
                value.toString().toLowerCase().includes(filterText.toLowerCase())
            )
        );

    // Table Columns
    const columns = [
        { field: 'order_commessa', headerName: 'Order Commessa', width: 180 },
        { field: 'size', headerName: 'Size', width: 100 },
        { field: 'season', headerName: 'Season', width: 100 },
        { field: 'prod_order_no', headerName: 'Prod Order No', width: 180 },
        { field: 'style', headerName: 'Style', width: 150 },
        { field: 'color_code', headerName: 'Color Code', width: 120 },
        { field: 'quantity', headerName: 'Quantity', width: 100, type: 'number' },
        { field: 'status', headerName: 'Status', width: 100, type: 'number' },
    ];

    return (
        <MainCard
            title="Orders Summary"
            secondary={
                <TextField
                    label="Filter"
                    variant="outlined"
                    size="small"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    sx={{
                        '& input': { fontWeight: 'normal' } // ✅ Correct way to set label font weight
                    }}
                />
            }
        >
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <div style={{ height: tableHeight, width: '100%' }}>
                    <DataGrid
                        rows={filteredOrders} // Use filtered data
                        columns={columns}
                        pageSize={25} // Default 25 rows per page
                        rowsPerPageOptions={[10, 25, 50, 100]} // User can change
                        pagination
                        getRowId={(row) => `${row.order_commessa}-${row.size}`} // Composite key
                        disableSelectionOnClick // No selection, no checkboxes
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'season', sort: 'desc' }] // ✅ Default sorting by season (descending)
                            }
                        }}
                        sx={{
                            '& .MuiTablePagination-root': {
                                overflow: 'hidden', // ✅ Prevents pagination scrolling
                                minHeight: '52px', // ✅ Makes sure everything is properly aligned
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                            }
                        }}
                        components={{
                            Pagination: CustomPagination // ✅ Custom pagination (no scrolling)
                        }}
                    />
                </div>
            )}
        </MainCard>
    );
};

export default Orders;









