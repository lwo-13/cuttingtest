import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { AddCircleOutline, DeleteOutline, Save, Print } from '@mui/icons-material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { useSelector } from "react-redux";

// Order Planning Components
import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';

// Cutting Room Info
import CuttingRoomInfo from 'views/dashboard/OrderReport/CuttingRoomInfo';
import ProductionCenterFilter from 'views/dashboard/OrderReport/ProductionCenterFilter';

// Pad Print Components
import PadPrintInfo from 'views/planning/OrderPlanning/components/PadPrintInfo';

// Style Comment Component (Read-only)
import StyleCommentCardReadOnly from 'views/subcontractor/components/StyleCommentCardReadOnly';

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

    // Production Center Filter state
    const [productionCenterCombinations, setProductionCenterCombinations] = useState([]);
    const [showProductionCenterFilter, setShowProductionCenterFilter] = useState(false);
    const [filteredCuttingRoom, setFilteredCuttingRoom] = useState(null);
    const [filteredDestination, setFilteredDestination] = useState(null);
    const [filterLoading, setFilterLoading] = useState(false);
    const [productionCenterLoading, setProductionCenterLoading] = useState(false);

    // Pin Order Planning Card
    const [isPinned, setIsPinned] = useState(false);

    // User
    const username = useSelector((state) => state.account?.user?.username) || "Unknown";

    // Tables
    const [tables, setTables] = useState([]);
    const [adhesiveTables, setAdhesiveTables] = useState([]);
    const [alongTables, setAlongTables] = useState([]);
    const [weftTables, setWeftTables] = useState([]);
    const [biasTables, setBiasTables] = useState([]);

    // Order Change
    const { onOrderChange, fetchMattressData } = useHandleOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames,
        setSelectedStyle,
        setSelectedSeason,
        setSelectedColorCode,
        setSelectedProductionCenter,
        setSelectedCuttingRoom,
        setSelectedDestination,
        setProductionCenterCombinations,
        setShowProductionCenterFilter,
        setFilteredCuttingRoom,
        setFilteredDestination,
        setProductionCenterLoading,
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


    // Average Consumption per table
    const avgConsumption = useAvgConsumption(tables, getTablePlannedQuantities);

    // Print Styles
    useOrderReportPrintStyles();

    // Fetch order data
    useEffect(() => {
        Promise.all([
            axios.get('/orders/order_lines'),
            axios.get('/mattress/order_ids')
        ])
            .then(([ordersRes, mattressRes]) => {
            if (!ordersRes.data.success || !mattressRes.data.success) {
                console.error("Failed to fetch order or mattress data");
                return;
            }

            const mattressOrderIds = new Set(
                (mattressRes.data.data || []).map(item => item.order_commessa)
            );

            const ordersMap = new Map();

            ordersRes.data.data.forEach(row => {
                const orderId = row.order_commessa;

                if (mattressOrderIds.has(orderId)) {
                if (!ordersMap.has(orderId)) {
                    ordersMap.set(orderId, {
                    id: orderId,
                    style: row.style,
                    season: row.season,
                    colorCode: row.color_code,
                    sizes: []
                    });
                }

                ordersMap.get(orderId).sizes.push({
                    size: row.size,
                    qty: parseFloat(row.quantity.toString().replace(",", "")) || 0
                });
                }
            });

            const sortedOrders = Array.from(ordersMap.values()).map(order => ({
                ...order,
                sizes: sortSizes(order.sizes || [])
            }));

            setOrderOptions(sortedOrders);

            const uniqueStyles = [
                ...new Set(sortedOrders.map(order => order.style).filter(Boolean))
            ];
            setStyleOptions(uniqueStyles);
        })
        .catch(error => {
            console.error("Error fetching filtered order data:", error);
        });
    }, []);


    const filteredOrders = selectedStyle
        ? orderOptions.filter(order => order.style === selectedStyle)
        : orderOptions;

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

    // Production Center Filter Handlers
    const handleApplyFilter = async () => {
        if (!selectedOrder) return;

        // Use filtered values
        const cuttingRoom = filteredCuttingRoom;
        const destination = filteredDestination;

        // Validate required fields
        if (!cuttingRoom) return;
        if ((cuttingRoom === 'ZALLI' || cuttingRoom === 'DELICIA') && !destination) return;

        setFilterLoading(true);
        try {
            const sizesSorted = sortSizes(selectedOrder.sizes || []);
            await fetchMattressData(selectedOrder, sizesSorted, cuttingRoom, destination);
            setShowProductionCenterFilter(false);
        } catch (error) {
            console.error("❌ Error applying production center filter:", error);
        } finally {
            setFilterLoading(false);
        }
    };

    // Handle changing production center selection
    const handleChangeSelection = () => {
        // Reset production center info
        setSelectedProductionCenter('');
        setSelectedCuttingRoom('');
        setSelectedDestination('');

        // Reset filter values
        setFilteredCuttingRoom(null);
        setFilteredDestination(null);

        // Clear tables
        setTables([]);
        setAdhesiveTables([]);
        setAlongTables([]);
        setWeftTables([]);
        setBiasTables([]);

        // Show filter again
        setShowProductionCenterFilter(true);
    };

    return (
        <>
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
                            Order Details
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
                                    Print
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

            {/* Production Center Filter */}
            {selectedOrder && showProductionCenterFilter && (
                <>
                    <ProductionCenterFilter
                        combinations={productionCenterCombinations}
                        selectedCuttingRoom={filteredCuttingRoom}
                        selectedDestination={filteredDestination}
                        onCuttingRoomChange={setFilteredCuttingRoom}
                        onDestinationChange={setFilteredDestination}
                        onApplyFilter={handleApplyFilter}
                        loading={filterLoading}
                    />
                    <Box mt={2} />
                </>
            )}

            {/* Production Center Info */}
            {selectedOrder && !showProductionCenterFilter && !productionCenterLoading && (selectedProductionCenter || selectedCuttingRoom) && (
                <>
                    <CuttingRoomInfo
                        productionCenter={selectedProductionCenter}
                        cuttingRoom={selectedCuttingRoom}
                        destination={selectedDestination}
                        onChangeSelection={productionCenterCombinations.length > 1 ? handleChangeSelection : null}
                        orderSizes={orderSizes}
                        tables={tables}
                    />
                    <Box mt={2} />
                </>
            )}

            {/* Mattress Group Section */}
            {tables.length > 0 && tables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   {/* ✅ Add spacing before every table except the first one */}
                   {tableIndex > 0 && <Box mt={2} />}
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {`Mattresses`}

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
            {adhesiveTables.length > 0 && adhesiveTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {`Adhesives`}

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
            {alongTables.length > 0 && alongTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>

                    <Box mt={2} />
                    
                    <MainCard data-table-id={table.id} title="Collaretto Along the Grain">
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
            {weftTables.length > 0 && weftTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title="Collaretto in Weft"
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
            {biasTables.length > 0 && biasTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title="Collaretto Bias"
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