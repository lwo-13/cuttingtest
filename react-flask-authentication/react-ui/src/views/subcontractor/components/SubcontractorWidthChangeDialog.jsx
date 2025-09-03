import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Divider,
    Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { areSizeQuantitiesEqual } from '../../../utils/sizeNormalization';
import axios from 'utils/axiosInstance';

const SubcontractorWidthChangeDialog = ({
    open,
    onClose,
    mattressData,
    onSubmit,
    currentUser
}) => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState({
        newWidth: '',
        selectedMarker: '',
        availableMarkers: [],
        loadingMarkers: false,
        requestType: 'new_marker' // Default to new marker request
    });
    
    const [error, setError] = useState('');

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (open && mattressData) {
            setFormData({
                newWidth: '',
                selectedMarker: '',
                availableMarkers: [],
                loadingMarkers: false,
                requestType: 'new_marker'
            });
            setError('');
            
            // Fetch available markers for this style
            fetchMarkersForStyle();
        }
    }, [open, mattressData]);

    // Helper functions from spreader view
    const parseMattressSizes = (sizesString) => {
        // Parse "S - 10; M - 15; L - 20" format into {S: 10, M: 15, L: 20}
        if (!sizesString) return {};

        const sizeQuantities = {};
        const sizeEntries = sizesString.split(';');

        sizeEntries.forEach(entry => {
            const parts = entry.split(' - ');
            if (parts.length === 2) {
                const size = parts[0].trim();
                const quantity = parseInt(parts[1].trim());
                if (!isNaN(quantity)) {
                    sizeQuantities[size] = quantity;
                }
            }
        });

        return sizeQuantities;
    };

    // Note: Using imported areSizeQuantitiesEqual function with size normalization

    const fetchMarkersForStyle = async () => {
        if (!mattressData?.style || !mattressData?.orderCommessa) {
            console.log('Missing style or order commessa for marker fetch');
            return;
        }

        setFormData(prev => ({ ...prev, loadingMarkers: true }));

        try {
            // First get the order lines to get the sizes (same as spreader)
            const orderLinesResponse = await axios.get(`/orders/order_lines?order_commessa=${encodeURIComponent(mattressData.orderCommessa)}`);

            if (orderLinesResponse.data.success && orderLinesResponse.data.data.length > 0) {
                const sizes = orderLinesResponse.data.data.map(line => line.size);

                // Then fetch markers for this style with these sizes (same as spreader)
                const markersResponse = await axios.get('/markers/marker_headers_planning', {
                    params: {
                        style: mattressData.style,
                        sizes: sizes.join(',')
                    }
                });

                if (markersResponse.data.success) {
                    // Create mattress sizes string from piecesPerSize for comparison
                    const mattressSizesString = mattressData.piecesPerSize ?
                        Object.entries(mattressData.piecesPerSize)
                            .filter(([size, qty]) => parseFloat(qty) > 0)
                            .map(([size, qty]) => `${size} - ${qty}`)
                            .join('; ') : '';

                    // Parse mattress sizes for comparison
                    const mattressSizeQuantities = parseMattressSizes(mattressSizesString);

                    // Filter markers to only include those with exact size quantity matches
                    const matchingMarkers = markersResponse.data.data.filter(marker => {
                        return areSizeQuantitiesEqual(mattressSizeQuantities, marker.size_quantities || {});
                    });

                    console.log('Mattress sizes:', mattressSizeQuantities);
                    console.log('Available markers:', markersResponse.data.data.length);
                    console.log('Matching markers:', matchingMarkers.length);

                    setFormData(prev => ({
                        ...prev,
                        availableMarkers: matchingMarkers,
                        loadingMarkers: false
                    }));
                } else {
                    console.error('Failed to fetch markers:', markersResponse.data.msg);
                    setFormData(prev => ({ ...prev, loadingMarkers: false, availableMarkers: [] }));
                }
            } else {
                console.error('Failed to fetch order lines');
                setFormData(prev => ({ ...prev, loadingMarkers: false, availableMarkers: [] }));
            }
        } catch (error) {
            console.error('Error fetching markers:', error);
            setFormData(prev => ({ ...prev, loadingMarkers: false, availableMarkers: [] }));
        }
    };

    const handleWidthChange = (value) => {
        // Only allow numbers and limit to 3 digits, no decimals
        if (value === '' || (/^\d{1,3}$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 999)) {
            setFormData(prev => {
                // Check if current selected marker is still valid for new width (same logic as spreader)
                let newSelectedMarker = prev.selectedMarker;
                if (value && value.trim() !== '' && prev.selectedMarker) {
                    const newWidth = parseFloat(value);
                    if (!isNaN(newWidth)) {
                        const selectedMarkerData = prev.availableMarkers.find(
                            m => m.marker_name === prev.selectedMarker
                        );

                        if (selectedMarkerData) {
                            const markerWidth = parseFloat(selectedMarkerData.marker_width);
                            // Use same logic as spreader: markerWidth >= newWidth && markerWidth <= newWidth + 0.5
                            if (!(markerWidth >= newWidth && markerWidth <= newWidth + 0.5)) {
                                newSelectedMarker = '';
                            }
                        }
                    }
                }

                return {
                    ...prev,
                    newWidth: value,
                    selectedMarker: newSelectedMarker,
                    requestType: newSelectedMarker ? 'change_marker' : 'new_marker'
                };
            });
        }
        setError('');
    };

    const handleMarkerSelection = (markerName) => {
        let newWidth = formData.newWidth;

        // If a marker is selected, automatically update the width field with marker width
        if (markerName) {
            const selectedMarkerData = formData.availableMarkers.find(
                m => m.marker_name === markerName
            );
            if (selectedMarkerData && selectedMarkerData.marker_width) {
                // Convert marker width to string and ensure it's max 3 characters
                newWidth = Math.round(parseFloat(selectedMarkerData.marker_width)).toString();
                if (newWidth.length > 3) {
                    newWidth = newWidth.substring(0, 3);
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            selectedMarker: markerName,
            newWidth: newWidth,
            requestType: markerName ? 'change_marker' : 'new_marker'
        }));
        setError('');
    };

    const getFilteredMarkers = () => {
        let filteredMarkers = formData.availableMarkers;

        // Exclude the current marker from the list (same as spreader)
        filteredMarkers = filteredMarkers.filter(marker =>
            marker.marker_name !== mattressData?.markerName
        );

        // Filter by new width if provided (same logic as spreader)
        if (formData.newWidth && formData.newWidth.trim() !== '') {
            const newWidth = parseFloat(formData.newWidth);
            if (!isNaN(newWidth)) {
                filteredMarkers = filteredMarkers.filter(marker => {
                    const markerWidth = parseFloat(marker.marker_width);
                    return markerWidth >= newWidth && markerWidth <= newWidth + 0.5;
                });
            }
        }

        // Order markers by width from smallest to largest
        filteredMarkers.sort((a, b) => {
            const widthA = parseFloat(a.marker_width) || 0;
            const widthB = parseFloat(b.marker_width) || 0;
            return widthA - widthB;
        });

        return filteredMarkers;
    };

    const handleSubmit = () => {
        // Validation
        if (!formData.newWidth || parseFloat(formData.newWidth) <= 0) {
            setError('Please enter a valid width');
            return;
        }

        if (!mattressData) {
            setError('Mattress data is missing');
            return;
        }

        // Prepare submission data
        const submissionData = {
            mattressId: mattressData.id,
            currentWidth: mattressData.width,
            newWidth: parseFloat(formData.newWidth),
            selectedMarker: formData.selectedMarker,
            requestType: formData.requestType,
            style: mattressData.style,
            orderCommessa: mattressData.orderCommessa,
            piecesPerSize: mattressData.piecesPerSize || {},
            // Create mattress sizes string for API (same format as spreader)
            mattressSizes: mattressData.piecesPerSize ?
                Object.entries(mattressData.piecesPerSize)
                    .filter(([size, qty]) => parseFloat(qty) > 0)
                    .map(([size, qty]) => `${size} - ${qty}`)
                    .join('; ') : ''
        };

        onSubmit(submissionData);
    };

    if (!mattressData) {
        return null;
    }

    const filteredMarkers = getFilteredMarkers();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            
            <DialogContent>
                {/* Mattress Information */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label={t('subcontractor.mattressName', 'Mattress Name')}
                            value={mattressData.mattressName || ''}
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontWeight: 'normal'
                                }
                            }}
                        />
                        <TextField
                            label={t('subcontractor.currentWidth', 'Current Width (cm)')}
                            value={mattressData.width || ''}
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontWeight: 'normal'
                                }
                            }}
                        />
                        <TextField
                            label={t('subcontractor.currentMarker', 'Current Marker')}
                            value={mattressData.markerName || ''}
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontWeight: 'normal'
                                }
                            }}
                        />
                        <TextField
                            label={t('subcontractor.style', 'Style')}
                            value={mattressData.style || ''}
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontWeight: 'normal'
                                }
                            }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Width Change Request */}
                <Box sx={{ mb: 3 }}>
                    {/* New Width and Available Markers on the same line */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                        <TextField
                            label={t('subcontractor.newWidth', 'New Width (cm)')}
                            value={formData.newWidth}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            sx={{ flex: 1 }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                maxLength: 3
                            }}
                            placeholder="150"
                        />

                        {/* Available Markers */}
                        {formData.loadingMarkers ? (
                            <Box sx={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '56px' }}>
                                <CircularProgress size={24} />
                                <Typography sx={{ ml: 1 }}>
                                    {t('subcontractor.loadingMarkers', 'Loading available markers...')}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ flex: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>
                                        {t('subcontractor.selectMarker', 'Select Existing Marker')}
                                    </InputLabel>
                                    <Select
                                        value={formData.selectedMarker}
                                        onChange={(e) => handleMarkerSelection(e.target.value)}
                                        label={t('subcontractor.selectMarker', 'Select Existing Marker')}
                                    >
                                        {filteredMarkers.length === 0 && (
                                            <MenuItem value="">
                                                <em>{t('subcontractor.requestNewMarker', 'Request New Marker')}</em>
                                            </MenuItem>
                                        )}
                                        {filteredMarkers.map((marker) => (
                                            <MenuItem key={marker.id} value={marker.marker_name}>
                                                {marker.marker_name} ({marker.marker_width}cm)
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Request Type Information */}
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        {formData.selectedMarker ? (
                            t('subcontractor.changeMarkerInfo', 'This will request to change to the selected existing marker.')
                        ) : (
                            t('subcontractor.newMarkerInfo', 'This will request a new marker to be created for the specified width.')
                        )}
                    </Typography>
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
                <Button onClick={onClose}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!formData.newWidth || parseFloat(formData.newWidth) <= 0}
                >
                    {formData.selectedMarker ?
                        t('subcontractor.requestMarkerChange', 'Request Marker Change') :
                        t('subcontractor.requestNewMarker', 'Request New Marker')
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubcontractorWidthChangeDialog;
