import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button } from '@mui/material';
import { AddCircleOutline, DeleteOutline, Save } from '@mui/icons-material';
import MainCard from '../../ui-component/cards/MainCard';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

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

const ALLOWANCE = 0.02;

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
    const [markerOptions, setMarkerOptions] = useState([]);
    const [spreadingMethod, setSpreadingMethod] = useState(null);
    const [collarettoType, setcollarettoType] = useState(null);
    const [deletedMattresses, setDeletedMattresses] = useState([]);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    
    const [tables, setTables] = useState([]); 

    const [collarettoTables, setCollarettoTables] = useState([]);

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

    const handleRemoveTable = (id) => {
        setTables(prevTables => prevTables.filter(table => table.id !== id));
    };

    const handleRemoveCollaretto = (id) => {
        setCollarettoTables(prevTables => prevTables.filter(table => table.id !== id));
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
    
                    setOrderOptions(Array.from(ordersMap.values()));  // ✅ Convert map to array
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
    
        axios.get('http://127.0.0.1:5000/api/markers/marker_headers_planning')  // ✅ Fetch only when order changes
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
            setOrderSizes(newValue.sizes || []);
            setOrderSizeNames(newValue.sizes ? newValue.sizes.map(size => size.size) : []);
            setSelectedStyle(newValue.style);
            setSelectedSeason(newValue.season);
            setSelectedColorCode(newValue.colorCode);

            console.log(`🔍 Fetching mattresses for order: ${newValue.id}`);

            // ✅ Fetch existing mattresses from Flask API
            axios.get(`http://127.0.0.1:5000/api/mattress/get_by_order/${newValue.id}`)
                .then(response => {
                    if (response.data.success) {
                        console.log("✅ Mattresses Loaded:", response.data.data);

                        // ✅ Create a mapping of tables grouped by `fabric_type`
                        const tablesByFabricType = {};

                        response.data.data.forEach((mattress) => {
                            const fabricType = mattress.fabric_type;

                            // ✅ Ensure each fabric type has its own table
                            if (!tablesByFabricType[fabricType]) {
                                tablesByFabricType[fabricType] = {
                                    id: Object.keys(tablesByFabricType).length + 1,
                                    fabricType: fabricType,
                                    fabricCode: mattress.fabric_code,
                                    fabricColor: mattress.fabric_color,
                                    spreadingMethod: mattress.spreading_method,
                                    rows: []
                                };
                            }

                            // ✅ Add mattress row to the correct table
                            tablesByFabricType[fabricType].rows.push({
                                mattressName: mattress.mattress,  // ✅ Store but do not display in UI
                                width: "",
                                markerName: "",  // Separate from mattressName
                                piecesPerSize: {},  // ⚠️ Adjust if pieces per size are saved separately
                                markerLength: "",
                                layers: "",
                                expectedConsumption: "",
                                bagno: mattress.dye_lot
                            });
                        });

                        // ✅ Convert tables object to array
                        const loadedTables = Object.values(tablesByFabricType);

                        setTables(loadedTables);  // ✅ Restore previous tables
                    } else {
                        console.warn("⚠️ No existing mattresses found for this order.");
                        setTables([
                            {
                                id: 1,
                                rows: [
                                    {
                                        mattressName: "",  // ✅ Keep track of new mattresses without showing it
                                        width: "",
                                        markerName: "",
                                        piecesPerSize: newValue.sizes ? Object.fromEntries(newValue.sizes.map(size => [size.size, ""])) : {},
                                        markerLength: "",
                                        layers: "",
                                        expectedConsumption: "",
                                        bagno: ""
                                    }
                                ]
                            }
                        ]);
                    }
                })
                .catch(error => {
                    console.error("❌ Error fetching mattresses:", error);
                    setTables([
                        {
                            id: 1,
                            rows: [
                                {
                                    mattressName: "",  // ✅ Keep track of new mattresses without showing it
                                    width: "",
                                    markerName: "",
                                    piecesPerSize: newValue.sizes ? Object.fromEntries(newValue.sizes.map(size => [size.size, ""])) : {},
                                    markerLength: "",
                                    layers: "",
                                    expectedConsumption: "",
                                    bagno: ""
                                }
                            ]
                        }
                    ]);
                });

            setFabricType(null);
            setSpreadingMethod(null);
        } else {
            setSelectedOrder(null);
            setOrderSizes([]);
            setOrderSizeNames([]);
            setMarkerOptions([]);
            setTables([]);
            setFabricType(null);
            setSpreadingMethod(null);
            setSelectedStyle("");
            setSelectedSeason("");
            setSelectedColorCode("");
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
    
    // ✅ New function to handle delayed calculation
    const updateExpectedConsumption = (tableIndex, rowIndex) => {
        setTables(prevTables => {
            const updatedTables = [...prevTables];
    
            // Clear any existing timeout
            clearTimeout(updatedTables[tableIndex].rows[rowIndex].timeout);
    
            updatedTables[tableIndex].rows[rowIndex].timeout = setTimeout(() => {
                const markerLength = (parseFloat(updatedTables[tableIndex].rows[rowIndex].markerLength) || 0) + ALLOWANCE;
                const layers = parseInt(updatedTables[tableIndex].rows[rowIndex].layers) || 0;
    
                updatedTables[tableIndex].rows[rowIndex].expectedConsumption = (markerLength * layers).toFixed(1);
                
                setTables([...updatedTables]); // ✅ Update state
            }, 500);
            
            return updatedTables;
        });
    };

    const handleSave = () => {
        if (!selectedOrder || !tables.length) {
            alert("Please select an order and enter at least one mattress entry.");
            return;
        }
    
        const newMattressNames = new Set();
        const payloads = [];
    
        // ✅ Collect data for saving
        tables.forEach((table) => {
            table.rows.forEach((row, rowIndex) => {
                if (!row.markerName) return; // ✅ Skip empty rows
    
                // ✅ Generate Mattress Name (ORDER-AS-FABRICTYPE-001, 002, ...)
                const mattressName = `${selectedOrder}-AS-${table.fabricType}-${String(rowIndex + 1).padStart(3, '0')}`;
                newMattressNames.add(mattressName); // ✅ Track UI rows
    
                payloads.push({
                    mattress: mattressName,
                    order_commessa: selectedOrder,
                    fabric_type: table.fabricType,
                    fabric_code: table.fabricCode,
                    fabric_color: table.fabricColor,
                    dye_lot: row.bagno,
                    item_type: "Mattress",
                    spreading_method: table.spreadingMethod,
                });
            });
        });
    
        console.log("📤 Sending Updated Data:", payloads);
    
        // ✅ Send Update Requests
        Promise.all(payloads.map(payload =>
            axios.post('http://127.0.0.1:5000/api/mattress/add_mattress_row', payload)
                .then(response => {
                    if (response.data.success) {
                        console.log(`✅ Mattress ${payload.mattress} saved successfully.`);
                    } else {
                        console.warn(`⚠️ Failed to save mattress ${payload.mattress}:`, response.data.message);
                    }
                })
                .catch(error => console.error("❌ Error saving mattress:", error))
        )).then(() => {
            // ✅ Delete Only Rows That Were Removed from UI
            console.log("🗑️ Mattresses to delete:", deletedMattresses);
    
            const mattressesToDelete = deletedMattresses.filter(mattress => !newMattressNames.has(mattress));
    
            return Promise.all(mattressesToDelete.map(mattress =>
                axios.delete(`http://127.0.0.1:5000/api/mattress/delete/${mattress}`)
                    .then(res => {
                        console.log(`🗑️ Deleted mattress: ${mattress}`);
                    })
                    .catch(err => console.error(`❌ Error deleting mattress: ${mattress}`, err))
            ));
        }).then(() => {
            // ✅ Reset state after successful save
            setDeletedMattresses([]);
            setUnsavedChanges(false);
        });
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

                    <Button 
                        variant="contained" 
                        sx={{ backgroundColor: '#B0B0B0', color: 'white', '&:hover': { backgroundColor: '#A0A0A0' } }}
                        onClick={handleSave}
                        startIcon={<Save />}
                    >
                        Save
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
                    <MainCard key={table.id} title={`Mattress Group ${tableIndex + 1}`}>
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
                                        }}
                                        sx={{
                                            width: '100%',
                                            minWidth: '60px',
                                            "& input": { fontWeight: "normal" } // ✅ Set font weight to normal
                                        }}
                                    />
                                </Grid>

                                {/* Fabric Description (Read-Only) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <TextField
                                        label="Fabric Description"
                                        variant="outlined"
                                        value="" // Placeholder, will be filled with DB data
                                        slotProps={{ input: { readOnly: true } }}
                                        sx={{ width: '100%', minWidth: '60px' }}
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
                            </Grid>
                        </Box>

                        {/* Table Section */}
                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Width</TableCell>
                                            <TableCell>Marker Name</TableCell>
                                            {/* ✅ Correctly Mapping Sizes */}
                                            {orderSizes.length > 0 &&
                                                orderSizes.map((size, index) => (
                                                    <TableCell align="center" sx={{ textAlign: 'center' }} key={index}>
                                                        {size.size || "N/A"}
                                                    </TableCell>
                                                ))
                                            }
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Marker Length</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Layers</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Expected Consumption</TableCell>
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Bagno</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tables[tableIndex].rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>

                                                {/* Width, Marker Length, Layers, Expected Consumption, Bagno */}
                                                {/* Width (Auto-Filled & Read-only) */}
                                                <TableCell sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
                                                    <TextField
                                                        variant="outlined"
                                                        value={tables[tableIndex].rows[rowIndex].width || ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 3);  // ✅ Remove non-numeric & limit to 4 digits
                                                            handleInputChange(tableIndex, rowIndex, "width", value);
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

                                                {/* Marker Code (Dropdown) */}
                                                <TableCell sx={{ padding: '4px', minWidth: '350px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <Autocomplete
                                                        options={markerOptions}
                                                        getOptionLabel={(option) => option.marker_name}
                                                        value={markerOptions.find(m => m.marker_name === row.markerName) || null}
                                                        onChange={(_, newValue) => {
                                                            setTables(prevTables => {
                                                                const updatedTables = [...prevTables];
                                                                const newRows = [...updatedTables[tableIndex].rows];
                                    
                                                                if (newValue) {
                                                                    newRows[rowIndex] = {
                                                                        ...newRows[rowIndex],
                                                                        markerName: newValue.marker_name,
                                                                        width: newValue.marker_width,       // ✅ Auto-fill Width
                                                                        markerLength: newValue.marker_length // ✅ Auto-fill Marker Length
                                                                    };
                                                                } else {
                                                                    newRows[rowIndex] = {
                                                                        ...newRows[rowIndex],
                                                                        markerName: "",
                                                                        width: "",       // ✅ Clear Width if empty
                                                                        markerLength: "" // ✅ Clear Marker Length if empty
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

                                                {/* ✅ Dynamic Inputs for Pieces Per Size */}
                                                {orderSizes.map((size) => (
                                                    <TableCell
                                                        sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}
                                                        key={size.size}
                                                    >
                                                        <TextField
                                                            variant="outlined"
                                                            value={tables[tableIndex].rows[rowIndex].piecesPerSize[size.size] || ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value.replace(/\D/g, "").slice(0, 2); // ✅ Only numbers, max 2 digits

                                                                setTables(prevTables => {
                                                                    const updatedTables = [...prevTables];
                                                                    const updatedRows = [...updatedTables[tableIndex].rows];

                                                                    updatedRows[rowIndex] = {
                                                                        ...updatedRows[rowIndex],
                                                                        piecesPerSize: {
                                                                            ...updatedRows[rowIndex].piecesPerSize,
                                                                            [size.size]: value
                                                                        }
                                                                    };

                                                                    updatedTables[tableIndex] = {
                                                                        ...updatedTables[tableIndex],
                                                                        rows: updatedRows
                                                                    };

                                                                    return updatedTables;
                                                                });
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                minWidth: '60px', // ✅ Ensures a minimum width
                                                                maxWidth: '70px', // ✅ Prevents expanding too much
                                                                textAlign: 'center',
                                                                "& input": { textAlign: "center", fontWeight: "normal" } // ✅ Centered text
                                                            }}
                                                        />
                                                    </TableCell>
                                                ))}

                                                {/* Marker Length (Auto-Filled & Read-only) */}
                                                <TableCell sx={{ minWidth: '65x', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "normal", textAlign: "center" }}>
                                                        {row.markerLength}
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

             {/* Collaretto Tables Section */}
             {collarettoTables.length > 0 && collarettoTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                    <Box mt={2} />
                    <MainCard title={`Collaretto Group ${tableIndex + 1}`}>

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

                                {/* Fabric Description (Read-Only) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <TextField
                                        label="Fabric Description"
                                        variant="outlined"
                                        value="" // Placeholder, will be filled with DB data
                                        slotProps={{ input: { readOnly: true } }}
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

                                {/* Collaretto Type (Dropdown) */}
                                <Grid item xs={3} sm={2} md={2}>
                                    <Autocomplete
                                        options={["ALONG THE GRAIN", "IN WEFT", "ON THE BIAS"]} // ✅ Defined options
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
                                        <TableRow>
                                            <TableCell>Marker Name</TableCell>
                                            <TableCell align="center">Width</TableCell>
                                            <TableCell align="center">Marker Length</TableCell>
                                            <TableCell align="center">Layers</TableCell>
                                            <TableCell align="center">Expected Consumption</TableCell>
                                            <TableCell align="center">Bagno</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {table.rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                <TableCell>
                                                    <Autocomplete
                                                        options={markerOptions}
                                                        getOptionLabel={(option) => option.marker_name}
                                                        value={markerOptions.find(m => m.marker_name === row.markerName) || null}
                                                        onChange={(_, newValue) => {
                                                            handleCollarettoRowChange(tableIndex, rowIndex, "markerName", newValue ? newValue.marker_name : "");
                                                        }}
                                                        renderInput={(params) => <TextField {...params} variant="outlined" />}
                                                    />
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Typography>{row.width}</Typography>
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Typography>{row.markerLength}</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.layers || ""}
                                                        onChange={(e) => handleCollarettoRowChange(tableIndex, rowIndex, "layers", e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                        sx={{ width: '100%', minWidth: '65px', maxWidth: '80px', textAlign: 'center' }}
                                                    />
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Typography>{row.expectedConsumption}</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <TextField
                                                        variant="outlined"
                                                        value={row.bagno || ""}
                                                        onChange={(e) => handleCollarettoRowChange(tableIndex, rowIndex, "bagno", e.target.value)}
                                                        sx={{ width: '100%', minWidth: '90px', maxWidth: '120px', textAlign: 'center' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Remove Collaretto Table Button */}
                        <Box mt={2} display="flex" justifyContent="flex-end">
                            <Button variant="outlined" color="error" onClick={() => handleRemoveCollaretto(table.id)}>
                                Remove Collaretto
                            </Button>
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
                        onClick={handleAddCollaretto}
                    >
                        Add Collaretto
                    </Button>
                </Box>
            )}
        </>
    );
};

export default OrderPlanning;
