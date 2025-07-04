// src/views/orderPlanning/PadPrintInfo.jsx
import React from 'react';
import { Grid, TextField, Box } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const PadPrintInfo = ({ padPrintInfo }) => {
    if (!padPrintInfo) return null;

    return (
        <MainCard title="Pad Print">
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={3} sm={2} md={1.5}>
                    <TextField
                        label="Pattern"
                        variant="outlined"
                        value={padPrintInfo.pattern || ""}
                        InputProps={{ readOnly: true }}
                        sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                    />
                </Grid>

                <Grid item xs={3} sm={2} md={1.5}>
                    <TextField
                        label="Pad Print Color"
                        variant="outlined"
                        value={padPrintInfo.padprint_color || ""}
                        InputProps={{ readOnly: true }}
                        sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                    />
                </Grid>

                {padPrintInfo.image_url && (
                    <Grid item xs={12} sm={6} md={4}>
                        <Box
                            component="img"
                            // Using the working API endpoint format
                            src={`http://172.27.57.210:5000/api/padprint/image/${padPrintInfo.pattern.toLowerCase()}.jpg`}
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