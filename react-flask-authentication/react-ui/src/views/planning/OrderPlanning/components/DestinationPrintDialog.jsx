import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider
} from '@mui/material';
import { Print } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const DestinationPrintDialog = ({
    open,
    onClose,
    destinations,
    onPrintDestination,
    onPrintAll
}) => {
    const { t } = useTranslation();
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >

            
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('orderPlanning.multipleDestinationsFound', 'Multiple destinations found. Choose which destination to print, or print all destinations.')}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {destinations.map((destination, index) => (
                        <Button
                            key={destination}
                            variant="outlined"
                            startIcon={<Print />}
                            onClick={() => onPrintDestination(destination)}
                            sx={{
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                py: 1.5,
                                px: 2,
                                borderColor: 'primary.main',
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                    color: 'white'
                                }
                            }}
                        >
                            {t('common.print', 'Print')} {destination}
                        </Button>
                    ))}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Button
                        variant="contained"
                        startIcon={<Print />}
                        onClick={onPrintAll}
                        sx={{
                            py: 1.5,
                            px: 2,
                            textTransform: 'none',
                            backgroundColor: 'secondary.main',
                            '&:hover': {
                                backgroundColor: 'secondary.dark'
                            }
                        }}
                    >
                        {t('orderPlanning.printAllDestinations', 'Print All Destinations')}
                    </Button>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DestinationPrintDialog;
