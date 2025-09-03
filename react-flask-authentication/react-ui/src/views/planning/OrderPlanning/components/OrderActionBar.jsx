import React from 'react';
import { Box, Button, Chip, CircularProgress } from '@mui/material';
import PushPin from '@mui/icons-material/PushPin';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import IconButton from '@mui/material/IconButton';
import SaveIcon from '@mui/icons-material/Save';
import { Print, RestoreOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const OrderActionBar = ({ unsavedChanges, handleSave, handlePrint, isPinned, setIsPinned, saving, handleDiscard }) => {
    const { t } = useTranslation();

    // Debug logging for save button state
    React.useEffect(() => {
        console.log('💾 Save button state - unsavedChanges:', unsavedChanges, 'saving:', saving, 'disabled:', !unsavedChanges && !saving);
    }, [unsavedChanges, saving]);

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
        }}>
            {/* Enhanced Unsaved Changes Indicator - Matching Discard Button Style */}
            {unsavedChanges && (
                <Chip
                    label={t('orderPlanning.unsavedChanges', 'Unsaved Changes')}
                    variant="outlined"
                    size="small"
                    sx={{
                        fontWeight: 'normal',
                        fontSize: '0.75rem',
                        height: '28px',
                        backgroundColor: 'transparent',
                        color: 'error.main',
                        borderColor: 'error.main',
                        '& .MuiChip-label': {
                            px: 1.5
                        },
                        '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'white'
                        }
                    }}
                />
            )}

            {/* Discard Changes Button */}
            {unsavedChanges && (
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RestoreOutlined />}
                    onClick={handleDiscard}
                    disabled={saving}
                    sx={{
                        fontSize: '0.875rem',
                        py: 0.75,
                        px: 2,
                        minHeight: '36px'
                    }}
                >
                    {t('common.discard', 'Discard')}
                </Button>
            )}

            {/* Enhanced Save Button */}
            <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={!unsavedChanges && !saving}
                sx={{
                    backgroundColor: unsavedChanges ? 'primary.main' : 'grey.400',
                    color: 'white',
                    fontSize: '0.875rem',
                    py: 0.75,
                    px: 2,
                    minHeight: '36px',
                    '&:hover': {
                        backgroundColor: unsavedChanges ? 'primary.dark' : 'grey.500'
                    },
                    '&:disabled': {
                        backgroundColor: 'grey.300',
                        color: 'grey.500'
                    }
                }}
            >
                {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>

            {/* Print Button - Only show if handlePrint is provided */}
            {handlePrint && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePrint}
                    startIcon={<Print />}
                    sx={{
                        fontSize: '0.875rem',
                        py: 0.75,
                        px: 2,
                        minHeight: '36px'
                    }}
                >
                    {t('common.print', 'Print')}
                </Button>
            )}

            <IconButton
                onClick={() => setIsPinned((prev) => !prev)}
                title={isPinned ? t('orderPlanning.unpinHeader', 'Unpin Header') : t('orderPlanning.pinHeader', 'Pin Header')}
                sx={{
                    color: 'primary.main',
                    p: 0.5
                }}
                size="small"
            >
                {isPinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
            </IconButton>
        </Box>
    );
};

export default OrderActionBar;
