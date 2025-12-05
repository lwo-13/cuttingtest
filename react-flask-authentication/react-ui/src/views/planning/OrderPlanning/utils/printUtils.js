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

        /* Make ALL table cards have 2px borders for consistency */
        .MuiCard-root[data-table-id] {
          border: 2px solid #90caf9 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Production Center card - no top spacing, minimal bottom spacing */
        .production-center-card {
          margin: 0 !important;
          margin-bottom: 2px !important;
          padding: 0 !important;
          padding-bottom: 8px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        /* Reduce spacing after production center section */
        .production-center-card + .MuiBox-root {
          margin-top: 2px !important;
        }

        /* Override default Box spacing that comes after production center */
        body.print-mode .MuiBox-root[style*="margin-top"] {
          margin-top: 2px !important;
        }

        /* Specific targeting for spacing between production center and pad print/style comment */
        body.print-mode .production-center-card ~ .MuiBox-root {
          margin-top: 2px !important;
        }

        /* Hide Production Center card title and header divider when printing */
        .production-center-card .MuiCardHeader-root {
          display: none !important;
        }

        /* Hide the divider line between header and content */
        .production-center-card .MuiCardHeader-root + .MuiDivider-root,
        .production-center-card .MuiCardContent-root::before {
          display: none !important;
        }

        /* Production Center card content - no top spacing */
        .production-center-card .MuiCardContent-root {
          margin: 0 !important;
          padding: 6px !important;
          padding-top: 0 !important;
        }

        /* Production Center tabs - increased spacing */
        .production-center-card .MuiTabs-root {
          margin: 0 !important;
          padding: 2px !important;
          min-height: 32px !important;
        }

        /* Production Center tab panels - increased spacing */
        .production-center-card .MuiTabPanel-root {
          margin: 0 !important;
          padding: 6px !important;
        }

        /* Production Center divider - increased spacing */
        .production-center-card .MuiDivider-root {
          margin: 2px 0 !important;
        }

        /* Production Center text and labels - much bigger font size */
        .production-center-card .MuiTypography-root {
          font-size: 18px !important;
          line-height: 1.4 !important;
          font-weight: 600 !important;
        }

        /* Production Center input fields - much bigger text */
        .production-center-card .MuiInputBase-input {
          font-size: 18px !important;
          padding: 10px 14px !important;
          font-weight: 600 !important;
        }

        /* Production Center labels - much bigger text */
        .production-center-card .MuiInputLabel-root {
          font-size: 18px !important;
          font-weight: 600 !important;
        }

        /* Production Center tab labels - bigger text */
        .production-center-card .MuiTab-root {
          font-size: 16px !important;
          font-weight: 600 !important;
        }

        /* Production Center form fields - make outlines/borders transparent */
        .production-center-card input,
        .production-center-card select,
        .production-center-card textarea,
        .production-center-card .MuiInputBase-root,
        .production-center-card .MuiOutlinedInput-root,
        .production-center-card .MuiTextField-root,
        .production-center-card .MuiFormControl-root,
        .production-center-card .MuiSelect-root,
        .production-center-card .MuiInputBase-input,
        .production-center-card .MuiOutlinedInput-input {
          border-color: transparent !important;
          outline-color: transparent !important;
          box-shadow: none !important;
        }

        /* Production Center outlined input - make border transparent */
        .production-center-card .MuiOutlinedInput-notchedOutline {
          border-color: transparent !important;
        }

        /* Production Center input focus states - make borders transparent */
        .production-center-card .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
        .production-center-card .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: transparent !important;
        }

        /* Remove underlines and bottom borders from text fields */
        .production-center-card .MuiInput-underline:before,
        .production-center-card .MuiInput-underline:after,
        .production-center-card .MuiInput-underline:hover:not(.Mui-disabled):before {
          border-bottom-color: transparent !important;
          border-bottom: none !important;
        }

        /* Remove any remaining field borders and lines */
        .production-center-card .MuiInputBase-root::before,
        .production-center-card .MuiInputBase-root::after {
          border-bottom: none !important;
          border-bottom-color: transparent !important;
        }

        /* Make sure fieldset borders are transparent */
        .production-center-card fieldset {
          border-color: transparent !important;
        }

        .production-center-print-header {
          margin: 0 !important;
          padding: 8px !important;
          margin-bottom: 8px !important;
          margin-top: 4px !important;
        }
        .production-center-print-header .MuiTypography-root {
          margin: 0 !important;
          padding: 4px !important;
          line-height: 1.4 !important;
          font-size: 24px !important;
          font-weight: bold !important;
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

        /* Conservative page break controls - keep normal tables together, split only large ones */
        .MuiCard-root[data-table-id] {
          /* Default: try to keep tables together */
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: auto !important;
          page-break-after: auto !important;
        }

        /* Normal tables: force page break before if they don't fit */
        .MuiCard-root[data-table-id]:not([data-large-table]) {
          /* Keep entire table together, but allow page break before */
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: auto !important;
        }

        /* Only really large tables allow internal splitting */
        .MuiCard-root[data-table-id][data-large-table] {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }

        /* Keep table headers with content - stronger rules */
        .MuiTableHead-root,
        .MuiCard-root[data-table-id] .MuiTableHead-root {
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Avoid breaking table rows when possible - but allow for large tables */
        .MuiTableRow-root {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* For large tables, allow row breaking but keep first few rows together */
        .MuiCard-root[data-table-id][data-large-table] .MuiTableRow-root:nth-child(-n+3) {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        /* Keep card headers with their content - stronger rules */
        .MuiCardHeader-root {
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Ensure card header + first table row stay together */
        .MuiCard-root[data-table-id] .MuiCardHeader-root + * {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }

        /* Add some spacing between tables */
        .MuiCard-root[data-table-id] + .MuiCard-root[data-table-id] {
          margin-top: 8px !important;
        }

        /* Conservative page break controls - manual page breaks for normal tables */
        @media print {
          /* Production center can break before if needed */
          .production-center-card {
            page-break-before: auto !important;
            break-before: auto !important;
          }

          /* Normal tables: keep together but allow page break before */
          .MuiCard-root[data-table-id]:not([data-large-table]) {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto !important;
            break-before: auto !important;
            orphans: 3;
            widows: 3;
          }

          /* Large tables: allow internal splitting with good control */
          .MuiCard-root[data-table-id][data-large-table] {
            page-break-inside: auto !important;
            break-inside: auto !important;
            orphans: 3;
            widows: 3;
          }

          /* Table containers inherit parent breaking behavior */
          .MuiTableContainer-root {
            page-break-inside: inherit !important;
            break-inside: inherit !important;
          }

          /* Always keep table headers with content */
          .MuiTableHead-root,
          .MuiTableHead-root tr {
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* For large tables: keep header with first few rows */
          .MuiCard-root[data-table-id][data-large-table] .MuiTableBody-root tr:first-child,
          .MuiCard-root[data-table-id][data-large-table] .MuiTableBody-root tr:nth-child(2),
          .MuiCard-root[data-table-id][data-large-table] .MuiTableBody-root tr:nth-child(3) {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }

          /* For normal tables: keep all content together */
          .MuiCard-root[data-table-id]:not([data-large-table]) .MuiTableBody-root tr {
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Better orphan/widow control */
          .MuiTableRow-root {
            orphans: 3;
            widows: 3;
          }

          /* Manual page break class for forcing tables to new page */
          .force-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
        /* Mattress group card header styling - light blue background */
        /* Apply to ALL mattress tables, even when filtered */
        .MuiCard-root.mattress-table .MuiCardHeader-root,
        .MuiCard-root.mattress-table.print-hidden .MuiCardHeader-root {
          background-color: #e3f2fd !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiTypography-root,
        .MuiCard-root.mattress-table.print-hidden .MuiCardHeader-root .MuiTypography-root {
          color: black !important;
        }
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiIconButton-root,
        .MuiCard-root.mattress-table.print-hidden .MuiCardHeader-root .MuiIconButton-root {
          color: black !important;
        }
        /* Make planned quantities text black for better visibility */
        .MuiCard-root.mattress-table .MuiCardHeader-root *,
        .MuiCard-root.mattress-table.print-hidden .MuiCardHeader-root * {
          color: black !important;
        }

        /* Make planned quantities in mattress header light blue background */
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiBox-root,
        .MuiCard-root.mattress-table .MuiCardHeader-root [class*="planned"],
        .MuiCard-root.mattress-table .MuiCardHeader-root [class*="quantity"],
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiChip-root {
          background-color: #e3f2fd !important;
          background: #e3f2fd !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Make other form elements in mattress header transparent so header background shows through */
        .MuiCard-root.mattress-table .MuiCardHeader-root input:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root select:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root textarea:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiInputBase-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiOutlinedInput-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiTextField-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiFormControl-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiSelect-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.mattress-table .MuiCardHeader-root .MuiInputBase-input:not([class*="planned"]):not([class*="quantity"]) {
          background-color: transparent !important;
          background: transparent !important;
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

        /* Make planned quantities in collaretto header light purple background */
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiBox-root,
        .MuiCard-root.collaretto-table .MuiCardHeader-root [class*="planned"],
        .MuiCard-root.collaretto-table .MuiCardHeader-root [class*="quantity"],
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiChip-root {
          background-color: #ede7f6 !important;
          background: #ede7f6 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Make other form elements in collaretto header transparent so header background shows through */
        .MuiCard-root.collaretto-table .MuiCardHeader-root input:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root select:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root textarea:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiInputBase-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiOutlinedInput-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiTextField-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiFormControl-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiSelect-root:not([class*="planned"]):not([class*="quantity"]),
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiInputBase-input:not([class*="planned"]):not([class*="quantity"]) {
          background-color: transparent !important;
          background: transparent !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiTypography-root {
          color: black !important;
        }
        .MuiCard-root.collaretto-table .MuiCardHeader-root .MuiIconButton-root {
          color: black !important;
        }
        .MuiCard-root.collaretto-table .MuiCardHeader-root * {
          color: black !important;
        }

        /* Style Comment card styling - green outline and light green background */
        .MuiCard-root.style-comment-card {
          border: 2px solid #4caf50 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .MuiCard-root.style-comment-card .MuiCardHeader-root {
          background-color: #e8f5e8 !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Make form elements in style comment header transparent so header background shows through */
        .MuiCard-root.style-comment-card .MuiCardHeader-root input,
        .MuiCard-root.style-comment-card .MuiCardHeader-root select,
        .MuiCard-root.style-comment-card .MuiCardHeader-root textarea,
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiInputBase-root,
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiOutlinedInput-root,
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiTextField-root,
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiFormControl-root,
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiSelect-root,
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiInputBase-input {
          background-color: transparent !important;
          background: transparent !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiTypography-root {
          color: black !important;
        }
        .MuiCard-root.style-comment-card .MuiCardHeader-root .MuiIconButton-root {
          color: black !important;
        }
        .MuiCard-root.style-comment-card .MuiCardHeader-root * {
          color: black !important;
        }

        /* Style Comment Card - Allow full text to show when printing */
        .MuiCard-root.style-comment-card .MuiInputBase-root,
        .MuiCard-root.style-comment-card textarea,
        .style-comment-card .MuiInputBase-root,
        .style-comment-card textarea {
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
          overflow-y: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .MuiCard-root.style-comment-card .MuiInputBase-root::-webkit-scrollbar,
        .MuiCard-root.style-comment-card textarea::-webkit-scrollbar,
        .style-comment-card .MuiInputBase-root::-webkit-scrollbar,
        .style-comment-card textarea::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
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

// Detect and mark large tables that should allow page breaks
export const markLargeTables = () => {
  const allTableCards = document.querySelectorAll('.MuiCard-root[data-table-id]');

  allTableCards.forEach(card => {
    // Calculate approximate table height
    const tableContainer = card.querySelector('.MuiTableContainer-root');
    const tableRows = card.querySelectorAll('tbody tr, .MuiTableBody-root .MuiTableRow-root');

    if (tableContainer && tableRows.length > 0) {
      // Conservative approach - only mark genuinely large tables for splitting
      const rowCount = tableRows.length;
      const actualHeight = card.offsetHeight;

      // Estimate row height (including header and padding)
      const estimatedRowHeight = actualHeight / (rowCount + 2); // +2 for header and padding

      // Consider page height as ~800px (A4 with margins)
      // Only mark as large if table is genuinely too big for a page
      const pageHeight = 800;
      const fullPageHeight = pageHeight * 0.9; // 90% of page height

      // Conservative criteria - only really large tables get marked for splitting
      const isLargeTable = (rowCount > 15) || (actualHeight > fullPageHeight) || (actualHeight > 700);

      if (isLargeTable) {
        card.setAttribute('data-large-table', 'true');
      } else {
        card.removeAttribute('data-large-table');
      }
    }
  });
};

// Add manual page breaks for tables that don't fit on remaining page space
export const addManualPageBreaks = () => {
  const allTableCards = document.querySelectorAll('.MuiCard-root[data-table-id]:not([data-large-table])');

  allTableCards.forEach((card, index) => {
    // Calculate if this table would fit on the current page
    const rect = card.getBoundingClientRect();
    const actualHeight = card.offsetHeight;

    // Estimate remaining page space (this is approximate)
    const pageHeight = 800; // A4 page height with margins
    const currentPagePosition = rect.top % pageHeight;
    const remainingSpace = pageHeight - currentPagePosition;

    // If table is medium-sized and might not fit, add page break
    const needsPageBreak = (actualHeight > remainingSpace * 0.7) && (actualHeight > 200);

    if (needsPageBreak) {
      card.classList.add('force-page-break');
    } else {
      card.classList.remove('force-page-break');
    }
  });
};

// Add mattress table classes for print styling
export const addMattressTableClasses = (tables) => {
  // Method 1: Add class based on table data
  tables.forEach(table => {
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    if (tableElement) {
      tableElement.classList.add('mattress-table');
    }
  });

  // Method 2: Add class to ALL cards that contain mattress-like content
  setTimeout(() => {
    const allTableCards = document.querySelectorAll('.MuiCard-root[data-table-id]');

    allTableCards.forEach((card, index) => {
      // Check if this card contains "Mattresses" in the title
      const cardTitle = card.querySelector('.MuiCardHeader-root')?.textContent || '';
      const hasMattressTitle = cardTitle.includes('Mattresses') || cardTitle.includes('Mattress');

      // Also check for table structure
      const tableHeaders = Array.from(card.querySelectorAll('th, .MuiTableCell-head')).map(th => th.textContent);
      const hasWidthColumn = tableHeaders.some(text => text.includes('Width'));
      const hasMarkerColumn = tableHeaders.some(text => text.includes('Marker'));
      const hasLayersColumn = tableHeaders.some(text => text.includes('Layers'));

      if (hasMattressTitle || (hasWidthColumn && hasMarkerColumn && hasLayersColumn)) {
        card.classList.add('mattress-table');
      }
    });

    // Mark large tables and add manual page breaks after adding classes
    markLargeTables();
    addManualPageBreaks();
  }, 100); // Small delay to ensure DOM is ready
};

// Add production center card class for print styling
export const addProductionCenterCardClass = () => {
  // Find the Production Center card by looking for cards with "Production Center" in the title
  const allCards = document.querySelectorAll('.MuiCard-root');

  allCards.forEach(card => {
    const cardHeader = card.querySelector('.MuiCardHeader-root');
    if (cardHeader) {
      const titleElement = cardHeader.querySelector('.MuiCardHeader-title, .MuiTypography-root');
      if (titleElement && titleElement.textContent.includes('Production Center')) {
        card.classList.add('production-center-card');
      }
    }
  });
};

// Remove production center card class after printing
export const removeProductionCenterCardClass = () => {
  const productionCenterCards = document.querySelectorAll('.production-center-card');
  productionCenterCards.forEach(card => {
    card.classList.remove('production-center-card');
  });
};

// Remove large table attributes after printing
export const removeLargeTableAttributes = () => {
  const allTableCards = document.querySelectorAll('.MuiCard-root[data-table-id][data-large-table]');
  allTableCards.forEach(card => {
    card.removeAttribute('data-large-table');
  });
};

// Remove manual page break classes after printing
export const removeManualPageBreaks = () => {
  const allTableCards = document.querySelectorAll('.MuiCard-root[data-table-id].force-page-break');
  allTableCards.forEach(card => {
    card.classList.remove('force-page-break');
  });
};

// Remove mattress table classes after printing
export const removeMattressTableClasses = (tables) => {
  // Remove from specific tables
  tables.forEach(table => {
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    if (tableElement) {
      tableElement.classList.remove('mattress-table');
    }
  });

  // Remove from ALL elements that might have the class
  const allMattressTables = document.querySelectorAll('.mattress-table');
  allMattressTables.forEach(element => {
    element.classList.remove('mattress-table');
  });

  // Remove large table attributes and manual page breaks
  removeLargeTableAttributes();
  removeManualPageBreaks();
};

// Add collaretto table classes for print styling
export const addCollarettoTableClasses = (alongTables, weftTables, biasTables) => {
  [...alongTables, ...weftTables, ...biasTables].forEach(table => {
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    if (tableElement) {
      tableElement.classList.add('collaretto-table');
    }
  });

  // Mark large tables and add manual page breaks after adding classes
  setTimeout(() => {
    markLargeTables();
    addManualPageBreaks();
  }, 100);
};

// Remove collaretto table classes after printing
export const removeCollarettoTableClasses = (alongTables, weftTables, biasTables) => {
  [...alongTables, ...weftTables, ...biasTables].forEach(table => {
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    if (tableElement) {
      tableElement.classList.remove('collaretto-table');
    }
  });

  // Remove large table attributes and manual page breaks
  removeLargeTableAttributes();
  removeManualPageBreaks();
};

// Add style comment card class for print styling
export const addStyleCommentCardClass = () => {
  // Find the Style Comment card by looking for cards with "Style Comment" in the title
  const allCards = document.querySelectorAll('.MuiCard-root');

  allCards.forEach(card => {
    const cardHeader = card.querySelector('.MuiCardHeader-root');
    if (cardHeader) {
      const titleElement = cardHeader.querySelector('.MuiCardHeader-title, .MuiTypography-root');
      if (titleElement && titleElement.textContent.includes('Style Comment')) {
        card.classList.add('style-comment-card');
      }
    }
  });
};

// Remove style comment card class after printing
export const removeStyleCommentCardClass = () => {
  const styleCommentCards = document.querySelectorAll('.style-comment-card');
  styleCommentCards.forEach(card => {
    card.classList.remove('style-comment-card');
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

  // Add table classes for styling
  addMattressTableClasses(tables);
  addCollarettoTableClasses(alongTables, weftTables, biasTables);
  addProductionCenterCardClass();
  addStyleCommentCardClass();

  document.body.classList.add("print-mode");

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");

    // Remove table classes
    removeMattressTableClasses(tables);
    removeCollarettoTableClasses(alongTables, weftTables, biasTables);
    removeProductionCenterCardClass();
    removeStyleCommentCardClass();

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
    switchToDestinationTab(selectedDestination);
  }

  // Collapse menu and expand all tables
  collapseMenu();
  expandAllTables(tables, adhesiveTables, alongTables, weftTables, biasTables, setCollapsedCards);

  // Store selected destination for production center tabs to use
  document.body.setAttribute('data-print-destination', selectedDestination);
  document.body.classList.add("print-mode");
  applyDestinationFilter(selectedDestination, tables, adhesiveTables, alongTables, weftTables, biasTables);

  // Add table classes for styling AFTER destination filter is applied
  addMattressTableClasses(tables);
  addCollarettoTableClasses(alongTables, weftTables, biasTables);
  addProductionCenterCardClass();
  addStyleCommentCardClass();

  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");
    document.body.removeAttribute('data-print-destination');
    removeDestinationFilter();

    // Remove table classes
    removeMattressTableClasses(tables);
    removeCollarettoTableClasses(alongTables, weftTables, biasTables);
    removeProductionCenterCardClass();
    removeStyleCommentCardClass();

    // Restore original states after printing
    setTimeout(() => {
      restoreCollapsedState(setCollapsedCards);
      restoreMenuState();
    }, 100);
  }, 300);
};