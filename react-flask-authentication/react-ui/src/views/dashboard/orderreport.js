import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Backdrop, CircularProgress } from '@mui/material';
import { AddCircleOutline, DeleteOutline, Save, Print } from '@mui/icons-material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { useSelector } from "react-redux";

// Order Planning Components
import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';

// Production Center Components
import ProductionCenterTabs from 'views/dashboard/OrderReport/ProductionCenterTabs';

// Pad Print Components
import PadPrintInfo from 'views/planning/OrderPlanning/components/PadPrintInfo';

// Style Comment Component (Read-only)
import StyleCommentCardReadOnly from 'views/subcontractor/components/StyleCommentCardReadOnly';

// Order Comment Component (Read-only)
import OrderCommentCardReadOnly from 'views/dashboard/OrderReport/components/OrderCommentCardReadOnly';

// Print Utils
import { useOrderReportPrintStyles, handleOrderReportPrint } from 'views/dashboard/OrderReport/printUtils';

// Mattress Components
import MattressGroupCardReadOnly from 'views/dashboard/OrderReport/MattressGroupCardReadOnly';
import PlannedQuantityBar from 'views/planning/OrderPlanning/components/PlannedQuantityBar';
import MattressTableHeader from 'views/dashboard/OrderReport/MattressTableHeader';
import MattressRowReadOnly from 'views/dashboard/OrderReport/MattressRowReadOnly';
import MattressActionRowReadOnly from 'views/dashboard/OrderReport/MattressActionRowReadOnly';

// Adhesive Components
import AdhesiveGroupCardReadOnly from 'views/dashboard/OrderReport/AdhesiveGroupCardReadOnly';
import AdhesiveTableHeaderReadOnly from 'views/dashboard/OrderReport/AdhesiveTableHeaderReadOnly';
import AdhesiveRowReadOnly from 'views/dashboard/OrderReport/AdhesiveRowReadOnly';
import AdhesiveActionRowReadOnly from 'views/dashboard/OrderReport/AdhesiveActionRowReadOnly';

// Along Components (Read-Only)
import AlongGroupCardReadOnly from 'views/dashboard/OrderReport/AlongGroupCardReadOnly';
import AlongTableHeaderReadOnly from 'views/dashboard/OrderReport/AlongTableHeaderReadOnly';
import AlongRowReadOnly from 'views/dashboard/OrderReport/AlongRowReadOnly';
import AlongActionRowReadOnly from 'views/dashboard/OrderReport/AlongActionRowReadOnly';

// Weft Components (Read-Only)
import WeftGroupCardReadOnly from 'views/dashboard/OrderReport/WeftGroupCardReadOnly';
import WeftTableHeaderReadOnly from 'views/dashboard/OrderReport/WeftTableHeaderReadOnly';
import WeftRowReadOnly from 'views/dashboard/OrderReport/WeftRowReadOnly';
import WeftActionRowReadOnly from 'views/dashboard/OrderReport/WeftActionRowReadOnly';

// Bias Components (Read-Only)
import BiasGroupCardReadOnly from 'views/dashboard/OrderReport/BiasGroupCardReadOnly';
import BiasTableHeaderReadOnly from 'views/dashboard/OrderReport/BiasTableHeaderReadOnly';
import BiasRowReadOnly from 'views/dashboard/OrderReport/BiasRowReadOnly';
import BiasActionRowReadOnly from 'views/dashboard/OrderReport/BiasActionRowReadOnly';

// Weft Components
import WeftGroupCard from 'views/planning/OrderPlanning/components/WeftGroupCard';
import WeftTableHeader from 'views/planning/OrderPlanning/components/WeftTableHeader';
import WeftRow from 'views/planning/OrderPlanning/components/WeftRow';
import WeftActionRow from 'views/planning/OrderPlanning/components/WeftActionRow';

// Hooks
import useItalianRatios from 'views/planning/OrderPlanning/hooks/useItalianRatios';
import usePadPrintInfo from 'views/planning/OrderPlanning/hooks/usePadPrintInfo';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';
import useHandleOrderChange from 'views/dashboard/OrderReport/useHandleOrderChange';
import useAvgConsumption from 'views/planning/OrderPlanning/hooks/useAvgConsumption';

// Utils
import { getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno } from 'views/dashboard/OrderReport/plannedQuantities';
import { sortSizes } from 'views/planning/OrderPlanning/utils/sortSizes';

const OrderReport = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const [orderOptions, setOrderOptions] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [styleOptions, setStyleOptions] = useState([]);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [selectedSeason, setSelectedSeason] = useState("");
    const [selectedColorCode, setSelectedColorCode] = useState("");
    const [orderSizes, setOrderSizes] = useState([]); // ✅ Stores full objects (for qty display)
    const [orderSizeNames, setOrderSizeNames] = useState([]); // ✅ Stores only size names (for table columns)
    const [markerOptions, setMarkerOptions] = useState([]);

    const [styleTouched, setStyleTouched] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [openError, setOpenError] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [openSuccess, setOpenSuccess] = useState(false);

    // Italian Ratio
    const italianRatios = useItalianRatios(selectedOrder);

    // Fetch Pad Print
    const { padPrintInfo, fetchPadPrintInfo, clearPadPrintInfo } = usePadPrintInfo();

    // Fetch Brand
    const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();

    // Production Center state
    const [selectedProductionCenter, setSelectedProductionCenter] = useState('');
    const [selectedCuttingRoom, setSelectedCuttingRoom] = useState('');
    const [selectedDestination, setSelectedDestination] = useState('');

    // Production Center Configuration state
    const [productionCenterCombinations, setProductionCenterCombinations] = useState([]);
    const [showProductionCenterTabs, setShowProductionCenterTabs] = useState(false);
    const [selectedCombination, setSelectedCombination] = useState(null);
    const [productionCenterLoading, setProductionCenterLoading] = useState(false);

    // Pin Order Planning Card
    const [isPinned, setIsPinned] = useState(false);

    // Breadcrumb navigation state - initialize from URL parameter
    const [selectedBreadcrumb, setSelectedBreadcrumb] = useState(() => {
        const urlParams = new URLSearchParams(location.search);
        const typeParam = urlParams.get('type');
        return typeParam === 'closed' ? 'closed' : 'open';
    });
    const [orderListLoading, setOrderListLoading] = useState(false); // For loading order list (no backdrop)
    const [orderDataLoading, setOrderDataLoading] = useState(false); // For loading specific order data (with backdrop)

    // User
    const username = useSelector((state) => state.account?.user?.username) || "Unknown";



    // Listen for URL parameter changes (when navigating via sidebar)
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const typeParam = urlParams.get('type');
        const newBreadcrumb = typeParam === 'closed' ? 'closed' : 'open';
        if (newBreadcrumb !== selectedBreadcrumb) {
            setSelectedBreadcrumb(newBreadcrumb);

            // Stop any loading when switching order types
            setOrderDataLoading(false);

            // Clear all state when switching between order types
            setSelectedOrder(null);
            setSelectedStyle("");
            setSelectedSeason("");
            setSelectedColorCode("");
            setOrderSizes([]);
            setOrderSizeNames([]);
            setMarkerOptions([]);
            setTables([]);
            setAdhesiveTables([]);
            setAlongTables([]);
            setWeftTables([]);
            setBiasTables([]);

            // Clear other related state
            clearPadPrintInfo();
            clearBrand();

            console.log(`🔄 Switched to ${newBreadcrumb} orders - state cleared`);
        }
    }, [location.search, selectedBreadcrumb, clearPadPrintInfo, clearBrand]);

    // Tables (all loaded, visibility controlled by selectedCombination)
    const [tables, setTables] = useState([]);
    const [adhesiveTables, setAdhesiveTables] = useState([]);
    const [alongTables, setAlongTables] = useState([]);
    const [weftTables, setWeftTables] = useState([]);
    const [biasTables, setBiasTables] = useState([]);

    // Order Change
    const { onOrderChange, cancelPendingRequests } = useHandleOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames,
        setSelectedStyle,
        setSelectedSeason,
        setSelectedColorCode,
        setSelectedProductionCenter,
        setSelectedCuttingRoom,
        setSelectedDestination,
        setSelectedCombination,
        setProductionCenterCombinations,
        setShowProductionCenterTabs,
        setProductionCenterLoading,
        setOrderDataLoading, // Add order data loading state
        productionCenterCombinations,
        fetchPadPrintInfo,
        fetchBrandForStyle,
        setTables,
        setAdhesiveTables,
        setAlongTables,
        setWeftTables,
        setBiasTables,
        setMarkerOptions,
        sortSizes,
        clearBrand,
        clearPadPrintInfo
    });

    // Cleanup effect - only on component unmount
    useEffect(() => {
        return () => {
            console.log('🧹 Component unmount - cancelling pending requests');
            cancelPendingRequests();
            setOrderDataLoading(false);
        };
    }, []); // Empty dependency array - only run on unmount

    // Average Consumption per table
    const avgConsumption = useAvgConsumption(tables, getTablePlannedQuantities);

    // Print Styles
    useOrderReportPrintStyles();

    // Enhanced classification using order lines status + mattress completion
    const classifyOrders = (allOrderLines, mattressCompletionData) => {
        const openOrders = [];
        const closedOrders = [];

        // Group by order_commessa and determine status
        const ordersMap = new Map();

        allOrderLines.forEach(row => {
            const orderId = row.order_commessa;

            if (!ordersMap.has(orderId)) {
                ordersMap.set(orderId, {
                    id: orderId,
                    style: row.style,
                    season: row.season,
                    colorCode: row.color_code,
                    status: row.status,
                    sizes: []
                });
            }

            ordersMap.get(orderId).sizes.push({
                size: row.size,
                qty: parseFloat(row.quantity.toString().replace(",", "")) || 0
            });
        });

        // Create mattress completion map
        const completionMap = new Map();
        (mattressCompletionData || []).forEach(item => {
            completionMap.set(item.order_commessa, item.is_completed);
        });

        // Convert to array and sort sizes
        const allOrders = Array.from(ordersMap.values()).map(order => ({
            ...order,
            sizes: sortSizes(order.sizes || []),
            // Add completion status for open orders
            isFinished: order.status === 3 ? (completionMap.get(order.id) === true) : false
        }));

        // Classify based on status
        allOrders.forEach(order => {
            if (order.status === 3) {
                openOrders.push(order); // Status 3 = Open orders (may have isFinished flag)
            } else {
                closedOrders.push(order); // Other statuses = Closed orders
            }
        });

        return { openOrders, closedOrders, allOrders };
    };

    // Fetch order data with mattress completion status
    useEffect(() => {
        setOrderListLoading(true);
        Promise.all([
            axios.get('/orders/order_lines'), // Get all order lines with status
            axios.get('/mattress/order_ids'),  // Get orders that have mattresses
            axios.get('/mattress/orders_completion_status') // Get mattress completion status
        ])
            .then(([ordersRes, mattressRes, completionRes]) => {
            if (!ordersRes.data.success || !mattressRes.data.success) {
                console.error("Failed to fetch order or mattress data");
                return;
            }

            const mattressOrderIds = new Set(
                (mattressRes.data.data || []).map(item => item.order_commessa)
            );

            // Filter order lines to only include orders that have mattresses
            const filteredOrderLines = ordersRes.data.data.filter(row =>
                mattressOrderIds.has(row.order_commessa)
            );

            // Get completion data (handle case where endpoint might not exist yet)
            const completionData = completionRes?.data?.success ? completionRes.data.data : [];

            // Classify orders based on status + mattress completion
            const { openOrders, closedOrders, allOrders } = classifyOrders(filteredOrderLines, completionData);

            // Debug logging
            console.log('📊 Order Classification Debug:');
            console.log('Total orders with mattresses:', allOrders.length);
            console.log('Open orders (status=3):', openOrders.length);
            console.log('- Open orders that are finished:', openOrders.filter(o => o.isFinished).length);
            console.log('Closed orders (status≠3):', closedOrders.length);

            // Store both classifications
            setOrderOptions({ open: openOrders, closed: closedOrders, all: allOrders });

            const uniqueStyles = [
                ...new Set(allOrders.map(order => order.style).filter(Boolean))
            ];
            setStyleOptions(uniqueStyles);
        })
        .catch(error => {
            console.error("Error fetching filtered order data:", error);
        })
        .finally(() => {
            setOrderListLoading(false);
        });
    }, []); // Run only once on component mount


    // Get orders based on breadcrumb selection
    const getOrdersByBreadcrumb = () => {
        if (!orderOptions || typeof orderOptions !== 'object') return [];

        let orders = [];
        if (selectedBreadcrumb === 'open') {
            orders = orderOptions.open || [];
        } else if (selectedBreadcrumb === 'closed') {
            orders = orderOptions.closed || [];
        } else {
            orders = orderOptions.all || [];
        }

        return selectedStyle ? orders.filter(order => order.style === selectedStyle) : orders;
    };

    const filteredOrders = getOrdersByBreadcrumb();

    // Fetch marker data from Flask API
    useEffect(() => {
        if (!selectedOrder) return;  // ✅ Do nothing if no order is selected



        axios.get(`/markers/marker_headers_planning`, {
            params: {
              style: selectedStyle,
              sizes: orderSizeNames.join(',')
            }
          })  // ✅ Fetch only when order changes
            .then((response) => {

                if (response.data.success) {
                    setMarkerOptions(response.data.data);  // ✅ Update markers only when order changes
                } else {
                    console.error("Failed to fetch markers");
                }
            })
            .catch((error) => console.error("Error fetching marker data:", error));
    }, [selectedOrder]); // ✅ Runs only when order changes

    // Handle Style Change
    const handleStyleChange = (newStyle, touched = false) => {
        setStyleTouched(touched);

        if (touched) {
          onOrderChange(null); // ✅ This resets everything already
          setTimeout(() => {
            setSelectedStyle(newStyle);
          }, 0);
        } else {
          setSelectedStyle(newStyle);
        }
      };


    // Filter tables based on selected production center combination (like Order Planning)
    const getFilteredTables = (allTables, selectedCombination) => {
        if (!selectedCombination) return allTables; // Show all if no combination selected

        return allTables.filter(table => {
            // Show tables that match the selected combination
            const matchesSelectedCombination = (
                table.productionCenter === selectedCombination.production_center &&
                table.cuttingRoom === selectedCombination.cutting_room &&
                table.destination === selectedCombination.destination
            );

            // Show tables that don't have production center data yet
            const hasNoProductionCenter = (
                !table.productionCenter &&
                !table.cuttingRoom &&
                !table.destination
            );



            return matchesSelectedCombination || hasNoProductionCenter;
        });
    };

    // Create filtered arrays based on selected combination
    const filteredTables = getFilteredTables(tables, selectedCombination);
    const filteredAdhesiveTables = getFilteredTables(adhesiveTables, selectedCombination);
    const filteredAlongTables = getFilteredTables(alongTables, selectedCombination);
    const filteredWeftTables = getFilteredTables(weftTables, selectedCombination);
    const filteredBiasTables = getFilteredTables(biasTables, selectedCombination);



    // Production Center Configuration Handler (for tabs)
    const handleCombinationChange = (combination) => {
        if (!combination) return;

        console.log('🔄 Production center combination changed:', combination);
        setSelectedCombination(combination);

        // Update production center display info
        setSelectedProductionCenter(combination.production_center || '');
        setSelectedCuttingRoom(combination.cutting_room);
        setSelectedDestination(combination.destination);
    };



    // Handle changing production center selection (now just shows tabs again)
    const handleChangeSelection = () => {
        // Reset production center info
        setSelectedProductionCenter('');
        setSelectedCuttingRoom('');
        setSelectedDestination('');
        setSelectedCombination(null);

        // Clear tables
        setTables([]);
        setAdhesiveTables([]);
        setAlongTables([]);
        setWeftTables([]);
        setBiasTables([]);

        // Show tabs again
        setShowProductionCenterTabs(true);
    };

    return (
        <>
            {/* Loading Overlay - Only for order data loading */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }}
                open={orderDataLoading}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress color="primary" />
                    <Box sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                        Loading order data...
                    </Box>
                </Box>
            </Backdrop>


                {/* Order Bar */}
            <Box
                sx={{
                    position: isPinned ? 'sticky' : 'relative',
                    top: isPinned ? 85 : 'auto',
                    zIndex: isPinned ? 1000 : 'auto',
                }}
            >
                <MainCard
                    title={
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                            {t('orderPlanning.orderDetails', 'Order Details')}
                            {selectedOrder && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleOrderReportPrint(tables, adhesiveTables, alongTables, weftTables, biasTables)}
                                    startIcon={<Print />}
                                    sx={{
                                        fontSize: '0.875rem',
                                        py: 0.75,
                                        px: 2,
                                        minHeight: '36px'
                                    }}
                                >
                                    {t('orderPlanning.print', 'Print')}
                                </Button>
                            )}
                        </Box>
                    }
                >

                    {/* Order Toolbar */}
                    <OrderToolbar
                        styleOptions={styleOptions}
                        selectedStyle={selectedStyle}
                        onStyleChange={handleStyleChange}
                        orderOptions={filteredOrders}
                        selectedOrder={selectedOrder}
                        onOrderChange={onOrderChange}
                        selectedSeason={selectedSeason}
                        selectedBrand={brand}
                        selectedColorCode={selectedColorCode}
                    />

                    {/* Order Quantities Section - Hide during printing if multiple destinations */}
                    <Box className={productionCenterCombinations.length > 1 ? 'hide-order-quantities-print' : ''}>
                        <OrderQuantities orderSizes={orderSizes} italianRatios={italianRatios} />
                    </Box>

                </MainCard>
            </Box>



            {/* Pad Print and Style Comment Section - Side by Side */}
            {(selectedOrder || selectedStyle) && (
                <Box display="flex" gap={2} mt={2} alignItems="stretch">
                    {/* Pad Print Section - Left Half */}
                    <Box flex={1} display="flex">
                        {padPrintInfo && (
                            <PadPrintInfo padPrintInfo={padPrintInfo} />
                        )}
                    </Box>

                    {/* Style Comment Section - Right Half */}
                    <Box flex={1} display="flex">
                        {selectedStyle && (
                            <StyleCommentCardReadOnly
                                selectedStyle={selectedStyle}
                            />
                        )}
                    </Box>
                </Box>
            )}

            <Box mt={2} />

            {/* Production Center Configuration */}
            {selectedOrder && showProductionCenterTabs && (
                <>
                    <ProductionCenterTabs
                        combinations={productionCenterCombinations}
                        selectedCombination={selectedCombination}
                        onCombinationChange={handleCombinationChange}
                        loading={orderDataLoading}
                    />

                    <Box mt={2} />
                </>
            )}



            {/* Mattress Group Section */}
            {filteredTables.length > 0 && filteredTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   {/* ✅ Add spacing before every table except the first one */}
                   {tableIndex > 0 && <Box mt={2} />}
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {t('orderPlanning.mattresses', 'Mattresses')}

                                {/* Table-Specific Planned Quantities - Hide if Empty */}
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

                    <MattressGroupCardReadOnly
                        table={table}
                    />

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <MattressTableHeader orderSizes={orderSizes} />
                                    <TableBody>
                                        {(() => {
                                            // Group rows by bagno and sort by sequence number (last part of ID: 001, 002, 003) within each group
                                            const sortedRows = [...table.rows].sort((a, b) => {
                                                const bagnoA = a.bagno || '';
                                                const bagnoB = b.bagno || '';

                                                // If bagnos are different, sort by the sequence number of the first mattress in each bagno
                                                if (bagnoA !== bagnoB) {
                                                    // Find the first mattress in each bagno group and compare their sequence numbers
                                                    const firstMattressA = table.rows.find(row => (row.bagno || '') === bagnoA);
                                                    const firstMattressB = table.rows.find(row => (row.bagno || '') === bagnoB);

                                                    const sequenceA = firstMattressA ? parseInt(firstMattressA.sequenceNumber) || 0 : 0;
                                                    const sequenceB = firstMattressB ? parseInt(firstMattressB.sequenceNumber) || 0 : 0;

                                                    return sequenceA - sequenceB;
                                                }

                                                // If same bagno, sort by sequence number (final part of mattress ID: 001, 002, 003)
                                                const sequenceA = parseInt(a.sequenceNumber) || 0;
                                                const sequenceB = parseInt(b.sequenceNumber) || 0;
                                                return sequenceA - sequenceB;
                                            });

                                            return sortedRows.map((row) => (
                                                <MattressRowReadOnly
                                                key={row.id}
                                                row={row}
                                                orderSizes={orderSizes}
                                                />
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Action Row: Avg Consumption + Buttons aligned horizontally */}
                            <MattressActionRowReadOnly
                                table={table}
                            />

                        </Box>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Adhesive Tables Section */}
            {filteredAdhesiveTables.length > 0 && filteredAdhesiveTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {t('orderPlanning.adhesives', 'Adhesives')}

                                {/* Table-Specific Planned Quantities - Hide if Empty */}
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

                    <AdhesiveGroupCardReadOnly
                        table={table}
                    />

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <AdhesiveTableHeaderReadOnly orderSizes={orderSizes} />
                                    <TableBody>
                                        {(() => {
                                            // Group rows by bagno and sort by sequence number (last part of ID: 001, 002, 003) within each group
                                            const sortedRows = [...table.rows].sort((a, b) => {
                                                const bagnoA = a.bagno || '';
                                                const bagnoB = b.bagno || '';

                                                // If bagnos are different, sort by the sequence number of the first mattress in each bagno
                                                if (bagnoA !== bagnoB) {
                                                    // Find the first mattress in each bagno group and compare their sequence numbers
                                                    const firstMattressA = table.rows.find(row => (row.bagno || '') === bagnoA);
                                                    const firstMattressB = table.rows.find(row => (row.bagno || '') === bagnoB);

                                                    const sequenceA = firstMattressA ? parseInt(firstMattressA.sequenceNumber) || 0 : 0;
                                                    const sequenceB = firstMattressB ? parseInt(firstMattressB.sequenceNumber) || 0 : 0;

                                                    return sequenceA - sequenceB;
                                                }

                                                // If same bagno, sort by sequence number (final part of mattress ID: 001, 002, 003)
                                                const sequenceA = parseInt(a.sequenceNumber) || 0;
                                                const sequenceB = parseInt(b.sequenceNumber) || 0;
                                                return sequenceA - sequenceB;
                                            });

                                            return sortedRows.map((row) => (
                                                <AdhesiveRowReadOnly
                                                key={row.id}
                                                row={row}
                                                orderSizes={orderSizes}
                                                />
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Action Row: Avg Consumption + Buttons aligned horizontally */}
                            <AdhesiveActionRowReadOnly
                                table={table}
                            />

                        </Box>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Along Tables Section */}
            {filteredAlongTables.length > 0 && filteredAlongTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>

                    <Box mt={2} />
                    
                    <MainCard data-table-id={table.id} title={t('orderPlanning.collarettoAlongTheGrain', 'Collaretto Along the Grain')}>
                        <AlongGroupCardReadOnly table={table} />

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <AlongTableHeaderReadOnly />
                                    <TableBody>
                                        {(() => {
                                            // Group rows by bagno and sort by sequence number (last part of ID: 001, 002, 003) within each group
                                            const sortedRows = [...table.rows].sort((a, b) => {
                                                const bagnoA = a.bagno || '';
                                                const bagnoB = b.bagno || '';

                                                // If bagnos are different, sort by the sequence number of the first collaretto in each bagno
                                                if (bagnoA !== bagnoB) {
                                                    // Find the first collaretto in each bagno group and compare their sequence numbers
                                                    const firstCollarettoA = table.rows.find(row => (row.bagno || '') === bagnoA);
                                                    const firstCollarettoB = table.rows.find(row => (row.bagno || '') === bagnoB);

                                                    const sequenceA = firstCollarettoA ? parseInt(firstCollarettoA.sequenceNumber) || 0 : 0;
                                                    const sequenceB = firstCollarettoB ? parseInt(firstCollarettoB.sequenceNumber) || 0 : 0;

                                                    return sequenceA - sequenceB;
                                                }

                                                // If same bagno, sort by sequence number (final part of collaretto ID: 001, 002, 003)
                                                const sequenceA = parseInt(a.sequenceNumber) || 0;
                                                const sequenceB = parseInt(b.sequenceNumber) || 0;
                                                return sequenceA - sequenceB;
                                            });

                                            return sortedRows.map((row) => (
                                                <AlongRowReadOnly
                                                key={row.id}
                                                row={row}
                                                />
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <AlongActionRowReadOnly table={table} />

                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Weft Tables Section */}
            {filteredWeftTables.length > 0 && filteredWeftTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={t('orderPlanning.collarettoInWeft', 'Collaretto in Weft')}
                    >
                    <WeftGroupCardReadOnly table={table} />

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <WeftTableHeaderReadOnly />
                                    <TableBody>
                                        {(() => {
                                            // Group rows by bagno and sort by sequence number (last part of ID: 001, 002, 003) within each group
                                            const sortedRows = [...table.rows].sort((a, b) => {
                                                const bagnoA = a.bagno || '';
                                                const bagnoB = b.bagno || '';

                                                // If bagnos are different, sort by the sequence number of the first collaretto in each bagno
                                                if (bagnoA !== bagnoB) {
                                                    // Find the first collaretto in each bagno group and compare their sequence numbers
                                                    const firstCollarettoA = table.rows.find(row => (row.bagno || '') === bagnoA);
                                                    const firstCollarettoB = table.rows.find(row => (row.bagno || '') === bagnoB);

                                                    const sequenceA = firstCollarettoA ? parseInt(firstCollarettoA.sequenceNumber) || 0 : 0;
                                                    const sequenceB = firstCollarettoB ? parseInt(firstCollarettoB.sequenceNumber) || 0 : 0;

                                                    return sequenceA - sequenceB;
                                                }

                                                // If same bagno, sort by sequence number (final part of collaretto ID: 001, 002, 003)
                                                const sequenceA = parseInt(a.sequenceNumber) || 0;
                                                const sequenceB = parseInt(b.sequenceNumber) || 0;
                                                return sequenceA - sequenceB;
                                            });

                                            return sortedRows.map((row) => (
                                                <WeftRowReadOnly
                                                key={row.id}
                                                row={row}
                                                />
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <WeftActionRowReadOnly table={table} />

                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Bias Tables Section */}
            {filteredBiasTables.length > 0 && filteredBiasTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={t('orderPlanning.collarettoBiasGrain', 'Collaretto Bias')}
                    >
                    <BiasGroupCardReadOnly table={table} />

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <BiasTableHeaderReadOnly />
                                    <TableBody>
                                        {(() => {
                                            // Group rows by bagno and sort by sequence number (last part of ID: 001, 002, 003) within each group
                                            const sortedRows = [...table.rows].sort((a, b) => {
                                                const bagnoA = a.bagno || '';
                                                const bagnoB = b.bagno || '';

                                                // If bagnos are different, sort by the sequence number of the first collaretto in each bagno
                                                if (bagnoA !== bagnoB) {
                                                    // Find the first collaretto in each bagno group and compare their sequence numbers
                                                    const firstCollarettoA = table.rows.find(row => (row.bagno || '') === bagnoA);
                                                    const firstCollarettoB = table.rows.find(row => (row.bagno || '') === bagnoB);

                                                    const sequenceA = firstCollarettoA ? parseInt(firstCollarettoA.sequenceNumber) || 0 : 0;
                                                    const sequenceB = firstCollarettoB ? parseInt(firstCollarettoB.sequenceNumber) || 0 : 0;

                                                    return sequenceA - sequenceB;
                                                }

                                                // If same bagno, sort by sequence number (final part of collaretto ID: 001, 002, 003)
                                                const sequenceA = parseInt(a.sequenceNumber) || 0;
                                                const sequenceB = parseInt(b.sequenceNumber) || 0;
                                                return sequenceA - sequenceB;
                                            });

                                            return sortedRows.map((row) => (
                                                <BiasRowReadOnly
                                                key={row.id}
                                                row={row}
                                                />
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <BiasActionRowReadOnly table={table} />

                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Order Comment Section - Display at the end */}
            {selectedOrder && showProductionCenterTabs && selectedCombination && (
                <Box mt={3}>
                    <OrderCommentCardReadOnly
                        selectedOrder={selectedOrder}
                        selectedCombination={selectedCombination}
                    />
                </Box>
            )}

            {/* Order Comment for orders without production centers (backward compatibility) */}
            {selectedOrder && !showProductionCenterTabs && (
                <Box mt={3}>
                    <OrderCommentCardReadOnly
                        selectedOrder={selectedOrder}
                        selectedCombination={null}
                    />
                </Box>
            )}

            {/* Error Snackbar
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

            {/* ✅ Success Message Snackbar
            <Snackbar
                open={openSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%', padding: "12px 16px", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }}>
                    {successMessage}
                </Alert>
            </Snackbar>*/}

        </>
    );
};

export default OrderReport;