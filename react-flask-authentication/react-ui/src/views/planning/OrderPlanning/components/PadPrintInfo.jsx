// src/views/orderPlanning/PadPrintInfo.jsx
import React from 'react';
import { Grid, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const PadPrintInfo = ({ padPrintInfo }) => {
    const { t } = useTranslation();
    if (!padPrintInfo) return null;

    // Check if pattern is "TRANSFER" to hide color field and image
    const isTransferPattern = padPrintInfo.pattern?.toUpperCase() === "TRANSFER";

    return (
        <MainCard title={t('orderPlanning.padPrint', 'Pad Print')} sx={{ width: '100%', height: '100%' }}>
            <Grid container spacing={2}>
                {/* Fields Column - 1/3 width */}
                <Grid item xs={12} md={4}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* Pattern Field */}
                        <TextField
                            label={t('orderPlanning.pattern', 'Pattern')}
                            variant="outlined"
                            value={padPrintInfo.pattern || ""}
                            InputProps={{ readOnly: true }}
                            sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                        />

                        {/* Pad Print Color Field - Only show if not TRANSFER pattern */}
                        {!isTransferPattern && (
                            <TextField
                                label={t('orderPlanning.padPrintColor', 'Pad Print Color')}
                                variant="outlined"
                                value={padPrintInfo.padprint_color || ""}
                                InputProps={{ readOnly: true }}
                                sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                            />
                        )}
                    </Box>
                </Grid>

                {/* Image Column - 2/3 width - Only show if not TRANSFER pattern and image exists */}
                {!isTransferPattern && padPrintInfo.image_url && (
                    <Grid item xs={12} md={8}>
                        <Box
                            component="img"
                            // Use axios instance to get correct base URL (works with VPN proxy)
                            src={`${axios.defaults.baseURL}padprint/image/${padPrintInfo.pattern.toLowerCase()}.jpg`}
                            alt="Pad Print"
                            sx={{
                                width: '100%',
                                maxHeight: '160px',
                                objectFit: 'contain',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                        />
                    </Grid>
                )}
            </Grid>
        </MainCard>
    );
};

export default PadPrintInfo;