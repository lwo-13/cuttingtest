import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'utils/axiosInstance';

// material-ui
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
    IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// icons
import { IconListCheck, IconRefresh } from '@tabler/icons';

const OrdersWorkedOn = ({ selectedPeriod }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/dashboard/orders-worked-on?period=${selectedPeriod}`);
            if (response.data.success) {
                setOrders(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch orders');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [selectedPeriod]);

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getProductionCenterChips = (productionCenters) => {
        if (!productionCenters || productionCenters.length === 0) {
            return <Chip label="Not Assigned" size="small" variant="outlined" />;
        }

        return productionCenters.map((pc, index) => (
            <Tooltip
                key={index}
                title={`${pc.production_center} - ${pc.cutting_room}${pc.destination ? ` → ${pc.destination}` : ''}`}
            >
                <Chip
                    label={pc.production_center}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    color="primary"
                />
            </Tooltip>
        ));
    };

    return (
        <Card>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconListCheck size={20} />
                        <Typography variant="h6">
                            {t('dashboard.ordersWorkedOn', 'Orders Worked On')}
                        </Typography>
                    </Box>
                }
                action={
                    <IconButton onClick={fetchOrders} disabled={loading}>
                        <IconRefresh size={20} />
                    </IconButton>
                }
                sx={{
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    '& .MuiCardHeader-action': {
                        color: theme.palette.primary.contrastText
                    }
                }}
            />
            <CardContent>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && orders.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                        {t('dashboard.noOrdersFound', 'No orders found for the selected period')}
                    </Typography>
                )}

                {!loading && !error && orders.length > 0 && (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('dashboard.order', 'Order')}</TableCell>
                                    <TableCell>{t('dashboard.style', 'Style')}</TableCell>
                                    <TableCell>{t('dashboard.season', 'Season')}</TableCell>
                                    <TableCell>{t('dashboard.color', 'Color')}</TableCell>
                                    <TableCell align="center">{t('dashboard.mattresses', 'Mattresses')}</TableCell>
                                    <TableCell>{t('dashboard.productionCenter', 'Production Center')}</TableCell>
                                    <TableCell>{t('dashboard.lastUpdated', 'Last Updated')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {order.order_commessa}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {order.style}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {order.season}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {order.color_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={order.mattress_count}
                                                size="small"
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                {getProductionCenterChips(order.production_centers)}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDateTime(order.last_updated)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );
};

export default OrdersWorkedOn;
