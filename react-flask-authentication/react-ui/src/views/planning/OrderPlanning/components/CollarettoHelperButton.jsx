import React, { useState, useEffect } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';
import { safeClosest, isValidDOMTarget } from 'utils/domUtils';

const CollarettoHelperShortcut = ({ tables }) => {
    const [lastActiveIndex, setLastActiveIndex] = useState(0);
    const [dialogJustOpened, setDialogJustOpened] = useState(false);

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

    // Click handler that opens the last active planned quantity bar
    const handleClick = () => {
        // Find all REAL mattress tables (ones with planned-quantity-bar)
        const realMattressTables = Array.from(document.querySelectorAll('[data-table-id]')).filter(table =>
            table.querySelector('.planned-quantity-bar')
        );

        if (realMattressTables.length > 0) {
            // Set flag to ignore focus events for a short time after opening dialog
            setDialogJustOpened(true);
            setTimeout(() => setDialogJustOpened(false), 1000); // Clear flag after 1 second

            // Use last active index, but make sure it's within bounds
            const index = Math.min(lastActiveIndex, realMattressTables.length - 1);
            const targetTable = realMattressTables[index];
            const plannedQuantityBar = targetTable.querySelector('.planned-quantity-bar');

            if (plannedQuantityBar) {
                plannedQuantityBar.click();
            }
        }
    };

    // Show the button even if no tables initially (it will become active when tables are added)
    const hasActiveTables = tables && tables.length > 0;

    return (
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
        >
            <Tooltip
                title={hasActiveTables ? "Collaretto Helper (for last active mattress)" : "Collaretto Helper (no mattresses yet)"}
                placement="left"
                arrow
            >
                <span>
                    <IconButton
                        size="medium"
                        onClick={handleClick}
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
    );
};

export default CollarettoHelperShortcut;
