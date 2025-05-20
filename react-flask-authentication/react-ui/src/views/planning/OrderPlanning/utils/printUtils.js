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
      }
    `;
    document.head.appendChild(style);
  }, []);
};

export const handlePrint = () => {
  document.body.classList.add("print-mode");
  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");
  }, 300);
};