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
    const [collarettoType, setcollarettoType] = useState(null);
    const [deletedMattresses, setDeletedMattresses] = useState([]);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [avgConsumption, setAvgConsumption] = useState({});
    
    const [tables, setTables] = useState([]); 

    const [collarettoTables, setCollarettoTables] = useState([]);

    const [alongTables, setAlongTables] = useState([]);

    const [errorMessage, setErrorMessage] = useState("");
    const [openError, setOpenError] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [openSuccess, setOpenSuccess] = useState(false);

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

    const handleAddCollaretto = () => {
        setCollarettoTables(prevTables => [
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
                rows: [
                    {
                        bagno: "",
                        width: "",
                        markerLength: "",
                        layers: "",
                        expectedConsumption: ""
                    }
                ]
            }
        ]);
    };

    const handleRemoveTable = (id) => {
        setTables(prevTables => prevTables.filter(table => table.id !== id));
    };

    const handleRemoveCollaretto = (id) => {
        setCollarettoTables(prevTables => prevTables.filter(table => table.id !== id));
    };

    const handleRemoveAlong = (id) => {
        setAlongTables(prevTables => prevTables.filter(table => table.id !== id));
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
    
            // Fetch mattresses and markers in parallel
            Promise.all([
                axios.get(`http://127.0.0.1:5000/api/mattress/get_by_order/${newValue.id}`),  // Fetch mattresses
                axios.get(`http://127.0.0.1:5000/api/markers/marker_headers_planning?style=${newValue.style}`)  // Fetch markers
            ])
            .then(([mattressResponse, markerResponse]) => {
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
                    setUnsavedChanges(false);
                }
            })
            .catch(error => {
                console.error("❌ Error in parallel fetch:", error);
                setTables([]);
                setUnsavedChanges(false);
            });
        } else {
            setSelectedOrder(null);
            setOrderSizes([]);
            setOrderSizeNames([]);
            setMarkerOptions([]);
            setTables([]);
            setCollarettoTables([]);
            setAlongTables([]);
            setFabricType(null);
            setSpreadingMethod(null);
            setAllowance("");
            setSelectedStyle("");
            setSelectedSeason("");
            setSelectedColorCode("");

            setUnsavedChanges(false);
        }
    };
    
    // Function to add a new row
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

    // Function to add a new row Along 
    const handleAddRowAlong = (tableIndex) => {
        setAlongTables(prevTables => {
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

    // Function to add a new row Weft & Bias 
    const handleAddRowCollaretto = (tableIndex) => {
        setCollarettoTables(prevTables => {
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

    const handleRemoveCollarettoRow = (tableIndex, rowIndex) => {
        setCollarettoTables(prevTables => {
            return prevTables.map((table, tIndex) => {
                if (tIndex === tableIndex) {
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

    const handleCollarettoRowChange = (tableIndex, rowIndex, field, value) => {
        setCollarettoTables(prevTables => {
            const updatedTables = [...prevTables];
            const updatedRows = [...updatedTables[tableIndex].rows];
    
            updatedRows[rowIndex] = { ...updatedRows[rowIndex], [field]: value };
    
            updatedTables[tableIndex] = { ...updatedTables[tableIndex], rows: updatedRows };

            return updatedTables;
        });
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
    
            // ✅ Calculate Koturi per Roll (round down)
            updatedRow.koturiPerRoll = collarettoWidth > 0 ? Math.floor(usableWidth / collarettoWidth) : 0;
    
            // ✅ Calculate Meters of Collaretto
            updatedRow.metersCollaretto = pieces * theoreticalConsumption * extraPercentage;
    
            // ✅ Calculate Consumption
            updatedRow.consumption = updatedRow.koturiPerRoll > 0
                ? (updatedRow.metersCollaretto / updatedRow.koturiPerRoll).toFixed(2) // Round to 2 decimals
                : "0";
    
            // ✅ Save updated row in copied array
            updatedRows[rowIndex] = updatedRow;
            updatedTables[tableIndex] = { ...updatedTables[tableIndex], rows: updatedRows };
    
            return updatedTables; // ✅ Return new state to trigger React re-render
        });
    };
    
    const handleExtraChange = (tableIndex, value) => {
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
                row.metersCollaretto = pieces * theoreticalConsumption * extraMultiplier;
    
                // ✅ Update `consumption`
                row.consumption = row.koturiPerRoll > 0
                    ? (row.metersCollaretto / row.koturiPerRoll).toFixed(2)
                    : "0";
    
                return row;
            });
    
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
        if (!selectedOrder || !tables.length) {
            setErrorMessage("Please select an order and enter at least one mattress entry.");
            setOpenError(true);
            return;
        }
    
        const newMattressNames = new Set();
        const payloads = [];
        let invalidRow = null;
        
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
                

                payloads.push({
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
                });
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
            // ✅ Reset state after successful save
            setDeletedMattresses([]);
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

            {/* Mattress Group Section */}
            {tables.length > 0 && tables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   {/* ✅ Add spacing before every table except the first one */}
                   {tableIndex > 0 && <Box mt={2} />} 
                    <MainCard 
                        key={table.id} 
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Typography variant="h3">{`Mattress Group ${tableIndex + 1}`}</Typography>

                                {/* Middle Section: Avg. Consumption - Only Show if > 0 */}
                                {avgConsumption[tableIndex] && avgConsumption[tableIndex] > 0 ? (
                                    <Box 
                                        p={1} 
                                        sx={{ 
                                            background: "#D6EAF8", 
                                            padding: "4px 8px", 
                                            borderRadius: "8px", 
                                            minWidth: "140px",  
                                            textAlign: "center",
                                            flexShrink: 0,  
                                            margin: "0 auto",
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                            Avg. Consumption: {avgConsumption[tableIndex]} m/pc
                                        </Typography>
                                    </Box>
                                ) : null}  {/* ✅ Prevents rendering when avgConsumption is 0 */}

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
                                            const value = e.target.value.slice(0, 8);
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
                                            const value = e.target.value.slice(0, 4);
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
                                            "& input": { fontWeight: "normal" } // ✅ Ensure normal font weight
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

                            {/* Button Container (Flexbox for alignment) */}
                            <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
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
                                            const value = e.target.value.slice(0, 8);
                                            setAlongTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricCode: value };
                                                return updatedTables;
                                            });
                                        }}
                                        sx={{ width: '100%', minWidth: '60px' }}
                                    />
                                </Grid>

                                {/* Fabric Color (Text Input) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <TextField
                                        label="Fabric Color"
                                        variant="outlined"
                                        value={table.fabricColor || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 4);
                                            setAlongTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricColor: value };
                                                return updatedTables;
                                            });
                                        }}
                                        sx={{ width: '100%', minWidth: '60px' }}
                                    />
                                </Grid>

                                {/* Extra (Text Input) */}
                                <Grid item xs={2} sm={1} md={1}>
                                    <TextField
                                        label="Extra %"
                                        variant="outlined"
                                        value={table.alongExtra || ""}
                                        onChange={(e) => handleExtraChange(tableIndex, e.target.value.slice(0, 2))}
                                        sx={{ width: '100%', minWidth: '60px' }}
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
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Bagno</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Usable Width [cm]</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Pieces</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Gross Length [m]</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Collaretto Width [mm]</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Scrap Koturi</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Koturi per Roll</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Total Collaretto [m]</TableCell>
                                            <TableCell align="center" sx={{ padding: "2px 6px" }}>Consumption</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {table.rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {/* Bagno (Editable Text Field) */}
                                                <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '2px 10px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.bagno || ""}
                                                        onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "bagno", e.target.value)}
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
                                                        onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "usableWidth", e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                        sx={{
                                                            width: '100%',
                                                            minWidth: '90px', // ✅ Ensures a minimum width
                                                            maxWidth: '120px', // ✅ Prevents expanding too much
                                                            textAlign: 'center',
                                                            "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Pieces (Editable Text Field) */}
                                                <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '2px 10px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.pieces || ""}
                                                        onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "pieces", e.target.value.replace(/\D/g, '').slice(0, 7))}
                                                        sx={{
                                                            width: '100%',
                                                            minWidth: '90px',
                                                            maxWidth: '120px',
                                                            textAlign: 'center',
                                                            "& input": { textAlign: "center", fontWeight: "normal" }
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Theoretical Consumption (Editable Text Field) */}
                                                <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '10px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.theoreticalConsumption || ""}
                                                        onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "theoreticalConsumption", e.target.value.replace(/[^0-9.,]/g, ''))}
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
                                                        onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "collarettoWidth", e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                        sx={{
                                                            width: '100%',
                                                            minWidth: '65px', // ✅ Ensures a minimum width
                                                            maxWidth: '150px', // ✅ Prevents expanding too much
                                                            textAlign: 'center',
                                                            "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Srap Koturi */}
                                                <TableCell sx={{ minWidth: '65x', textAlign: 'center', padding: '10px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.collarettoWidth || ""}
                                                        onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "collarettoWidth", e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                                                    <Typography>{row.koturiPerRoll || ""}</Typography>
                                                </TableCell>

                                                {/* Meters of Collaretto */}
                                                <TableCell align="center">
                                                    <Typography>{row.metersCollaretto || ""}</Typography>
                                                </TableCell>

                                                {/* Consumption */}
                                                <TableCell align="center">
                                                    <Typography>{row.consumption && row.consumption !== "0.00" ? row.consumption : ""}</Typography>
                                                </TableCell>

                                                {/* Delete Button */}
                                                <TableCell>
                                                    <IconButton 
                                                        onClick={() => handleRemoveAlongRow(tableIndex, rowIndex)}
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
                                    onClick={() => handleAddRowAlong(tableIndex)} // ✅ Pass the specific table index
                                >
                                    Add Row
                                </Button>

                                {/* Remove Table Button */}
                                <Button 
                                    variant="outlined" 
                                    color="error" 
                                    onClick={() => handleRemoveAlong(table.id)}
                                >
                                    Remove
                                </Button>
                            </Box>
                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Collaretto Tables Section */}
            {collarettoTables.length > 0 && collarettoTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                    <Box mt={2} />
                    <MainCard title={`Collaretto Weft or Bias`}>

                        <Box p={1}>
                            <Grid container spacing={2}>
                                {/* Fabric Type (Dropdown) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <Autocomplete
                                        options={fabricTypeOptions}
                                        getOptionLabel={(option) => option}
                                        value={table.fabricType || null}
                                        onChange={(event, newValue) => {
                                            setCollarettoTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricType: newValue };
                                                return updatedTables;
                                            });
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Fabric Type" variant="outlined" />}
                                        sx={{ width: '100%', minWidth: '60px' }}
                                    />
                                </Grid>

                                {/* Fabric Code (Text Input) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <TextField
                                        label="Fabric Code"
                                        variant="outlined"
                                        value={table.fabricCode || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 8);
                                            setCollarettoTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricCode: value };
                                                return updatedTables;
                                            });
                                        }}
                                        sx={{ width: '100%', minWidth: '60px' }}
                                    />
                                </Grid>

                                {/* Fabric Color (Text Input) */}
                                <Grid item xs={3} sm={2} md={1.5}>
                                    <TextField
                                        label="Fabric Color"
                                        variant="outlined"
                                        value={table.fabricColor || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 4);
                                            setCollarettoTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], fabricColor: value };
                                                return updatedTables;
                                            });
                                        }}
                                        sx={{ width: '100%', minWidth: '60px' }}
                                    />
                                </Grid>

                                {/* Extra (Text Input) */}
                                <Grid item xs={2} sm={1} md={1}>
                                    <TextField
                                        label="Extra %"
                                        variant="outlined"
                                        value={table.alongExtra || ""}
                                        onChange={(e) => handleExtraChange(tableIndex, e.target.value.slice(0, 2))}
                                        sx={{ width: '100%', minWidth: '60px' }}
                                    />
                                </Grid>

                                {/* Collaretto Type (Dropdown) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <Autocomplete
                                        options={["IN WEFT", "ON THE BIAS"]} // ✅ Defined options
                                        getOptionLabel={(option) => option} 
                                        value={collarettoTables[tableIndex].collarettoType || null} // ✅ Table-specific value
                                        onChange={(event, newValue) => {
                                            setCollarettoTables(prevTables => {
                                                const updatedTables = [...prevTables];
                                                updatedTables[tableIndex] = { ...updatedTables[tableIndex], collarettoType: newValue };
                                                return updatedTables;
                                            });
                                        }} // ✅ Update table-specific state
                                        renderInput={(params) => (
                                            <TextField {...params} label="Collaretto Type" variant="outlined" />
                                        )}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& .MuiAutocomplete-input": { fontWeight: 'normal' }
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
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Bagno</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Usable Width [cm]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Pieces</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>IT Cons. [m/pc]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Collaretto Width [mm]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Koturi per Roll</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Total Collaretto [m]</TableCell>
                                                <TableCell align="center" sx={{ padding: "2px 6px" }}>Consumption</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {table.rows.map((row, rowIndex) => (
                                                <TableRow key={rowIndex}>
                                                    {/* Bagno (Editable Text Field) */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '2px 10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.bagno || ""}
                                                            onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "bagno", e.target.value)}
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
                                                            onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "usableWidth", e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '90px', // ✅ Ensures a minimum width
                                                                maxWidth: '120px', // ✅ Prevents expanding too much
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Pieces (Editable Text Field) */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '2px 10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.pieces || ""}
                                                            onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "pieces", e.target.value.replace(/\D/g, '').slice(0, 7))}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '90px',
                                                                maxWidth: '120px',
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" }
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Theoretical Consumption (Editable Text Field) */}
                                                    <TableCell sx={{ minWidth: '90x', maxWidth: '120px', textAlign: 'center', padding: '10px' }}>
                                                        <TextField
                                                            variant="outlined"
                                                            value={row.theoreticalConsumption || ""}
                                                            onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "theoreticalConsumption", e.target.value.replace(/[^0-9.,]/g, ''))}
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
                                                            onChange={(e) => handleAlongRowChange(tableIndex, rowIndex, "collarettoWidth", e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                                                        <Typography>{row.koturiPerRoll || ""}</Typography>
                                                    </TableCell>

                                                    {/* Meters of Collaretto */}
                                                    <TableCell align="center">
                                                        <Typography>{row.metersCollaretto || ""}</Typography>
                                                    </TableCell>

                                                    {/* Consumption */}
                                                    <TableCell align="center">
                                                        <Typography>{row.consumption && row.consumption !== "0.00" ? row.consumption : ""}</Typography>
                                                    </TableCell>

                                                    {/* Delete Button */}
                                                    <TableCell>
                                                        <IconButton 
                                                            onClick={() => handleRemoveCollarettoRow(tableIndex, rowIndex)}
                                                            color="error"
                                                            disabled={collarettoTables[tableIndex].rows.length === 1} // ✅ Disable when only 1 row left
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
                                    onClick={() => handleAddRowCollaretto(tableIndex)} // ✅ Pass the specific table index
                                >
                                    Add Row
                                </Button>

                                {/* Remove Table Button */}
                                <Button 
                                    variant="outlined" 
                                    color="error" 
                                    onClick={() => handleRemoveCollaretto(table.id)}
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
                        Add Collaretto Along Grain
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary" // ✅ Different color to distinguish it
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddCollaretto}
                    >
                        Add Collaretto Weft or Bias
                    </Button>

                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: "#B71C1C", // ✅ Deep Blood Red
                            color: "white",
                            "&:hover": { backgroundColor: "#7F0000" } // ✅ Darker red on hover
                        }}
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddCollaretto}
                    >
                        Add Pad Print
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
