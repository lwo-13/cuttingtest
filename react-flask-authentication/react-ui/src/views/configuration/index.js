import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Tab,
    Tabs,
    Button,
    TextField,
    IconButton,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Autocomplete
} from '@mui/material';
import { Add, Delete, Edit, Save, Refresh, ColorLens } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import UserRolesConfiguration from './UserRolesConfiguration';

const ConfigurationManagement = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogType, setDialogType] = useState(''); // 'productionCenter', 'cuttingRoom', 'destination', 'mapping', 'combination', 'color'
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchConfiguration();
    }, []);

    const fetchConfiguration = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/config/get');
            if (response.data.success) {
                setConfig(response.data.data);
            } else {
                showSnackbar('Failed to load configuration', 'error');
            }
        } catch (error) {
            console.error('Error fetching configuration:', error);
            showSnackbar('Error loading configuration', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveConfiguration = async () => {
        try {
            const response = await axios.post('/config/save', config);
            if (response.data.success) {
                showSnackbar('Configuration saved successfully!', 'success');
                fetchConfiguration(); // Reload to ensure consistency
            } else {
                showSnackbar('Failed to save configuration', 'error');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            showSnackbar('Error saving configuration', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleOpenDialog = (type, item = null) => {
        setDialogType(type);
        setEditItem(item);

        // Initialize form data based on type
        if (type === 'productionCenter' || type === 'cuttingRoom' || type === 'destination') {
            setFormData(item ? { key: item.key, value: item.value } : { key: '', value: '' });
        } else if (type === 'mapping') {
            setFormData(item ? { ...item } : { productionCenter: '', cuttingRooms: [] });
        } else if (type === 'destinationMapping') {
            setFormData(item ? { ...item } : { cuttingRoom: '', destinations: [] });
        } else if (type === 'combination') {
            setFormData(item ? { ...item } : { cuttingRoom: '', destination: '', key: '' });
        } else if (type === 'color') {
            setFormData(item ? { ...item } : { cuttingRoom: '', color: '#9e9e9e' });
        } else if (type === 'machineSpec') {
            setFormData(item ? { ...item } : { cuttingRoom: '', machines: [{ percentage: 100, length: 12, width: 220 }] });
        }

        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditItem(null);
        setFormData({});
    };

    const handleSaveDialog = () => {
        const newConfig = { ...config };

        if (dialogType === 'productionCenter') {
            if (!newConfig.productionCenters) newConfig.productionCenters = {};
            newConfig.productionCenters[formData.key] = formData.value;
        } else if (dialogType === 'cuttingRoom') {
            if (!newConfig.cuttingRooms) newConfig.cuttingRooms = {};
            newConfig.cuttingRooms[formData.key] = formData.value;
        } else if (dialogType === 'destination') {
            if (!newConfig.destinations) newConfig.destinations = {};
            newConfig.destinations[formData.key] = formData.value;
        } else if (dialogType === 'mapping') {
            if (!newConfig.productionCenterCuttingRooms) newConfig.productionCenterCuttingRooms = {};
            newConfig.productionCenterCuttingRooms[formData.productionCenter] = formData.cuttingRooms;
        } else if (dialogType === 'destinationMapping') {
            if (!newConfig.cuttingRoomDestinations) newConfig.cuttingRoomDestinations = {};
            newConfig.cuttingRoomDestinations[formData.cuttingRoom] = formData.destinations;
        } else if (dialogType === 'combination') {
            if (!newConfig.combinationKeys) newConfig.combinationKeys = {};
            const comboKey = `${formData.cuttingRoom}+${formData.destination}`;
            newConfig.combinationKeys[comboKey] = formData.key;
        } else if (dialogType === 'color') {
            if (!newConfig.cuttingRoomColors) newConfig.cuttingRoomColors = {};
            newConfig.cuttingRoomColors[formData.cuttingRoom] = formData.color;
        } else if (dialogType === 'machineSpec') {
            if (!newConfig.machineSpecifications) newConfig.machineSpecifications = {};
            newConfig.machineSpecifications[formData.cuttingRoom] = formData.machines;
        }

        setConfig(newConfig);
        handleCloseDialog();
        showSnackbar('Item updated. Click Save Configuration to persist changes.', 'info');
    };

    const handleDelete = (type, key) => {
        const newConfig = { ...config };

        if (type === 'productionCenter') {
            delete newConfig.productionCenters[key];
        } else if (type === 'cuttingRoom') {
            delete newConfig.cuttingRooms[key];
        } else if (type === 'destination') {
            delete newConfig.destinations[key];
        } else if (type === 'mapping') {
            delete newConfig.productionCenterCuttingRooms[key];
        } else if (type === 'destinationMapping') {
            delete newConfig.cuttingRoomDestinations[key];
        } else if (type === 'combination') {
            delete newConfig.combinationKeys[key];
        } else if (type === 'color') {
            delete newConfig.cuttingRoomColors[key];
        } else if (type === 'machineSpec') {
            delete newConfig.machineSpecifications[key];
        }

        setConfig(newConfig);
        showSnackbar('Item deleted. Click Save Configuration to persist changes.', 'info');
    };

    if (loading || !config) {
        return (
            <MainCard title="Configuration Management">
                <Typography>Loading configuration...</Typography>
            </MainCard>
        );
    }

    return (
        <MainCard
            title="Configuration Management"
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="text"
                        onClick={fetchConfiguration}
                        size="small"
                        sx={{ minWidth: 'auto', p: 1 }}
                        title="Reload"
                        disabled={activeTab === 8}
                    >
                        <Refresh />
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={saveConfiguration}
                        disabled={activeTab === 8}
                        sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            fontSize: '0.875rem',
                            py: 0.75,
                            px: 2,
                            minHeight: '36px',
                            '&:hover': {
                                backgroundColor: 'primary.dark'
                            },
                            '&:disabled': {
                                backgroundColor: 'grey.300',
                                color: 'grey.500'
                            }
                        }}
                    >
                        Save
                    </Button>
                </Box>
            }
        >
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Production Centers" />
                <Tab label="Cutting Rooms" />
                <Tab label="Destinations" />
                <Tab label="PC → CR Mapping" />
                <Tab label="CR → Dest Mapping" />
                <Tab label="Combination Keys" />
                <Tab label="Colors" />
                <Tab label="Machine Specs" />
                <Tab label="User Roles" />
            </Tabs>

            {/* Production Centers Tab */}
            {activeTab === 0 && (
                <ConfigTable
                    title="Production Centers"
                    data={config.productionCenters || {}}
                    onAdd={() => handleOpenDialog('productionCenter')}
                    onEdit={(key, value) => handleOpenDialog('productionCenter', { key, value })}
                    onDelete={(key) => handleDelete('productionCenter', key)}
                />
            )}

            {/* Cutting Rooms Tab */}
            {activeTab === 1 && (
                <ConfigTable
                    title="Cutting Rooms"
                    data={config.cuttingRooms || {}}
                    onAdd={() => handleOpenDialog('cuttingRoom')}
                    onEdit={(key, value) => handleOpenDialog('cuttingRoom', { key, value })}
                    onDelete={(key) => handleDelete('cuttingRoom', key)}
                />
            )}

            {/* Destinations Tab */}
            {activeTab === 2 && (
                <ConfigTable
                    title="Destinations"
                    data={config.destinations || {}}
                    onAdd={() => handleOpenDialog('destination')}
                    onEdit={(key, value) => handleOpenDialog('destination', { key, value })}
                    onDelete={(key) => handleDelete('destination', key)}
                />
            )}

            {/* Production Center to Cutting Room Mapping Tab */}
            {activeTab === 3 && (
                <MappingTable
                    title="Production Center → Cutting Rooms"
                    data={config.productionCenterCuttingRooms || {}}
                    onAdd={() => handleOpenDialog('mapping')}
                    onEdit={(pc, rooms) => handleOpenDialog('mapping', { productionCenter: pc, cuttingRooms: rooms })}
                    onDelete={(key) => handleDelete('mapping', key)}
                />
            )}

            {/* Cutting Room to Destination Mapping Tab */}
            {activeTab === 4 && (
                <MappingTable
                    title="Cutting Room → Destinations"
                    data={config.cuttingRoomDestinations || {}}
                    onAdd={() => handleOpenDialog('destinationMapping')}
                    onEdit={(cr, dests) => handleOpenDialog('destinationMapping', { cuttingRoom: cr, destinations: dests })}
                    onDelete={(key) => handleDelete('destinationMapping', key)}
                />
            )}

            {/* Combination Keys Tab */}
            {activeTab === 5 && (
                <CombinationTable
                    data={config.combinationKeys || {}}
                    config={config}
                    onEdit={(combo, key) => {
                        const [cuttingRoom, destination] = combo.split('+');
                        handleOpenDialog('combination', { cuttingRoom, destination, key });
                    }}
                />
            )}

            {/* Colors Tab */}
            {activeTab === 6 && (
                <ColorTable
                    data={config.cuttingRoomColors || {}}
                    onAdd={() => handleOpenDialog('color')}
                    onEdit={(room, color) => handleOpenDialog('color', { cuttingRoom: room, color })}
                    onDelete={(key) => handleDelete('color', key)}
                />
            )}

            {/* Machine Specifications Tab */}
            {activeTab === 7 && (
                <MachineSpecsTable
                    data={config.machineSpecifications || {}}
                    onAdd={() => handleOpenDialog('machineSpec')}
                    onEdit={(room, machines) => handleOpenDialog('machineSpec', { cuttingRoom: room, machines })}
                    onDelete={(key) => handleDelete('machineSpec', key)}
                />
            )}

            {/* User Roles Tab */}
            {activeTab === 8 && (
                <UserRolesConfiguration />
            )}

            {/* Dialog for adding/editing */}
            <ConfigDialog
                open={openDialog}
                type={dialogType}
                formData={formData}
                setFormData={setFormData}
                onClose={handleCloseDialog}
                onSave={handleSaveDialog}
                config={config}
            />

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainCard>
    );
};

// Component for simple key-value tables
const ConfigTable = ({ title, data, onAdd, onEdit, onDelete }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4">{title}</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={onAdd} size="small">
                Add {title.slice(0, -1)}
            </Button>
        </Box>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Key</strong></TableCell>
                        <TableCell><strong>Value</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(data).map(([key, value]) => (
                        <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>{value}</TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => onEdit(key, value)} color="primary">
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => onDelete(key)} color="error">
                                    <Delete fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

// Component for mapping tables (arrays)
const MappingTable = ({ title, data, onAdd, onEdit, onDelete }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4">{title}</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={onAdd} size="small">
                Add Mapping
            </Button>
        </Box>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Key</strong></TableCell>
                        <TableCell><strong>Values</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(data).map(([key, values]) => (
                        <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {values.map((val, idx) => (
                                        <Chip key={idx} label={val} size="small" />
                                    ))}
                                </Box>
                            </TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => onEdit(key, values)} color="primary">
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => onDelete(key)} color="error">
                                    <Delete fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

// Component for combination keys table
const CombinationTable = ({ data, onEdit, config }) => {
    // Generate all possible combinations from cutting room destinations mapping
    const allCombinations = React.useMemo(() => {
        const combinations = [];
        const cuttingRoomDestinations = config?.cuttingRoomDestinations || {};

        Object.entries(cuttingRoomDestinations).forEach(([cuttingRoomKey, destinations]) => {
            // Extract the actual cutting room name (remove "CUTTING_ROOMS." prefix if present)
            const cuttingRoom = cuttingRoomKey.replace('CUTTING_ROOMS.', '');

            destinations.forEach(destination => {
                const comboKey = `${cuttingRoom}+${destination}`;
                combinations.push({
                    cuttingRoom,
                    destination,
                    comboKey,
                    key: data[comboKey] || '' // Get existing key or empty string
                });
            });
        });

        return combinations;
    }, [config?.cuttingRoomDestinations, data]);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4">Combination Keys</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    Auto-generated from Cutting Room → Destinations mapping
                </Typography>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Cutting Room</strong></TableCell>
                            <TableCell><strong>Destination</strong></TableCell>
                            <TableCell><strong>Key</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allCombinations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No combinations available. Please configure Cutting Room → Destinations mapping first.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            allCombinations.map(({ cuttingRoom, destination, comboKey, key }) => (
                                <TableRow key={comboKey}>
                                    <TableCell>{cuttingRoom}</TableCell>
                                    <TableCell>{destination}</TableCell>
                                    <TableCell>
                                        {key ? (
                                            <Chip label={key} color="primary" size="small" />
                                        ) : (
                                            <Chip label="Not Set" color="default" size="small" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => onEdit(comboKey, key)} color="primary">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

// Component for color configuration table
const ColorTable = ({ data, onAdd, onEdit, onDelete }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4">Cutting Room Colors</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={onAdd} size="small">
                Add Color
            </Button>
        </Box>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Cutting Room</strong></TableCell>
                        <TableCell><strong>Color</strong></TableCell>
                        <TableCell><strong>Preview</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(data).map(([room, color]) => (
                        <TableRow key={room}>
                            <TableCell>{room}</TableCell>
                            <TableCell>{color}</TableCell>
                            <TableCell>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 24,
                                        backgroundColor: color,
                                        border: '1px solid #ccc',
                                        borderRadius: 1
                                    }}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => onEdit(room, color)} color="primary">
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => onDelete(room)} color="error">
                                    <Delete fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

// Component for machine specifications table
const MachineSpecsTable = ({ data, onAdd, onEdit, onDelete }) => {
    const calculateTotalPercentage = (machines) => {
        return machines.reduce((sum, m) => sum + (m.percentage || 0), 0);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4">Machine Specifications</Typography>
                <Button variant="outlined" startIcon={<Add />} onClick={onAdd} size="small">
                    Add Machine Spec
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Cutting Room</strong></TableCell>
                            <TableCell><strong>Machines</strong></TableCell>
                            <TableCell><strong>Total %</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(data).map(([room, machines]) => {
                            const totalPct = calculateTotalPercentage(machines);
                            const isValid = totalPct === 100;
                            return (
                                <TableRow key={room}>
                                    <TableCell>{room}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {machines.map((machine, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={`${machine.percentage}% - ${machine.length}m × ${machine.width}cm`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${totalPct}%`}
                                            size="small"
                                            color={isValid ? 'success' : 'error'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => onEdit(room, machines)} color="primary">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => onDelete(room)} color="error">
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

// Dialog component for adding/editing configurations
const ConfigDialog = ({ open, type, formData, setFormData, onClose, onSave, config }) => {
    const getDialogTitle = () => {
        const titles = {
            productionCenter: 'Production Center',
            cuttingRoom: 'Cutting Room',
            destination: 'Destination',
            mapping: 'Production Center → Cutting Rooms Mapping',
            destinationMapping: 'Cutting Room → Destinations Mapping',
            combination: 'Combination Key',
            color: 'Cutting Room Color',
            machineSpec: 'Machine Specifications'
        };
        return titles[type] || 'Configuration';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(type === 'productionCenter' || type === 'cuttingRoom' || type === 'destination') && (
                        <>
                            <TextField
                                label="Key"
                                value={formData.key || ''}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Value"
                                value={formData.value || ''}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                fullWidth
                            />
                        </>
                    )}

                    {type === 'mapping' && (
                        <>
                            <FormControl fullWidth>
                                <InputLabel>Production Center</InputLabel>
                                <Select
                                    value={formData.productionCenter || ''}
                                    onChange={(e) => setFormData({ ...formData, productionCenter: e.target.value })}
                                    label="Production Center"
                                >
                                    {Object.keys(config?.productionCenters || {}).map((pc) => (
                                        <MenuItem key={pc} value={pc}>{pc}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Autocomplete
                                multiple
                                options={Object.keys(config?.cuttingRooms || {})}
                                value={formData.cuttingRooms || []}
                                onChange={(e, newValue) => setFormData({ ...formData, cuttingRooms: newValue })}
                                renderInput={(params) => <TextField {...params} label="Cutting Rooms" />}
                            />
                        </>
                    )}

                    {type === 'destinationMapping' && (
                        <>
                            <FormControl fullWidth>
                                <InputLabel>Cutting Room</InputLabel>
                                <Select
                                    value={formData.cuttingRoom || ''}
                                    onChange={(e) => setFormData({ ...formData, cuttingRoom: e.target.value })}
                                    label="Cutting Room"
                                >
                                    {Object.keys(config?.cuttingRooms || {}).map((cr) => (
                                        <MenuItem key={cr} value={cr}>{cr}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Autocomplete
                                multiple
                                options={Object.keys(config?.destinations || {})}
                                value={formData.destinations || []}
                                onChange={(e, newValue) => setFormData({ ...formData, destinations: newValue })}
                                renderInput={(params) => <TextField {...params} label="Destinations" />}
                            />
                        </>
                    )}

                    {type === 'combination' && (
                        <>
                            <TextField
                                label="Cutting Room"
                                value={formData.cuttingRoom || ''}
                                fullWidth
                                disabled
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                            <TextField
                                label="Destination"
                                value={formData.destination || ''}
                                fullWidth
                                disabled
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                            <TextField
                                label="Combination Key"
                                value={formData.key || ''}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                fullWidth
                                placeholder="e.g., Z11, VV, DD"
                                autoFocus
                                helperText="Enter a unique key for this cutting room + destination combination"
                            />
                        </>
                    )}

                    {type === 'color' && (
                        <>
                            <FormControl fullWidth>
                                <InputLabel>Cutting Room</InputLabel>
                                <Select
                                    value={formData.cuttingRoom || ''}
                                    onChange={(e) => setFormData({ ...formData, cuttingRoom: e.target.value })}
                                    label="Cutting Room"
                                >
                                    {Object.keys(config?.cuttingRooms || {}).map((cr) => (
                                        <MenuItem key={cr} value={cr}>{cr}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Color (Hex)"
                                value={formData.color || ''}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                fullWidth
                                placeholder="#1976d2"
                                InputProps={{
                                    startAdornment: (
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                backgroundColor: formData.color || '#9e9e9e',
                                                border: '1px solid #ccc',
                                                borderRadius: 1,
                                                mr: 1
                                            }}
                                        />
                                    )
                                }}
                            />
                        </>
                    )}

                    {type === 'machineSpec' && (
                        <>
                            <FormControl fullWidth>
                                <InputLabel>Cutting Room</InputLabel>
                                <Select
                                    value={formData.cuttingRoom || ''}
                                    onChange={(e) => setFormData({ ...formData, cuttingRoom: e.target.value })}
                                    label="Cutting Room"
                                >
                                    {Object.keys(config?.cuttingRooms || {}).map((cr) => (
                                        <MenuItem key={cr} value={cr}>{cr}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle2" sx={{ mt: 1 }}>Machines:</Typography>
                            {(formData.machines || [{ percentage: 100, length: 12, width: 220 }]).map((machine, idx) => (
                                <Paper key={idx} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                            label="Percentage %"
                                            type="number"
                                            value={machine.percentage || ''}
                                            onChange={(e) => {
                                                const newMachines = [...(formData.machines || [])];
                                                newMachines[idx] = { ...machine, percentage: parseInt(e.target.value) || 0 };
                                                setFormData({ ...formData, machines: newMachines });
                                            }}
                                            sx={{ flex: 1 }}
                                            inputProps={{ min: 0, max: 100 }}
                                        />
                                        <TextField
                                            label="Length (m)"
                                            type="number"
                                            value={machine.length || ''}
                                            onChange={(e) => {
                                                const newMachines = [...(formData.machines || [])];
                                                newMachines[idx] = { ...machine, length: parseFloat(e.target.value) || 0 };
                                                setFormData({ ...formData, machines: newMachines });
                                            }}
                                            sx={{ flex: 1 }}
                                            inputProps={{ step: 0.5, min: 0 }}
                                        />
                                        <TextField
                                            label="Width (cm)"
                                            type="number"
                                            value={machine.width || ''}
                                            onChange={(e) => {
                                                const newMachines = [...(formData.machines || [])];
                                                newMachines[idx] = { ...machine, width: parseInt(e.target.value) || 0 };
                                                setFormData({ ...formData, machines: newMachines });
                                            }}
                                            sx={{ flex: 1 }}
                                            inputProps={{ min: 0 }}
                                        />
                                        {(formData.machines || []).length > 1 && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    const newMachines = (formData.machines || []).filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, machines: newMachines });
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Paper>
                            ))}

                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => {
                                    const newMachines = [...(formData.machines || []), { percentage: 0, length: 12, width: 220 }];
                                    setFormData({ ...formData, machines: newMachines });
                                }}
                            >
                                Add Machine
                            </Button>

                            {formData.machines && (
                                <Alert severity={formData.machines.reduce((sum, m) => sum + (m.percentage || 0), 0) === 100 ? 'success' : 'warning'}>
                                    Total: {formData.machines.reduce((sum, m) => sum + (m.percentage || 0), 0)}%
                                    {formData.machines.reduce((sum, m) => sum + (m.percentage || 0), 0) !== 100 && ' (should be 100%)'}
                                </Alert>
                            )}
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onSave} variant="contained" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfigurationManagement;

