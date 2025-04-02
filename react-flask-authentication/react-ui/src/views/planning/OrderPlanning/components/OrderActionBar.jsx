import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Save, Print } from '@mui/icons-material';

const OrderActionBar = ({ unsavedChanges, handleSave, handlePrint }) => {
    return (
        <Box sx={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* ✅ Show Unsaved Changes */}
            {unsavedChanges && (
                <Typography color="error" sx={{ fontWeight: 'bold' }}>
                    Unsaved Changes
                </Typography>
            )}

            {/* ✅ Save Button */}
            <Button
                variant="contained"
                sx={{
                    backgroundColor: unsavedChanges ? '#707070' : '#B0B0B0',
                    color: 'white',
                    '&:hover': { backgroundColor: unsavedChanges ? '#505050' : '#A0A0A0' }
                }}
                onClick={handleSave}
                startIcon={<Save />}
            >
                Save
            </Button>

            {/* ✅ Print Button */}
            <Button
                variant="contained"
                color="primary"
                onClick={handlePrint}
                startIcon={<Print />}
            >
                Print
            </Button>
        </Box>
    );
};

export default OrderActionBar;
