import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const CollarettoPrintLabel = ({ collarettoDetails, row }) => {
  useEffect(() => {
    // Add print styles to hide everything except the label
    const style = document.createElement('style');
    style.id = 'print-label-styles';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-label-container,
        #print-label-container * {
          visibility: visible;
        }
        #print-label-container {
          position: absolute;
          left: 0;
          top: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('print-label-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  if (!collarettoDetails || !row) return null;

  return (
    <Box
      id="print-label-container"
      sx={{
        width: '100%',
        maxWidth: '400px',
        border: '3px solid black',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'white',
        '@media print': {
          maxWidth: '100%',
          pageBreakAfter: 'always'
        }
      }}
    >
      {/* Top section with measurements */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '2px solid black',
          minHeight: '60px'
        }}
      >
        <Box
          sx={{
            borderRight: '2px solid black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            p: 1
          }}
        >
          {row.usableWidth || ''}
        </Box>
        <Box
          sx={{
            borderRight: '2px solid black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            p: 1
          }}
        >
          {row.rollsActual || row.rollsPlanned || ''}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            p: 1
          }}
        >
          {row.consActual || row.consPlanned || ''}
        </Box>
      </Box>

      {/* MODEL - Style Name from Order */}
      <Box
        sx={{
          borderBottom: '2px solid black',
          display: 'flex',
          alignItems: 'center',
          minHeight: '50px',
          p: 1
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '18px',
            mr: 2
          }}
        >
          MODEL:
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {collarettoDetails.style || ''}
        </Typography>
      </Box>

      {/* COMM (Order Commessa) */}
      <Box
        sx={{
          borderBottom: '2px solid black',
          display: 'flex',
          alignItems: 'center',
          minHeight: '50px',
          p: 1
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '18px',
            mr: 2
          }}
        >
          COMM:
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {collarettoDetails.orderCommessa || ''}
        </Typography>
      </Box>

      {/* BAGNO (Dye Lot) */}
      <Box
        sx={{
          borderBottom: '2px solid black',
          display: 'flex',
          alignItems: 'center',
          minHeight: '50px',
          p: 1
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '18px',
            mr: 2
          }}
        >
          BAGNO:
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {collarettoDetails.dyeLot || ''}
        </Typography>
      </Box>

      {/* QUANT (Pieces) */}
      <Box
        sx={{
          borderBottom: '2px solid black',
          display: 'flex',
          alignItems: 'center',
          minHeight: '50px',
          p: 1
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '18px',
            mr: 2
          }}
        >
          QUANT:
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {row.pieces || ''}
        </Typography>
      </Box>

      {/* MEAS (Collaretto Width / Roll Width) */}
      <Box
        sx={{
          borderBottom: '2px solid black',
          display: 'flex',
          alignItems: 'center',
          minHeight: '50px',
          p: 1
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '18px',
            mr: 2
          }}
        >
          MEAS:
        </Typography>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {row.rollWidth || ''}
        </Typography>
      </Box>

      {/* DESTINATION */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          minHeight: '50px',
          p: 1
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '18px',
            mr: 2
          }}
        >
          DEST:
        </Typography>
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 'bold'
          }}
        >
          {collarettoDetails.destination || ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default CollarettoPrintLabel;

