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
                    <Grid item xs={12} sm={4} md={3}>
                        <Box
                            component="img"
                            // to see it work on local host change it to this http://127.0.0.1:5000/api
                            src={`http://172.27.57.210:5000/api/padprint/image/${padPrintInfo.pattern}.jpg`}
                            alt="Pad Print"
                            sx={{
                                width: '100%',
                                maxHeight: '75px',
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