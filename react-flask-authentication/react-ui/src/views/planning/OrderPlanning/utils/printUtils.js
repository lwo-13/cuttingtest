import { useEffect } from 'react';

export const usePrintStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body {
          zoom: 50%;
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