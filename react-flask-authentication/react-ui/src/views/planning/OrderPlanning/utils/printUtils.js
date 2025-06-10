import { useEffect } from 'react';

export const usePrintStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page {
          size: landscape;
          margin: 5mm;
        }
        body {
          zoom: 50%;
        }
        *, *::before, *::after {
          font-size: 20px !important;
          line-height: 1.4 !important;
        }
        .scrollbar-container, .navbar, .buttons, .floating-action-button, .MuiButtonBase-root {
          display: none !important;
        }
        .main-content, .MuiContainer-root, .MuiGrid-root {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .MuiTableContainer-root {
          overflow: visible !important;
        }
        .MuiTableCell-root, .MuiTableCell-head, .MuiTableCell-body {
          padding: 0px !important;
        }
        .print-hidden {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);
};

// Get all unique destinations from all table types
export const getAllDestinations = (tables, adhesiveTables, alongTables, weftTables, biasTables) => {
  const destinations = new Set();

  // Collect destinations from all table types
  [...tables, ...adhesiveTables, ...alongTables, ...weftTables, ...biasTables].forEach(table => {
    if (table.destination && table.destination.trim() !== '') {
      destinations.add(table.destination);
    }
  });

  return Array.from(destinations).sort();
};

// Apply destination filter to DOM elements before printing
export const applyDestinationFilter = (selectedDestination, tables, adhesiveTables, alongTables, weftTables, biasTables) => {
  const allTables = [...tables, ...adhesiveTables, ...alongTables, ...weftTables, ...biasTables];

  allTables.forEach(table => {
    // Find table elements by their ID or data attributes
    const tableElements = document.querySelectorAll(`[data-table-id="${table.id}"]`);

    tableElements.forEach(element => {
      if (table.destination !== selectedDestination) {
        element.classList.add('print-hidden');
      } else {
        element.classList.remove('print-hidden');
      }
    });
  });
};

// Expand all collapsed tables before printing
export const expandAllTables = (tables, adhesiveTables, alongTables, weftTables, biasTables, setCollapsedCards) => {
  const allTableIds = [
    ...tables.map(t => ({ id: t.id, type: 'mattress' })),
    ...adhesiveTables.map(t => ({ id: t.id, type: 'adhesive' })),
    ...alongTables.map(t => ({ id: t.id, type: 'along' })),
    ...weftTables.map(t => ({ id: t.id, type: 'weft' })),
    ...biasTables.map(t => ({ id: t.id, type: 'bias' }))
  ];

  // Create new collapsed state with all tables expanded (false)
  const newCollapsedState = {
    mattress: {},
    adhesive: {},
    along: {},
    weft: {},
    bias: {}
  };

  allTableIds.forEach(({ id, type }) => {
    newCollapsedState[type][id] = false;
  });

  setCollapsedCards(newCollapsedState);

  // Return the table IDs for potential restoration
  return allTableIds;
};

// Store original collapsed state before printing
let originalCollapsedState = null;

export const storeCollapsedState = (collapsedCards) => {
  originalCollapsedState = JSON.parse(JSON.stringify(collapsedCards));
};

export const restoreCollapsedState = (setCollapsedCards) => {
  if (originalCollapsedState) {
    setCollapsedCards(originalCollapsedState);
    originalCollapsedState = null;
  }
};

// Remove destination filter after printing
export const removeDestinationFilter = () => {
  const hiddenElements = document.querySelectorAll('.print-hidden');
  hiddenElements.forEach(element => {
    element.classList.remove('print-hidden');
  });
};

export const handlePrint = (tables, adhesiveTables, alongTables, weftTables, biasTables, collapsedCards, setCollapsedCards) => {
  // Store current collapsed state
  storeCollapsedState(collapsedCards);

  // Expand all tables
  expandAllTables(tables, adhesiveTables, alongTables, weftTables, biasTables, setCollapsedCards);

  document.body.classList.add("print-mode");

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");

    // Restore original collapsed state after printing
    setTimeout(() => {
      restoreCollapsedState(setCollapsedCards);
    }, 100);
  }, 300);
};

export const handleDestinationPrint = (selectedDestination, tables, adhesiveTables, alongTables, weftTables, biasTables, collapsedCards, setCollapsedCards) => {
  // Store current collapsed state
  storeCollapsedState(collapsedCards);

  // Expand all tables
  expandAllTables(tables, adhesiveTables, alongTables, weftTables, biasTables, setCollapsedCards);

  document.body.classList.add("print-mode");
  applyDestinationFilter(selectedDestination, tables, adhesiveTables, alongTables, weftTables, biasTables);

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");
    removeDestinationFilter();

    // Restore original collapsed state after printing
    setTimeout(() => {
      restoreCollapsedState(setCollapsedCards);
    }, 100);
  }, 300);
};