import React, { useEffect, useState } from 'react';
import axios from 'utils/axiosInstance';
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Box, Button } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import MainCard from '../../ui-component/cards/MainCard';
import TablePagination from '@mui/material/TablePagination';
import { useSelector } from "react-redux";
import { useBadgeCount } from '../../contexts/BadgeCountContext';

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

const MattressApproval = () => {
    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedMattresses, setSelectedMattresses] = useState([]);

    const username = useSelector((state) => state.account?.user?.username) || "Unknown";

    const { refreshMattressCount } = useBadgeCount();

    useEffect(() => {
        const handleResize = () => setTableHeight(window.innerHeight - 260);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fetchMattresses = () => {
        setLoading(true);
        axios.get('/mattress/approval')
            .then((response) => {
                if (response.data.success) {
                    setMattresses(response.data.data);  // ✅ Directly set the data
                } else {
                    console.error("Failed to fetch mattresses");
                }
            })
            .catch((error) => console.error("Error fetching mattress data:", error))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchMattresses(); }, []);

    const handleApproveMattresses = async () => {
        if (!selectedMattresses.length) return;
        try {
            const response = await axios.post('/mattress/approve', {
                mattress_ids: selectedMattresses,
                operator: username
            });
            if (response.data.success) {
                console.log("Mattresses approved");
                fetchMattresses(); // ✅ Refresh table
                setSelectedMattresses([]);
                refreshMattressCount(); 
            } else {
                console.error("Approval failed:", response.data.message);
            }
        } catch (error) {
            console.error("Error approving mattresses:", error);
        }
    };

    const columns = [
        { field: 'mattress', headerName: 'Mattress', width: 250 },
        { field: 'order_commessa', headerName: 'Order Commessa', width: 180, hide: true },
        { field: 'fabric_type', headerName: 'Fabric Type', width: 130, hide: true },
        { field: 'fabric_code', headerName: 'Fabric Code', width: 140 },
        { field: 'fabric_color', headerName: 'Fabric Color', width: 140 },
        { field: 'dye_lot', headerName: 'Dye Lot', width: 130 },
        { field: 'marker', headerName: 'Marker', width: 280 },
        { field: 'marker_length', headerName: 'Marker Length [m]', width: 160 },
        { field: 'width', headerName: 'Width [cm]', width: 120 },
        { field: 'layers', headerName: 'Layers', width: 100 },
        { field: 'sizes', headerName: 'Sizes', width: 230 },
        { field: 'consumption', headerName: 'Cons. [m]', width: 120 },
      ];

    return (
        <MainCard title="Mattress Approval" secondary={
            <Button
            variant="contained"
            onClick={handleApproveMattresses}
            startIcon={<CheckIcon />}
            disabled={!selectedMattresses.length}
            sx={{
                backgroundColor: '#4CAF50',  // ✅ Material UI Green 500 - Balanced strong green
                color: '#FFFFFF',
                '&:hover': {
                backgroundColor: '#43A047',  // ✅ Green 600 - darker on hover
                }
            }}
            >
            Confirm Selection
            </Button>
        }>
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <div style={{ height: tableHeight, width: '100%' }}>
                    <DataGrid
                        rows={mattresses}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        checkboxSelection
                        disableRowSelectionOnClick
                        pagination
                        onRowSelectionModelChange={(newSelection) => setSelectedMattresses(newSelection)}
                        sx={{
                            '& .MuiTablePagination-root': { minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }
                        }}
                        components={{ Pagination: CustomPagination }}
                        initialState={{
                            columns: {
                                columnVisibilityModel: {
                                    order_commessa: false,  // ✅ Hidden by default
                                    fabric_type: false      // ✅ Hidden by default
                                }
                            }
                        }}
                    />
                </div>
            )}
        </MainCard>
    );
};

export default MattressApproval;
