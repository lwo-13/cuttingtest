import React from 'react';
import { Box, Typography, Button, Chip} from '@mui/material';
import PushPin from '@mui/icons-material/PushPin';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import IconButton from '@mui/material/IconButton';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { Print, Warning, Refresh, RestoreOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const OrderActionBar = ({ unsavedChanges, handleSave, handlePrint, isPinned, setIsPinned, saving, handleDiscard }) => {
    const { t } = useTranslation();
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
                    size="small"
                    startIcon={<RestoreOutlined />}
                    onClick={handleDiscard}
                    disabled={saving}
                    sx={{
                        fontSize: '0.75rem',
                        py: 0.25,
                        px: 1,
                        minHeight: '28px'
                    }}
                >
                    {t('common.discard', 'Discard')}
                </Button>
            )}

            {/* Enhanced Save Button */}
            <LoadingButton
                variant="contained"
                loading={saving}
                loadingPosition="start"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!unsavedChanges && !saving}
                size="small"
                sx={{
                    backgroundColor: unsavedChanges ? 'primary.main' : 'grey.400',
                    color: 'white',
                    fontSize: '0.75rem',
                    py: 0.25,
                    px: 1,
                    minHeight: '28px',
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
            </LoadingButton>

            {/* Print Button */}
            <Button
                variant="contained"
                color="primary"
                onClick={handlePrint}
                startIcon={<Print />}
                size="small"
                sx={{
                    fontSize: '0.75rem',
                    py: 0.25,
                    px: 1,
                    minHeight: '28px'
                }}
            >
                {t('common.print', 'Print')}
            </Button>

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
