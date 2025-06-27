import React, { useState, useEffect } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';

const CollarettoHelperShortcut = ({ tables }) => {
    const [lastActiveIndex, setLastActiveIndex] = useState(0);

    // Listen for any activity within mattress tables to track the last active one
    useEffect(() => {
        const handleMattressActivity = (event) => {
            // Find the closest mattress table container
            const mattressTable = event.target.closest('[data-table-id]');

            if (mattressTable) {
                const tableId = mattressTable.getAttribute('data-table-id');

                // Find all mattress tables and get the index of the active one
                const allMattressTables = document.querySelectorAll('[data-table-id]');
                const index = Array.from(allMattressTables).findIndex(table =>
                    table.getAttribute('data-table-id') === tableId
                );

                if (index !== -1 && index !== lastActiveIndex) {
                    setLastActiveIndex(index);
                    console.log(`Tracked last active mattress: ${index + 1} (table ID: ${tableId})`);
                }
            }
        };

        // Listen for various events that indicate user activity
        const events = ['click', 'focus', 'input', 'change'];

        events.forEach(eventType => {
            document.addEventListener(eventType, handleMattressActivity, true); // Use capture phase
        });

        return () => {
            events.forEach(eventType => {
                document.removeEventListener(eventType, handleMattressActivity, true);
            });
        };
    }, [lastActiveIndex]);

    // Click handler that opens the last active planned quantity bar
    const handleClick = () => {
        const plannedQuantityElements = document.querySelectorAll('.planned-quantity-bar');

        if (plannedQuantityElements.length > 0) {
            // Use last active index, but make sure it's within bounds
            const index = Math.min(lastActiveIndex, plannedQuantityElements.length - 1);
            plannedQuantityElements[index].click();

            console.log(`Opened collaretto helper for mattress ${index + 1} (last active)`);
        } else {
            console.log('Could not find planned quantity bar elements');
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
            </Tooltip>
        </Box>
    );
};

export default CollarettoHelperShortcut;
