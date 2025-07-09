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
    Alert
  } from '@mui/material';
import { Block, Delete } from '@mui/icons-material';
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

    // Snackbar state
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Snackbar close handlers
    const handleCloseSuccess = () => setOpenSuccess(false);
    const handleCloseError = () => setOpenError(false);

    // ✅ Adjust table height dynamically when the window resizes
    useEffect(() => {
        const handleResize = () => {
            setTableHeight(window.innerHeight - 260); // ✅ Adjust based on viewport height
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fetchMarkers = () => {
        setLoading(true);
        axios.get('/markers/marker_headers') // Adjust URL if needed
            .then((response) => {
                if (response.data.success) {
                    setMarkers(response.data.data);
                } else {
                    console.error("Failed to fetch markers");
                }
            })
            .catch((error) => console.error("Error fetching marker data:", error))
            .finally(() => setLoading(false));
    };

    // ✅ Call fetchMarkers in useEffect
    useEffect(() => {
        fetchMarkers();
    }, []);

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

                // ✅ Re-fetch markers after update
                fetchMarkers();

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

                // ✅ Re-fetch markers after deletion
                fetchMarkers();

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

    // Table Columns
    const columns = [
        { field: 'marker_name', headerName: 'Marker Name', width: 290 },
        { field: 'marker_width', headerName: 'Width', width: 100 },
        { field: 'marker_length', headerName: 'Length', width: 100 },
        { field: 'efficiency', headerName: 'Efficiency (%)', width: 130 },
        { field: 'total_pcs', headerName: 'Total Pieces', width: 120 },
        { field: 'fabric_type', headerName: 'Fabric Type', width: 100 },
        { field: 'fabric_code', headerName: 'Fabric Code', width: 130 },
        { field: 'model', headerName: 'MDL', width: 200 },
        { field: 'variant', headerName: 'Variant', width: 200 },
        {
            field: 'check_pcs',
            headerName: 'Check pcs',
            width: 120,
            renderCell: (params) => (
              <Button
                variant="text"
                color="primary"
                sx={{ textDecoration: 'underline', fontSize: '0.85rem' }}
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
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                            pageSize={10}
                            rowsPerPageOptions={[10, 25, 50, 100]} // Allow user selection
                            pagination
                            checkboxSelection
                            disableRowSelectionOnClick
                            onRowSelectionModelChange={(newSelection) => {
                                setSelectedMarkers(newSelection);
                            }}
                            sx={{
                                '& .MuiTablePagination-root': {
                                    overflow: 'hidden', // ✅ Prevents pagination scrolling
                                    minHeight: '52px', // ✅ Ensures proper alignment
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end'
                                }
                            }}
                            components={{
                                Pagination: CustomPagination // ✅ Custom pagination (aligned right, no scroll)
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




