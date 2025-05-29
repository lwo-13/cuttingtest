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

// Pad Print Components
import PadPrintInfo from 'views/planning/OrderPlanning/components/PadPrintInfo';

// Mattress Components
import MattressGroupCardReadOnly from 'views/dashboard/OrderReport/MattressGroupCardReadOnly';
import PlannedQuantityBar from 'views/planning/OrderPlanning/components/PlannedQuantityBar';
import MattressTableHeader from 'views/dashboard/OrderReport/MattressTableHeader';
import MattressRowReadOnly from 'views/dashboard/OrderReport/MattressRowReadOnly';
import MattressActionRowReadOnly from 'views/dashboard/OrderReport/MattressActionRowReadOnly';

// Along Components
import AlongGroupCard from 'views/planning/OrderPlanning/components/AlongGroupCard';
import AlongRow from 'views/planning/OrderPlanning/components/AlongRow';
import AlongTableHeader from 'views/planning/OrderPlanning/components/AlongTableHeader';
import AlongActionRow from 'views/planning/OrderPlanning/components/AlongActionRow';

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

    // Cutting Room Assignemnt
    const [selectedProductionCenter, setSelectedProductionCenter] = useState('');
    const [selectedCuttingRoom, setSelectedCuttingRoom] = useState('');
    const [selectedDestination, setSelectedDestination] = useState('');

    // Pin Order Planning Card
    const [isPinned, setIsPinned] = useState(false);

    // User
    const username = useSelector((state) => state.account?.user?.username) || "Unknown";

    // Tables
    const [tables, setTables] = useState([]);
    const [alongTables, setAlongTables] = useState([]);
    const [weftTables, setWeftTables] = useState([]);

    // Order Change
    const { onOrderChange } = useHandleOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames,
        setSelectedStyle,
        setSelectedSeason,
        setSelectedColorCode,
        setSelectedProductionCenter,
        setSelectedCuttingRoom,
        setSelectedDestination,
        fetchPadPrintInfo,
        fetchBrandForStyle,
        setTables,
        setAlongTables,
        setWeftTables,
        setMarkerOptions,
        sortSizes,
        clearBrand,
        clearPadPrintInfo
    });


    // Average Consumption per table
    const avgConsumption = useAvgConsumption(tables, getTablePlannedQuantities);

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

        console.log("Fetching marker headers...");  // ✅ Debugging

        axios.get(`/markers/marker_headers_planning`, {
            params: {
              style: selectedStyle,
              sizes: orderSizeNames.join(',')
            }
          })  // ✅ Fetch only when order changes
            .then((response) => {
                console.log("API Response:", response.data);  // ✅ Debugging
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
                <MainCard title="Order Details">

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

                    {/* Order Quantities Section */}
                    <OrderQuantities orderSizes={orderSizes} italianRatios={italianRatios} />

                </MainCard>
            </Box>

            <Box mt={2} />
            
            {/* Production Center */}
            {selectedOrder && (
                <CuttingRoomInfo
                    productionCenter={selectedProductionCenter}
                    cuttingRoom={selectedCuttingRoom}
                    destination={selectedDestination}
                />
            )}

            <Box mt={2} />

            {/* Mattress Group Section */}
            {tables.length > 0 && tables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   {/* ✅ Add spacing before every table except the first one */}
                   {tableIndex > 0 && <Box mt={2} />}
                    <MainCard
                        key={table.id}
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
                                        {table.rows.map((row) => (
                                            <MattressRowReadOnly
                                            key={row.id}
                                            row={row}
                                            orderSizes={orderSizes}
                                            />
                                        ))}
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

            {/* Along Tables Section */}
            {/* {alongTables.length > 0 && alongTables.map((table) => (
                <React.Fragment key={table.id}>

                    <Box mt={2} />
                    
                    <MainCard title={`Collaretto Along the Grain`}>
                        <AlongGroupCard
                            table={table}
                            tables={alongTables}
                            fabricTypeOptions={fabricTypeOptions}
                            isTableEditable={isTableEditable}
                            setTables={setAlongTables}
                            setUnsavedChanges={setUnsavedChanges}
                            handleAlongExtraChange={handleAlongExtraChange}
                        />

                        {/* Table Section
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <AlongTableHeader />
                                    <TableBody>
                                        {table.rows.map((row) => (
                                            <AlongRow
                                                key={row.id}
                                                row={row}
                                                rowId={row.id}
                                                table={table}
                                                tableId={table.id}
                                                handleInputChange={handleAlongRowChange}
                                                handleRemoveRow={handleRemoveAlongRow}
                                                setUnsavedChanges={setUnsavedChanges}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Button Container
                           <AlongActionRow
                                tableId={table.id}
                                table={table}
                                isTableEditable={isTableEditable}
                                handleAddRowAlong={handleAddRowAlong}
                                handleRemoveAlongTable={handleRemoveAlong}
                                setUnsavedChanges={setUnsavedChanges}
                            />

                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Weft Tables Section
            {weftTables.length > 0 && weftTables.map((table) => (

                <React.Fragment key={table.id}>
                    <Box mt={2} />

                    <MainCard title={`Collaretto in Weft`}>
                        <WeftGroupCard
                            table={table}
                            tables={weftTables}
                            fabricTypeOptions={fabricTypeOptions}
                            isTableEditable={isTableEditable}
                            setTables={setWeftTables}
                            setUnsavedChanges={setUnsavedChanges}
                            handleWeftExtraChange={handleWeftExtraChange}
                            />                      

                        {/* Table Section
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                    <Table>
                                        <WeftTableHeader />
                                        <TableBody>
                                        {table.rows.map((row) => (
                                            <WeftRow
                                            key={row.id}
                                            row={row}
                                            rowId={row.id}
                                            table={table}
                                            tableId={table.id}
                                            handleInputChange={handleWeftRowChange}
                                            handleRemoveRow={handleRemoveWeftRow}
                                            setUnsavedChanges={setUnsavedChanges}
                                            />
                                        ))}
                                        </TableBody>
                                    </Table>
                            </TableContainer>

                            {/* Button Container
                            <WeftActionRow
                                tableId={table.id}
                                table={table}
                                isTableEditable={isTableEditable}
                                handleAddRowWeft={handleAddRowWeft}
                                handleRemoveWeft={handleRemoveWeft}
                                setUnsavedChanges={setUnsavedChanges}
                            />
                            
                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}*/}

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