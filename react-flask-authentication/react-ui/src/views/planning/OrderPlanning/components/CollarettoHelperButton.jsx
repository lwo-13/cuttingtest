import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';
import { Calculate as CalculateIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { safeClosest, isValidDOMTarget } from 'utils/domUtils';

const SHORTCUT_STORAGE_KEY = 'collarettoHelperShortcut';
const DEFAULT_SHORTCUT = 'Dead';

// Helper to get display name for a key
const getKeyDisplayName = (key) => {
    if (key === 'Dead') return '` (Backtick)';
    if (key === '`') return '` (Backtick)';
    if (key === ' ') return 'Space';
    if (key === 'Escape') return 'Esc';
    return key.length === 1 ? key.toUpperCase() : key;
};

const CollarettoHelperShortcut = ({ tables }) => {
    const [lastActiveIndex, setLastActiveIndex] = useState(0);
    const [dialogJustOpened, setDialogJustOpened] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shortcut, setShortcut] = useState(() => {
        return localStorage.getItem(SHORTCUT_STORAGE_KEY) || DEFAULT_SHORTCUT;
    });
    const [isCapturing, setIsCapturing] = useState(false);
    const [tempShortcut, setTempShortcut] = useState('');

    // Listen for any activity within mattress tables to track the last active one
    useEffect(() => {
        const handleMattressActivity = (event) => {
            // Check if event.target exists and has the closest method (is a DOM element)
            if (!isValidDOMTarget(event)) {
                return;
            }

            // Skip if the event is from a dialog or modal (to avoid confusion when dialogs open)
            if (safeClosest(event, '.MuiDialog-root') || safeClosest(event, '.MuiModal-root')) {
                return;
            }

            // Skip focus events for a short time after a dialog opens to avoid confusion
            if (dialogJustOpened && event.type === 'focus') {
                return;
            }

            // Find the closest mattress table container - be more specific about what we're looking for
            const mattressTable = safeClosest(event, '[data-table-id]');

            if (mattressTable) {
                const tableId = mattressTable.getAttribute('data-table-id');

                // Check if this table actually has a planned-quantity-bar (i.e., it's a real mattress table)
                const hasPlannedQuantityBar = mattressTable.querySelector('.planned-quantity-bar');

                if (!hasPlannedQuantityBar) {
                    // This is probably a collaretto table or other table, not a mattress table - ignore it
                    return;
                }

                // Find all REAL mattress tables (ones with planned-quantity-bar) and get the index of the active one
                const allMattressTables = Array.from(document.querySelectorAll('[data-table-id]')).filter(table =>
                    table.querySelector('.planned-quantity-bar')
                );
                const index = allMattressTables.findIndex(table =>
                    table.getAttribute('data-table-id') === tableId
                );

                if (index !== -1 && index !== lastActiveIndex) {
                    setLastActiveIndex(index);
                }
            }
        };

        // Listen for various events that indicate user activity, but be more selective
        const events = ['click', 'focus', 'input', 'change'];

        events.forEach(eventType => {
            document.addEventListener(eventType, handleMattressActivity, true); // Use capture phase
        });

        return () => {
            events.forEach(eventType => {
                document.removeEventListener(eventType, handleMattressActivity, true);
            });
        };
    }, [lastActiveIndex, dialogJustOpened]);

    // Function to open the collaretto helper
    const openCollarettoHelper = useCallback(() => {
        // Find all REAL mattress tables (ones with planned-quantity-bar)
        const realMattressTables = Array.from(document.querySelectorAll('[data-table-id]')).filter(table =>
            table.querySelector('.planned-quantity-bar')
        );

        if (realMattressTables.length > 0) {
            // Set flag to ignore focus events for a short time after opening dialog
            setDialogJustOpened(true);
            setTimeout(() => setDialogJustOpened(false), 1000);

            // Use last active index, but make sure it's within bounds
            const index = Math.min(lastActiveIndex, realMattressTables.length - 1);
            const targetTable = realMattressTables[index];
            const plannedQuantityBar = targetTable.querySelector('.planned-quantity-bar');

            if (plannedQuantityBar) {
                plannedQuantityBar.click();
            }
        }
    }, [lastActiveIndex]);

    // Keyboard shortcut listener
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Don't trigger if user is typing in an input field (except for settings capture)
            const isInputField = event.target.tagName === 'INPUT' ||
                                 event.target.tagName === 'TEXTAREA' ||
                                 event.target.isContentEditable;

            // Skip if settings dialog is open (we're capturing a new shortcut)
            if (settingsOpen) return;

            // Skip if typing in input fields
            if (isInputField) return;

            // Check if the pressed key matches our shortcut
            if (event.key === shortcut) {
                event.preventDefault();
                openCollarettoHelper();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcut, openCollarettoHelper, settingsOpen]);

    // Handle shortcut capture in settings
    const handleCaptureKeyDown = (event) => {
        event.preventDefault();
        const key = event.key;

        // Ignore modifier keys alone
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return;

        setTempShortcut(key);
        setIsCapturing(false);
    };

    // Save new shortcut
    const handleSaveShortcut = () => {
        if (tempShortcut) {
            setShortcut(tempShortcut);
            localStorage.setItem(SHORTCUT_STORAGE_KEY, tempShortcut);
        }
        setSettingsOpen(false);
        setIsCapturing(false);
        setTempShortcut('');
    };

    // Reset to default
    const handleResetShortcut = () => {
        setShortcut(DEFAULT_SHORTCUT);
        localStorage.setItem(SHORTCUT_STORAGE_KEY, DEFAULT_SHORTCUT);
        setTempShortcut('');
        setIsCapturing(false);
    };

    // Open settings dialog
    const handleContextMenu = (event) => {
        event.preventDefault();
        setTempShortcut(shortcut);
        setSettingsOpen(true);
    };

    // Show the button even if no tables initially (it will become active when tables are added)
    const hasActiveTables = tables && tables.length > 0;

    return (
        <>
            <Box
                sx={{
                    position: 'fixed',
                    top: '54.5%',
                    right: 10,
                    transform: 'translateY(-50%)',
                    zIndex: 1300,
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
                onContextMenu={handleContextMenu}
            >
                <Tooltip
                    title={
                        hasActiveTables
                            ? `Collaretto Helper [${getKeyDisplayName(shortcut)}] (right-click to configure)`
                            : "Collaretto Helper (no mattresses yet)"
                    }
                    placement="left"
                    arrow
                >
                    <span>
                        <IconButton
                            size="medium"
                            onClick={openCollarettoHelper}
                            disabled={!hasActiveTables}
                            sx={{
                                color: hasActiveTables ? '#673ab7' : '#ccc',
                                m: 0.5,
                                '&:hover': hasActiveTables ? {
                                    backgroundColor: '#673ab7',
                                    color: 'white'
                                } : {}
                            }}
                        >
                            <CalculateIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* Settings Dialog */}
            <Dialog
                open={settingsOpen}
                onClose={() => {
                    setSettingsOpen(false);
                    setIsCapturing(false);
                    setTempShortcut('');
                }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon sx={{ color: '#673ab7' }} />
                    Configure Shortcut
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Current shortcut: <strong>{getKeyDisplayName(shortcut)}</strong>
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2
                            }}
                        >
                            <TextField
                                fullWidth
                                label={isCapturing ? "Press any key..." : "New shortcut"}
                                value={isCapturing ? "Listening..." : (tempShortcut ? getKeyDisplayName(tempShortcut) : getKeyDisplayName(shortcut))}
                                onFocus={() => setIsCapturing(true)}
                                onBlur={() => !tempShortcut && setIsCapturing(false)}
                                onKeyDown={isCapturing ? handleCaptureKeyDown : undefined}
                                InputProps={{
                                    readOnly: true,
                                    sx: {
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: isCapturing ? '#f3e5f5' : 'inherit'
                                    }
                                }}
                                inputProps={{
                                    style: { textAlign: 'center' }
                                }}
                                helperText="Click to capture a new shortcut key"
                            />

                            <Button
                                variant="text"
                                size="small"
                                onClick={handleResetShortcut}
                                sx={{ color: 'text.secondary' }}
                            >
                                Reset to default ({getKeyDisplayName(DEFAULT_SHORTCUT)})
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setSettingsOpen(false);
                            setIsCapturing(false);
                            setTempShortcut('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveShortcut}
                        variant="contained"
                        disabled={!tempShortcut || tempShortcut === shortcut}
                        sx={{
                            backgroundColor: '#673ab7',
                            '&:hover': { backgroundColor: '#5e35b1' }
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CollarettoHelperShortcut;
