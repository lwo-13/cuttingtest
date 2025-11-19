import { useEffect } from 'react';
import { store } from '../../../store';
import { SET_MENU } from '../../../store/actions';

export const useLogisticPrintStyles = () => {
  useEffect(() => {
    // Check if print styles already exist to prevent duplicates
    const existingStyle = document.getElementById('logistic-print-styles');
    if (existingStyle) {
      return;
    }

    const style = document.createElement("style");
    style.id = 'logistic-print-styles';
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

        /* Exception: Show status icons in table rows */
        .MuiTableCell-root .MuiIconButton-root,
        .MuiTableCell-root .MuiButtonBase-root,
        .MuiTableRow-root .MuiIconButton-root,
        .MuiTableRow-root .MuiButtonBase-root {
          display: inline-flex !important;
        }

        /* Hide specific action buttons */
        .MuiTableCell-root .MuiIconButton-root[aria-label*="delete"],
        .MuiTableCell-root .MuiIconButton-root[aria-label*="edit"],
        .MuiTableCell-root .MuiIconButton-root[aria-label*="add"],
        .MuiTableCell-root .MuiIconButton-root[aria-label*="remove"] {
          display: none !important;
        }

        /* Hide print button */
        .print-hidden {
          display: none !important;
        }

        /* Production Center Card styling */
        .production-center-card-print {
          border: 2px solid #4caf50 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .production-center-card-print .MuiCardHeader-root {
          background-color: #e8f5e8 !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Order Comment Card styling */
        .order-comment-card-print {
          border: 2px solid #2196f3 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .order-comment-card-print .MuiCardHeader-root {
          background-color: #e3f2fd !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Style Comment Card styling */
        .style-comment-card-print {
          border: 2px solid #ff9800 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .style-comment-card-print .MuiCardHeader-root {
          background-color: #fff3e0 !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Mattress table styling - blue outline and light blue background */
        .MuiCard-root.mattress-table {
          border: 2px solid #90caf9 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .MuiCard-root.mattress-table .MuiCardHeader-root {
          background-color: #e3f2fd !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Collaretto table styling - purple outline and light purple background */
        .MuiCard-root.collaretto-table {
          border: 2px solid #673ab7 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .MuiCard-root.collaretto-table .MuiCardHeader-root {
          background-color: #ede7f6 !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Remove grey backgrounds from form elements */
        input, select, textarea,
        .MuiInputBase-root, .MuiOutlinedInput-root, .MuiTextField-root,
        .MuiFormControl-root, .MuiSelect-root, .MuiInputBase-input,
        .MuiOutlinedInput-input, .MuiFilledInput-root, .MuiInput-root {
          background-color: transparent !important;
          background: transparent !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Table styling */
        .MuiTable-root {
          border-collapse: collapse !important;
        }
        .MuiTableCell-root {
          border: 1px solid #ddd !important;
          padding: 8px !important;
        }
        .MuiTableHead-root .MuiTableCell-root {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Production Center print header styling */
        .production-center-print-header {
          display: block !important;
          margin-bottom: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleElement = document.getElementById('logistic-print-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
};

// Store menu state
let storedMenuState = null;

const storeMenuState = () => {
  const state = store.getState();
  storedMenuState = state.customization?.opened;
};

const restoreMenuState = () => {
  if (storedMenuState !== null) {
    store.dispatch({ type: SET_MENU, opened: storedMenuState });
  }
};

const collapseMenu = () => {
  store.dispatch({ type: SET_MENU, opened: false });
};

// Add table classes for print styling
export const addLogisticTableClasses = (mattressTables, adhesiveTables, alongTables, weftTables, biasTables) => {
  // Add mattress table classes
  [...mattressTables, ...adhesiveTables].forEach(table => {
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    if (tableElement) {
      tableElement.classList.add('mattress-table');
    }
  });

  // Add collaretto table classes
  [...alongTables, ...weftTables, ...biasTables].forEach(table => {
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    if (tableElement) {
      tableElement.classList.add('collaretto-table');
    }
  });
};

// Remove table classes after printing
export const removeLogisticTableClasses = (mattressTables, adhesiveTables, alongTables, weftTables, biasTables) => {
  [...mattressTables, ...adhesiveTables, ...alongTables, ...weftTables, ...biasTables].forEach(table => {
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    if (tableElement) {
      tableElement.classList.remove('mattress-table', 'collaretto-table');
    }
  });
};

// Add production center card class
export const addProductionCenterCardClass = () => {
  const cards = document.querySelectorAll('.production-center-card');
  cards.forEach(card => {
    card.classList.add('production-center-card-print');
  });
};

// Remove production center card class
export const removeProductionCenterCardClass = () => {
  const cards = document.querySelectorAll('.production-center-card');
  cards.forEach(card => {
    card.classList.remove('production-center-card-print');
  });
};

// Add comment card classes
export const addCommentCardClasses = () => {
  const orderCommentCards = document.querySelectorAll('.order-comment-card');
  orderCommentCards.forEach(card => {
    card.classList.add('order-comment-card-print');
  });

  const styleCommentCards = document.querySelectorAll('.style-comment-card');
  styleCommentCards.forEach(card => {
    card.classList.add('style-comment-card-print');
  });
};

// Remove comment card classes
export const removeCommentCardClasses = () => {
  const orderCommentCards = document.querySelectorAll('.order-comment-card');
  orderCommentCards.forEach(card => {
    card.classList.remove('order-comment-card-print');
  });

  const styleCommentCards = document.querySelectorAll('.style-comment-card');
  styleCommentCards.forEach(card => {
    card.classList.remove('style-comment-card-print');
  });
};

// Handle print for logistic view
export const handleLogisticPrint = (mattressTables, adhesiveTables, alongTables, weftTables, biasTables) => {
  // Store current menu state
  storeMenuState();

  // Collapse menu
  collapseMenu();

  // Add table and card classes for styling
  addLogisticTableClasses(mattressTables, adhesiveTables, alongTables, weftTables, biasTables);
  addProductionCenterCardClass();
  addCommentCardClasses();

  document.body.classList.add("print-mode");

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");

    // Remove all table and card classes
    removeLogisticTableClasses(mattressTables, adhesiveTables, alongTables, weftTables, biasTables);
    removeProductionCenterCardClass();
    removeCommentCardClasses();

    // Restore original menu state after printing
    setTimeout(() => {
      restoreMenuState();
    }, 100);
  }, 300);
};

