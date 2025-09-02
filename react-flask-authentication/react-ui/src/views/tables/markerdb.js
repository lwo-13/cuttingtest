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
    TextField
  } from '@mui/material';
import { Block, Delete } from '@mui/icons-material';
import { IconTarget } from '@tabler/icons';
import MainCard from '../../ui-component/cards/MainCard';
import TablePagination from '@mui/material/TablePagination';

//==============================|| MARKER DATABASE PAGE ||==============================//

// Custom Pagination Component to Disable Scrolling and Keep Alignment Right
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

const MarkerDB = () => {
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [pcsDialogOpen, setPcsDialogOpen] = useState(false);
    const [markerLines, setMarkerLines] = useState([]);
    const [selectedMarkerName, setSelectedMarkerName] = useState('');

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 100,
        total_count: 0,
        total_pages: 0
    });

    // Separate state for current page size to avoid async issues
    const [currentPageSize, setCurrentPageSize] = useState(100);

    // Server-side pagination state (fetch 300 rows at a time)
    const [serverData, setServerData] = useState([]);
    const [serverPage, setServerPage] = useState(1);
    const [serverPagination, setServerPagination] = useState({
        page: 1,
        per_page: 300,
        total_count: 0,
        total_pages: 0
    });

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

    const fetchMarkers = (clientPage = 1, search = "", forceRefresh = false) => {
        // Calculate which server page we need based on client page
        // Each server page has 300 items, each client page has 100 items
        // So server page 1 contains client pages 1-3, server page 2 contains client pages 4-6, etc.
        const itemsPerServerPage = 300;
        const itemsPerClientPage = currentPageSize;
        const clientPagesPerServerPage = itemsPerServerPage / itemsPerClientPage; // 3 pages

        const requiredServerPage = Math.ceil(clientPage / clientPagesPerServerPage);

        // Check if we need to fetch new data from server
        const needsServerFetch = forceRefresh ||
                                requiredServerPage !== serverPage ||
                                search !== debouncedSearchTerm;

        if (needsServerFetch) {
            setLoading(true);

            // Build query parameters for server
            const params = new URLSearchParams({
                page: requiredServerPage.toString(),
                per_page: itemsPerServerPage.toString()
            });

            if (search.trim()) {
                params.append('search', search.trim());
            }

            axios.get(`/markers/marker_headers_paginated?${params.toString()}`)
                .then((response) => {
                    if (response.data.success) {
                        const newServerData = response.data.data;
                        setServerData(newServerData);
                        setServerPage(requiredServerPage);

                        // Update server pagination state
                        if (response.data.pagination) {
                            setServerPagination(response.data.pagination);
                        }

                        // Calculate client pagination based on server data (use fresh data, not state)
                        updateClientPaginationWithData(clientPage, response.data.pagination, newServerData);
                    } else {
                        console.error("Failed to fetch markers:", response.data);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching marker data:", error);
                })
                .finally(() => setLoading(false));
        } else {
            // Use existing server data, just update client pagination
            updateClientPaginationWithData(clientPage, serverPagination, serverData);
        }
    };

    const updateClientPaginationWithData = (clientPage, serverPaginationData, dataArray) => {
        const itemsPerServerPage = 300;
        const itemsPerClientPage = currentPageSize;
        const clientPagesPerServerPage = itemsPerServerPage / itemsPerClientPage;

        // Calculate the range of items for this client page
        const startIndex = ((clientPage - 1) % clientPagesPerServerPage) * itemsPerClientPage;
        const endIndex = startIndex + itemsPerClientPage;

        // Extract the subset of data for this client page
        const clientPageData = dataArray.slice(startIndex, endIndex);
        setMarkers(clientPageData);

        // Calculate total client pages based on server total count
        const totalClientPages = Math.ceil(serverPaginationData.total_count / itemsPerClientPage);

        // Update client pagination state
        setPagination({
            page: clientPage,
            per_page: itemsPerClientPage,
            total_count: serverPaginationData.total_count,
            total_pages: totalClientPages
        });
    };

    // Fetch markers when component mounts or search term changes
    useEffect(() => {
        fetchMarkers(1, debouncedSearchTerm, true); // Force refresh on search change
    }, [debouncedSearchTerm]);

    // Handle Selection Change
    const handleSelectionChange = (newSelection) => {
        console.log("Selection Model:", newSelection); // 🔍 Debugging

        if (!newSelection.length) {
            setSelectedMarkers([]); // ✅ Clear selection if none
            return;
        }

        // ✅ Extract selected marker IDs from `newSelection` directly
        setSelectedMarkers(newSelection);

        console.log("Selected Marker IDs:", newSelection); // 🔍 Debugging
    };

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

                // Re-fetch markers after update (maintain current page and search)
                fetchMarkers(pagination.page, debouncedSearchTerm, true);

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

                // Re-fetch markers after deletion (maintain current page and search)
                fetchMarkers(pagination.page, debouncedSearchTerm, true);

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
            renderCell: (params) => (
                <div style={{
                    textDecoration: params.row.status === 'NOT ACTIVE' ? 'line-through' : 'none',
                    opacity: params.row.status === 'NOT ACTIVE' ? 0.6 : 1
                }}>
                    <Badge
                        badgeContent={params.row.usage_count}
                        color={params.row.usage_count > 0 ? 'success' : 'default'}
                        showZero
                    >
                        <IconTarget size={20} />
                    </Badge>
                </div>
            )
        },
        {
            field: 'check_pcs',
            headerName: 'Check pcs',
            width: 120,
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
                            key={`${pagination.page}-${currentPageSize}`} // Force re-render on pagination change
                            rows={markers}
                            columns={columns}
                            paginationModel={{
                                page: pagination.page - 1, // DataGrid uses 0-based indexing
                                pageSize: currentPageSize
                            }}
                            pageSizeOptions={[25, 50, 100]}
                            paginationMode="server" // Server-side pagination
                            rowCount={pagination.total_count > 0 ? pagination.total_count : 100000}
                            onPaginationModelChange={(model) => {
                                // Handle page change
                                if (model.page !== pagination.page - 1) {
                                    fetchMarkers(model.page + 1, debouncedSearchTerm);
                                }

                                // Handle page size change
                                if (model.pageSize !== currentPageSize) {
                                    setCurrentPageSize(model.pageSize);
                                    // Force refresh when page size changes
                                    fetchMarkers(1, debouncedSearchTerm, true);
                                }
                            }}
                            checkboxSelection
                            disableRowSelectionOnClick
                            onRowSelectionModelChange={(newSelection) => {
                                setSelectedMarkers(newSelection);
                            }}
                            loading={loading}
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




