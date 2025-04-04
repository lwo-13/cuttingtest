import React from 'react';
import { Box, Typography, Button} from '@mui/material';
import PushPin from '@mui/icons-material/PushPin';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import IconButton from '@mui/material/IconButton';
import { Save, Print } from '@mui/icons-material';

const OrderActionBar = ({ unsavedChanges, handleSave, handlePrint, isPinned, setIsPinned }) => {
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

            <IconButton
                onClick={() => setIsPinned((prev) => !prev)}
                title={isPinned ? 'Unpin Header' : 'Pin Header'}
                sx={{ color: '#1976d2' }} // optional: match icon color
            >
                {isPinned ? <PushPin /> : <PushPinOutlined />}
            </IconButton>
        </Box>
    );
};

export default OrderActionBar;
