import React, { useEffect, useState } from 'react';
import axios from 'utils/axiosInstance';
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Box, TextField, Typography, TablePagination, Button, CheckCircleOutline } from '@mui/material';
import MainCard from '../../ui-component/cards/MainCard';
import { Print } from '@mui/icons-material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import saveMattressBG from 'views/import-print-tools/Print/saveBG';
import printMattressBG from 'views/import-print-tools/Print/printBG';
import printMattressEN from 'views/import-print-tools/Print/printEN';

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

const MattressTable = () => {
    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedMattresses, setSelectedMattresses] = useState([]);

    // ✅ Adjust table height dynamically when the window resizes
    useEffect(() => {
        const handleResize = () => {
            setTableHeight(window.innerHeight - 260); // ✅ Adjust based on viewport height
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSelectionChange = (newSelection) => {
        if (!newSelection.length) {
            setSelectedMattresses([]); // ✅ If nothing is selected, clear state
            return;
        }

        // ✅ Find selected mattresses from `mattresses` array
        const selected = mattresses.filter(m => newSelection.includes(m.mattress));

        setSelectedMattresses(selected); // ✅ Store selected objects
    };

    const fetchMattresses = () => {
        setLoading(true);
        axios.get('/mattress/all_with_details')
            .then((response) => {
                if (response.data.success) {
                    const updatedMattresses = response.data.data.map(mattress => {
                        const printTravelStatus = mattress.details.length > 0
                            ? mattress.details[0].print_travel
                            : false;

                        const printMarkerStatus = mattress.details.length > 0
                            ? mattress.details[0].print_marker
                            : false;

                        return {
                            ...mattress,
                            print_travel: printTravelStatus,
                            print_marker: printMarkerStatus
                        };
                    });

                    setMattresses(updatedMattresses);
                }
            })
            .catch(() => {
                // Error fetching mattresses - handle silently
            })
            .finally(() => setLoading(false));
    };

    // Call fetchMattresses inside useEffect
    useEffect(() => {
        fetchMattresses();
    }, []);

    // Filter data locally
    const filteredMattresses = mattresses.filter(mattress => {
        // Define the specific fields to search through
        const searchableFields = [
            mattress.mattress,
            mattress.order_commessa,
            mattress.fabric_type,
            mattress.fabric_code,
            mattress.fabric_color,
            mattress.dye_lot,
            mattress.item_type,
            mattress.spreading_method
        ];

        // Convert filter text to lowercase for case-insensitive search
        const searchText = filterText.toLowerCase();

        // Check if any of the fields contain the search text
        return searchableFields.some(field =>
            field !== null &&
            field !== undefined &&
            field.toString().toLowerCase().includes(searchText)
        );
    });


    // Table Columns
    const columns = [
        { field: 'mattress', headerName: 'Mattress', width: 250 },
        { field: 'order_commessa', headerName: 'Order Commessa', width: 180 },
        { field: 'fabric_type', headerName: 'Fabric Type', width: 130 },
        { field: 'fabric_code', headerName: 'Fabric Code', width: 140 },
        { field: 'fabric_color', headerName: 'Fabric Color', width: 140 },
        { field: 'dye_lot', headerName: 'Dye Lot', width: 130 },
        { field: 'item_type', headerName: 'Item Type', width: 100 },
        { field: 'spreading_method', headerName: 'Spreading Method', width: 180 },
        {
            field: 'print_travel',
            headerName: 'Printed',
            width: 160,
            renderCell: (params) => (
                params.value ? "✅ Printed" : ""
            )
        }
    ];


    return (
        <MainCard
            title="Mattress Travel Document"
            secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Filter Input */}
                    <TextField
                        label="Filter"
                        variant="outlined"
                        size="small"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        sx={{ '& input': { fontWeight: 'normal' } }}
                    />

                    {/* Print Button EN
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => printMattressEN(selectedMattresses, fetchMattresses)}// ✅ Calls the print function
                        startIcon={<Print />}
                    >
                        Print EN
                    </Button> */}

                    {/* Save Button */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => saveMattressBG(selectedMattresses, fetchMattresses)}
                        startIcon={<PictureAsPdfIcon />}
                    >
                        Save
                    </Button>

                    {/* Print Button */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => printMattressBG(selectedMattresses, fetchMattresses)}// ✅ Calls the print function
                        startIcon={<Print />}
                    >
                        Print
                    </Button>
                </Box>
            }
        >
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <Box style={{ height: tableHeight, width: '100%' }}>
                    <DataGrid
                        rows={filteredMattresses} // Use filtered data
                        columns={columns}
                        pageSize={25}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        pagination
                        checkboxSelection
                        disableRowSelectionOnClick
                        onRowSelectionModelChange={handleSelectionChange} // ✅ Correct event listener
                        rowSelectionModel={selectedMattresses.map(m => m.mattress)}
                        getRowId={(row) => row.mattress}
                        disableSelectionOnClick
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
                </Box>
            )}
        </MainCard>
    );

};

export default MattressTable;
