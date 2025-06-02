import React from 'react';
import { Box, Typography, Button} from '@mui/material';
import PushPin from '@mui/icons-material/PushPin';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import IconButton from '@mui/material/IconButton';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { Print } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const OrderActionBar = ({ unsavedChanges, handleSave, handlePrint, isPinned, setIsPinned, saving }) => {
    const { t } = useTranslation();
    return (
        <Box sx={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* ✅ Show Unsaved Changes */}
            {unsavedChanges && (
                <Typography color="error" sx={{ fontWeight: 'bold' }}>
                    {t('orderPlanning.unsavedChanges', 'Unsaved Changes')}
                </Typography>
            )}

            {/* ✅ Save Button */}
            <LoadingButton
                variant="contained"
                loading={saving}
                loadingPosition="start"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{
                    backgroundColor: unsavedChanges ? '#707070' : '#B0B0B0',
                    color: 'white',
                    '&:hover': {
                        backgroundColor: unsavedChanges ? '#505050' : '#A0A0A0'
                    }
                }}
            >
                {t('common.save', 'Save')}
            </LoadingButton>

            {/* ✅ Print Button */}
            <Button
                variant="contained"
                color="primary"
                onClick={handlePrint}
                startIcon={<Print />}
            >
                {t('common.print', 'Print')}
            </Button>

            <IconButton
                onClick={() => setIsPinned((prev) => !prev)}
                title={isPinned ? t('orderPlanning.unpinHeader', 'Unpin Header') : t('orderPlanning.pinHeader', 'Pin Header')}
                sx={{ color: '#1976d2' }} // optional: match icon color
            >
                {isPinned ? <PushPin /> : <PushPinOutlined />}
            </IconButton>
        </Box>
    );
};

export default OrderActionBar;
