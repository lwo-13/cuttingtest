import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button, Snackbar, Alert } from '@mui/material';
import { AddCircleOutline, DeleteOutline, Save, Print } from '@mui/icons-material';
import MainCard from '../../ui-component/cards/MainCard';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from "react-redux";

const sampleLaboratorio = [
    { id: "VEN000", name: "ZALLI" },
    { id: "VEN001", name: "DELITSIYA FASHION LTD" },
    { id: "VEN002", name: "IDEAL FASHION LTD" },
    { id: "VEN003", name: "SYNA FASHION LTD" },
    { id: "VEN004", name: "VEGA TEX LTD" },
    { id: "VEN005", name: "ZEYNTEX OOD" },
];

// Sample Fabric Types
const fabricTypeOptions = ["01", "02", "03", "04", "05", "06"];

const OrderPlanning = () => {
    const [orderOptions, setOrderOptions] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedLaboratorio, setSelectedLaboratorio] = useState(null);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedSeason, setSelectedSeason] = useState("");
    const [selectedColorCode, setSelectedColorCode] = useState("");
    const [orderSizes, setOrderSizes] = useState([]); // ✅ Stores full objects (for qty display)
    const [orderSizeNames, setOrderSizeNames] = useState([]); // ✅ Stores only size names (for table columns)
    const [fabricType, setFabricType] = useState(null);
    const [fabricCode, setFabricCode] = useState("");
    const [fabricColor, setFabricColor] = useState("");
    const [alongExtra, setalongExtra] = useState("");
    const [markerOptions, setMarkerOptions] = useState([]);
    const [spreadingMethod, setSpreadingMethod] = useState(null);
    const [allowance, setAllowance] = useState("");
    const [deletedMattresses, setDeletedMattresses] = useState([]);
    const [deletedAlong, setDeletedAlong] = useState([]);
    const [deletedWeft, setDeletedWeft] = useState([]);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [avgConsumption, setAvgConsumption] = useState({});
    
    const [tables, setTables] = useState([]); 

    const [weftTables, setWeftTables] = useState([]);

    const [alongTables, setAlongTables] = useState([]);

    const [errorMessage, setErrorMessage] = useState("");
    const [openError, setOpenError] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [openSuccess, setOpenSuccess] = useState(false);

    const [padPrintInfo, setPadPrintInfo] = useState(null); 

    const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]; // Custom order for letter sizes

    const handleCloseError = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpenError(false);
    };

    const handleCloseSuccess = (event, reason) => {
        if (reason === "clickaway") return;
        setOpenSuccess(false);
    };

    const sortSizes = (sizes) => {
        return sizes.sort((a, b) => {
            const sizeA = a.size;
            const sizeB = b.size;
    
            // If both are numbers, sort numerically
            if (!isNaN(sizeA) && !isNaN(sizeB)) {
                return parseInt(sizeA) - parseInt(sizeB);
            }
    
            // If both are letters, sort by predefined order
            const indexA = sizeOrder.indexOf(sizeA);
            const indexB = sizeOrder.indexOf(sizeB);
    
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
    
            // If one is a number and the other is a letter, prioritize letters first
            if (!isNaN(sizeA)) return 1;
            if (!isNaN(sizeB)) return -1;
    
            // Default to alphabetical order for unknown cases
            return sizeA.localeCompare(sizeB);
        });
    };

    /* fix this */
    const handleAddTable = () => {
        setTables(prevTables => [
            ...prevTables,
            {
                id: uuidv4(),  // ✅ Unique ID for each table
                fabricType: "",
                fabricCode: "",
                fabricColor: "",
                spreadingMethod: "",
                rows: [{
                    width: "",
                    markerName: "",
                    piecesPerSize: {},
                    markerLength: "",
                    allowance: "",
                    efficiency: "",
                    layers: "",
                    expectedConsumption: "",
                    bagno: ""
                }]
            }
        ]);
    };

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

    const handleAddAlong = () => {
        setAlongTables(prevTables => [
            ...prevTables, 
            {
                id: uuidv4(), // Unique ID
                fabricType: "",
                fabricCode: "",
                fabricColor: "",
                alongExtra: "3",  // ✅ Default Extra % to 3 if you want
                rows: [
                    {
                        pieces: "",
                        usableWidth: "",
                        theoreticalConsumption: "",
                        collarettoWidth: "",
                        scrapRoll: "",
                        rolls: "",
                        metersCollaretto: "",
                        consumption: "",
                        bagno: ""
                    }
                ]
            }
        ]);
        setUnsavedChanges(true);
    };

    const handleRemoveTable = (id) => {
        setTables(prevTables => {
            const updatedTables = prevTables.filter(table => table.id !== id);
    
            // ✅ Find the table being removed
            const removedTable = prevTables.find(table => table.id === id);
    
            if (removedTable) {
                // ✅ Push ALL mattressNames of this table to deletedMattresses
                removedTable.rows.forEach(row => {
                    if (row.mattressName) {
                        setDeletedMattresses(prev => [...prev, row.mattressName]);
                    }
                });
            }
    
            setUnsavedChanges(true);
            return updatedTables;
        });
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

    const handleRemoveAlong = (id) => {
        setAlongTables(prevTables => {
            const updatedTables = prevTables.filter(table => table.id !== id);
    
            // ✅ Find the table being removed
            const removedTable = prevTables.find(table => table.id === id);
    
            if (removedTable) {
                // ✅ Push ALL backend collaretto names of this table to deletedAlong
                removedTable.rows.forEach(row => {
                    if (row.collarettoName) {
                        setDeletedAlong(prev => [...prev, row.collarettoName]);
                    }
                });
            }
    
            setUnsavedChanges(true);
            return updatedTables;
        });
    };

    const fetchPadPrintInfo = async (season, style, color) => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/api/padprint/all");
            const data = response.data;
    
            const matchingPadPrint = data.find((p) =>
                p.season === season &&
                p.style === style &&
                p.color === color
            );
    
            setPadPrintInfo(matchingPadPrint || null);
        } catch (err) {
            console.error("Error fetching pad print:", err);
        }
    };

    // Fetch order data from Flask API 
    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/orders/order_lines')
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
                } else {
                    console.error("Failed to fetch orders");
                }
            })
            .catch(error => console.error("Error fetching order data:", error));
    }, []);
    
    // Fetch marker data from Flask API 
    useEffect(() => {
        if (!selectedOrder) return;  // ✅ Do nothing if no order is selected
    
        console.log("Fetching marker headers...");  // ✅ Debugging
    
        axios.get(`http://127.0.0.1:5000/api/markers/marker_headers_planning?style=${encodeURIComponent(selectedStyle)}`)  // ✅ Fetch only when order changes
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
            setSelectedStyle(newValue.style);
            setSelectedSeason(newValue.season);
            setSelectedColorCode(newValue.colorCode);
    
            console.log(`🔍 Fetching mattresses for order: ${newValue.id}`);

            // ✅ Fetch Pad Print Info based on order attributes
            fetchPadPrintInfo(newValue.season, newValue.style, newValue.colorCode);
    
            // Fetch mattresses and markers in parallel
            Promise.all([
                axios.get(`http://127.0.0.1:5000/api/mattress/get_by_order/${newValue.id}`),  // Fetch mattresses
                axios.get(`http://127.0.0.1:5000/api/markers/marker_headers_planning?style=${newValue.style}`),  // Fetch markers
                axios.get(`http://127.0.0.1:5000/api/collaretto/get_by_order/${newValue.id}`),
                axios.get(`http://127.0.0.1:5000/api/collaretto/get_weft_by_order/${newValue.id}`)
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
    
                    // Group mattresses by fabric type
                    const tablesByFabricType = {};
    
                    mattressResponse.data.data.forEach((mattress) => {
                        const fabricType = mattress.fabric_type;
    
                        if (!tablesByFabricType[fabricType]) {
                            tablesByFabricType[fabricType] = {
                                id: Object.keys(tablesByFabricType).length + 1,
                                fabricType: fabricType,
                                fabricCode: mattress.fabric_code,
                                fabricColor: mattress.fabric_color,
                                spreadingMethod: mattress.spreading_method,
                                allowance: parseFloat(mattress.allowance) || 0,
                                rows: []
                            };
                        }
    
                        // Get marker details for this mattress
                        const markerDetails = markersMap[mattress.marker_name];
    
                        // Add mattress row with all necessary data (including marker details)
                        tablesByFabricType[fabricType].rows.push({
                            mattressName: mattress.mattress,
                            width: markerDetails ? markerDetails.marker_width : "",
                            markerName: mattress.marker_name,
                            markerLength: markerDetails ? markerDetails.marker_length : "",
                            efficiency: markerDetails ? markerDetails.efficiency : "",
                            piecesPerSize: markerDetails ? markerDetails.size_quantities || {} : {},
                            layers: mattress.layers || "",
                            expectedConsumption: "",
                            bagno: mattress.dye_lot
                        });
                    });
    
                    // Convert to array and set tables
                    const loadedTables = Object.values(tablesByFabricType);
                    setTables(loadedTables);

                    if (alongResponse.data.success) {
                        console.log("✅ Along (Collaretto) Loaded:", alongResponse.data.data);
                    
                        // ✅ Group along by fabric type
                        const alongTablesByFabricType = {};
                    
                        alongResponse.data.data.forEach((along) => {
                            const fabricType = along.fabric_type;
                    
                            // If this fabric type group doesn't exist, create it
                            if (!alongTablesByFabricType[fabricType]) {
                                alongTablesByFabricType[fabricType] = {
                                    id: Object.keys(alongTablesByFabricType).length + 1,
                                    fabricType: fabricType,
                                    fabricCode: along.fabric_code,
                                    fabricColor: along.fabric_color,
                                    alongExtra: along.details.extra,  // ✅ Optional: You can manage this logic if extra varies
                                    rows: []
                                };
                            }
                    
                            // Push this collaretto row inside the correct fabric group
                            alongTablesByFabricType[fabricType].rows.push({
                                collarettoName: along.collaretto,
                                pieces: along.details.pieces,
                                usableWidth: along.details.usable_width,
                                theoreticalConsumption: along.details.gross_length,
                                collarettoWidth: along.details.roll_width,
                                scrapRoll: along.details.scrap_rolls,
                                rolls: along.details.rolls_planned,
                                metersCollaretto: along.details.total_collaretto,
                                consumption: along.details.cons_planned,
                                bagno: along.dye_lot
                            });
                        });
                    
                        // ✅ Convert to array
                        const loadedAlongTables = Object.values(alongTablesByFabricType);
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

                    // ✅ Automatically update expected consumption for all rows
                    setTimeout(() => {
                        loadedTables.forEach((table, tableIndex) => {
                            table.rows.forEach((row, rowIndex) => {
                                updateExpectedConsumption(tableIndex, rowIndex);
                            });
                        });
                    }, 100); // Small delay to ensure state update has completed

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
            setFabricType(null);
            setSpreadingMethod(null);
            setAllowance("");
            setSelectedStyle("");
            setSelectedSeason("");
            setSelectedColorCode("");
            setPadPrintInfo(null);

            setUnsavedChanges(false);
        }
    };
    
    // Function to add a new row
    /* fix this */
    const handleAddRow = (tableIndex) => {
        setTables(prevTables => {
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
                                efficiency: "",
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

    const handleAddRowAlong = (tableIndex) => {
        setAlongTables(prevTables => {
            return prevTables.map((table, index) => {
                if (index === tableIndex) {
                    return {
                        ...table,
                        rows: [
                            ...table.rows,
                            {
                                pieces: "",
                                usableWidth: "",
                                theoreticalConsumption: "",
                                collarettoWidth: "",
                                scrapRoll: "",
                                rolls: "",
                                metersCollaretto: "",
                                consumption: "",
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
    
    const handleRemoveRow = (tableIndex, rowIndex) => {
        setTables(prevTables => {
            return prevTables.map((table, tIndex) => {
                if (tIndex === tableIndex) {
                    const deletedRow = table.rows[rowIndex];
    
                    // ✅ If the row has a valid mattress name, add it to the delete list
                    if (deletedRow.mattressName) {
                        setDeletedMattresses(prevDeleted => [...prevDeleted, deletedRow.mattressName]);
                    }

                    setUnsavedChanges(true);  // ✅ Mark as unsaved when a row is deleted
    
                    return {
                        ...table,
                        rows: table.rows.filter((_, i) => i !== rowIndex)
                    };
                }
                return table;
            });
        });
    };

    const handleRemoveAlongRow = (tableIndex, rowIndex) => {
        setAlongTables(prevTables => {
            return prevTables.map((table, tIndex) => {
                if (tIndex === tableIndex) {
                    const deletedRow = table.rows[rowIndex];

                    // ✅ If the row has a valid collaretto name, track it
                    if (deletedRow.collarettoName) {
                        setDeletedAlong(prevDeleted => [...prevDeleted, deletedRow.collarettoName]);
                    }

                    setUnsavedChanges(true);  // ✅ Mark as unsaved when a row is deleted
                    
                    return {
                        ...table,
                        rows: table.rows.filter((_, i) => i !== rowIndex) // ✅ Remove row
                    };
                }
                return table;
            });
        });
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

    const handleInputChange = (tableIndex, rowIndex, field, value) => {
        setTables(prevTables => {
            if (!prevTables[tableIndex]) return prevTables; // ✅ Prevents errors if tableIndex is invalid
    
            const updatedTables = [...prevTables];
            const updatedTable = { ...updatedTables[tableIndex] };
    
            if (!updatedTable.rows || !updatedTable.rows[rowIndex]) return prevTables; // ✅ Prevents errors if rowIndex is invalid
    
            const updatedRows = [...updatedTable.rows];
    
            // ✅ Update field value
            updatedRows[rowIndex] = { 
                ...updatedRows[rowIndex], 
                [field]: value 
            };
    
            // ✅ If field is "layers" or "markerLength", update Expected Consumption
            if (field === "layers" || field === "markerLength") {
                const markerLength = parseFloat(updatedRows[rowIndex].markerLength) || 0;
                const layers = parseInt(updatedRows[rowIndex].layers) || 0;
                updatedRows[rowIndex].expectedConsumption = (markerLength * layers).toFixed(2);
            }
    
            updatedTable.rows = updatedRows;
            updatedTables[tableIndex] = updatedTable;
    
            setUnsavedChanges(true);  // ✅ Mark the form as having unsaved changes
    
            return updatedTables;
        });
    };

    const handleWeftRowChange = (tableIndex, rowIndex, field, value) => {
        setWeftTables(prevTables => {
            const updatedTables = [...prevTables];
            const updatedRows = [...updatedTables[tableIndex].rows];
            const updatedRow = { ...updatedRows[rowIndex], [field]: value };
    
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
        setUnsavedChanges(true);
    };

    const handleAlongRowChange = (tableIndex, rowIndex, field, value) => {
        setAlongTables(prevTables => {
            const updatedTables = [...prevTables];
            const updatedRows = [...updatedTables[tableIndex].rows];
    
            // ✅ Update the specific field
            const updatedRow = { ...updatedRows[rowIndex], [field]: value };
    
            // ✅ Convert required values to numbers (default to 0 if empty)
            const usableWidth = parseFloat(updatedRow.usableWidth) || 0;
            const collarettoWidth = (parseFloat(updatedRow.collarettoWidth) || 1) / 10; // Avoid division by 0
            const pieces = parseFloat(updatedRow.pieces) || 0;
            const theoreticalConsumption = parseFloat(updatedRow.theoreticalConsumption) || 0;
            const extraPercentage = parseFloat(updatedRow.extraPercentage) || 1; // Default 1 (100%)
            const scrap = parseFloat(updatedRow.scrapRoll) || 0;
    
            // ✅ Calculate Koturi per Roll (round down)
            updatedRow.rolls = collarettoWidth > 0 ? Math.floor(usableWidth / collarettoWidth) - scrap : 0;
    
            // ✅ Calculate Meters of Collaretto
            updatedRow.metersCollaretto = (pieces * theoreticalConsumption * extraPercentage).toFixed(1);
    
            // ✅ Calculate Consumption
            updatedRow.consumption = updatedRow.rolls > 0
                ? (updatedRow.metersCollaretto / updatedRow.rolls).toFixed(1) // Round to 1 decimals
                : "0";
    
            // ✅ Save updated row in copied array
            updatedRows[rowIndex] = updatedRow;
            updatedTables[tableIndex] = { ...updatedTables[tableIndex], rows: updatedRows };
    
            return updatedTables; // ✅ Return new state to trigger React re-render
        });
    };
    
    const handleAlongExtraChange = (tableIndex, value) => {
        setAlongTables(prevTables => {
            const updatedTables = [...prevTables];
    
            // ✅ Update `alongExtra` in the selected table
            updatedTables[tableIndex] = { ...updatedTables[tableIndex], alongExtra: value };
    
            // ✅ Convert Extra % into a multiplier (e.g., 10% → 1.10)
            const extraMultiplier = 1 + (parseFloat(value) / 100) || 1;
    
            // ✅ Update all rows in this table
            updatedTables[tableIndex].rows = updatedTables[tableIndex].rows.map(row => {
                const pieces = parseFloat(row.pieces) || 0;
                const theoreticalConsumption = parseFloat(row.theoreticalConsumption) || 0;
    
                // ✅ Apply Extra % increase
                row.metersCollaretto = (pieces * theoreticalConsumption * extraMultiplier).toFixed(1);
    
                // ✅ Update `consumption`
                row.consumption = row.rolls > 0
                    ? (row.metersCollaretto / row.rolls).toFixed(1)
                    : "0";
    
                return row;
            });
    
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

    // ✅ New function to handle delayed calculation
    const updateExpectedConsumption = (tableIndex, rowIndex) => {
        setTables(prevTables => {
            const updatedTables = [...prevTables];
    
            // ✅ Clear existing timeout
            clearTimeout(updatedTables[tableIndex].rows[rowIndex].timeout);
    
            updatedTables[tableIndex].rows[rowIndex].timeout = setTimeout(() => {
                const tableAllowance = parseFloat(updatedTables[tableIndex].allowance) || 0;
                const markerLength = (parseFloat(updatedTables[tableIndex].rows[rowIndex].markerLength) || 0) + tableAllowance;
                const layers = parseInt(updatedTables[tableIndex].rows[rowIndex].layers) || 0;
    
                // ✅ Update expected consumption first
                updatedTables[tableIndex].rows[rowIndex].expectedConsumption = (markerLength * layers).toFixed(1);
    
                // ✅ Update tables first
                setTables([...updatedTables]);
    
                // ✅ Then update avgConsumption for the affected table
            }, 500);
    
            return updatedTables;
        });
    };

    useEffect(() => {
        if (!tables || tables.length === 0) return; // ✅ Prevent unnecessary runs
    
        const newAvgConsumption = tables.map(table => calculateTableAverageConsumption(table));
    
        setAvgConsumption([...newAvgConsumption]); // ✅ Ensures a new state reference
    }, [tables]);

    const username = useSelector((state) => state.account?.user?.username) || "Unknown";

    const handleSave = () => {
    
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

        // ✅ Proceed with valid mattress processing
        tables.forEach((table) => {
            table.rows.forEach((row, rowIndex) => {

                // ✅ Generate Mattress Name (ORDER-AS-FABRICTYPE-001, 002, ...)
                const mattressName = `${selectedOrder}-AS-${table.fabricType}-${String(rowIndex + 1).padStart(3, '0')}`;
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
                    dye_lot: row.bagno,
                    item_type: "AS",
                    spreading_method: table.spreadingMethod,
                    layers: layers,
                    length_mattress: lengthMattress, // ✅ Updated: markerLength + allowance
                    cons_planned: consPlanned, // ✅ Auto-calculated
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
            table.rows.forEach((row, rowIndex) => {
                // ✅ Build unique collaretto (along) name WITH padded index
                const collarettoName = `${selectedOrder}-CA-${table.fabricType}-${String(rowIndex + 1).padStart(3, '0')}`;
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
        Promise.all(payloads.map(payload =>
            axios.post('http://127.0.0.1:5000/api/mattress/add_mattress_row', payload)
                .then(response => {
                    if (response.data.success) {
                        console.log(`✅ Mattress ${payload.mattress} saved successfully.`);
                    } else {
                        console.warn(`⚠️ Failed to save mattress ${payload.mattress}:`, response.data.message);
                        throw new Error(`Failed to save mattress ${payload.mattress}`);
                    }
                })
                .catch(error => {
                    console.error("❌ Error saving mattress:", error);
                    throw error; // ✅ Ensure Promise.all rejects if an error occurs
                })
        ))

        // ✅ Send Along Update Requests
        Promise.all(allongPayloads.map(payload =>
            axios.post('http://127.0.0.1:5000/api/collaretto/add_along_row', payload)
                .then(response => {
                    if (response.data.success) {
                        console.log(`✅ Along Row ${payload.collaretto} saved successfully.`);
                    } else {
                        console.warn(`⚠️ Failed to save along row ${payload.collaretto}:`, response.data.message);
                        throw new Error(`Failed to save along row ${payload.collaretto}`);
                    }
                })
                .catch(error => {
                    console.error(`❌ Error saving along row ${payload.collaretto}:`, error);
                    throw error; // Ensures Promise.all stops on failure
                })
        ))

        // ✅ Send Weft Update Requests
        Promise.all(weftPayloads.map(payload =>
            axios.post('http://127.0.0.1:5000/api/collaretto/add_weft_row', payload)
                .then(response => {
                    if (response.data.success) {
                        console.log(`✅ Weft Row ${payload.collaretto} saved successfully.`);
                    } else {
                        console.warn(`⚠️ Failed to save weft row ${payload.collaretto}:`, response.data.message);
                        throw new Error(`Failed to save weft row ${payload.collaretto}`);
                    }
                })
                .catch(error => {
                    console.error(`❌ Error saving weft row ${payload.collaretto}:`, error);
                    throw error; // ✅ Ensures Promise.all stops on failure
                })
        ))
        
        .then(() => {
            // ✅ Delete Only Rows That Were Removed from UI
            console.log("🗑️ Mattresses to delete:", deletedMattresses);

            const mattressesToDelete = deletedMattresses.filter(mattress => !newMattressNames.has(mattress));

            return Promise.all(mattressesToDelete.map(mattress =>
                axios.delete(`http://127.0.0.1:5000/api/mattress/delete/${mattress}`)
                    .then(() => {
                        console.log(`🗑️ Deleted mattress: ${mattress}`);
                    })
                    .catch(error => {
                        console.error(`❌ Error deleting mattress: ${mattress}`, error);
                        throw error; // ✅ Ensure Promise.all rejects if an error occurs
                    })
            ));
        })

        .then(() => {
            // ✅ Delete Only Along Rows Removed from the UI
            console.log("🗑️ Along Rows to delete:", deletedAlong);
        
            const alongToDelete = deletedAlong.filter(along => !newAlongNames.has(along));
        
            return Promise.all(alongToDelete.map(along =>
                axios.delete(`http://127.0.0.1:5000/api/collaretto/delete/${along}`)
                    .then(() => {
                        console.log(`🗑️ Deleted along row: ${along}`);
                    })
                    .catch(error => {
                        console.error(`❌ Error deleting along row: ${along}`, error);
                        throw error; // ✅ Ensures Promise.all rejects if any deletion fails
                    })
            ));
        })

        .then(() => {
            // ✅ Delete Only Weft Rows Removed from the UI
            console.log("🗑️ Weft Rows to delete:", deletedWeft);
        
            const weftToDelete = deletedWeft.filter(weft => !newWeftNames.has(weft));
        
            return Promise.all(weftToDelete.map(weft =>
                axios.delete(`http://127.0.0.1:5000/api/collaretto/delete_weft/${weft}`)
                    .then(() => {
                        console.log(`🗑️ Deleted weft row: ${weft}`);
                    })
                    .catch(error => {
                        console.error(`❌ Error deleting weft row: ${weft}`, error);
                        throw error; // ✅ Ensures Promise.all rejects if any deletion fails
                    })
            ));
        })

        .then(() => {
            // ✅ Reset state after successful save
            setDeletedMattresses([]);
            setDeletedAlong([]);    
            setDeletedWeft([]);   
            setUnsavedChanges(false);

            // ✅ Show success message
            setSuccessMessage("Saving completed successfully!");
            setOpenSuccess(true);
        })
        .catch(() => {
            // ❌ Show error if any API request fails
            setErrorMessage("An error occurred while saving. Please try again.");
            setOpenError(true);
        });
    };

    const getTablePlannedQuantities = (table) => {
        const plannedQuantities = {};
    
        table.rows.forEach(row => {
            Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
                const layers = parseInt(row.layers) || 0;
                const pieces = parseInt(pcs) || 0;
                plannedQuantities[size] = (plannedQuantities[size] || 0) + (pieces * layers);
            });
        });
    
        return plannedQuantities;
    };

    /* Function to Calculate Average Consumption for a Specific Table */
    const calculateTableAverageConsumption = (table) => {
        if (!table || !table.rows || table.rows.length === 0) return 0; // ✅ Prevent crashes
    
        // ✅ Get planned quantities safely
        const plannedQuantities = getTablePlannedQuantities(table) || {};
        const totalPlannedPcs = Object.values(plannedQuantities).reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0);
    
        // ✅ Sum all expected consumption for this table
        const totalConsPlanned = table.rows.reduce(
            (sum, row) => sum + (parseFloat(row.expectedConsumption) || 0), 0
        );
    
        if (totalPlannedPcs === 0) {
            return 0;
        }
        const avgConsumption = totalConsPlanned / totalPlannedPcs;
        return avgConsumption.toFixed(2); // ✅ Ensure 2 decimal places
    };
    
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            @media print {
                body {
                    zoom: 60%; /* Adjust if necessary */
                }
                .scrollbar-container, .navbar, .buttons, .floating-action-button, .MuiButtonBase-root {
                    display: none !important;
                }
                .main-content, .MuiContainer-root, .MuiGrid-root {
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .MuiTableContainer-root {
                    overflow: visible !important;
                }
            }
        `;
        document.head.appendChild(style);
    }, []);
    
    const handlePrint = () => {
        // Temporarily collapse menu
        document.body.classList.add("print-mode");
    
        setTimeout(() => {
            window.print();
            document.body.classList.remove("print-mode"); // Restore after printing
        }, 300);
    };

    return (
        <>
            <MainCard title="Order Planning" sx={{ position: 'relative' }}>
                {/* Save Button (Positioned at the Top-Right) */}
                <Box sx={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>

                    {/* ✅ Show "Unsaved Changes" only if needed */}
                    {unsavedChanges && (
                        <Typography color="error" sx={{ fontWeight: 'bold' }}>
                            Unsaved Changes
                        </Typography>
                    )}

                    {/* Save Button */}
                    <Button 
                        variant="contained" 
                        sx={{
                            backgroundColor: unsavedChanges ? '#707070' : '#B0B0B0', // ✅ Darker color when unsaved changes exist
                            color: 'white', 
                            '&:hover': { backgroundColor: unsavedChanges ? '#505050' : '#A0A0A0' } // ✅ Even darker on hover if unsaved
                        }}
                        onClick={handleSave}
                        startIcon={<Save />}
                    >
                        Save
                    </Button>

                    {/* Print Button */}
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handlePrint} // ✅ Calls the print function
                        startIcon={<Print />} // ✅ Uses a Print icon
                    >
                        Print
                    </Button>
                </Box>

                <Grid container spacing={1} justifyContent="flex-start" alignItems="center">

                    {/* Order Selection (Searchable) */}
                    <Grid item xs={6} sm={4} md={2.5}>
                        <Autocomplete
                            options={orderOptions}
                            getOptionLabel={(option) => option.id}
                            value={orderOptions.find(order => order.id === selectedOrder) || null}
                            onChange={handleOrderChange}
                            renderInput={(params) => (
                                <TextField {...params} label="Order/Commessa" variant="outlined" />
                            )}
                            sx={{
                                width: '100%',
                                "& .MuiAutocomplete-input": { fontWeight: 'normal' }
                            }}
                        />
                    </Grid>

                    {/* Laboratorio Selection (Searchable) */}
                    <Grid item xs={6} sm={4} md={2.5}>
                        <Autocomplete
                            options={sampleLaboratorio}
                            getOptionLabel={(option) => option.name}
                            value={sampleLaboratorio.find(lab => lab.name === selectedLaboratorio) || null}
                            onChange={(event, newValue) => setSelectedLaboratorio(newValue ? newValue.name : null)}
                            renderInput={(params) => (
                                <TextField {...params} label="Laboratorio" variant="outlined" />
                            )}
                            sx={{
                                width: '100%',
                                "& .MuiAutocomplete-input": { fontWeight: 'normal' }
                            }}
                        />
                    </Grid>

                    {/* Read-Only Fields for Line, Style, Season */}
                    <Grid item xs={3} sm={2} md={1.5}>
                        <TextField
                            label="Season"
                            variant="outlined"
                            value={selectedSeason || ""}
                            slotProps={{ input: { readOnly: true } }}
                            sx={{ 
                                width: '100%', 
                                minWidth: '60px', 
                                "& .MuiInputBase-input": { fontWeight: 'normal' } 
                            }}      
                        />
                    </Grid>

                    {/* Read-Only Fields for Line, Style, Season */}
                    <Grid item xs={3} sm={2} md={1.5}>
                        <TextField
                            label="Brand"
                            variant="outlined"
                            value={selectedBrand || ""}
                            slotProps={{ input: { readOnly: true } }}
                            sx={{ 
                                width: '100%', 
                                minWidth: '60px', 
                                "& .MuiInputBase-input": { fontWeight: 'normal' } 
                            }}      
                        />
                    </Grid>

                    <Grid item xs={3} sm={2} md={1.5}>
                        <TextField
                            label="Style"
                            variant="outlined"
                            value={selectedStyle || ""}
                            slotProps={{ input: { readOnly: true } }}
                            sx={{ 
                                width: '100%', 
                                minWidth: '60px', 
                                "& .MuiInputBase-input": { fontWeight: 'normal' } 
                            }}       
                        />
                    </Grid>

                    <Grid item xs={3} sm={2} md={1.5}> 
                        <TextField
                            label="Color"
                            variant="outlined"
                            value={selectedColorCode || ""}
                            slotProps={{ input: { readOnly: true } }}
                            sx={{ 
                                width: '100%', 
                                minWidth: '60px', 
                                "& .MuiInputBase-input": { fontWeight: 'normal' } 
                            }}                            
                        />
                    </Grid>
                </Grid>

                {/* Order Quantities Section */}
                {orderSizes.length > 0 && (
                    <Box mt={3} p={2} sx={{ background: '#f5f5f5', borderRadius: '8px' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'normal' }}>Quantities</Typography>
                        <Grid container spacing={2}>
                            {orderSizes.map((size, index) => (
                                <Grid item xs={6} sm={4} md={2} key={index}>
                                    <TextField
                                        label={`Size: ${size.size}`}
                                        variant="outlined"
                                        value={size.qty}
                                        slotProps={{ input: { readOnly: true } }}
                                        sx={{ width: '100%' }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

            </MainCard>

            <Box mt={2} />

            {padPrintInfo && (
                <MainCard title="Pad Print">
                    <Grid container spacing={2} alignItems="center">

                        <Grid item xs={3} sm={2} md={1.5}>
                            <TextField
                                label="Pattern"
                                variant="outlined"
                                value={padPrintInfo.pattern || ""}
                                InputProps={{ readOnly: true }}
                                sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                            />
                        </Grid>

                        <Grid item xs={3} sm={2} md={1.5}>
                            <TextField
                                label="Pad Print Color"
                                variant="outlined"
                                value={padPrintInfo.padprint_color || ""}
                                InputProps={{ readOnly: true }}
                                sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                            />
                        </Grid>

                        {/* ✅ Image Box */}
                        {padPrintInfo.image_url && (
                            <Grid item xs={12} sm={4} md={3}>
                                <Box
                                    component="img"
                                    src={`http://127.0.0.1:5000/api/padprint/uploads/${padPrintInfo.image_url.split('/').pop()}`}
                                    alt="Pad Print"
                                    sx={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </Grid>
                        )}

                    </Grid>
                </MainCard>
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

                                {/* Right Section: Table-Specific Planned Quantities - Hide if Empty */}
                                {Object.keys(getTablePlannedQuantities(table)).length > 0 && (
                                    <Box 
                                        display="flex" 
                                        gap={2} 
                                        sx={{ 
                                            backgroundColor: "#EFEFEF", 
                                            padding: "4px 8px", 
                                            borderRadius: "8px", 
                                            flexWrap: "wrap", // ✅ Prevents pushing "Avg. Consumption"
                                            maxWidth: "50%",   // ✅ Prevents excessive width from breaking layout
                                            justifyContent: "flex-end",  // ✅ Keeps it right-aligned
                                            overflow: "hidden", // ✅ Prevents layout breaking when content grows
                                            textOverflow: "ellipsis"
                                        }}
                                    >
                                        {Object.entries(getTablePlannedQuantities(table)).map(([size, qty]) => {
                                            const sizeData = orderSizes.find(s => s.size === size);
                                            const totalOrdered = sizeData ? sizeData.qty : 1; // ✅ Use actual qty, default to 1 if not found

                                            const percentage = totalOrdered ? ((qty / totalOrdered) * 100).toFixed(1) : "N/A";

                                            return (
                                                <Typography key={size} variant="body2" sx={{ fontWeight: "bold" }}>
                                                    {size}: {qty} ({percentage !== "NaN" ? percentage + "%" : "N/A"})
                                                </Typography>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>

                        }
                    >
                    <Box p={1}>
                            <Grid container spacing={2}>
                                {/* Fabric Type (Dropdown) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <Autocomplete
                                        options={fabricTypeOptions.filter(option => 
                                            !tables.some((t, i) => i !== tableIndex && t.fabricType === option) // ✅ Exclude selected options from other tables
                                        )}
                                        getOptionLabel={(option) => option}
                                        value={tables[tableIndex].fabricType || null}
                                        onChange={(event, newValue) => {
                                            setTables(prevTables => {
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
                                            "& .MuiAutocomplete-input": { fontWeight: 'normal' }
                                        }}
                                    />
                                </Grid>

                                {/* Fabric Code (Text Input) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <TextField
                                        label="Fabric Code"
                                        variant="outlined"
                                        value={tables[tableIndex].fabricCode || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, 8);
                                            setTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricCode: value };
                                                return updatedTables;
                                            });
                                            setUnsavedChanges(true);
                                        }}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& input": { fontWeight: "normal" } // ✅ Set font weight to normal
                                        }}
                                    />
                                </Grid>

                                {/* Fabric Color (Text Input) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <TextField
                                        label="Fabric Color"
                                        variant="outlined"
                                        value={tables[tableIndex].fabricColor || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
                                            setTables(prevTables => {
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

                                {/* Spreading Method (Dropdown) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <Autocomplete
                                        options={["FACE UP", "FACE DOWN", "FACE TO FACE"]} // ✅ Defined options
                                        getOptionLabel={(option) => option} 
                                        value={tables[tableIndex].spreadingMethod || null} // ✅ Table-specific value
                                        onChange={(event, newValue) => {
                                            setTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], spreadingMethod: newValue };
                                                return updatedTables;
                                            });
                                            setUnsavedChanges(true);
                                        }} // ✅ Update table-specific state
                                        renderInput={(params) => (
                                            <TextField {...params} label="Spreading Method" variant="outlined" />
                                        )}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& .MuiAutocomplete-input": { fontWeight: 'normal' }
                                        }}
                                    />
                                </Grid>

                                {/* Allowance */}
                                <Grid item xs={1.5} sm={1.5} md={1.5}>
                                    <TextField
                                        label="Allowance [m]"
                                        variant="outlined"
                                        value={tables[tableIndex]?.allowance || ""} 
                                        onChange={(e) => {
                                            const value = e.target.value
                                                .replace(/[^0-9.,]/g, '')  // ✅ Allow only digits, dot (.), and comma (,)
                                                .replace(/[,]+/g, '.')     // ✅ Convert multiple commas to a single dot
                                                .replace(/(\..*)\./g, '$1') // ✅ Prevent multiple dots
                                                .slice(0, 4);  // ✅ Limit total length (adjust if needed)
                                
                                            setTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = {
                                                    ...updatedTables[tableIndex],
                                                    allowance: value  // ✅ Update table-specific allowance
                                                };

                                                // ✅ Trigger `updateExpectedConsumption` for all rows in the table
                                                updatedTables[tableIndex].rows.forEach((_, rowIndex) => {
                                                    updateExpectedConsumption(tableIndex, rowIndex);
                                                });

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
                            </Grid>
                        </Box>

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center" sx={{ textAlign: 'center', minWidth: '100px'}}>Width [cm]</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center', minWidth: '400px'}}>Marker Name</TableCell>
                                            {/* ✅ Correctly Mapping Sizes */}
                                            {orderSizes.length > 0 &&
                                                orderSizes.map((size, index) => (
                                                    <TableCell align="center" sx={{ textAlign: 'center' }} key={index}>
                                                        {size.size || "N/A"}
                                                    </TableCell>
                                                ))
                                            }
                                            <TableCell align="center" sx={{ textAlign: 'center', minWidth: '100px' }}>Length [m]</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center', minWidth: '70px'  }}>Eff %</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Layers</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center', minWidth: '100px'   }}>Cons [m]</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Bagno</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tables[tableIndex].rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>

                                                {/* Width, Marker Length, Layers, Expected Consumption, Bagno */}

                                                {/* Width (Auto-Filled or Input) */}
                                                <TableCell sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={tables[tableIndex].rows[rowIndex].width || ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 3);  // ✅ Remove non-numeric & limit to 4 digits
                                                            
                                                            setTables(prevTables => {
                                                                const updatedTables = [...prevTables];
                                                                const updatedRows = [...updatedTables[tableIndex].rows];
                                                
                                                                updatedRows[rowIndex] = {
                                                                    ...updatedRows[rowIndex],
                                                                    width: value,
                                                                    markerName: "" // ✅ Clear selected marker when width changes
                                                                };
                                                
                                                                updatedTables[tableIndex] = {
                                                                    ...updatedTables[tableIndex],
                                                                    rows: updatedRows
                                                                };
                                                
                                                                return updatedTables;
                                                            });
                                                
                                                            setUnsavedChanges(true);  // ✅ Mark as unsaved when width is edited
                                                        }}
                                                        sx={{
                                                            width: '100%',
                                                            minWidth: '60px',
                                                            maxWidth: '70px',
                                                            textAlign: 'center',
                                                            "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Marker Name (Dropdown) */}
                                                <TableCell sx={{ padding: '4px', minWidth: '350px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <Autocomplete
                                                        options={row.width
                                                            ? [...markerOptions]
                                                                .filter(marker => parseFloat(marker.marker_width) === parseFloat(row.width))
                                                                .sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency)) // ✅ Sort by efficiency (Descending)
                                                            : [...markerOptions].sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency))} // ✅ Sort all markers when no width is entered
                                                        getOptionLabel={(option) => option.marker_name} // Keep only marker name here
                                                        renderOption={(props, option) => (
                                                            <li {...props}>
                                                                <span>{option.marker_name}</span>
                                                                <span style={{ color: "gray", marginLeft: "10px", fontSize: "0.85em" }}>
                                                                    ({option.efficiency}%)
                                                                </span>
                                                            </li>
                                                        )}
                                                        value={markerOptions.find(m => m.marker_name === row.markerName) || null}
                                                        onChange={(_, newValue) => {
                                                            setTables(prevTables => {
                                                                const updatedTables = [...prevTables];
                                                                const newRows = [...updatedTables[tableIndex].rows];
                                                    
                                                                if (newValue) {
                                                                    newRows[rowIndex] = {
                                                                        ...newRows[rowIndex],
                                                                        markerName: newValue.marker_name,
                                                                        width: newValue.marker_width,        // ✅ Auto-fill Width
                                                                        markerLength: newValue.marker_length, // ✅ Auto-fill Marker Length
                                                                        efficiency: newValue.efficiency,      // ✅ Auto-fill Efficiency
                                                                        piecesPerSize: newValue.size_quantities || {} // ✅ Auto-fill Sizes Quantities
                                                                    };
                                                                } else {
                                                                    newRows[rowIndex] = {
                                                                        ...newRows[rowIndex],
                                                                        markerName: "",
                                                                        width: "",        // ✅ Clear Width if empty
                                                                        markerLength: "", // ✅ Clear Marker Length if empty
                                                                        efficiency: "",   // ✅ Clear Efficiency if empty
                                                                        piecesPerSize: {} // ✅ Clear Size Quantities if empty
                                                                    };
                                                                }
                                                    
                                                                updatedTables[tableIndex] = {
                                                                    ...updatedTables[tableIndex],
                                                                    rows: newRows
                                                                };
                                                    
                                                                return updatedTables;
                                                            });
                                                        }}
                                                        renderInput={(params) => <TextField {...params} variant="outlined" />}
                                                        sx={{
                                                            width: '100%',
                                                            "& .MuiAutocomplete-input": { fontWeight: 'normal' }
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Pieces Per Size (Auto-Filled & Read-only) */}
                                                {orderSizes.map((size) => (
                                                    <TableCell
                                                        sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}
                                                        key={size.size}
                                                    >
                                                        <Typography variant="body1" sx={{ fontWeight: "normal", textAlign: "center" }}>
                                                            {tables[tableIndex].rows[rowIndex].piecesPerSize[size.size] || 0}
                                                        </Typography>
                                                    </TableCell>
                                                ))}

                                                {/* Marker Length (Auto-Filled & Read-only) */}
                                                <TableCell sx={{ minWidth: '65x', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "normal", textAlign: "center" }}>
                                                        {row.markerLength}
                                                    </Typography>
                                                </TableCell>

                                                {/* Efficiency (Auto-Filled & Read-only) */}
                                                <TableCell sx={{ minWidth: '65x', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "normal", textAlign: "center" }}>
                                                        {row.efficiency}
                                                    </Typography>
                                                </TableCell>

                                                {/* Layers (Text Input) */}
                                                <TableCell sx={{ minWidth: '65x', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={tables[tableIndex].rows[rowIndex].layers || ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);  // ✅ Remove non-numeric & limit to 4 digits
                                                            handleInputChange(tableIndex, rowIndex, "layers", value);
                                                        }}
                                                        sx={{
                                                            width: '100%',
                                                            minWidth: '65px', // ✅ Ensures a minimum width
                                                            maxWidth: '80px', // ✅ Prevents expanding too much
                                                            textAlign: 'center',
                                                            "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Expected Consumption (Read-Only & Auto-Calculated) */}
                                                <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "normal", textAlign: "center" }}>
                                                        {row.expectedConsumption}
                                                </Typography>
                                                </TableCell>

                                                {/* Bagno (Text Input) */}
                                                <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '4px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={tables[tableIndex].rows[rowIndex].bagno || ""}
                                                        onChange={(e) => handleInputChange(tableIndex, rowIndex, "bagno", e.target.value)}
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
                                                        onClick={() => handleRemoveRow(tableIndex, rowIndex)}
                                                        color="error"
                                                        disabled={tables[tableIndex].rows.length === 1} // ✅ Disable when only 1 row left
                                                    >
                                                        <DeleteOutline />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            
                            {/* Action Row: Avg Consumption + Buttons aligned horizontally */}
                            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
    
                                {/* Middle Section: Avg. Consumption - Only Show if > 0 */}
                                {avgConsumption[tableIndex] && avgConsumption[tableIndex] > 0 ? (
                                   <Box 
                                        p={1}
                                        sx={{ 
                                            padding: "4px 8px", 
                                            minWidth: "140px",  
                                            textAlign: "center",
                                            width: "fit-content",
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                            Avg Cons: {avgConsumption[tableIndex]} m/pc
                                        </Typography>
                                    </Box>
                                ) : (
                                    // ✅ Empty placeholder to reserve space
                                    <Box sx={{ minWidth: "140px" }} />
                                )}
                                {/* Button Container (Flexbox for alignment) */}
                                <Box display="flex" justifyContent="flex-end" gap={2}>
                                    {/* Add Row Button */}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddCircleOutline />}
                                        onClick={() => handleAddRow(tableIndex)} // ✅ Pass the specific table index
                                    >
                                        Add Row
                                    </Button>

                                    {/* Remove Table Button */}
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        onClick={() => handleRemoveTable(table.id)}
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Along Tables Section */}
            {alongTables.length > 0 && alongTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                    <Box mt={2} />
                    <MainCard title={`Collaretto Along the Grain`}>

                        <Box p={1}>
                            <Grid container spacing={2}>
                                {/* Fabric Type (Dropdown) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <Autocomplete
                                        options={fabricTypeOptions.filter(option => 
                                            !alongTables.some((t, i) => i !== tableIndex && t.fabricType === option) // ✅ Exclude fabricType selected in other alongTables
                                        )}
                                        getOptionLabel={(option) => option}
                                        value={alongTables[tableIndex].fabricType || null}
                                        onChange={(event, newValue) => {
                                            setAlongTables(prevTables => {
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
                                            "& .MuiAutocomplete-input": { fontWeight: 'normal' }
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
                                            setAlongTables(prevTables => {
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
                                            setAlongTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricColor: value };
                                                return updatedTables;
                                            });
                                            setUnsavedChanges(true);
                                        }}
                                        sx={{ 
                                            width: '100%', 
                                            minWidth: '60px',
                                            "& input": { fontWeight: "normal" }  // ✅ Normal font weight
                                        }}
                                    />
                                </Grid>

                                {/* Extra (Text Input) */}
                                <Grid item xs={2} sm={1} md={1}>
                                    <TextField
                                        label="Extra %"
                                        variant="outlined"
                                        value={table.alongExtra || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 2); // ✅ Only digits, max 2
                                            setUnsavedChanges(true);
                                            handleAlongExtraChange(tableIndex, value);
                                        }}
                                        sx={{ 
                                            width: '100%', 
                                            minWidth: '60px',
                                            "& input": { fontWeight: "normal" }  // ✅ Normal font
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
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Collaretto Width [mm]</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Scrap Rolls</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>N° Rolls</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Total Collaretto [m]</TableCell>
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
                                                            handleAlongRowChange(tableIndex, rowIndex, "pieces", e.target.value.replace(/\D/g, '').slice(0, 7));
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
                                                            handleAlongRowChange(tableIndex, rowIndex, "usableWidth", e.target.value.replace(/\D/g, '').slice(0, 3));
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

                                                {/* Theoretical Consumption (Editable Text Field) */}
                                                <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '10px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.theoreticalConsumption || ""}
                                                        onChange={(e) => {
                                                            handleAlongRowChange(tableIndex, rowIndex, "theoreticalConsumption", e.target.value.replace(/[^0-9.,]/g, ''));
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
                                                            handleAlongRowChange(tableIndex, rowIndex, "collarettoWidth", e.target.value.replace(/\D/g, '').slice(0, 4));
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
                                                            handleAlongRowChange(tableIndex, rowIndex, "scrapRoll", e.target.value.replace(/\D/g, '').slice(0, 1));
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

                                                {/* Koturi per Roll */}
                                                <TableCell align="center">
                                                    <Typography>{row.rolls || ""}</Typography>
                                                </TableCell>

                                                {/* Meters of Collaretto */}
                                                <TableCell align="center">
                                                    <Typography>{row.metersCollaretto || ""}</Typography>
                                                </TableCell>

                                                {/* Consumption */}
                                                <TableCell align="center">
                                                    <Typography>{row.consumption && row.consumption !== "0.0" ? row.consumption : ""}</Typography>
                                                </TableCell>

                                                {/* Bagno (Editable Text Field) */}
                                                <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '2px 10px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.bagno || ""}
                                                        onChange={(e) => {
                                                            handleAlongRowChange(tableIndex, rowIndex, "bagno", e.target.value);
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
                                                        onClick={() => {
                                                            handleRemoveAlongRow(tableIndex, rowIndex);
                                                            setUnsavedChanges(true);
                                                        }}
                                                        color="error"
                                                        disabled={alongTables[tableIndex].rows.length === 1} // ✅ Disable when only 1 row left
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
                                    onClick={() => {
                                        handleAddRowAlong(tableIndex);
                                        setUnsavedChanges(true);                                    
                                    }} // ✅ Pass the specific table index
                                >
                                    Add Row
                                </Button>

                                {/* Remove Table Button */}
                                <Button 
                                    variant="outlined" 
                                    color="error" 
                                    onClick={() => {
                                        handleRemoveAlong(table.id);
                                        setUnsavedChanges(true); 
                                    }}
                                >
                                    Remove
                                </Button>
                            </Box>
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
        </>
    );
};

export default OrderPlanning;
