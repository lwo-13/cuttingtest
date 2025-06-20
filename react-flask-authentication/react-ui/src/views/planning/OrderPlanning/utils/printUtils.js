import { useEffect } from 'react';
import { store } from '../../../../store';
import { SET_MENU } from '../../../../store/actions';

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
        .print-hidden, .cumulative-quantities-section {
          display: none !important;
        }
        .main-content, .MuiContainer-root, .MuiGrid-root {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .MuiBox-root {
          margin: 0 !important;
          padding: 2px !important;
        }
        .MuiTypography-root {
          margin: 0 !important;
          padding: 2px !important;
        }
        .MuiCard-root, .MuiPaper-root {
          margin: 2px !important;
          padding: 4px !important;
          box-shadow: none !important;
        }
        .production-center-print-header {
          margin: 0 !important;
          padding: 4px !important;
          margin-bottom: 4px !important;
          margin-top: 0 !important;
        }
        .production-center-print-header .MuiTypography-root {
          margin: 0 !important;
          padding: 2px !important;
          line-height: 1.2 !important;
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

// Get destinations in the same order as production center tabs
export const getDestinationsInTabOrder = (combinations) => {
  if (!combinations || !Array.isArray(combinations)) {
    return [];
  }

  // Extract destinations from combinations in their tab order
  const destinations = combinations
    .map(combination => combination.destination)
    .filter(destination => destination && destination.trim() !== '');

  // Remove duplicates while preserving order
  return [...new Set(destinations)];
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

// Store original menu state before printing
let originalMenuState = null;

export const storeMenuState = () => {
  const currentState = store.getState();
  originalMenuState = currentState.customization.opened;
};

export const collapseMenu = () => {
  store.dispatch({ type: SET_MENU, opened: false });
};

export const restoreMenuState = () => {
  if (originalMenuState !== null) {
    store.dispatch({ type: SET_MENU, opened: originalMenuState });
    originalMenuState = null;
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
  // Store current states
  storeCollapsedState(collapsedCards);
  storeMenuState();

  // Collapse menu and expand all tables
  collapseMenu();
  expandAllTables(tables, adhesiveTables, alongTables, weftTables, biasTables, setCollapsedCards);

  document.body.classList.add("print-mode");

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");

    // Restore original states after printing
    setTimeout(() => {
      restoreCollapsedState(setCollapsedCards);
      restoreMenuState();
    }, 100);
  }, 300);
};

export const handleDestinationPrint = (selectedDestination, tables, adhesiveTables, alongTables, weftTables, biasTables, collapsedCards, setCollapsedCards, switchToDestinationTab) => {
  // Store current states
  storeCollapsedState(collapsedCards);
  storeMenuState();

  // Switch to the correct tab for the selected destination BEFORE printing
  if (switchToDestinationTab && selectedDestination) {
    console.log(`🔄 Switching to tab for destination: ${selectedDestination}`);
    switchToDestinationTab(selectedDestination);
  }

  // Collapse menu and expand all tables
  collapseMenu();
  expandAllTables(tables, adhesiveTables, alongTables, weftTables, biasTables, setCollapsedCards);

  // Store selected destination for production center tabs to use
  document.body.setAttribute('data-print-destination', selectedDestination);
  document.body.classList.add("print-mode");
  applyDestinationFilter(selectedDestination, tables, adhesiveTables, alongTables, weftTables, biasTables);

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");
    document.body.removeAttribute('data-print-destination');
    removeDestinationFilter();

    // Restore original states after printing
    setTimeout(() => {
      restoreCollapsedState(setCollapsedCards);
      restoreMenuState();
    }, 100);
  }, 300);
};