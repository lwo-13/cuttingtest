// src/views/orderPlanning/PadPrintInfoManual.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Grid, MenuItem, Select, InputLabel, FormControl, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MainCard from 'ui-component/cards/MainCard';

const PadPrintInfoManual = ({ brand, pattern, setPattern, color, setColor }) => {
    const { t } = useTranslation();

    const tezenisOptions = ['AYLOGO', 'AK000200', 'TRANSFER', 'NO'];
    const calzedoniaOptions = ['AK000049', 'AKOM23', 'AKOM24', 'NO'];
    const intimissimiOptions = [
        'AK000024', 'AK000025', 'AK000029', 'AK000135', 'AK000176', 
        'AK000177', 'AK000178', 'AK000179', 'AK000181', 'AK000182', 
        'AK000183', 'AK000184', 'AK000188TRANSFER', 'AK000218', 'AK000266', 
        'AK000267', 'AK000268', 'AK000269', 'AKOM04', 'AKOM05', 'AKOM06', 
        'AKOM39', 'AKOM40', 'AKOM41', 'AKOM43', 'AKOM44', 'AKOM48', 
        'AKOM54', 'AKOM62', 'TRANSFER', 'NO'
    ];
    const falconeriOptions = ['ETI000043', 'ETIMA0056', 'ETIMA0057', 'NO'];

    const colorOptions = [
        'BIANCO', 'NERO', 'GRIGIO', 'BRONZO', 
        'ANTRACITE', 'GRIGIO ANTRACITE', 'PANNA', 'NO'
    ];

    const patternOptions = useMemo(() => {
        switch ((brand || '').toLowerCase()) {
            case 'tezenis':
                return tezenisOptions;
            case 'calzedonia':
                return calzedoniaOptions;
            case 'intimissimi':
                return intimissimiOptions;
            case 'falconeri':
                return falconeriOptions;
            default:
                return [];
        }
    }, [brand]);

    // Check if pattern is "TRANSFER" to hide color field
    const isTransferPattern = pattern?.toUpperCase() === "TRANSFER";

    // Auto-set color to "NO" when TRANSFER pattern is selected
    useEffect(() => {
        if (isTransferPattern && color !== "NO") {
            setColor("NO");
        }
    }, [isTransferPattern, color, setColor]);

    return (
        <MainCard title={t('orderPlanning.padPrint', 'Pad Print')} sx={{ width: '100%', height: '100%' }}>
            <Grid container spacing={2}>
                {/* Fields Column - 1/3 width */}
                <Grid item xs={12} md={4}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* Pattern Field */}
                        <FormControl fullWidth>
                            <InputLabel>{t('orderPlanning.pattern', 'Pattern')}</InputLabel>
                            <Select
                                value={pattern}
                                label={t('orderPlanning.pattern', 'Pattern')}
                                onChange={(e) => setPattern(e.target.value)}
                                sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                            >
                                {patternOptions.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                        {opt}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Pad Print Color Field - Only show if not TRANSFER pattern */}
                        {!isTransferPattern && (
                            <FormControl fullWidth>
                                <InputLabel>Pad Print Color</InputLabel>
                                <Select
                                    value={color}
                                    label="Pad Print Color"
                                    onChange={(e) => setColor(e.target.value)}
                                    sx={{ "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                                >
                                    {colorOptions.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                </Grid>

                {/* Empty space for image - 2/3 width (no image in manual mode) */}
                <Grid item xs={12} md={8}>
                    {/* This space could be used for future features or left empty */}
                </Grid>
            </Grid>
        </MainCard>
    );
};

export default PadPrintInfoManual;

