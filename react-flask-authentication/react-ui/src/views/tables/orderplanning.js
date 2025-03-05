import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button } from '@mui/material';
import { AddCircleOutline, DeleteOutline, Save } from '@mui/icons-material';
import MainCard from '../../ui-component/cards/MainCard';
import axios from 'axios';


// Sample Data
const sampleOrders = [
    { id: 1, name: "25IE341346", sizes: [{ size: "S", qty: 100 }, { size: "M", qty: 150 }, { size: "L", qty: 200 }] },
    { id: 2, name: "25IC344190", sizes: [{ size: "XS", qty: 120 }, { size: "S", qty: 140 }, { size: "M", qty: 160 }, { size: "L", qty: 180 }] },
    { id: 3, name: "25IP5800332715", sizes: [{ size: "S", qty: 50 }, { size: "M", qty: 70 }, { size: "L", qty: 90 }, { size: "XL", qty: 110 }, { size: "XXL", qty: 130 }, { size: "XXXL", qty: 150 }] }
];

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
    
    const [tables, setTables] = useState([
        {
            id: 1, // Unique ID for tracking
            rows: [{
                markerName: "",
                piecesPerSize: {},
                width: "",
                markerLength: "",
                layers: "",
                expectedConsumption: "",
                bagno: ""
            }]
        }
    ]);

    const handleAddTable = () => {
        setTables(prevTables => [
            ...prevTables,
            {
                id: prevTables.length + 1, // Assign unique ID
                rows: [{
                    markerName: "",
                    piecesPerSize: {},
                    width: "",
                    markerLength: "",
                    layers: "",
                    expectedConsumption: "",
                    bagno: ""
                }]
            }
        ]);
    };

    const handleRemoveTable = (id) => {
        setTables(prevTables => prevTables.filter(table => table.id !== id));
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
            setSelectedOrder(newValue.id); //
            setOrderSizes(newValue.sizes || []); // Update size details dynamically
            setOrderSizeNames(newValue.sizes ? newValue.sizes.map(size => size.size) : []); // Store only size names
            setSelectedStyle(newValue.style);
            setSelectedSeason(newValue.season);
            setSelectedColorCode(newValue.colorCode);
            
            // ✅ Reset all tables when switching orders
            setTables([
                {
                    id: 1, // ✅ Keep track of table IDs for duplication
                    rows: [
                        {
                            markerName: "",
                            piecesPerSize: newValue.sizes ? Object.fromEntries(newValue.sizes.map(size => [size.size, ""])) : {},
                            width: "",
                            markerLength: "",
                            layers: "",
                            expectedConsumption: "",
                            bagno: ""
                        }
                    ]
                }
            ]);
            setFabricType(null);
            setSpreadingMethod(null);
        } else {
            setSelectedOrder(null);
            setOrderSizes([]); // Reset sizes if no order is selected
            setOrderSizeNames([]); // ✅ Reset only size names
            setMarkerOptions([]); // Also clear marker options if no order is selected
            setTables([]);  // ✅ Reset all tables
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
                                markerName: "",
                                piecesPerSize: orderSizeNames.reduce((acc, size) => {
                                    acc[size] = ""; // Initialize each size with an empty value
                                    return acc;
                                }, {}),
                                width: "",
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
    };
    

    const handleRemoveRow = (tableIndex, rowIndex) => {
        setTables(prevTables => {
            return prevTables.map((table, tIndex) => {
                if (tIndex === tableIndex) {
                    return {
                        ...table,
                        rows: table.rows.filter((_, i) => i !== rowIndex) // ✅ Creates a new array without mutating state
                    };
                }
                return table; // ✅ Return other tables unchanged
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
        const payload = {
            order: selectedOrder,  // ✅ Selected Order
            laboratorio: selectedLaboratorio,  // ✅ Selected Laboratory
            fabricCode: tables.map(table => table.fabricCode),  // ✅ Fabric Codes per table
            fabricColor: tables.map(table => table.fabricColor),  // ✅ Fabric Colors per table
            fabricType: tables.map(table => table.fabricType),  // ✅ Fabric Types per table
            tables: tables.map(table => ({
                id: table.id,
                rows: table.rows.map(row => ({
                    markerName: row.markerName,
                    piecesPerSize: row.piecesPerSize,
                    width: row.width,
                    markerLength: row.markerLength,
                    layers: row.layers,
                    expectedConsumption: row.expectedConsumption,
                    bagno: row.bagno
                }))
            }))
        };
    
        console.log("Saving Data:", payload);
        
        // Next step: Send this to your database via an API
    };
    

    return (
        <>
            <MainCard title="Order Planning" sx={{ position: 'relative' }}>
                {/* Save Button (Positioned at the Top-Right) */}
                <Box sx={{ position: 'absolute', top: '16px', right: '16px' }}>
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

            {tables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   {/* ✅ Add spacing before every table except the first one */}
                   {tableIndex > 0 && <Box mt={2} />} 
                    <MainCard key={table.id} title={`Table ${tableIndex + 1}`}>
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
                                            const value = e.target.value;
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
                                        value={spreadingMethod || null} // ✅ Controlled component
                                        onChange={(event, newValue) => setSpreadingMethod(newValue)} // ✅ Update state
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
                                            <TableCell>Marker Name</TableCell>
                                            {/* ✅ Correctly Mapping Sizes */}
                                            {orderSizes.length > 0 &&
                                                orderSizes.map((size, index) => (
                                                    <TableCell align="center" sx={{ textAlign: 'center' }} key={index}>
                                                        {size.size || "N/A"}
                                                    </TableCell>
                                                ))
                                            }
                                            <TableCell align="center" sx={{ textAlign: 'center' }}>Width</TableCell>
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

                                                {/* Width, Marker Length, Layers, Expected Consumption, Bagno */}
                                                {/* Width (Auto-Filled & Read-only) */}
                                                <TableCell sx={{ minWidth: '60x', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "normal", textAlign: "center" }}>
                                                        {row.width}
                                                    </Typography>
                                                </TableCell>

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

                            {/* Add Row Button */}
                            <Box mt={2} display="flex" justifyContent="flex-end">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddCircleOutline />}
                                    onClick={() => handleAddRow(tableIndex)} // ✅ Pass the specific table index
                                >
                                    Add Row
                                </Button>
                            </Box>
                        </Box>

                        {/* Remove Table Button */}
                        {tables.length > 1 && (
                            <Box mt={2} display="flex" justifyContent="flex-end">
                                <Button variant="outlined" color="error" onClick={() => handleRemoveTable(table.id)}>
                                    Remove Table
                                </Button>
                            </Box>
                        )}
                    </MainCard>
                    </React.Fragment>
            ))}
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
                    onClick={() => {}} // 🔹 Placeholder for future functionality
                >
                    Add Collaretto Along Grain
                </Button>

                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddCircleOutline />}
                    onClick={() => {}} // 🔹 Placeholder for future functionality
                >
                    Add Collaretto Weft
                </Button>

                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddCircleOutline />}
                    onClick={() => {}} // 🔹 Placeholder for future functionality
                >
                    Add Collaretto Bias
                </Button>
            </Box>
        </>
    );
};

export default OrderPlanning;
