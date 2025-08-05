import React, { useState, useEffect } from 'react';
import { Box, Paper, Table, TableBody, TableContainer, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { Print } from '@mui/icons-material';
import axios from 'utils/axiosInstance';

// project imports
import MainCard from 'ui-component/cards/MainCard';

// Order Components
import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';

// Mattress Components
import MattressGroupCardReadOnly from 'views/dashboard/OrderReport/MattressGroupCardReadOnly';
import PlannedQuantityBar from 'views/planning/OrderPlanning/components/PlannedQuantityBar';
import MattressTableHeaderWithSizes from './components/MattressTableHeaderWithSizes';
import MattressRowReadOnlyWithSizes from './components/MattressRowReadOnlyWithSizes';
import MattressActionRowReadOnly from 'views/dashboard/OrderReport/MattressActionRowReadOnly';

// Adhesive Components
import AdhesiveGroupCardReadOnly from 'views/dashboard/OrderReport/AdhesiveGroupCardReadOnly';
import AdhesiveTableHeaderReadOnly from 'views/dashboard/OrderReport/AdhesiveTableHeaderReadOnly';
import AdhesiveRowReadOnly from 'views/dashboard/OrderReport/AdhesiveRowReadOnly';
import AdhesiveActionRowReadOnly from 'views/dashboard/OrderReport/AdhesiveActionRowReadOnly';

// PadPrint Component
import PadPrintInfo from 'views/planning/OrderPlanning/components/PadPrintInfo';

// Hooks
import useSubcontractorOrderChange from './hooks/useSubcontractorOrderChange';
import usePadPrintInfo from 'views/planning/OrderPlanning/hooks/usePadPrintInfo';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';

// Print Utils
import { usePrintStyles, handlePrint, getAllDestinations, handleDestinationPrint } from 'views/planning/OrderPlanning/utils/printUtils';
import DestinationPrintDialog from 'views/planning/OrderPlanning/components/DestinationPrintDialog';
// Dynamic import to handle potential module resolution issues

const SubcontractorView = () => {
    // State for orders and selection
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedColorCode, setSelectedColorCode] = useState('');

    // Order sizes
    const [orderSizes, setOrderSizes] = useState([]);

    // Tables
    const [tables, setTables] = useState([]);
    const [adhesiveTables, setAdhesiveTables] = useState([]);

    // Print functionality
    const [openDestinationPrintDialog, setOpenDestinationPrintDialog] = useState(false);
    const [availableDestinations, setAvailableDestinations] = useState([]);

    // Hooks
    const { padPrintInfo, fetchPadPrintInfo, clearPadPrintInfo } = usePadPrintInfo();
    const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();

    // Italian ratios not needed for subcontractors

    // Sort sizes utility
    const sortSizes = (sizes) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        return sizes.sort((a, b) => {
            const indexA = sizeOrder.indexOf(a.size);
            const indexB = sizeOrder.indexOf(b.size);
            if (indexA === -1 && indexB === -1) return a.size.localeCompare(b.size);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    };

    // Planned quantities calculation
    const getTablePlannedQuantities = (table) => {
        const result = {};
        orderSizes.forEach(size => {
            result[size.size] = table.rows.reduce((sum, row) => {
                const pcsPerSize = parseFloat(row.piecesPerSize?.[size.size]) || 0;
                const layers = parseFloat(row.layers_a || row.layers) || 0;
                return sum + (pcsPerSize * layers);
            }, 0);
        });
        return result;
    };

    const getTablePlannedByBagno = (table) => {
        const bagnoMap = {};
        const bagnoOrder = []; // Track the order of bagno appearance

        // Safety check for invalid table
        if (!table || !table.rows) {
            console.warn('Invalid table passed to getTablePlannedByBagno:', table);
            return { bagnoMap, bagnoOrder };
        }

        table.rows.forEach(row => {
            const bagno = row.bagno || 'no bagno';

            // Initialize bagno entry if it doesn't exist and track order
            if (!bagnoMap[bagno]) {
                bagnoMap[bagno] = {};
                bagnoOrder.push(bagno); // Add to order list when first encountered
            }

            orderSizes.forEach(size => {
                if (!bagnoMap[bagno][size.size]) bagnoMap[bagno][size.size] = 0;
                const pcsPerSize = parseFloat(row.piecesPerSize?.[size.size]) || 0;
                const layers = parseFloat(row.layers_a || row.layers) || 0;
                bagnoMap[bagno][size.size] += pcsPerSize * layers;
            });
        });
        return { bagnoMap, bagnoOrder };
    };

    const getMetersByBagno = (table) => {
        const bagnoMeters = {};
        const bagnoOrder = []; // Track the order of bagno appearance

        table.rows.forEach(row => {
            const bagno = row.bagno || 'no bagno';
            const consumption = parseFloat(row.cons_actual || row.expectedConsumption) || 0;

            // Track order when first encountered
            if (!bagnoMeters.hasOwnProperty(bagno)) {
                bagnoOrder.push(bagno);
            }

            bagnoMeters[bagno] = (bagnoMeters[bagno] || 0) + consumption;
        });

        return { bagnoMeters, bagnoOrder };
    };

    // Consumption calculations not needed for read-only subcontractor view

    // Print styles
    usePrintStyles();

    // Get current user info
    const account = useSelector((state) => state.account);
    const currentUser = account?.user;
    const cuttingRoom = currentUser?.username; // Username = cutting room name

    // Order Change Handler
    const { onOrderChange } = useSubcontractorOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames: () => {}, // Not needed for subcontractor
        setSelectedStyle,
        setSelectedSeason,
        setSelectedColorCode,
        setSelectedProductionCenter: () => {}, // Not needed for subcontractor
        setSelectedCuttingRoom: () => {}, // Not needed for subcontractor
        setSelectedDestination: () => {}, // Not needed for subcontractor
        setProductionCenterCombinations: () => {}, // Not needed for subcontractor
        setShowProductionCenterFilter: () => {}, // Not needed for subcontractor
        setFilteredCuttingRoom: () => {}, // Not needed for subcontractor
        setFilteredDestination: () => {}, // Not needed for subcontractor
        setProductionCenterLoading: () => {}, // Not needed for subcontractor
        productionCenterCombinations: [], // Not needed for subcontractor
        fetchPadPrintInfo,
        fetchBrandForStyle,
        setTables,
        setAdhesiveTables,
        setAlongTables: () => {}, // Not needed for subcontractor
        setWeftTables: () => {}, // Not needed for subcontractor
        setMarkerOptions: () => {}, // Not needed for subcontractor
        sortSizes,
        clearBrand,
        clearPadPrintInfo,
        cuttingRoom // Pass the cutting room to filter mattresses
    });

    // Print handlers
    const handleEnhancedPrint = () => {
        const destinations = getAllDestinations(tables, adhesiveTables, [], [], []);

        if (destinations.length <= 1) {
            // Single or no destination - print normally
            handlePrint(tables, adhesiveTables, [], [], [], {}, () => {});
        } else {
            // Multiple destinations - show selection dialog
            setAvailableDestinations(destinations);
            setOpenDestinationPrintDialog(true);
        }
    };

    const handlePrintDestination = (selectedDestination) => {
        setOpenDestinationPrintDialog(false);
        handleDestinationPrint(selectedDestination, tables, adhesiveTables, [], [], [], {}, () => {});
    };

    const handlePrintAll = () => {
        setOpenDestinationPrintDialog(false);
        handlePrint(tables, adhesiveTables, [], [], [], {}, () => {});
    };

    // Handle individual mattress print
    const handlePrintMattress = async (row) => {
        try {
            // Dynamic import to handle potential module resolution issues
            const { default: printMattressBG } = await import('../import-print-tools/Print/printBG');
            // Convert row data to the format expected by printMattressBG
            const mattressData = {
                id: row.id,
                mattress: row.mattressName,
                order_commessa: selectedOrder?.id || '',
                fabric_code: tables.find(table => table.rows.some(r => r.id === row.id))?.fabricCode || '',
                fabric_color: tables.find(table => table.rows.some(r => r.id === row.id))?.fabricColor || '',
                dye_lot: row.bagno || '',
                spreading_method: tables.find(table => table.rows.some(r => r.id === row.id))?.spreadingMethod || '',
                table_id: tables.find(table => table.rows.some(r => r.id === row.id))?.id || '',
                details: [{
                    layers: row.layers,
                    cons_planned: row.expectedConsumption,
                    allowance: tables.find(table => table.rows.some(r => r.id === row.id))?.allowance || 0
                }],
                markers: [{
                    marker_name: row.markerName,
                    marker_width: row.width,
                    marker_length: row.markerLength,
                    efficiency: row.efficiency,
                    size_quantities: row.piecesPerSize || {}
                }]
            };

            // Call the print function with the single mattress
            await printMattressBG([mattressData], () => {
                // Refresh callback - could trigger a data refresh if needed
            });
        } catch (error) {
            alert('Error printing mattress. Please try again.');
        }
    };

    const handleCloseDestinationPrintDialog = () => {
        setOpenDestinationPrintDialog(false);
    };

    // Fetch orders assigned to this subcontractor's cutting room
    useEffect(() => {
        if (!cuttingRoom) {
            return;
        }

        // Get orders assigned to this cutting room via mattress production center
        axios.get(`/mattress/production_center/orders_by_cutting_room/${cuttingRoom}`)
            .then(ordersRes => {
                if (!ordersRes.data.success) {
                    return;
                }

                // Convert order IDs to order objects for the dropdown
                const assignedOrderIds = ordersRes.data.data || [];

                // Create order objects with just the order ID for now
                // We'll fetch the full order details when an order is selected
                const ordersArray = assignedOrderIds.map(item => ({
                    id: item.order_commessa,
                    style: '', // Will be populated when order is selected
                    season: '', // Will be populated when order is selected
                    colorCode: '', // Will be populated when order is selected
                    sizes: [] // Will be populated when order is selected
                }));

                setOrders(ordersArray);
            })
            .catch(error => {
                // Fallback to all mattress orders if the specific endpoint fails
                axios.get('/mattress/order_ids')
                    .then(mattressRes => {
                        if (mattressRes.data.success) {
                            const mattressOrderIds = mattressRes.data.data || [];
                            const ordersArray = mattressOrderIds.map(item => ({
                                id: item.order_commessa,
                                style: '',
                                season: '',
                                colorCode: '',
                                sizes: []
                            }));
                            setOrders(ordersArray);
                        }
                    })
                    .catch(fallbackError => {
                        // Silent fallback failure
                    });
            });
    }, [cuttingRoom]);

    return (
        <>
            {/* Order Bar */}
            <MainCard
                title="Order Mattress Plan"
                sx={{ position: 'relative' }}
            >
                {/* Print Button */}
                {selectedOrder && (
                    <Box sx={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleEnhancedPrint}
                            startIcon={<Print />}
                            sx={{
                                height: '36px', // Smaller button height
                                fontSize: '0.875rem'
                            }}
                        >
                            Print
                        </Button>
                    </Box>
                )}



                {/* Order Toolbar - Direct order selection without style filtering */}
                <OrderToolbar
                    styleOptions={[]} // No style filtering for subcontractors
                    selectedStyle={selectedStyle}
                    onStyleChange={() => {}} // No style change handler needed
                    orderOptions={orders} // Show all orders directly
                    selectedOrder={selectedOrder}
                    onOrderChange={onOrderChange}
                    selectedSeason={selectedSeason}
                    selectedBrand={brand}
                    selectedColorCode={selectedColorCode}
                />

                {/* Order Quantities Section */}
                <OrderQuantities orderSizes={orderSizes} italianRatios={{}} />
            </MainCard>

            {/* Pad Print Info */}
            {padPrintInfo && (
                <Box mt={2}>
                    <PadPrintInfo padPrintInfo={padPrintInfo} />
                </Box>
            )}

            {/* Mattress Tables Section */}
            {tables.length > 0 && tables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {`Mattresses`}
                                <PlannedQuantityBar
                                    table={table}
                                    orderSizes={orderSizes}
                                    getTablePlannedQuantities={getTablePlannedQuantities}
                                    getTablePlannedByBagno={getTablePlannedByBagno}
                                    getMetersByBagno={getMetersByBagno}
                                    showHelpers={false}
                                />
                            </Box>
                        }
                    >
                    <MattressGroupCardReadOnly table={table} />

                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <MattressTableHeaderWithSizes orderSizes={orderSizes} />
                                    <TableBody>
                                        {table.rows.map((row) => (
                                            <MattressRowReadOnlyWithSizes
                                            key={row.id}
                                            row={row}
                                            orderSizes={orderSizes}
                                            onPrintMattress={handlePrintMattress}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <MattressActionRowReadOnly table={table} />
                        </Box>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Adhesive Tables Section */}
            {adhesiveTables.length > 0 && adhesiveTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {`Adhesives`}
                                <PlannedQuantityBar
                                    table={table}
                                    orderSizes={orderSizes}
                                    getTablePlannedQuantities={getTablePlannedQuantities}
                                    getTablePlannedByBagno={getTablePlannedByBagno}
                                    getMetersByBagno={getMetersByBagno}
                                    showHelpers={false}
                                />
                            </Box>
                        }
                    >
                    <AdhesiveGroupCardReadOnly table={table} />

                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <AdhesiveTableHeaderReadOnly orderSizes={orderSizes} />
                                    <TableBody>
                                        {table.rows.map((row) => (
                                            <AdhesiveRowReadOnly
                                            key={row.id}
                                            row={row}
                                            orderSizes={orderSizes}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <AdhesiveActionRowReadOnly table={table} />
                        </Box>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Destination Print Dialog */}
            <DestinationPrintDialog
                open={openDestinationPrintDialog}
                onClose={handleCloseDestinationPrintDialog}
                destinations={availableDestinations}
                onPrintDestination={handlePrintDestination}
                onPrintAll={handlePrintAll}
            />
        </>
    );
};

export default SubcontractorView;
