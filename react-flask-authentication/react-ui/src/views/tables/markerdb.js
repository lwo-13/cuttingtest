import React, { useEffect, useState } from 'react';
import axios from 'utils/axiosInstance';
import { DataGrid } from '@mui/x-data-grid';
import {
    CircularProgress,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Typography,
    Button,
    Snackbar,
    Alert,
    Badge,
    TextField,
    IconButton,
    Tooltip,
    Link
  } from '@mui/material';
import { Block, Delete, OpenInNew } from '@mui/icons-material';
import { IconTarget } from '@tabler/icons';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import MainCard from '../../ui-component/cards/MainCard';


//==============================|| MARKER DATABASE PAGE ||==============================//

/*
// UNUSED - Custom Pagination Component to Disable Scrolling and Keep Alignment Right
const CustomPagination = (props) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end', // Changed to flex-start to move content left
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
                    justifyContent: 'flex-end',
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
*/

const MarkerDB = () => {
    const history = useHistory();

    // Get user role from Redux state
    const account = useSelector((state) => state.account);
    const userRole = account?.user?.role || '';

    // Check if user can view usage orders (Planner role and above)
    const canViewUsageOrders = ['Planner', 'Administrator', 'Project Admin', 'Manager', 'Shift Manager'].includes(userRole);

    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [pcsDialogOpen, setPcsDialogOpen] = useState(false);
    const [markerLines, setMarkerLines] = useState([]);
    const [selectedMarkerName, setSelectedMarkerName] = useState('');

    // Usage orders dialog state
    const [usageDialogOpen, setUsageDialogOpen] = useState(false);
    const [usageOrders, setUsageOrders] = useState([]);
    const [usageDialogLoading, setUsageDialogLoading] = useState(false);
    const [selectedMarkerForUsage, setSelectedMarkerForUsage] = useState(null);

    // Search state
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Snackbar state
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Snackbar close handlers
    const handleCloseSuccess = () => setOpenSuccess(false);
    const handleCloseError = () => setOpenError(false);

    // Debounce search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Adjust table height dynamically when the window resizes
    useEffect(() => {
        const handleResize = () => {
            setTableHeight(window.innerHeight - 260); // ✅ Adjust based on viewport height
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fetchMarkers = (search = "") => {
        setLoading(true);

        // Build query parameters for server - fetch ALL markers from database
        const params = new URLSearchParams({
            page: '1',
            per_page: '999999' // Fetch all markers without limit
        });

        if (search.trim()) {
            params.append('search', search.trim());
        }

        axios.get(`/markers/marker_headers_paginated?${params.toString()}`)
            .then((response) => {
                if (response.data.success) {
                    const markersData = response.data.data;
                    setMarkers(markersData);
                } else {
                    console.error("Failed to fetch markers:", response.data);
                }
            })
            .catch((error) => {
                console.error("Error fetching marker data:", error);
            })
            .finally(() => setLoading(false));
    };

    // Fetch markers when component mounts or search term changes
    useEffect(() => {
        fetchMarkers(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    const handleCheckPcsClick = async (markerName) => {
        try {
          const res = await axios.get(`/markers/marker_pcs?marker_name=${markerName}`);
          if (res.data.success) {
            setMarkerLines(res.data.marker_lines);
            setSelectedMarkerName(markerName);
            setPcsDialogOpen(true);
          } else {
            console.warn(res.data.msg);
          }
        } catch (err) {
          console.error("Failed to fetch marker lines:", err);
        }
      };

    // Handle usage icon click - show orders using this marker
    const handleUsageClick = async (markerId, markerName) => {
        if (!canViewUsageOrders) return;

        setUsageDialogLoading(true);
        setSelectedMarkerForUsage({ id: markerId, name: markerName });
        setUsageDialogOpen(true);

        try {
            const res = await axios.get(`/markers/marker_usage_orders/${markerId}`);
            if (res.data.success) {
                setUsageOrders(res.data.orders);
            } else {
                console.warn(res.data.msg);
                setUsageOrders([]);
            }
        } catch (err) {
            console.error("Failed to fetch marker usage orders:", err);
            setUsageOrders([]);
        } finally {
            setUsageDialogLoading(false);
        }
    };

    // Navigate to Order Planning with selected order
    const handleNavigateToOrder = (orderCommessa) => {
        history.push(`/planning/orderplanning?order=${orderCommessa}`);
    };

    const handleSetNotActive = async () => {
        if (!selectedMarkers.length) return;

        console.log("Sending marker IDs:", selectedMarkers); // ✅ Debugging

        try {
            const response = await axios.post('/markers/set_not_active', {
                marker_ids: selectedMarkers  // ✅ Send the ID array directly
            });

            if (response.data.success) {
                setSuccessMessage("Markers set to NOT ACTIVE successfully");
                setOpenSuccess(true);

                // Re-fetch markers after update
                fetchMarkers(debouncedSearchTerm);

                // ✅ Clear selection
                setSelectedMarkers([]);
            } else {
                setErrorMessage(response.data.message || "Failed to update markers");
                setOpenError(true);
            }
        } catch (error) {
            console.error("Error updating markers:", error);
            setErrorMessage("An error occurred while updating markers");
            setOpenError(true);
        }
    };

    const handleDeleteMarkers = async () => {
        if (!selectedMarkers.length) return;

        // Show confirmation dialog
        if (!window.confirm("Are you sure you want to delete the selected markers? This action cannot be undone.")) {
            return;
        }

        console.log("Deleting marker IDs:", selectedMarkers);

        try {
            const response = await axios.post('/markers/delete', {
                marker_ids: selectedMarkers
            });

            if (response.data.success) {
                setSuccessMessage(response.data.message);
                setOpenSuccess(true);

                // Re-fetch markers after deletion
                fetchMarkers(debouncedSearchTerm);

                // ✅ Clear selection
                setSelectedMarkers([]);
            } else {
                setErrorMessage(response.data.message);
                setOpenError(true);
            }
        } catch (error) {
            console.error("Error deleting markers:", error);
            setErrorMessage("Marker cannot be deleted");
            setOpenError(true);
        }
    };

    // Helper function to apply strikethrough styling for NOT ACTIVE markers
    const renderCellWithStrikethrough = (value, isNotActive) => (
        <span style={{
            textDecoration: isNotActive ? 'line-through' : 'none',
            color: isNotActive ? '#999' : 'inherit'
        }}>
            {value}
        </span>
    );

    // Table Columns
    const columns = [
        {
            field: 'marker_name',
            headerName: 'Marker Name',
            width: 290,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'marker_width',
            headerName: 'Width',
            width: 100,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'marker_length',
            headerName: 'Length',
            width: 100,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'efficiency',
            headerName: 'Efficiency (%)',
            width: 130,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'total_pcs',
            headerName: 'Total Pieces',
            width: 120,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'fabric_type',
            headerName: 'Fabric Type',
            width: 100,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'fabric_code',
            headerName: 'Fabric Code',
            width: 130,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'model',
            headerName: 'MDL',
            width: 150,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'variant',
            headerName: 'Variant',
            width: 150,
            renderCell: (params) => renderCellWithStrikethrough(params.value, params.row.status === 'NOT ACTIVE')
        },
        {
            field: 'usage_count',
            headerName: 'Usage',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            filterable: false, // Disable filtering for this column
            renderCell: (params) => {
                const usageCount = params.row.usage_count;
                const isClickable = canViewUsageOrders && usageCount > 0;

                const badgeContent = (
                    <Badge
                        badgeContent={usageCount}
                        color={usageCount > 0 ? 'success' : 'default'}
                        showZero
                    >
                        <IconTarget size={20} />
                    </Badge>
                );

                return (
                    <div style={{
                        textDecoration: params.row.status === 'NOT ACTIVE' ? 'line-through' : 'none',
                        opacity: params.row.status === 'NOT ACTIVE' ? 0.6 : 1
                    }}>
                        {isClickable ? (
                            <Tooltip title="View orders using this marker">
                                <IconButton
                                    size="small"
                                    onClick={() => handleUsageClick(params.row.id, params.row.marker_name)}
                                    sx={{
                                        padding: '4px',
                                        '&:hover': { backgroundColor: 'rgba(46, 125, 50, 0.1)' }
                                    }}
                                >
                                    {badgeContent}
                                </IconButton>
                            </Tooltip>
                        ) : (
                            badgeContent
                        )}
                    </div>
                );
            }
        },
        {
            field: 'check_pcs',
            headerName: 'Check pcs',
            width: 120,
            filterable: false, // Disable filtering for this column
            renderCell: (params) => (
              <Button
                variant="text"
                color="primary"
                sx={{
                    textDecoration: params.row.status === 'NOT ACTIVE' ? 'line-through' : 'underline',
                    fontSize: '0.85rem',
                    opacity: params.row.status === 'NOT ACTIVE' ? 0.6 : 1
                }}
                onClick={() => handleCheckPcsClick(params.row.marker_name)}
              >
                Check pcs
              </Button>
            )
          }
    ];


    return (
        <>
            <MainCard title="Marker Database" secondary={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        label="Search markers..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: 300 }}
                        placeholder="Search by name, fabric, model, variant..."
                    />
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleSetNotActive}
                        startIcon={<Block />}
                        disabled={!selectedMarkers.length}
                    >
                        Set NOT ACTIVE
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteMarkers}
                        startIcon={<Delete />}
                        disabled={!selectedMarkers.length}
                    >
                        DELETE
                    </Button>
                </Box>
            }>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                        <CircularProgress />
                    </Box>
                ) : (
                    <div style={{ height: tableHeight, width: '100%' }}>
                        <DataGrid
                            rows={markers}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 100 }
                                }
                            }}
                            pageSizeOptions={[25, 50, 100, 200]}
                            checkboxSelection
                            disableRowSelectionOnClick
                            onRowSelectionModelChange={(newSelection) => {
                                setSelectedMarkers(newSelection);
                            }}
                            loading={loading}
                            disableColumnFilter={false} // Enable column filtering
                            sx={{
                                '& .MuiTablePagination-root': {
                                    overflow: 'hidden',
                                    minHeight: '52px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end'
                                }
                            }}
                        />
                    </div>
                )}
            </MainCard>

            <Dialog open={pcsDialogOpen} onClose={() => setPcsDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'normal', fontSize: '1rem' }}>
                    {selectedMarkerName}
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {markerLines.length > 0 ? (
                        <TableContainer component={Paper} sx={{ width: '100%' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center"><strong>Style</strong></TableCell>
                                        <TableCell align="center"><strong>Size</strong></TableCell>
                                        <TableCell align="center"><strong>Quantity</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {markerLines.map((line, index) => (
                                        <TableRow key={index}>
                                            <TableCell align="center">{line.style}</TableCell>
                                            <TableCell align="center">{line.size}</TableCell>
                                            <TableCell align="center">{line.pcs_on_layer}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography sx={{ textAlign: 'center', mt: 2 }}>No pieces found for this marker.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPcsDialogOpen(false)} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Usage Orders Dialog */}
            <Dialog
                open={usageDialogOpen}
                onClose={() => setUsageDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Orders Using Marker
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {selectedMarkerForUsage?.name}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {usageDialogLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                            <CircularProgress size={30} />
                        </Box>
                    ) : usageOrders.length > 0 ? (
                        <TableContainer component={Paper} sx={{ width: '100%' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Order</strong></TableCell>
                                        <TableCell align="center"><strong>Mattresses</strong></TableCell>
                                        <TableCell align="center"><strong>Action</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {usageOrders.map((order, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>
                                                <Link
                                                    component="button"
                                                    variant="body2"
                                                    onClick={() => handleNavigateToOrder(order.order_commessa)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        textDecoration: 'none',
                                                        '&:hover': { textDecoration: 'underline' }
                                                    }}
                                                >
                                                    {order.order_commessa}
                                                </Link>
                                            </TableCell>
                                            <TableCell align="center">{order.mattress_count}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Open in Order Planning">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleNavigateToOrder(order.order_commessa)}
                                                    >
                                                        <OpenInNew fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
                            No orders found using this marker.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUsageDialogOpen(false)} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={openSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={openError}
                autoHideDuration={5000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default MarkerDB;




