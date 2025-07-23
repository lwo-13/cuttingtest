import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

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
    IconButton,
    Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// icons
import { IconFileImport, IconRefresh, IconTarget } from '@tabler/icons';

const MarkersImported = ({ selectedPeriod }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMarkers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/dashboard/markers-imported?period=${selectedPeriod}`);
            if (response.data.success) {
                setMarkers(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch markers');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching markers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarkers();
    }, [selectedPeriod]);

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getMarkerTypeColor = (markerType) => {
        switch (markerType?.toLowerCase()) {
            case 'automatic':
                return 'success';
            case 'manual':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getCreationTypeColor = (creationType) => {
        switch (creationType?.toLowerCase()) {
            case 'import':
                return 'primary';
            case 'manual':
                return 'secondary';
            default:
                return 'default';
        }
    };

    return (
        <Card>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconFileImport size={20} />
                        <Typography variant="h6">
                            {t('dashboard.markersImported', 'Markers Imported')}
                        </Typography>
                    </Box>
                }
                action={
                    <IconButton onClick={fetchMarkers} disabled={loading}>
                        <IconRefresh size={20} />
                    </IconButton>
                }
                sx={{
                    backgroundColor: theme.palette.secondary.light,
                    color: theme.palette.secondary.contrastText,
                    '& .MuiCardHeader-action': {
                        color: theme.palette.secondary.contrastText
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

                {!loading && !error && markers.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                        {t('dashboard.noMarkersFound', 'No markers found for the selected period')}
                    </Typography>
                )}

                {!loading && !error && markers.length > 0 && (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('dashboard.markerName', 'Marker Name')}</TableCell>
                                    <TableCell>{t('dashboard.fabric', 'Fabric')}</TableCell>
                                    <TableCell align="center">{t('dashboard.dimensions', 'Dimensions')}</TableCell>
                                    <TableCell align="center">{t('dashboard.efficiency', 'Efficiency')}</TableCell>
                                    <TableCell align="center">{t('dashboard.pieces', 'Pieces')}</TableCell>
                                    <TableCell>{t('dashboard.type', 'Type')}</TableCell>
                                    <TableCell align="center">{t('dashboard.usage', 'Usage')}</TableCell>
                                    <TableCell>{t('dashboard.imported', 'Imported')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {markers.map((marker, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {marker.marker_name}
                                            </Typography>
                                            {marker.model && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {marker.model}
                                                    {marker.variant && ` - ${marker.variant}`}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {marker.fabric_code}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {marker.fabric_type}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">
                                                {marker.marker_width} × {marker.marker_length}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                cm
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight="medium">
                                                {marker.efficiency ? `${marker.efficiency}%` : '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={marker.total_pcs || 0}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Chip
                                                    label={marker.marker_type || 'Unknown'}
                                                    size="small"
                                                    color={getMarkerTypeColor(marker.marker_type)}
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={marker.creation_type || 'Unknown'}
                                                    size="small"
                                                    color={getCreationTypeColor(marker.creation_type)}
                                                    variant="filled"
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Badge
                                                badgeContent={marker.usage_count}
                                                color={marker.usage_count > 0 ? 'success' : 'default'}
                                                showZero
                                            >
                                                <IconTarget size={20} />
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDateTime(marker.created_at)}
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

export default MarkersImported;
