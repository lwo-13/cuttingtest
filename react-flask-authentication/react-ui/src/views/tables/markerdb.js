import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
    Button
  } from '@mui/material';
import { Block } from '@mui/icons-material';
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
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [pcsDialogOpen, setPcsDialogOpen] = useState(false);
    const [markerLines, setMarkerLines] = useState([]);
    const [selectedMarkerName, setSelectedMarkerName] = useState('');

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
        axios.get('http://172.27.57.210:5000/api/markers/marker_headers') // Adjust URL if needed
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
          const res = await axios.get(`http://127.0.0.1:5000/api/markers/marker_pcs?marker_name=${markerName}`);
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
            const response = await axios.post('http://172.27.57.210:5000/api/markers/set_not_active', {
                marker_ids: selectedMarkers  // ✅ Send the ID array directly
            });
    
            if (response.data.success) {
                console.log("Markers updated successfully");
    
                // ✅ Re-fetch markers after update
                fetchMarkers();
    
                // ✅ Clear selection
                setSelectedMarkers([]);
            } else {
                console.error("Failed to update markers:", response.data.message);
            }
        } catch (error) {
            console.error("Error updating markers:", error);
        }
    };

    // Table Columns
    const columns = [
        { field: 'id', headerName: 'ID', width: 50 },
        { field: 'marker_name', headerName: 'Marker Name', width: 300 },
        { field: 'marker_width', headerName: 'Width', width: 100 },
        { field: 'marker_length', headerName: 'Length', width: 100 },
        { field: 'efficiency', headerName: 'Efficiency (%)', width: 130 },
        { field: 'total_pcs', headerName: 'Total Pieces', width: 120 },
        { field: 'creation_type', headerName: 'Creation Type', width: 150 },
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
                <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleSetNotActive} // ✅ Calls the function to set as NOT ACTIVE
                    startIcon={<Block />} // ✅ Uses a Print icon
                    disabled={!selectedMarkers.length} // ✅ Disable if no selection
                >
                    Set NOT ACTIVE
                </Button>
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

            <Dialog open={pcsDialogOpen} onClose={() => setPcsDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'normal', fontSize: '1rem' }}>
                    Marker: {selectedMarkerName}
                </DialogTitle>
                <DialogContent dividers>
                    {markerLines.length > 0 ? (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Style</strong></TableCell>
                                        <TableCell><strong>Size</strong></TableCell>
                                        <TableCell><strong>Quantity</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {markerLines.map((line, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{line.style}</TableCell>
                                            <TableCell>{line.size}</TableCell>
                                            <TableCell>{line.pcs_on_layer}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography>No pieces found for this marker.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPcsDialogOpen(false)} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MarkerDB;




