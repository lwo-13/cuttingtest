import { useEffect } from 'react';
import { store } from '../../../store';
import { SET_MENU } from '../../../store/actions';

export const useOrderReportPrintStyles = () => {
  useEffect(() => {
    // Check if print styles already exist to prevent duplicates
    const existingStyle = document.getElementById('order-report-print-styles');
    if (existingStyle) {
      return;
    }

    const style = document.createElement("style");
    style.id = 'order-report-print-styles';
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
        /* Show ALL buttons in table cells first, then hide specific action buttons */
        .MuiTableCell-root .MuiIconButton-root,
        .MuiTableCell-root .MuiButtonBase-root,
        .MuiTableRow-root .MuiIconButton-root,
        .MuiTableRow-root .MuiButtonBase-root {
          display: inline-flex !important;
        }

        /* Hide ALL buttons in the last column (action buttons like trash/delete) */
        .MuiTableCell-root:last-child .MuiIconButton-root,
        .MuiTableCell-root:last-child .MuiButtonBase-root {
          display: none !important;
        }

        /* But show status icons in the second-to-last column (Status column) */
        .MuiTableCell-root:nth-last-child(2) .MuiIconButton-root,
        .MuiTableCell-root:nth-last-child(2) .MuiButtonBase-root {
          display: inline-flex !important;
        }

        /* SHOW PLANNED QUANTITIES BARS IN ORDER REPORT WHEN PRINTING */
        .planned-quantity-bar {
          display: flex !important;
          background-color: #f5f5f5 !important;
          border: 1px solid #ddd !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          font-weight: bold !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* SHOW CONSUMPTION SUMMARIES IN ORDER REPORT */
        .consumption-summary {
          display: flex !important;
          gap: 8px !important;
          font-weight: bold !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* HIDE ORDER QUANTITIES WHEN MULTIPLE DESTINATIONS EXIST */
        .hide-order-quantities-print {
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

        /* Production Center card content styling */
        .production-center-card-print .MuiCardContent-root {
          margin: 0 !important;
          padding: 6px !important;
          padding-top: 0 !important;
        }

        /* Production Center text and labels */
        .production-center-card-print .MuiTypography-root {
          font-size: 18px !important;
          line-height: 1.4 !important;
          font-weight: 600 !important;
        }

        /* Production Center input fields */
        .production-center-card-print .MuiInputBase-input {
          font-size: 18px !important;
          padding: 10px 14px !important;
          font-weight: 600 !important;
        }

        /* Production Center form fields - transparent borders */
        .production-center-card-print input,
        .production-center-card-print select,
        .production-center-card-print textarea,
        .production-center-card-print .MuiInputBase-root,
        .production-center-card-print .MuiOutlinedInput-root,
        .production-center-card-print .MuiTextField-root {
          border-color: transparent !important;
          outline-color: transparent !important;
          box-shadow: none !important;
        }

        .production-center-card-print .MuiOutlinedInput-notchedOutline {
          border-color: transparent !important;
        }

        /* Style Comment Card styling */
        .MuiCard-root.style-comment-card-print,
        .style-comment-card-print {
          border: 2px solid #ff9800 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .MuiCard-root.style-comment-card-print .MuiCardHeader-root,
        .style-comment-card-print .MuiCardHeader-root {
          background-color: #fff3e0 !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-hidden, .cumulative-quantities-section {
          display: none !important;
        }

        /* Production Center print header styling */
        .production-center-print-header {
          display: block !important;
          margin-bottom: 16px !important;
        }
        .production-center-print-header .MuiTypography-root {
          font-size: 20px !important;
          font-weight: bold !important;
          text-align: center !important;
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

        /* Make ALL table cards have 2px borders for consistency */
        .MuiCard-root[data-table-id] {
          border: 2px solid #90caf9 !important;
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

        /* AGGRESSIVE: Remove ALL grey backgrounds from ALL form elements */
        input, select, textarea,
        .MuiInputBase-root, .MuiOutlinedInput-root, .MuiTextField-root,
        .MuiFormControl-root, .MuiSelect-root, .MuiInputBase-input,
        .MuiOutlinedInput-input, .MuiFilledInput-root, .MuiInput-root,
        [class*="Input"], [class*="input"], [class*="Select"], [class*="select"],
        [class*="TextField"], [class*="textfield"], [class*="Form"], [class*="form"] {
          background-color: transparent !important;
          background: transparent !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove the style when component unmounts
    return () => {
      const styleToRemove = document.getElementById('order-report-print-styles');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);
};

// Add table classes for print styling
export const addOrderReportTableClasses = (tables, adhesiveTables, alongTables, weftTables, biasTables) => {
  // Add mattress table classes
  [...tables, ...adhesiveTables].forEach(table => {
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
export const removeOrderReportTableClasses = () => {
  // Remove all mattress table classes
  const mattressTables = document.querySelectorAll('.mattress-table');
  mattressTables.forEach(table => {
    table.classList.remove('mattress-table');
  });

  // Remove all collaretto table classes
  const collarettoTables = document.querySelectorAll('.collaretto-table');
  collarettoTables.forEach(table => {
    table.classList.remove('collaretto-table');
  });
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

// Add production center card styling
export const addProductionCenterCardClass = () => {
  const productionCenterCards = document.querySelectorAll('[data-testid="production-center-card"], .production-center-card');
  productionCenterCards.forEach(card => {
    card.classList.add('production-center-card-print');
  });
};

export const removeProductionCenterCardClass = () => {
  const productionCenterCards = document.querySelectorAll('.production-center-card-print');
  productionCenterCards.forEach(card => {
    card.classList.remove('production-center-card-print');
  });
};

// Add style comment card styling
export const addStyleCommentCardClass = () => {
  const styleCommentCards = document.querySelectorAll('[data-testid="style-comment-card"], .style-comment-card');
  styleCommentCards.forEach(card => {
    card.classList.add('style-comment-card-print');
  });
};

export const removeStyleCommentCardClass = () => {
  const styleCommentCards = document.querySelectorAll('.style-comment-card-print');
  styleCommentCards.forEach(card => {
    card.classList.remove('style-comment-card-print');
  });
};

// Handle print for order report
export const handleOrderReportPrint = (tables, adhesiveTables, alongTables, weftTables, biasTables) => {
  // Store current menu state
  storeMenuState();

  // Collapse menu
  collapseMenu();

  // Add table classes for styling
  addOrderReportTableClasses(tables, adhesiveTables, alongTables, weftTables, biasTables);
  addProductionCenterCardClass();
  addStyleCommentCardClass();

  document.body.classList.add("print-mode");

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");

    // Remove all table and card classes
    removeOrderReportTableClasses();
    removeProductionCenterCardClass();
    removeStyleCommentCardClass();

    // Restore original menu state after printing
    setTimeout(() => {
      restoreMenuState();
    }, 100);
  }, 300);
};
