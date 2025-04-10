// src/views/orderPlanning/PadPrintInfoManual.jsx
import React, { useState, useMemo } from 'react';
import { Grid, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const PadPrintInfoManual = ({ brand, pattern, setPattern, color, setColor }) => {

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

    return (
        <MainCard title="Pad Print">
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={3} sm={2} md={1.5}>
                    <FormControl fullWidth>
                        <InputLabel>Pattern</InputLabel>
                        <Select
                            value={pattern}
                            label="Pattern"
                            onChange={(e) => setPattern(e.target.value)}
                        >
                            {patternOptions.map((opt) => (
                                <MenuItem key={opt} value={opt}>
                                    {opt}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={3} sm={2} md={1.5}>
                    <FormControl fullWidth>
                        <InputLabel>Pad Print Color</InputLabel>
                        <Select
                            value={color}
                            label="Pad Print Color"
                            onChange={(e) => setColor(e.target.value)}
                        >
                            {colorOptions.map((opt) => (
                                <MenuItem key={opt} value={opt}>
                                    {opt}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </MainCard>
    );
};

export default PadPrintInfoManual;

