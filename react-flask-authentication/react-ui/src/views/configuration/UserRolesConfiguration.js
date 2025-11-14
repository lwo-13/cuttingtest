import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Snackbar,
    Alert,
    Select,
    MenuItem,
    FormControl,
    CircularProgress
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const UserRolesConfiguration = () => {
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [changes, setChanges] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes] = await Promise.all([
                axios.get('/config/users'),
                axios.get('/config/roles')
            ]);

            if (usersRes.data.success) {
                setUsers(usersRes.data.data);
            }
            if (rolesRes.data.success) {
                setAvailableRoles(rolesRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showSnackbar('Error loading data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleRoleChange = (userId, newRole) => {
        setChanges({
            ...changes,
            [userId]: newRole
        });
    };

    const saveChanges = async () => {
        try {
            const updates = Object.entries(changes).map(([userId, role]) => ({
                id: parseInt(userId),
                role
            }));

            for (const update of updates) {
                await axios.post('/config/users', update);
            }

            setChanges({});
            await fetchData();
            showSnackbar('All user roles updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving changes:', error);
            showSnackbar('Error saving changes', 'error');
        }
    };

    if (loading) {
        return (
            <MainCard title="User Roles Management">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <MainCard
            title="User Roles Management"
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchData}
                        size="small"
                    >
                        Reload
                    </Button>
                    {Object.keys(changes).length > 0 && (
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={saveChanges}
                            size="small"
                            color="primary"
                        >
                            Save Changes ({Object.keys(changes).length})
                        </Button>
                    )}
                </Box>
            }
        >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When a user registers, they automatically get the "Planner" role. Use this page to change their role.
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><strong>Username</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Current Role</strong></TableCell>
                            <TableCell><strong>New Role</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <Select
                                            value={changes[user.id] || user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        >
                                            {availableRoles.map((role) => (
                                                <MenuItem key={role} value={role}>
                                                    {role}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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

export default UserRolesConfiguration;

