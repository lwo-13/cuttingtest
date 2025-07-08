// src/views/orderPlanning/PadPrintInfo.jsx
import React from 'react';
import { Grid, TextField, Box } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const PadPrintInfo = ({ padPrintInfo }) => {
    if (!padPrintInfo) return null;

    return (
        <MainCard title="Pad Print" sx={{ width: '100%', height: '100%' }}>
            <Grid container spacing={2}>
                {/* Fields Column - 1/3 width */}
                <Grid item xs={12} md={4}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* Pattern Field */}
                        <TextField
                            label="Pattern"
                            variant="outlined"
                            value={padPrintInfo.pattern || ""}
                            InputProps={{ readOnly: true }}
                            sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                        />

                        {/* Pad Print Color Field - Below Pattern */}
                        <TextField
                            label="Pad Print Color"
                            variant="outlined"
                            value={padPrintInfo.padprint_color || ""}
                            InputProps={{ readOnly: true }}
                            sx={{ width: '100%', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
                        />
                    </Box>
                </Grid>

                {/* Image Column - 2/3 width */}
                {padPrintInfo.image_url && (
                    <Grid item xs={12} md={8}>
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