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
import { Save, RestoreOutlined } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const UserRolesConfiguration = () => {
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [changes, setChanges] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [originalUsers, setOriginalUsers] = useState([]);

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
                // Sort users by role
                const sortedUsers = [...usersRes.data.data].sort((a, b) => {
                    return (a.role || '').localeCompare(b.role || '');
                });
                setUsers(sortedUsers);
                setOriginalUsers(sortedUsers);
            }
            if (rolesRes.data.success) {
                setAvailableRoles(rolesRes.data.data);
            }
            setChanges({});
            setHasChanges(false);
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
        setHasChanges(true);
    };

    const discardChanges = () => {
        setChanges({});
        setHasChanges(false);
        showSnackbar('Changes discarded', 'info');
    };

    const saveChanges = async () => {
        try {
            setSaving(true);
            const updates = Object.entries(changes).map(([userId, role]) => ({
                id: parseInt(userId),
                role
            }));

            for (const update of updates) {
                await axios.post('/config/users', update);
            }

            setChanges({});
            setHasChanges(false);
            await fetchData();
            showSnackbar('User roles updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving changes:', error);
            showSnackbar('Error saving changes', 'error');
        } finally {
            setSaving(false);
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
                    {hasChanges && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<RestoreOutlined />}
                            onClick={discardChanges}
                            disabled={saving}
                            sx={{
                                fontSize: '0.875rem',
                                py: 0.75,
                                px: 2,
                                minHeight: '36px'
                            }}
                        >
                            Discard
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={saveChanges}
                        disabled={!hasChanges || saving}
                        sx={{
                            backgroundColor: hasChanges ? 'primary.main' : 'grey.400',
                            color: 'white',
                            fontSize: '0.875rem',
                            py: 0.75,
                            px: 2,
                            minHeight: '36px',
                            '&:hover': {
                                backgroundColor: hasChanges ? 'primary.dark' : 'grey.500'
                            },
                            '&:disabled': {
                                backgroundColor: 'grey.300',
                                color: 'grey.500'
                            }
                        }}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            }
        >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When a user registers, they automatically get the "Planner" role. Use this page to change their role.
                Operator accounts (Spreader1-6, Cutter1-6) are hidden from this list.
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><strong>Username</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Role</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.filter(user => user.role !== 'Spreader' && user.role !== 'Cutter').map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <Select
                                            value={changes[user.id] || user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            renderValue={(selected) => selected}
                                        >
                                            {availableRoles.map((role) => (
                                                <MenuItem key={role} value={role}>
                                                    {role}{role === user.role ? ' (current)' : ''}
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

