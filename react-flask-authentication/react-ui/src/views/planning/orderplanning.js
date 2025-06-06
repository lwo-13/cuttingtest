import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Collapse } from '@mui/material';
import { AddCircleOutline, DeleteOutline, Save, Print, Calculate } from '@mui/icons-material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// Order Planning Components
import OrderActionBar from 'views/planning/OrderPlanning/components/OrderActionBar';
import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';



// Pad Print Components
import PadPrintInfo from 'views/planning/OrderPlanning/components/PadPrintInfo';
import PadPrintInfoManual from 'views/planning/OrderPlanning/components/PadPrintInfoManual';

// Mattress Components
import MattressGroupCard from 'views/planning/OrderPlanning/components/MattressGroupCard';
import PlannedQuantityBar from 'views/planning/OrderPlanning/components/PlannedQuantityBar';
import MattressTableHeader from 'views/planning/OrderPlanning/components/MattressTableHeader';
import MattressRow from 'views/planning/OrderPlanning/components/MattressRow';
import MattressActionRow from 'views/planning/OrderPlanning/components/MattressActionRow';

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

// Bias Components
import BiasGroupCard from 'views/planning/OrderPlanning/components/BiasGroupCard';
import BiasTableHeader from 'views/planning/OrderPlanning/components/BiasTableHeader';
import BiasRow from 'views/planning/OrderPlanning/components/BiasRow';
import BiasActionRow from 'views/planning/OrderPlanning/components/BiasActionRow';

// Calculator Component
import MarkerCalculatorDialog from 'views/planning/OrderPlanning/components/MarkerCalculatorDialog';

// Hooks
import useItalianRatios from 'views/planning/OrderPlanning/hooks/useItalianRatios';
import usePadPrintInfo from 'views/planning/OrderPlanning/hooks/usePadPrintInfo';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';
import useMattressTables from 'views/planning/OrderPlanning/hooks/useMattressTables';
import useAlongTables from 'views/planning/OrderPlanning/hooks/useAlongTables';
import useWeftTables from 'views/planning/OrderPlanning/hooks/useWeftTables';
import useBiasTables from 'views/planning/OrderPlanning/hooks/useBiasTables';
import useHandleSave from 'views/planning/OrderPlanning/hooks/useHandleSave';
import useHandleOrderChange from 'views/planning/OrderPlanning/hooks/useHandleOrderChange';
import useAvgConsumption from 'views/planning/OrderPlanning/hooks/useAvgConsumption';

// Utils
import { getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno } from 'views/planning/OrderPlanning/utils/plannedQuantities';
import { usePrintStyles, handlePrint } from 'views/planning/OrderPlanning/utils/printUtils';
import { sortSizes } from 'views/planning/OrderPlanning/utils/sortSizes';

// Sample Fabric Types
const fabricTypeOptions = ["01", "02", "03", "04", "05", "06", "10", "13"];

// Spreading Options
const spreadingOptions = ["AUTOMATIC", "MANUAL"];

// Spreading Methods
const spreadingMethods = ["FACE UP", "FACE DOWN", "FACE TO FACE"];

const OrderPlanning = () => {
    const { t } = useTranslation();
    const history = useHistory();

    const [orderOptions, setOrderOptions] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [styleOptions, setStyleOptions] = useState([]);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [selectedSeason, setSelectedSeason] = useState("");
    const [selectedColorCode, setSelectedColorCode] = useState("");
    const [orderSizes, setOrderSizes] = useState([]); // ✅ Stores full objects (for qty display)
    const [orderSizeNames, setOrderSizeNames] = useState([]); // ✅ Stores only size names (for table columns)
    const [markerOptions, setMarkerOptions] = useState([]);
    const [deletedMattresses, setDeletedMattresses] = useState([]);
    const [deletedAlong, setDeletedAlong] = useState([]);
    const [deletedWeft, setDeletedWeft] = useState([]);
    const [deletedBias, setDeletedBias] = useState([]);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    const [styleTouched, setStyleTouched] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [openError, setOpenError] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [openSuccess, setOpenSuccess] = useState(false);

    // State for unsaved changes dialog
    const [openUnsavedDialog, setOpenUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // State for calculator dialog
    const [openCalculatorDialog, setOpenCalculatorDialog] = useState(false);

    // State for card collapse/expand functionality
    const [collapsedCards, setCollapsedCards] = useState({
        mattress: {},  // { tableId: boolean }
        along: {},     // { tableId: boolean }
        weft: {},      // { tableId: boolean }
        bias: {}       // { tableId: boolean }
    });

    // Italian Ratio
    const italianRatios = useItalianRatios(selectedOrder);

    // Fetch Pad Print
    const { padPrintInfo, fetchPadPrintInfo, clearPadPrintInfo } = usePadPrintInfo();
    
    // Manual Pad Print
    const [manualPattern, setManualPattern] = useState('');
    const [manualColor, setManualColor] = useState('');

    // Fetch Brand
    const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();



    // Pin Order Planning Card
    const [isPinned, setIsPinned] = useState(false);

    // User
    const username = useSelector((state) => state.account?.user?.username) || "Unknown";

    // Mattress Tables
    const {
        tables,
        setTables,
        handleAddTable,
        handleRemoveTable,
        handleAddRow,
        handleRemoveRow,
        handleInputChange,
        updateExpectedConsumption
    } = useMattressTables({ orderSizeNames, setDeletedMattresses, setUnsavedChanges });

    // Along Tables
    const {
        alongTables,
        setAlongTables,
        handleAddTable: handleAddAlong,
        handleRemoveTable: handleRemoveAlong,
        handleAddRow: handleAddRowAlong,
        handleRemoveRow: handleRemoveAlongRow,
        handleInputChange: handleAlongRowChange,
        handleExtraChange: handleAlongExtraChange
    } = useAlongTables({ setUnsavedChanges, setDeletedAlong });

    // Weft Tables
    const {
        weftTables,
        setWeftTables,
        handleAddWeft,
        handleRemoveWeft,
        handleAddRow: handleAddRowWeft,
        handleRemoveRow: handleRemoveWeftRow,
        handleInputChange: handleWeftRowChange,
        handleExtraChange: handleWeftExtraChange
    } = useWeftTables({ setUnsavedChanges, setDeletedWeft });

    // Bias Tables
    const {
        biasTables,
        setBiasTables,
        handleAddBias,
        handleRemoveBias,
        handleAddRow: handleAddRowBias,
        handleRemoveRow: handleRemoveBiasRow,
        handleInputChange: handleBiasRowChange,
    } = useBiasTables({ setUnsavedChanges, setDeletedBias });

    // Save
    const { saving, handleSave } = useHandleSave({
        tables,
        alongTables,
        weftTables,
        biasTables,
        padPrintInfo,
        manualPattern,
        manualColor,
        selectedOrder,
        selectedStyle,
        selectedColorCode,
        selectedSeason,
        username,
        brand,
        deletedMattresses,
        deletedAlong,
        deletedWeft,
        deletedBias,
        setDeletedMattresses,
        setDeletedAlong,
        setDeletedWeft,
        setDeletedBias,
        setErrorMessage,
        setOpenError,
        setSuccessMessage,
        setOpenSuccess,
        setUnsavedChanges
    });

    // Order Change
    const { onOrderChange } = useHandleOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames,
        setSelectedStyle,
        setStyleTouched,
        setSelectedSeason,
        setSelectedColorCode,
        fetchPadPrintInfo,
        fetchBrandForStyle,
        setTables,
        setAlongTables,
        setWeftTables,
        setBiasTables,
        setMarkerOptions,
        setManualPattern,
        setManualColor,
        setUnsavedChanges,
        handleWeftRowChange,
        sortSizes,
        clearBrand,
        clearPadPrintInfo,
        styleTouched
    });

    // Print Styles
    usePrintStyles();

    // Average Consumption per table
    const avgConsumption = useAvgConsumption(tables, getTablePlannedQuantities);


    const handleCloseError = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpenError(false);
    };

    const handleCloseSuccess = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSuccess(false);
    };

    // Handle closing the unsaved changes dialog
    const handleCloseUnsavedDialog = () => {
        setOpenUnsavedDialog(false);
        setPendingNavigation(null);
    };

    // Calculate effective order quantities for a table (cascading from previous tables)
    const getEffectiveOrderQuantities = (targetTableId) => {
        const tableIndex = tables.findIndex(table => table.id === targetTableId);

        // First table uses original order quantities
        if (tableIndex === 0) {
            return orderSizes;
        }

        // Subsequent tables use calculated quantities from previous table
        const previousTable = tables[tableIndex - 1];
        const previousTableTotals = getTablePlannedQuantities(previousTable);

        // Convert to the same format as orderSizes
        return orderSizeNames.map(sizeName => ({
            size: sizeName,
            qty: previousTableTotals[sizeName] || 0
        }));
    };

    // Handle calculator dialog
    const handleOpenCalculator = () => {
        setOpenCalculatorDialog(true);
    };

    const handleCloseCalculator = () => {
        setOpenCalculatorDialog(false);
    };

    // Handle card collapse/expand functionality
    const toggleCardCollapse = (cardType, tableId) => {
        setCollapsedCards(prev => ({
            ...prev,
            [cardType]: {
                ...prev[cardType],
                [tableId]: !prev[cardType][tableId]
            }
        }));
    };

    // Handle confirming navigation when there are unsaved changes
    const handleConfirmNavigation = () => {
        setOpenUnsavedDialog(false);

        // If we have a pending navigation function, execute it
        if (pendingNavigation && typeof pendingNavigation === 'function') {
            pendingNavigation();
        }

        setPendingNavigation(null);
    };

    // Override history.block to show our custom dialog
    useEffect(() => {
        // This will be called when the user tries to navigate away
        const unblock = history.block((location) => {
            if (unsavedChanges) {
                // Store the navigation function to be called after user confirms
                setPendingNavigation(() => () => history.push(location.pathname));
                setOpenUnsavedDialog(true);
                return false; // Prevent immediate navigation
            }
            return true; // Allow navigation
        });

        return () => {
            // Clean up when component unmounts
            unblock();
        };
    }, [history, unsavedChanges]);

    // Handle page navigation warning when unsaved changes exist (browser close/refresh)
    useEffect(() => {
        // Function to handle beforeunload event
        const handleBeforeUnload = (event) => {
            if (unsavedChanges) {
                // Standard way to show a confirmation dialog before leaving the page
                const message = "You have unsaved changes, either save or delete them.";
                event.preventDefault();
                event.returnValue = message; // For older browsers
                return message; // For modern browsers
            }
        };

        // Add event listener when component mounts or unsavedChanges changes
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Clean up event listener when component unmounts or unsavedChanges changes
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [unsavedChanges]);

    // Fetch order data from Flask API
    useEffect(() => {
        axios.get('/orders/order_lines')
            .then(response => {
                if (response.data.success) {
                    const ordersMap = new Map();

                    response.data.data.forEach(row => {
                        if (row.status === 3) {  // ✅ Only include status = 3
                            if (!ordersMap.has(row.order_commessa)) {
                                ordersMap.set(row.order_commessa, {
                                    id: row.order_commessa,  // ✅ Use only id
                                    style: row.style,  // ✅ Unique style per order
                                    season: row.season,  // ✅ Unique season per order
                                    colorCode: row.color_code,  // ✅ Unique color code per order
                                    sizes: []  // ✅ Initialize array for sizes
                                });
                            }

                            // Append sizes dynamically
                            ordersMap.get(row.order_commessa).sizes.push({
                                size: row.size,
                                qty: parseFloat(row.quantity.toString().replace(",", "")) || 0 // ✅ Convert quantity to number
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
                } else {
                    console.error("Failed to fetch orders");
                }
            })
            .catch(error => console.error("Error fetching order data:", error));
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

    const isTableEditable = (table) => {
        return table.rows.every(row => row.isEditable !== false);
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
                <MainCard title={t('orderPlanning.orderDetails', 'Order Details')}>

                    {/* Order Actions Bar */}
                    <OrderActionBar
                        unsavedChanges={unsavedChanges}
                        handleSave={handleSave}
                        handlePrint={handlePrint}
                        isPinned={isPinned}
                        setIsPinned={setIsPinned}
                        saving={saving}
                    />

                    {/* Order Toolbar */}
                    <OrderToolbar
                        styleOptions={styleOptions}
                        selectedStyle={selectedStyle}
                        onStyleChange={handleStyleChange}
                        orderOptions={orderOptions}
                        filteredOrders={filteredOrders}
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

            {/* Pad Print Section */}
            {selectedOrder && (
                <>
                    {padPrintInfo ? (
                        <PadPrintInfo padPrintInfo={padPrintInfo} />
                    ) : (
                        <PadPrintInfoManual
                            brand={brand?.toLowerCase()}
                            pattern={manualPattern}
                            setPattern={setManualPattern}
                            color={manualColor}
                            setColor={setManualColor}
                        />
                    )}
                </>
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
                                <Box display="flex" alignItems="center" gap={1}>
                                    <IconButton
                                        size="small"
                                        onClick={() => toggleCardCollapse('mattress', table.id)}
                                        sx={{
                                            color: 'text.secondary',
                                            '&:hover': { backgroundColor: 'action.hover' }
                                        }}
                                        title={collapsedCards.mattress[table.id] ? "Expand" : "Collapse"}
                                    >
                                        {collapsedCards.mattress[table.id] ?
                                            <IconChevronDown stroke={1.5} size="1rem" /> :
                                            <IconChevronUp stroke={1.5} size="1rem" />
                                        }
                                    </IconButton>
                                    {t('orderPlanning.mattresses', 'Mattresses')}
                                    <IconButton
                                        size="small"
                                        onClick={handleOpenCalculator}
                                        sx={{
                                            color: 'primary.main',
                                            '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                                        }}
                                        title="Marker Calculator"
                                    >
                                        <Calculate fontSize="small" />
                                    </IconButton>
                                </Box>

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
                        <Collapse in={!collapsedCards.mattress[table.id]} timeout="auto" unmountOnExit>
                            <MattressGroupCard
                                table={table}
                                tableId={table.id}
                                tables={tables}
                                fabricTypeOptions={fabricTypeOptions}
                                spreadingMethods={spreadingMethods}
                                spreadingOptions={spreadingOptions}
                                isTableEditable={isTableEditable}
                                setTables={setTables}
                                setUnsavedChanges={setUnsavedChanges}
                                updateExpectedConsumption={updateExpectedConsumption}
                            />

                            {/* Table Section */}
                            <Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                    <Table>
                                        <MattressTableHeader orderSizes={orderSizes} />
                                        <TableBody>
                                            {table.rows.map((row) => (
                                                <MattressRow
                                                key={row.id}
                                                row={row}
                                                rowId={row.id}
                                                tableId={table.id}
                                                table={table}
                                                orderSizes={orderSizes}
                                                markerOptions={markerOptions}
                                                setTables={setTables}
                                                handleInputChange={handleInputChange}
                                                handleRemoveRow={handleRemoveRow}
                                                setUnsavedChanges={setUnsavedChanges}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Action Row: Avg Consumption + Buttons aligned horizontally */}
                                <MattressActionRow
                                    avgConsumption={avgConsumption[table.id]}
                                    tableId={table.id}
                                    isTableEditable={isTableEditable}
                                    table={table}
                                    handleAddRow={(tableId) => handleAddRow(tableId)}
                                    handleRemoveTable={handleRemoveTable}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Along Tables Section */}
            {alongTables.length > 0 && alongTables.map((table) => (
                <React.Fragment key={table.id}>

                    <Box mt={2} />
                    
                    <MainCard
                        title={
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => toggleCardCollapse('along', table.id)}
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { backgroundColor: 'action.hover' }
                                    }}
                                    title={collapsedCards.along[table.id] ? "Expand" : "Collapse"}
                                >
                                    {collapsedCards.along[table.id] ?
                                        <IconChevronDown stroke={1.5} size="1rem" /> :
                                        <IconChevronUp stroke={1.5} size="1rem" />
                                    }
                                </IconButton>
                                Collaretto Along the Grain
                            </Box>
                        }
                    >
                        <Collapse in={!collapsedCards.along[table.id]} timeout="auto" unmountOnExit>
                            <AlongGroupCard
                                table={table}
                                tables={alongTables}
                                fabricTypeOptions={fabricTypeOptions}
                                isTableEditable={isTableEditable}
                                setTables={setAlongTables}
                                setUnsavedChanges={setUnsavedChanges}
                                handleAlongExtraChange={handleAlongExtraChange}
                            />

                            {/* Table Section */}
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

                                {/* Button Container */}
                               <AlongActionRow
                                    tableId={table.id}
                                    table={table}
                                    isTableEditable={isTableEditable}
                                    handleAddRowAlong={handleAddRowAlong}
                                    handleRemoveAlongTable={handleRemoveAlong}
                                    setUnsavedChanges={setUnsavedChanges}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Weft Tables Section */}
            {weftTables.length > 0 && weftTables.map((table) => (

                <React.Fragment key={table.id}>
                    <Box mt={2} />

                    <MainCard
                        title={
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => toggleCardCollapse('weft', table.id)}
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { backgroundColor: 'action.hover' }
                                    }}
                                    title={collapsedCards.weft[table.id] ? "Expand" : "Collapse"}
                                >
                                    {collapsedCards.weft[table.id] ?
                                        <IconChevronDown stroke={1.5} size="1rem" /> :
                                        <IconChevronUp stroke={1.5} size="1rem" />
                                    }
                                </IconButton>
                                Collaretto in Weft
                            </Box>
                        }
                    >
                        <Collapse in={!collapsedCards.weft[table.id]} timeout="auto" unmountOnExit>
                            <WeftGroupCard
                                table={table}
                                tables={weftTables}
                                fabricTypeOptions={fabricTypeOptions}
                                isTableEditable={isTableEditable}
                                setTables={setWeftTables}
                                setUnsavedChanges={setUnsavedChanges}
                                handleWeftExtraChange={handleWeftExtraChange}
                                />

                            {/* Table Section */}
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

                                {/* Button Container */}
                                <WeftActionRow
                                    tableId={table.id}
                                    table={table}
                                    isTableEditable={isTableEditable}
                                    handleAddRowWeft={handleAddRowWeft}
                                    handleRemoveWeft={handleRemoveWeft}
                                    setUnsavedChanges={setUnsavedChanges}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* BiasTables Section */}
            {biasTables.length > 0 && biasTables.map((table) => (

                <React.Fragment key={table.id}>
                    <Box mt={2} />

                    <MainCard
                        title={
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => toggleCardCollapse('bias', table.id)}
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { backgroundColor: 'action.hover' }
                                    }}
                                    title={collapsedCards.bias[table.id] ? "Expand" : "Collapse"}
                                >
                                    {collapsedCards.bias[table.id] ?
                                        <IconChevronDown stroke={1.5} size="1rem" /> :
                                        <IconChevronUp stroke={1.5} size="1rem" />
                                    }
                                </IconButton>
                                Collaretto in Bias
                            </Box>
                        }
                    >
                        <Collapse in={!collapsedCards.bias[table.id]} timeout="auto" unmountOnExit>
                            <BiasGroupCard
                                key={table.id}
                                table={table}
                                tables={biasTables}
                                fabricTypeOptions={fabricTypeOptions}
                                isTableEditable={isTableEditable}
                                setTables={setBiasTables}
                                setUnsavedChanges={setUnsavedChanges}
                                />

                            {/* Table Section */}
                            <Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                        <Table>
                                            <BiasTableHeader />
                                            <TableBody>
                                            {table.rows.map((row) => (
                                                <BiasRow
                                                key={row.id}
                                                row={row}
                                                rowId={row.id}
                                                table={table}
                                                tableId={table.id}
                                                handleInputChange={handleBiasRowChange}
                                                handleRemoveRow={handleRemoveBiasRow}
                                                setUnsavedChanges={setUnsavedChanges}
                                                />
                                            ))}
                                            </TableBody>
                                        </Table>
                                </TableContainer>

                                {/* Button Container */}
                                <BiasActionRow
                                    tableId={table.id}
                                    table={table}
                                    isTableEditable={isTableEditable}
                                    handleAddRowBias={handleAddRowBias}
                                    handleRemoveBias={handleRemoveBias}
                                    setUnsavedChanges={setUnsavedChanges}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                </React.Fragment>
            ))}

            {selectedOrder && (
                <Box mt={2} display="flex" justifyContent="flex-start" gap={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddTable}
                    >
                        {t('orderPlanning.addMattress', 'Add Mattress')}
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddAlong}
                    >
                        {t('orderPlanning.addCollarettoAlong', 'Add Collaretto Along Grain (Ordito)')}
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddWeft}
                    >
                        {t('orderPlanning.addCollarettoWeft', 'Add Collaretto Weft (Trama)')}
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddBias}
                    >
                        {t('orderPlanning.addCollarettoBias', 'Add Collaretto Bias (Sbieco)')}
                    </Button>
                </Box>
            )}

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

            {/* ✅ Success Message Snackbar */}
            <Snackbar
                open={openSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%', padding: "12px 16px", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Unsaved Changes Dialog */}
            <Dialog
                open={openUnsavedDialog}
                onClose={handleCloseUnsavedDialog}
                aria-labelledby="unsaved-changes-dialog-title"
                aria-describedby="unsaved-changes-dialog-description"
            >
                <DialogTitle id="unsaved-changes-dialog-title">
                    {t('orderPlanning.unsavedChanges', 'Unsaved Changes')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="unsaved-changes-dialog-description">
                        {t('orderPlanning.unsavedChangesMessage', 'You have unsaved changes, either save or delete them.')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUnsavedDialog} color="primary" variant="contained">
                        {t('common.ok', 'OK')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Marker Calculator Dialog */}
            {selectedOrder && (
                <MarkerCalculatorDialog
                    open={openCalculatorDialog}
                    onClose={handleCloseCalculator}
                    orderSizes={orderSizes}
                    orderSizeNames={orderSizeNames}
                    selectedStyle={selectedStyle}
                    tables={tables}
                    getTablePlannedQuantities={getTablePlannedQuantities}
                    selectedOrder={selectedOrder}
                />
            )}
        </>
    );
};

export default OrderPlanning;
