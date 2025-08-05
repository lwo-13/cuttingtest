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
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedMattresses, setSelectedMattresses] = useState([]);

    // ✅ Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 100,
        total_count: 0,
        total_pages: 0
    });

    // ✅ Separate state for current page size to avoid async issues
    const [currentPageSize, setCurrentPageSize] = useState(100);

    // ✅ Search state
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // ✅ Debounce search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]);

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

        console.log("New Selection:", selected); // 🔍 Debugging - shows selected objects

        setSelectedMattresses(selected); // ✅ Store selected objects
    };

    const fetchMattresses = (page = 1, search = "", pageSize = null) => {
        setLoading(true);

        // ✅ Use provided pageSize or current state
        const effectivePageSize = pageSize || currentPageSize;

        // ✅ Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: effectivePageSize.toString()
        });

        if (search.trim()) {
            params.append('search', search.trim());
        }

        console.log(`🔍 Fetching page ${page} with ${effectivePageSize} items per page, search: "${search}"`);

        axios.get(`/mattress/all_with_details?${params.toString()}`)
            .then((response) => {
                console.log("API Response:", response.data);
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

                    // ✅ Update pagination info
                    if (response.data.pagination) {
                        setPagination(response.data.pagination);
                    }
                } else {
                    console.error("Failed to fetch mattress data.");
                }
            })
            .catch((error) => console.error("Error fetching mattresses:", error))
            .finally(() => setLoading(false));
    };

    // ✅ Fetch mattresses when component mounts or search term changes
    useEffect(() => {
        fetchMattresses(1, debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    // ✅ Initial load
    useEffect(() => {
        fetchMattresses();
    }, []);

    // ✅ No need for client-side filtering anymore - it's done server-side


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
                    {/* Search Input */}
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search mattresses..."
                        sx={{ '& input': { fontWeight: 'normal' } }}
                    />

                    {/* Results Info */}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {pagination.total_count} results
                    </Typography>

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
                        key={`${pagination.page}-${currentPageSize}`} // ✅ Force re-render on pagination change
                        rows={mattresses} // ✅ Use server-filtered data
                        columns={columns}
                        pageSize={currentPageSize}
                        rowsPerPageOptions={[25, 50, 100, 200]}
                        pagination
                        paginationMode="server" // ✅ Server-side pagination
                        rowCount={pagination.total_count > 0 ? pagination.total_count : 100000} // ✅ Handle -1 case
                        page={pagination.page - 1} // ✅ DataGrid uses 0-based indexing
                        onPageChange={(newPage) => {
                            console.log(`📄 Page changed to: ${newPage} (API page: ${newPage + 1})`);
                            fetchMattresses(newPage + 1, debouncedSearchTerm);
                        }}
                        onPageSizeChange={(newPageSize) => {
                            console.log(`📏 Page size changed to: ${newPageSize}`);
                            setCurrentPageSize(newPageSize);
                            setPagination(prev => ({ ...prev, per_page: newPageSize, page: 1 }));
                            fetchMattresses(1, debouncedSearchTerm, newPageSize);
                        }}
                        checkboxSelection
                        disableRowSelectionOnClick
                        onRowSelectionModelChange={handleSelectionChange} // ✅ Correct event listener
                        rowSelectionModel={selectedMattresses.map(m => m.mattress)}
                        getRowId={(row) => row.mattress}
                        disableSelectionOnClick
                        loading={loading} // ✅ Show loading state
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
