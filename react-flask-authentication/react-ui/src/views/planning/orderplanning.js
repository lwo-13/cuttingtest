import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { AddCircleOutline, DeleteOutline, Save, Print } from '@mui/icons-material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

// Order Planning Components
import OrderActionBar from 'views/planning/OrderPlanning/components/OrderActionBar';
import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';

// Cutting Room Selection
import CuttingRoomSelector from 'views/planning/OrderPlanning/components/CuttingRoomSelector';

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

// Hooks
import useItalianRatios from 'views/planning/OrderPlanning/hooks/useItalianRatios';
import usePadPrintInfo from 'views/planning/OrderPlanning/hooks/usePadPrintInfo';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';
import useMattressTables from 'views/planning/OrderPlanning/hooks/useMattressTables';
import useAlongTables from 'views/planning/OrderPlanning/hooks/useAlongTables';

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
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [avgConsumption, setAvgConsumption] = useState({});

    const [styleTouched, setStyleTouched] = useState(false);

    const [weftTables, setWeftTables] = useState([]);

    const [errorMessage, setErrorMessage] = useState("");
    const [openError, setOpenError] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [openSuccess, setOpenSuccess] = useState(false);

    // Saving Button Status
    const [saving, setSaving] = useState(false);

    // State for unsaved changes dialog
    const [openUnsavedDialog, setOpenUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Italian Ratio
    const italianRatios = useItalianRatios(selectedOrder);

    // Fetch Pad Print
    const { padPrintInfo, fetchPadPrintInfo, clearPadPrintInfo } = usePadPrintInfo();
    // Manual Pad Print
    const [manualPattern, setManualPattern] = useState('');
    const [manualColor, setManualColor] = useState('');

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
        } = useAlongTables({
        setUnsavedChanges,
        setDeletedAlong,
        getTablePlannedByBagno,
        mattressTables: tables // Pass the mattress tables here
        });

    // Print Styles
    usePrintStyles();

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

    /* fix this */
    const handleAddWeft = () => {
        setWeftTables(prevTables => [
            ...prevTables,
            {
                id: uuidv4(), // Unique ID
                fabricType: "",
                fabricCode: "",
                fabricColor: "",
                collarettoType: "",
                rows: [
                    {
                        markerName: "",
                        width: "",
                        markerLength: "",
                        layers: "",
                        expectedConsumption: "",
                        bagno: ""
                    }
                ]
            }
        ]);
    };

    const handleRemoveWeft = (id) => {
        setWeftTables(prevTables => {
            const updatedTables = prevTables.filter(table => table.id !== id);

            // ✅ Find the table being removed
            const removedTable = prevTables.find(table => table.id === id);

            if (removedTable) {
                // ✅ Push ALL collarettoNames of this weft table to deletedWeft
                removedTable.rows.forEach(row => {
                    if (row.collarettoName) {
                        setDeletedWeft(prev => [...prev, row.collarettoName]);
                    }
                });
            }

            setUnsavedChanges(true);
            return updatedTables;
        });
    };

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

    // Handle Order Selection
    const handleOrderChange = (event, newValue) => {
        if (newValue) {
            setSelectedOrder(newValue.id);
            setOrderSizes(sortSizes(newValue.sizes || []));
            setOrderSizeNames(sortSizes(newValue.sizes || []).map(size => size.size));
            if (!styleTouched) {
                setSelectedStyle(newValue.style);  // ✅ Auto-fill only if untouched
            }
            setSelectedSeason(newValue.season);
            setSelectedColorCode(newValue.colorCode);

            axios.get(`/orders/production_center/get/${newValue.id}`)
                .then((res) => {
                    if (res.data.success && res.data.data) {
                    const { production_center, cutting_room, destination } = res.data.data;
                    setSelectedProductionCenter(production_center || '');
                    setSelectedCuttingRoom(cutting_room || '');
                    setSelectedDestination(destination || '');
                    } else {
                    // Reset if not found
                    setSelectedProductionCenter('');
                    setSelectedCuttingRoom('');
                    setSelectedDestination('');
                    }
                })
                .catch((err) => {
                    console.error("❌ Failed to fetch Production Center info:", err);
                    setSelectedProductionCenter('');
                    setSelectedCuttingRoom('');
                    setSelectedDestination('');
                });

            console.log(`🔍 Fetching mattresses for order: ${newValue.id}`);

            // ✅ Fetch Pad Print Info based on order attributes
            fetchPadPrintInfo(newValue.season, newValue.style, newValue.colorCode);

            // ✅ Fetch brand directly with style
            fetchBrandForStyle(newValue.style);

            // Fetch mattresses and markers in parallel
            Promise.all([
                axios.get(`/mattress/get_by_order/${newValue.id}`),  // Fetch mattresses
                axios.get(`/markers/marker_headers_planning`, {
                    params: {
                      style: newValue.style,
                      sizes: orderSizeNames.join(',')
                    }
                  }),  // Fetch markers
                axios.get(`/collaretto/get_by_order/${newValue.id}`),
                axios.get(`/collaretto/get_weft_by_order/${newValue.id}`)
            ])
            .then(([mattressResponse, markerResponse, alongResponse, weftResponse]) => {
                if (mattressResponse.data.success && markerResponse.data.success) {
                    console.log("✅ Mattresses Loaded:", mattressResponse.data.data);
                    console.log("✅ Markers Loaded:", markerResponse.data.data);

                    // Mapping markers by marker_name for easy lookup
                    const markersMap = markerResponse.data.data.reduce((acc, marker) => {
                        acc[marker.marker_name] = marker;
                        return acc;
                    }, {});

                    // Group mattresses by table Id
                    const tablesById = {};

                    mattressResponse.data.data.forEach((mattress) => {
                        const tableId = mattress.table_id;

                        if (!tablesById[tableId]) {
                            tablesById[tableId] = {
                                id: tableId, // ✅ Use UUID from DB
                                fabricType: mattress.fabric_type,
                                fabricCode: mattress.fabric_code,
                                fabricColor: mattress.fabric_color,
                                spreadingMethod: mattress.spreading_method,
                                allowance: parseFloat(mattress.allowance) || 0,
                                spreading: mattress.item_type === "MS" ? "MANUAL" : "AUTOMATIC",
                                rows: []
                            };
                        }

                        // ✅ Store phase_status and create a boolean for easy checks
                        const isEditable =
                            mattress.phase_status === "0 - NOT SET" ||
                            mattress.phase_status === "1 - TO LOAD";

                        // Get marker details for this mattress
                        const markerDetails = markersMap[mattress.marker_name];

                        // Add mattress row with all necessary data (including marker details)
                        tablesById[tableId].rows.push({
                            id: mattress.row_id, // ✅ preserve row ID
                            mattressName: mattress.mattress,
                            width: markerDetails ? markerDetails.marker_width : "",
                            markerName: mattress.marker_name,
                            markerLength: markerDetails ? markerDetails.marker_length : "",
                            efficiency: markerDetails ? markerDetails.efficiency : "",
                            piecesPerSize: markerDetails ? markerDetails.size_quantities || {} : {},
                            layers: mattress.layers || "",
                            expectedConsumption: mattress.cons_planned || "",
                            bagno: mattress.dye_lot,
                            isEditable,
                            sequenceNumber: mattress.sequence_number || 0
                        });
                    });

                    // Convert to array and set tables
                    const loadedTables = Object.values(tablesById);
                    setTables(loadedTables);

                    if (alongResponse.data.success) {
                        console.log("✅ Along (Collaretto) Loaded:", alongResponse.data.data);

                        // ✅ Group along by table id
                        const alongTablesById = {};

                        alongResponse.data.data.forEach((along) => {
                            const tableId = along.table_id;

                            if (!alongTablesById[tableId]) {
                                alongTablesById[tableId] = {
                                    id: tableId,  // ✅ Preserve backend UUID
                                    fabricType: along.fabric_type,
                                    fabricCode: along.fabric_code,
                                    fabricColor: along.fabric_color,
                                    alongExtra: along.details.extra,
                                    rows: []
                                };
                            }

                            alongTablesById[tableId].rows.push({
                                id: along.row_id,  // ✅ Important: for tracking + removal
                                collarettoName: along.collaretto,
                                pieces: along.details.pieces,
                                usableWidth: along.details.usable_width,
                                theoreticalConsumption: along.details.gross_length,
                                collarettoWidth: along.details.roll_width,
                                scrapRoll: along.details.scrap_rolls,
                                rolls: along.details.rolls_planned,
                                metersCollaretto: along.details.total_collaretto,
                                consumption: along.details.cons_planned,
                                bagno: along.dye_lot,
                                sequenceNumber: along.sequence_number || 0
                            });
                        });

                        // ✅ Convert to array
                        const loadedAlongTables = Object.values(alongTablesById);
                        setAlongTables(loadedAlongTables);

                    } else {
                        console.warn("⚠️ No along (collaretto) rows found");
                        setAlongTables([]);
                    }

                    let loadedWeftTables = [];
                    if (weftResponse.data.success) {
                        console.log("✅ Weft (Collaretto Weft) Loaded:", weftResponse.data.data);

                        // ✅ Group weft by fabric type
                        const weftTablesByFabricType = {};

                        weftResponse.data.data.forEach((weft) => {
                            const fabricType = weft.fabric_type;

                            if (!weftTablesByFabricType[fabricType]) {
                                weftTablesByFabricType[fabricType] = {
                                    id: Object.keys(weftTablesByFabricType).length + 1,
                                    fabricType: fabricType,
                                    fabricCode: weft.fabric_code,
                                    fabricColor: weft.fabric_color,
                                    weftExtra: weft.details.extra,  // ✅ Optional: same as along logic
                                    rows: []
                                };
                            }

                            // ✅ Push the row inside the correct fabric group
                            weftTablesByFabricType[fabricType].rows.push({
                                collarettoName: weft.collaretto,
                                pieces: weft.details.pieces,
                                usableWidth: weft.details.usable_width,
                                grossLength: weft.details.gross_length,
                                panelLength: weft.details.panel_length,
                                collarettoWidth: weft.details.roll_width,
                                scrapRoll: weft.details.scrap_rolls,
                                rolls: weft.details.rolls_planned,
                                panels: weft.details.panels_planned,
                                consumption: weft.details.cons_planned,
                                bagno: weft.dye_lot
                            });
                        });

                        // ✅ Convert to array
                        const loadedWeftTables = Object.values(weftTablesByFabricType);
                        setWeftTables(loadedWeftTables);

                        setTimeout(() => {
                            setWeftTables(prevTables => {
                                prevTables.forEach((table, tableIndex) => {
                                    table.rows.forEach((row, rowIndex) => {
                                        handleWeftRowChange(tableIndex, rowIndex, "usableWidth", row.usableWidth || "0");
                                    });
                                });
                                return prevTables;
                            });
                        }, 100);  // Delay allows React to update the state first

                    } else {
                        console.warn("⚠️ No weft (collaretto weft) rows found");
                        setWeftTables([]);
                    }

                    setUnsavedChanges(false);

                } else {
                    console.error("❌ Error fetching mattresses or markers");
                    setTables([]);
                    setAlongTables([]);
                    setWeftTables([]);
                    setUnsavedChanges(false);
                }
            })
            .catch(error => {
                console.error("❌ Error in parallel fetch:", error);
                setTables([]);
                setAlongTables([]);
                setWeftTables([]);
                setUnsavedChanges(false);
            });
        } else {
            setSelectedOrder(null);
            setOrderSizes([]);
            setOrderSizeNames([]);
            setMarkerOptions([]);
            setTables([]);
            setWeftTables([]);
            setAlongTables([]);
            setSelectedStyle("");
            setSelectedSeason("");
            setSelectedColorCode("");
            clearBrand();
            clearPadPrintInfo();
            setManualPattern('');
            setManualColor('');

            setUnsavedChanges(false);
            setStyleTouched(false);
        }
    };

    // Handle Style Change
    const handleStyleChange = (newStyle, touched = false) => {
        setStyleTouched(touched);

        if (touched) {
          handleOrderChange(null); // ✅ This resets everything already
          setTimeout(() => {
            setSelectedStyle(newStyle);
          }, 0);
        } else {
          setSelectedStyle(newStyle);
        }
      };

    // Function to add a new row Weft
    /* fix this */
    const handleAddRowWeft = (tableIndex) => {
        setWeftTables(prevTables => {
            return prevTables.map((table, index) => {
                if (index === tableIndex) {
                    return {
                        ...table,
                        rows: [
                            ...table.rows,
                            {
                                width: "",
                                markerName: "",
                                piecesPerSize: orderSizeNames.reduce((acc, size) => {
                                    acc[size] = ""; // Initialize each size with an empty value
                                    return acc;
                                }, {}),
                                markerLength: "",
                                layers: "",
                                expectedConsumption: "",
                                bagno: ""
                            }
                        ]
                    };
                }
                return table; // Keep other tables unchanged
            });
        });
        setUnsavedChanges(true);  // ✅ Mark as unsaved when a new row is added
    };

    const handleRemoveWeftRow = (tableIndex, rowIndex) => {
        setWeftTables(prevTables => {
            return prevTables.map((table, tIndex) => {
                if (tIndex === tableIndex) {
                    const deletedRow = table.rows[rowIndex];

                    // ✅ If the row has a backend collarettoName, add it to the delete list
                    if (deletedRow.collarettoName) {
                        setDeletedWeft(prev => [...prev, deletedRow.collarettoName]);
                    }

                    return {
                        ...table,
                        rows: table.rows.filter((_, i) => i !== rowIndex) // ✅ Remove only the selected row
                    };
                }
                return table;
            });
        });

        setUnsavedChanges(true); // ✅ Mark as unsaved when a row is deleted
    };

    const handleWeftRowChange = (tableIndex, rowIndex, field, value) => {
        setWeftTables(prevTables => {
            const updatedTables = [...prevTables];
            const updatedRows = [...updatedTables[tableIndex].rows];
            const updatedRow = { ...updatedRows[rowIndex], [field]: value };

            // If the field being changed is bagno, auto-populate the pieces field with the total quantity for that bagno
            if (field === "bagno" && value && value !== 'Unknown') {
                // Store the bagno value in a closure for the timeout
                const bagnoValue = value;

                // Clear any existing timeout for this row's bagno
                if (window.weftBagnoChangeTimeouts && window.weftBagnoChangeTimeouts[rowIndex]) {
                    clearTimeout(window.weftBagnoChangeTimeouts[rowIndex]);
                }

                // Initialize the timeouts object if it doesn't exist
                if (!window.weftBagnoChangeTimeouts) {
                    window.weftBagnoChangeTimeouts = {};
                }

                // Set a timeout to calculate the total quantity after a short delay (300ms)
                window.weftBagnoChangeTimeouts[rowIndex] = setTimeout(() => {
                    // Calculate total quantity for this bagno from all mattress tables
                    let totalQuantityForBagno = 0;

                    // Only process valid tables
                    const validTables = tables.filter(table => table && table.rows && Array.isArray(table.rows));

                    validTables.forEach(table => {
                        // Get the planned quantities by bagno for this table
                        const plannedByBagno = getTablePlannedByBagno(table);

                        // Only add to total if this bagno exists in the table and has sizes
                        if (plannedByBagno[bagnoValue] && Object.keys(plannedByBagno[bagnoValue]).length > 0) {
                            const bagnoSizes = plannedByBagno[bagnoValue];
                            const tableTotal = Object.values(bagnoSizes).reduce((sum, qty) => sum + qty, 0);
                            totalQuantityForBagno += tableTotal;
                        }
                    });

                    // If we found a quantity, update the pieces field
                    if (totalQuantityForBagno > 0) {
                        setWeftTables(currentTables => {
                            return currentTables.map((table, tIndex) => {
                                if (tIndex === tableIndex) {
                                    const newRows = [...table.rows];
                                    const rowToUpdate = {...newRows[rowIndex], pieces: totalQuantityForBagno.toString()};

                                    // Recalculate dependent values
                                    const panelLength = parseFloat(rowToUpdate.panelLength);
                                    const collarettoWidthMM = parseFloat(rowToUpdate.collarettoWidth);
                                    const scrap = parseFloat(rowToUpdate.scrapRoll);

                                    if (!isNaN(panelLength) && !isNaN(collarettoWidthMM) && !isNaN(scrap)) {
                                        const collarettoWidthM = collarettoWidthMM / 1000; // Convert mm to m
                                        rowToUpdate.rolls = collarettoWidthM > 0
                                            ? Math.floor(panelLength / collarettoWidthM) - scrap
                                            : 0;
                                    }

                                    const rolls = parseFloat(rowToUpdate.rolls);
                                    const extra = parseFloat(table.weftExtra) || 0;

                                    if (!isNaN(totalQuantityForBagno) && !isNaN(rolls) && rolls > 0 && !isNaN(extra)) {
                                        const multiplier = 1 + (extra / 100);
                                        rowToUpdate.panels = Math.floor((totalQuantityForBagno * multiplier) / rolls);
                                    }

                                    const panels = parseFloat(rowToUpdate.panels);
                                    if (!isNaN(panels) && panels > 0 && !isNaN(panelLength) && panelLength > 0) {
                                        rowToUpdate.consumption = (panels * (panelLength)).toFixed(1);
                                    }

                                    newRows[rowIndex] = rowToUpdate;
                                    return {...table, rows: newRows};
                                }
                                return table;
                            });
                        });
                    }

                    // Remove the timeout reference
                    delete window.weftBagnoChangeTimeouts[rowIndex];
                }, 300);
            }

            // Auto-calculate pcsSeamtoSeam if usableWidth and grossLength are available
            const usableWidth = parseFloat(field === "usableWidth" ? value : updatedRow.usableWidth) || 0;
            const grossLength = parseFloat(field === "grossLength" ? value : updatedRow.grossLength) || 0;

            if (usableWidth > 0 && grossLength > 0) {
                updatedRow.pcsSeamtoSeam = usableWidth > 0 && grossLength > 0
                    ? ((usableWidth / 100) / grossLength).toFixed(1)
                    : "";
            } else {
                updatedRow.pcsSeamtoSeam = ""; // Reset if incomplete
            }

            const panelLength = parseFloat(field === "panelLength" ? value : updatedRow.panelLength);
            const collarettoWidthMM = parseFloat(field === "collarettoWidth" ? value : updatedRow.collarettoWidth);
            const scrap = parseFloat(field === "scrapRoll" ? value : updatedRow.scrapRoll);

            if (!isNaN(panelLength) && !isNaN(collarettoWidthMM) && !isNaN(scrap)) {
                const collarettoWidthM = collarettoWidthMM / 1000; // Convert mm to m
                updatedRow.rolls = collarettoWidthM > 0
                    ? Math.floor(panelLength / collarettoWidthM) - scrap
                    : 0;
            } else {
                updatedRow.rolls = "";
            }

            // ✅ Auto-calculate panels if pieces and rolls exist
            const pieces = parseFloat(field === "pieces" ? value : updatedRow.pieces);
            const rolls = parseFloat(updatedRow.rolls);
            const extra = parseFloat(updatedTables[tableIndex].weftExtra) || 0; // Extra comes from table level

            if (!isNaN(pieces) && !isNaN(rolls) && rolls > 0 && !isNaN(extra)) {
                const multiplier = 1 + (extra / 100);
                updatedRow.panels = Math.floor((pieces * multiplier) / rolls);  // ✅ Always round down
            } else {
                updatedRow.panels = "";
            }

             // ✅ Calculate consumption: panels * panelLength (if both are valid)
            const panels = parseFloat(updatedRow.panels);
            if (!isNaN(panels) && panels > 0 && !isNaN(panelLength) && panelLength > 0) {
                updatedRow.consumption = (panels * (panelLength)).toFixed(1);
            } else {
                updatedRow.consumption = "";
            }

            updatedRows[rowIndex] = updatedRow;
            updatedTables[tableIndex] = { ...updatedTables[tableIndex], rows: updatedRows };
            return updatedTables;
        });
    };

    const handleWeftExtraChange = (tableIndex, value) => {
        setWeftTables(prevTables => {
            const updatedTables = [...prevTables];
            const updatedTable = { ...updatedTables[tableIndex], weftExtra: value };

            // ✅ Recalculate panels and consumption for each row if possible
            updatedTable.rows = updatedTable.rows.map(row => {
                const pieces = parseFloat(row.pieces);
                const rolls = parseFloat(row.rolls);
                const extra = parseFloat(value) || 0;
                const panelLength = parseFloat(row.panelLength);

                let updatedRow = { ...row };

                if (!isNaN(pieces) && !isNaN(rolls) && rolls > 0) {
                    const multiplier = (100 + extra) / 100;
                    updatedRow.panels = Math.floor((pieces * multiplier) / rolls); // ✅ Always round down
                } else {
                    updatedRow.panels = "";
                }

                // ✅ Recalculate consumption if panels and panelLength exist
                const panels = parseFloat(updatedRow.panels);
                if (!isNaN(panels) && panels > 0 && !isNaN(panelLength) && panelLength > 0) {
                    updatedRow.consumption = (panels * (panelLength)).toFixed(1);  // cm to meters
                } else {
                    updatedRow.consumption = "";
                }

                return updatedRow;
            });

            updatedTables[tableIndex] = updatedTable;
            return updatedTables;
        });
    };

    // UseEffect for avg Consumption
    useEffect(() => {
        if (!tables || tables.length === 0) return;

        const newAvgConsumption = {};

        tables.forEach(table => {
          newAvgConsumption[table.id] = calculateTableAverageConsumption(table);
        });

        setAvgConsumption(newAvgConsumption);
      }, [tables]);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);

        try {
            const newMattressNames = new Set();
            const newAlongNames = new Set();
            const newWeftNames = new Set();
            const payloads = [];
            const allongPayloads = [];
            const weftPayloads = [];
            let invalidRow = null;
            let invalidAlongRow = null;
            let invalidWeftRow = null;

            // ✅ Check for missing mandatory fields
            const hasInvalidData = tables.some((table, tableIndex) => {
                if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.spreadingMethod) {
                    invalidRow = `Mattress Group ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color, or Spreading Method)`;
                    return true; // 🚨 Stop processing immediately
                }

                return table.rows.some((row, rowIndex) => {
                    if (!row.markerName || !row.layers || parseInt(row.layers) <= 0) {
                        invalidRow = `Mattress Group ${tableIndex + 1}, Row ${rowIndex + 1} is missing a Marker or Layers`;
                        return true; // 🚨 Stops processing if invalid
                    }
                    return false;
                });
            });

            // 🚨 Show Error Message If Validation Fails
            if (hasInvalidData) {
                setErrorMessage(invalidRow);
                setOpenError(true);
                return; // ✅ Prevents saving invalid data
            }

            const hasInvalidAlongData = alongTables.some((table, tableIndex) => {
                if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.alongExtra) {
                    invalidAlongRow = `Collaretto Along ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color or Extra)`;
                    return true;
                }

                return table.rows.some((row, rowIndex) => {
                    if (!row.pieces || !row.usableWidth || !row.theoreticalConsumption || !row.collarettoWidth || !row.scrapRoll) {
                        invalidAlongRow = `Collaretto Along ${tableIndex + 1}, Row ${rowIndex + 1} is missing required fields)`;
                        return true;
                    }
                    return false;
                });
            });

            // 🚨 Error Handling
            if (hasInvalidAlongData) {
                setErrorMessage(invalidAlongRow);
                setOpenError(true);
                return;
            }

            const hasInvalidWeftData = weftTables.some((table, tableIndex) => {
                if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.weftExtra) {
                    invalidWeftRow = `Collaretto Weft ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color, or Extra)`;
                    return true;
                }

                return table.rows.some((row, rowIndex) => {
                    if (!row.pieces || !row.usableWidth || !row.grossLength || !row.panelLength || !row.collarettoWidth || !row.scrapRoll) {
                        invalidWeftRow = `Collaretto Weft ${tableIndex + 1}, Row ${rowIndex + 1} is missing required fields`;
                        return true;
                    }
                    return false;
                });
            });

            // 🚨 Error Handling for Weft
            if (hasInvalidWeftData) {
                setErrorMessage(invalidWeftRow);
                setOpenError(true);
                return;
            }

            // ❗ Require manual pad print input if no padPrintInfo is available
            if (selectedOrder && !padPrintInfo) {
                const isPatternMissing = !manualPattern || manualPattern.trim() === '';
                const isColorMissing = !manualColor || manualColor.trim() === '';

                const isPatternNo = manualPattern?.trim().toUpperCase() === 'NO';
                const isColorNo = manualColor?.trim().toUpperCase() === 'NO';

                if ((isPatternMissing || isColorMissing) && !(isPatternNo && isColorNo)) {
                    setErrorMessage("Please select a Pad Print pattern and color, or set both to 'NO'.");
                    setOpenError(true);
                    return;
                }
            }

            // ❗ Require Production Center and Cutting Room Info
            if (!selectedProductionCenter || !selectedCuttingRoom) {
                setErrorMessage("Please select the Production Center and Cutting Room.");
                setOpenError(true);
                return;
            }


            // ✅ Proceed with valid mattress processing
            tables.forEach((table) => {
                table.rows.forEach((row) => {

                    // ✅ Generate Mattress Name (ORDER-AS-FABRICTYPE-001, 002, ...)
                    const itemTypeCode = table.spreading === "MANUAL" ? "MS" : "AS";
                    const mattressName = `${selectedOrder}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;

                    newMattressNames.add(mattressName); // ✅ Track UI rows

                    // ✅ Ensure numerical values are properly handled (convert empty strings to 0)
                    const layers = parseFloat(row.layers) || 0;
                    const markerLength = parseFloat(row.markerLength) || 0;
                    const lengthMattress = markerLength + (parseFloat(table.allowance) || 0); // ✅ Corrected calculation
                    const consPlanned = (lengthMattress * layers).toFixed(2); // ✅ Auto-calculated

                    const mattressData = {
                        mattress: mattressName,
                        order_commessa: selectedOrder,
                        fabric_type: table.fabricType,
                        fabric_code: table.fabricCode,
                        fabric_color: table.fabricColor,
                        dye_lot: row.bagno || null,
                        item_type: table.spreading === "MANUAL" ? "MS" : "AS",
                        spreading_method: table.spreadingMethod,

                        // ✅ New fields for structure integrity
                        table_id: table.id,
                        row_id: row.id,
                        sequence_number: row.sequenceNumber,


                        layers: layers,
                        length_mattress: lengthMattress,
                        cons_planned: consPlanned,
                        extra: parseFloat(table.allowance) || 0,
                        marker_name: row.markerName,
                        marker_width: parseFloat(row.width) || 0,
                        marker_length: markerLength,
                        operator: username
                    };

                    // ✅ Generate mattress_sizes data if you have row.piecesPerSize
                    if (row.piecesPerSize) {
                        Object.entries(row.piecesPerSize).forEach(([size, pcs_layer]) => {
                            mattressData.sizes = mattressData.sizes || []; // Initialize the sizes array if not already present
                            mattressData.sizes.push({
                                style : selectedStyle,
                                size: size,
                                pcs_layer: pcs_layer,
                                pcs_planned: pcs_layer * layers, // Total planned pcs
                                pcs_actual: null                // Will be filled later
                            });
                        });
                    }

                    payloads.push(mattressData);
                });
            });

            alongTables.forEach((table) => {
                table.rows.forEach((row) => {
                    // ✅ Build unique collaretto (along) name WITH padded index
                    const collarettoName = `${selectedOrder}-CA-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;
                    newAlongNames.add(collarettoName);

                    // ✅ Build the payload for this row
                    const payload = {
                        collaretto: collarettoName,
                        order_commessa: selectedOrder,
                        fabric_type: table.fabricType,
                        fabric_code: table.fabricCode,
                        fabric_color: table.fabricColor,
                        dye_lot: row.bagno || null,  // ✅ Pull bagno directly from the row
                        item_type: "CA",
                        extra: parseFloat(table.alongExtra),

                        table_id: table.id,
                        row_id: row.id,
                        sequence_number: row.sequenceNumber,

                        details: [
                            {
                                mattress_id: null,
                                pieces: parseFloat(row.pieces) || 0,
                                usable_width: parseFloat(row.usableWidth) || 0,
                                roll_width: parseFloat(row.collarettoWidth) || 0,
                                gross_length: parseFloat(row.theoreticalConsumption) || 0,
                                scrap_rolls: parseFloat(row.scrapRoll) || 0,
                                rolls_planned: parseFloat(row.rolls) || null,
                                rolls_actual: null,
                                cons_planned: parseFloat(row.consumption) || null,
                                cons_actual: null,
                                extra: parseFloat(table.alongExtra) || 0,
                                total_collaretto: parseFloat(row.metersCollaretto) || 0
                            }
                        ]
                    };

                    allongPayloads.push(payload);
                });
            });

            weftTables.forEach((table) => {
                table.rows.forEach((row, rowIndex) => {
                    // ✅ Build unique collaretto (weft) name WITH padded index
                    const collarettoWeftName = `${selectedOrder}-CW-${table.fabricType}-${String(rowIndex + 1).padStart(3, '0')}`;
                    newWeftNames.add(collarettoWeftName);

                    const mattressName = `${selectedOrder}-ASW-${table.fabricType}-${String(rowIndex + 1).padStart(3, '0')}`;

                    // ✅ Build the payload for this weft row
                    const payload = {
                        collaretto: collarettoWeftName,
                        mattress: mattressName,
                        order_commessa: selectedOrder,
                        fabric_type: table.fabricType,
                        fabric_code: table.fabricCode,
                        fabric_color: table.fabricColor,
                        dye_lot: row.bagno || null,  // ✅ Pull bagno directly from the row
                        item_type: "CW",  // ✅ Custom type for Collaretto Weft
                        details: [
                            {
                                pieces: parseFloat(row.pieces) || 0,
                                usable_width: parseFloat(row.usableWidth) || 0,
                                gross_length: parseFloat(row.grossLength) || 0,
                                panel_length: parseFloat(row.panelLength) || 0,
                                roll_width: parseFloat(row.collarettoWidth) || 0,
                                scrap_rolls: parseFloat(row.scrapRoll) || 0,
                                rolls_planned: parseFloat(row.rolls) || null,
                                rolls_actual: null,
                                panels_planned: parseFloat(row.panels) || null,
                                cons_planned: parseFloat(row.consumption) || null,
                                cons_actual: null,
                                extra: parseFloat(table.weftExtra) || 0
                            }
                        ]
                    };

                    weftPayloads.push(payload);
                });
            });

            // ✅ Send Update Requests
            const saveMattresses = () => {
                return Promise.all(payloads.map(payload =>
                    axios.post('/mattress/add_mattress_row', payload)
                        .then(response => {
                            if (response.data.success) {
                                console.log(`✅ Mattress ${payload.mattress} saved successfully.`);
                                return true;
                            } else {
                                console.warn(`⚠️ Failed to save mattress ${payload.mattress}:`, response.data.message);
                                return false;
                            }
                        })
                        .catch(error => {
                            console.error(`❌ Error saving mattress ${payload.mattress}:`, error.response?.data || error.message);
                            console.log("💥 Full payload that caused failure:", payload);
                            return false;
                        })
                )).then(results => {
                    const allSucceeded = results.every(result => result === true);
                    if (!allSucceeded) throw new Error("❌ Some mattresses failed to save.");
                });
            };

            // ✅ Send Along Update Requests
            const saveAlongRows = () => {
                return Promise.all(allongPayloads.map(payload =>
                    axios.post('/collaretto/add_along_row', payload)
                        .then(response => {
                            if (response.data.success) {
                                console.log(`✅ Along Row ${payload.collaretto} saved successfully.`);
                                return true;
                            } else {
                                console.warn(`⚠️ Failed to save along row ${payload.collaretto}:`, response.data.message);
                                return false;
                            }
                        })
                        .catch(error => {
                            console.error(`❌ Error saving along row ${payload.collaretto}:`, error);
                            return false;
                        })
                )).then(results => {
                    const allSucceeded = results.every(result => result === true);
                    if (!allSucceeded) throw new Error("❌ Some along rows failed to save.");
                });
            };

            // ✅ Send Weft Update Requests
            const saveWeftRows = () => {
                return Promise.all(weftPayloads.map(payload =>
                    axios.post('/collaretto/add_weft_row', payload)
                        .then(response => {
                            if (response.data.success) {
                                console.log(`✅ Weft Row ${payload.collaretto} saved successfully.`);
                                return true;
                            } else {
                                console.warn(`⚠️ Failed to save weft row ${payload.collaretto}:`, response.data.message);
                                return false;
                            }
                        })
                        .catch(error => {
                            console.error(`❌ Error saving weft row ${payload.collaretto}:`, error);
                            return false;
                        })
                )).then(results => {
                    const allSucceeded = results.every(result => result === true);
                    if (!allSucceeded) throw new Error("❌ Some weft rows failed to save.");
                });
            };

            if (!padPrintInfo && manualPattern && manualColor) {
                try {
                    await axios.post('/padprint/create', {
                        brand: brand?.toUpperCase(),
                        style: selectedStyle,
                        color: selectedColorCode,
                        season: selectedSeason,
                        pattern: manualPattern,
                        padprint_color: manualColor
                    });
                } catch (error) {
                    if (error.response?.status === 409) {
                        console.warn('⚠️ Pad Print entry already exists. Skipping creation.');
                    } else {
                        console.error('❌ Failed to save manual Pad Print info:', error);
                        setErrorMessage("⚠️ Failed to save manual Pad Print info. Please try again.");
                        setOpenError(true);
                        return;
                    }
                }
            }

            try {
                await axios.post('/orders/production_center/save', {
                    order_commessa: selectedOrder,
                    production_center: selectedProductionCenter,
                    cutting_room: selectedCuttingRoom,
                    destination: selectedDestination || null
                });
            } catch (error) {
                console.error("❌ Failed to save Production Center info:", error);
                setErrorMessage("⚠️ Failed to save Production Center info. Please try again.");
                setOpenError(true);
                return;
            }

            saveMattresses()
                .then(() => saveAlongRows())
                .then(() => saveWeftRows())
                .then(() => {
                    // ✅ Delete Only Rows That Were Removed from UI
                    console.log("🗑️ Mattresses to delete:", deletedMattresses);
                    const mattressesToDelete = deletedMattresses.filter(mattress => !newMattressNames.has(mattress));

                    return Promise.allSettled(mattressesToDelete.map(mattress =>
                        axios.delete(`/mattress/delete/${mattress}`)
                          .then(() => {
                            console.log(`🗑️ Deleted mattress: ${mattress}`);
                            return { mattress, success: true };
                          })
                          .catch(error => {
                            console.error(`❌ Error deleting mattress: ${mattress}`, error);
                            return { mattress, success: false };
                          })
                      )).then(results => {
                        const successfulDeletes = results
                          .filter(r => r.status === 'fulfilled' && r.value.success)
                          .map(r => r.value.mattress);

                        setDeletedMattresses(prev =>
                          prev.filter(name => !successfulDeletes.includes(name))
                        );
                    });
                })
                .then(() => {
                    // ✅ Delete Only Along Rows Removed from the UI
                    console.log("🗑️ Along Rows to delete:", deletedAlong);
                    const alongToDelete = deletedAlong.filter(along => !newAlongNames.has(along));

                    return Promise.all(alongToDelete.map(along =>
                        axios.delete(`/collaretto/delete/${along}`)
                            .then(() => {
                                console.log(`🗑️ Deleted along row: ${along}`);
                            })
                            .catch(error => {
                                console.error(`❌ Error deleting along row: ${along}`, error);
                                throw error;
                            })
                    ));
                })
                .then(() => {
                    // ✅ Delete Only Weft Rows Removed from the UI
                    console.log("🗑️ Weft Rows to delete:", deletedWeft);
                    const weftToDelete = deletedWeft.filter(weft => !newWeftNames.has(weft));

                    return Promise.all(weftToDelete.map(weft =>
                        axios.delete(`/collaretto/delete_weft/${weft}`)
                            .then(() => {
                                console.log(`🗑️ Deleted weft row: ${weft}`);
                            })
                            .catch(error => {
                                console.error(`❌ Error deleting weft row: ${weft}`, error);
                                throw error;
                            })
                    ));
                })
                .then(() => {
                    setDeletedAlong([]);
                    setDeletedWeft([]);
                    setUnsavedChanges(false);

                    setSuccessMessage("Saving completed successfully!");
                    setOpenSuccess(true);
                })
                .catch((error) => {
                    console.error("🚨 Final Save Error:", error);
                    setErrorMessage("⚠️ An error occurred while saving. Please try again.");
                    setOpenError(true);
                });
        } catch (error) {
            console.error("🚨 Final Save Error:", error);
                setErrorMessage("⚠️ An error occurred while saving. Please try again.");
                setOpenError(true);
        } finally {
            setSaving(false); // ✅ always re-enable the button
        }
    };

    // Average Consumption for each Specific Table
    const calculateTableAverageConsumption = (table) => {
        if (!table || !table.rows || table.rows.length === 0) return 0;

        const plannedQuantities = getTablePlannedQuantities(table) || {};
        const totalPlannedPcs = Object.values(plannedQuantities)
          .reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0);

        const totalConsPlanned = table.rows
            .filter(row => !isNaN(parseFloat(row.expectedConsumption)) && parseFloat(row.expectedConsumption) > 0)
            .reduce((sum, row) => sum + parseFloat(row.expectedConsumption), 0);

        if (totalPlannedPcs === 0) return 0;

        const avgConsumption = totalConsPlanned / totalPlannedPcs;

        return Number(avgConsumption.toFixed(2));
      };

    const isTableEditable = (table) => {
        return table.rows.every(row => row.isEditable !== false);
    };

    return (
        <>
            <Box
                sx={{
                    position: isPinned ? 'sticky' : 'relative',
                    top: isPinned ? 85 : 'auto',
                    zIndex: isPinned ? 1000 : 'auto',
                }}
            >
                <MainCard title="Order Planning">

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
                        orderOptions={filteredOrders}
                        selectedOrder={selectedOrder}
                        onOrderChange={handleOrderChange}
                        selectedSeason={selectedSeason}
                        selectedBrand={brand}
                        selectedColorCode={selectedColorCode}
                    />

                    {/* Order Quantities Section */}
                    <OrderQuantities orderSizes={orderSizes} italianRatios={italianRatios} />

                </MainCard>
            </Box>

            <Box mt={2} />

            {selectedOrder && (
                <CuttingRoomSelector
                    productionCenter={selectedProductionCenter}
                    setProductionCenter={setSelectedProductionCenter}
                    cuttingRoom={selectedCuttingRoom}
                    setCuttingRoom={setSelectedCuttingRoom}
                    destination={selectedDestination}
                    setDestination={setSelectedDestination}
                />
            )}

            <Box mt={2} />

            {selectedOrder && (
                <>
                    {/* Pad Print Section */}
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
                                {`Mattress Group ${tableIndex + 1}`}

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
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Along Tables Section */}
            {alongTables.length > 0 && alongTables.map((table) => (
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
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Weft Tables Section */}
            {weftTables.length > 0 && weftTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                    <Box mt={2} />
                    <MainCard title={`Collaretto Weft`}>

                        <Box p={1}>
                            <Grid container spacing={2}>
                                {/* Fabric Type (Dropdown) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <Autocomplete
                                        options={fabricTypeOptions.filter(option =>
                                            !weftTables.some((t, i) => i !== tableIndex && t.fabricType === option) // ✅ Exclude fabricType already selected in other weftTables
                                        )}
                                        getOptionLabel={(option) => option}
                                        value={table.fabricType || null}
                                        onChange={(event, newValue) => {
                                            setWeftTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricType: newValue };
                                                return updatedTables;
                                            });
                                            setUnsavedChanges(true);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Fabric Type" variant="outlined" />}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& .MuiAutocomplete-input": { fontWeight: "normal" }
                                        }}
                                    />
                                </Grid>

                                {/* Fabric Code (Text Input) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <TextField
                                        label="Fabric Code"
                                        variant="outlined"
                                        value={table.fabricCode || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, 8);
                                            setWeftTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricCode: value };
                                                return updatedTables;
                                            });
                                            setUnsavedChanges(true);
                                        }}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& input": { fontWeight: "normal" }
                                        }}
                                    />
                                </Grid>

                                {/* Fabric Color (Text Input) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <TextField
                                        label="Fabric Color"
                                        variant="outlined"
                                        value={table.fabricColor || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
                                            setWeftTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricColor: value };
                                                return updatedTables;
                                            });
                                            setUnsavedChanges(true);
                                        }}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& input": { fontWeight: "normal" }
                                        }}
                                    />
                                </Grid>

                                {/* Extra (Text Input) */}
                                <Grid item xs={2} sm={1} md={1}>
                                    <TextField
                                        label="Extra %"
                                        variant="outlined"
                                        value={table.weftExtra || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 2); // ✅ Only digits, max 2
                                            handleWeftExtraChange(tableIndex, value);
                                            setUnsavedChanges(true);
                                        }}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& input": { fontWeight: "normal" }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ height: "50px" }}>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Pieces</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Usable Width [cm]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Gross Length [m]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Pcs Seam to Seam</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Panel Length [m]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Collaretto Width [mm]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Scrap Rolls</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>N° Rolls</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>N° Panels</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Cons [m]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Bagno</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {table.rows.map((row, rowIndex) => (
                                                <TableRow key={rowIndex}>

                                                    {/* Pieces (Editable Text Field) */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '2px 10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.pieces || ""}
                                                            onChange={(e) => {
                                                                handleWeftRowChange(tableIndex, rowIndex, "pieces", e.target.value.replace(/\D/g, '').slice(0, 7));
                                                                setUnsavedChanges(true);
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '90px',
                                                                maxWidth: '120px',
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" }
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Usable Width */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.usableWidth || ""}
                                                            onChange={(e) => {
                                                                handleWeftRowChange(tableIndex, rowIndex, "usableWidth", e.target.value.replace(/\D/g, '').slice(0, 3));
                                                                setUnsavedChanges(true);
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '90px', // ✅ Ensures a minimum width
                                                                maxWidth: '120px', // ✅ Prevents expanding too much
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Gross Length */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.grossLength || ""}
                                                            onChange={(e) => {
                                                                handleWeftRowChange(tableIndex, rowIndex, "grossLength", e.target.value.replace(/[^0-9.,]/g, ''));
                                                                setUnsavedChanges(true);
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '90px', // ✅ Ensures a minimum width
                                                                maxWidth: '120px', // ✅ Prevents expanding too much
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Pcs Seam to Seam */}
                                                    <TableCell align="center">
                                                        <Typography>{row.pcsSeamtoSeam || ""}</Typography>
                                                    </TableCell>

                                                    {/* Panel Length */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.panelLength || ""}
                                                            onChange={(e) => {
                                                                let value = e.target.value.replace(',', '.');  // ✅ Replace comma with dot
                                                                // ✅ Remove all except numbers and dots, prevent multiple dots
                                                                value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                                                handleWeftRowChange(tableIndex, rowIndex, "panelLength", value.slice(0, 4));
                                                                setUnsavedChanges(true);
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '90px', // ✅ Ensures a minimum width
                                                                maxWidth: '120px', // ✅ Prevents expanding too much
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Collaretto Width */}
                                                    <TableCell sx={{ minWidth: '65x', textAlign: 'center', padding: '10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.collarettoWidth || ""}
                                                            onChange={(e) => {
                                                                handleWeftRowChange(tableIndex, rowIndex, "collarettoWidth", e.target.value.replace(/\D/g, '').slice(0, 4));
                                                                setUnsavedChanges(true);
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '65px', // ✅ Ensures a minimum width
                                                                maxWidth: '150px', // ✅ Prevents expanding too much
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Srap Roll */}
                                                    <TableCell sx={{ minWidth: '65x', textAlign: 'center', padding: '10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.scrapRoll || ""}
                                                            onChange={(e) => {
                                                                handleWeftRowChange(tableIndex, rowIndex, "scrapRoll", e.target.value.replace(/\D/g, '').slice(0, 1));
                                                                setUnsavedChanges(true);
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '65px', // ✅ Ensures a minimum width
                                                                maxWidth: '150px', // ✅ Prevents expanding too much
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* N° Rolls */}
                                                    <TableCell align="center">
                                                        <Typography>{row.rolls || ""}</Typography>
                                                    </TableCell>

                                                    {/* N° Panels */}
                                                    <TableCell align="center">
                                                        <Typography>{row.panels || ""}</Typography>
                                                    </TableCell>

                                                    {/* Consumption */}
                                                    <TableCell align="center">
                                                        <Typography>{row.consumption && row.consumption !== "0.00" ? row.consumption : ""}</Typography>
                                                    </TableCell>

                                                    {/* Bagno (Editable Text Field) */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '2px 10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.bagno || ""}
                                                            onChange={(e) => {
                                                                handleWeftRowChange(tableIndex, rowIndex, "bagno", e.target.value);
                                                                setUnsavedChanges(true);
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '90px',
                                                                maxWidth: '120px',
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" }
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Delete Button */}
                                                    <TableCell>
                                                        <IconButton
                                                            onClick={() => handleRemoveWeftRow(tableIndex, rowIndex)}
                                                            color="error"
                                                            disabled={weftTables[tableIndex].rows.length === 1} // ✅ Disable when only 1 row left
                                                        >
                                                            <DeleteOutline />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                            </TableContainer>

                            {/* Button Container (Flexbox for alignment) */}
                            <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
                                {/* Add Row Button */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddCircleOutline />}
                                    onClick={() => handleAddRowWeft(tableIndex)} // ✅ Pass the specific table index
                                >
                                    Add Row
                                </Button>

                                {/* Remove Table Button */}
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleRemoveWeft(table.id)}
                                >
                                    Remove
                                </Button>
                            </Box>
                        </Box>
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
                        Add Mattress
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary" // ✅ Different color to distinguish it
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddAlong}
                    >
                        Add Collaretto Along Grain (Ordito)
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary" // ✅ Different color to distinguish it
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddWeft}
                    >
                        Add Collaretto Weft (Trama)
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary" // ✅ Different color to distinguish it
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddWeft}
                    >
                        Add Collaretto Bias (Sbieco)
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
                    Unsaved Changes
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="unsaved-changes-dialog-description">
                        You have unsaved changes, either save or delete them.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUnsavedDialog} color="primary" variant="contained">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OrderPlanning;
