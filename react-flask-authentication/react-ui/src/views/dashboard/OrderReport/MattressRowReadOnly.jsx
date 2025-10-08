import React from 'react';
import { TableRow, TableCell, TextField, Typography, Tooltip, IconButton } from '@mui/material';
import { IconEdit } from '@tabler/icons';
import MattressProgressBar from './MattressProgressBar';

const MattressRowReadOnly = ({ row, orderSizes, onEditActualLayers }) => {
  // Helper function to create tooltip content showing size breakdown
  const createSizeBreakdownTooltip = (piecesPerSize, layers, isActual = false) => {
    if (!piecesPerSize || !layers) return null;

    const layerCount = parseInt(layers) || 0;
    if (layerCount === 0) return null;

    const sizeEntries = Object.entries(piecesPerSize)
      .filter(([size, pieces]) => (parseInt(pieces) || 0) > 0)
      .map(([size, pieces]) => {
        const piecesPerLayer = parseInt(pieces) || 0;
        const totalPieces = piecesPerLayer * layerCount;
        return `${size}: ${totalPieces}`;
      });

    if (sizeEntries.length === 0) return null;

    return sizeEntries.join('        ');
  };



  return (
    <TableRow>
      {/* Mattress Name (short display) */}
      <TableCell sx={{ minWidth: '120px', maxWidth: '150px', textAlign: 'center', padding: '1px' }}>
        <TextField
          variant="outlined"
          value={row.mattressName?.match(/[A-Z]{2,3}-\d{2}-\d{2,3}$/)?.[0] || ''}
          inputProps={{ readOnly: true, style: { textAlign: 'center' , fontWeight: 'normal' } }}
          sx={{ width: '100%' }}
        />
      </TableCell>

      {/* Width (KPI) */}
      <TableCell sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.width || ''}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            minWidth: '60px',
            maxWidth: '70px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Marker Name */}
      <TableCell sx={{
        padding: '4px',
        minWidth: '150px',
        maxWidth: '400px',
        width: 'auto',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        <Typography sx={{
          textAlign: 'center',
          fontWeight: 'normal',
          fontSize: '0.875rem'
        }}>
          {row.markerName || '-'}
        </Typography>
      </TableCell>

      {/* Pieces Per Size
      {orderSizes.map((size) => (
        <TableCell key={size.size} sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
          <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
            {row.piecesPerSize?.[size.size] || 0}
          </Typography>
        </TableCell>
      ))} */}

      {/* Marker Length */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '1px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.markerLength || '-'}
        </Typography>
      </TableCell>

      {/* Efficiency */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '1px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.efficiency || '-'}
        </Typography>
      </TableCell>

      {/* Planned Layers */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '1px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.layers || '-'}
        </Typography>
      </TableCell>

      {/* Actual Layers (KPI) */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '1px' }}>
        <TextField
          variant="outlined"
          value={row.layers_a || ''}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            minWidth: '65px',
            maxWidth: '80px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell>

      {/* Planned Pcs */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '70px', textAlign: 'center', padding: '1px' }}>
        {(() => {
          if (!row.piecesPerSize || !row.layers) {
            return (
              <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
                -
              </Typography>
            );
          }

          const totalPieces = Object.values(row.piecesPerSize).reduce((sum, pieces) => sum + (parseInt(pieces) || 0), 0);
          const plannedLayers = parseInt(row.layers) || 0;
          const totalPlannedPcs = totalPieces * plannedLayers;
          const tooltipContent = createSizeBreakdownTooltip(row.piecesPerSize, row.layers, false);

          return (
            <Tooltip
              title={tooltipContent || ''}
              arrow
              placement="top"
              enterDelay={300}
              leaveDelay={200}
            >
              <Typography sx={{
                fontWeight: 'normal',
                textAlign: 'center'
              }}>
                {totalPlannedPcs}
              </Typography>
            </Tooltip>
          );
        })()}
      </TableCell>

      {/* Actual Pcs */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '70px', textAlign: 'center', padding: '1px' }}>
        {(() => {
          if (!row.piecesPerSize || !row.layers_a) {
            return (
              <TextField
                variant="outlined"
                value=""
                InputProps={{ readOnly: true }}
                sx={{
                  width: '100%',
                  minWidth: '65px',
                  maxWidth: '80px',
                  textAlign: 'center',
                  "& input": { textAlign: 'center', fontWeight: 'normal' }
                }}
              />
            );
          }

          const totalPieces = Object.values(row.piecesPerSize).reduce((sum, pieces) => sum + (parseInt(pieces) || 0), 0);
          const actualLayers = parseInt(row.layers_a) || 0;
          const totalActualPcs = totalPieces * actualLayers;
          const tooltipContent = createSizeBreakdownTooltip(row.piecesPerSize, row.layers_a, true);

          return (
            <Tooltip
              title={tooltipContent || ''}
              arrow
              placement="top"
              enterDelay={300}
              leaveDelay={200}
            >
              <TextField
                variant="outlined"
                value={totalActualPcs}
                InputProps={{ readOnly: true }}
                sx={{
                  width: '100%',
                  minWidth: '65px',
                  maxWidth: '80px',
                  textAlign: 'center',
                  "& input": {
                    textAlign: 'center',
                    fontWeight: 'normal'
                  }
                }}
              />
            </Tooltip>
          );
        })()}
      </TableCell>

      {/* Planned Consumption */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '70px', textAlign: 'center', padding: '1px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.cons_planned ? parseFloat(row.cons_planned).toFixed(1) : '-'}
        </Typography>
      </TableCell>

      {/* Actual Consumption */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '70px', textAlign: 'center', padding: '1px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {typeof row.cons_actual === 'number' ? row.cons_actual.toFixed(1) : '-'}
        </Typography>
      </TableCell>

      {/* Real Consumption (KPI) */}
      {/* <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <TextField
          variant="outlined"
          value={row.cons_real || ''}
          InputProps={{ readOnly: true }}
          sx={{
            width: '100%',
            minWidth: '65px',
            maxWidth: '80px',
            textAlign: 'center',
            "& input": { textAlign: 'center', fontWeight: 'normal' }
          }}
        />
      </TableCell> */}

      {/* Bagno */}
      <TableCell sx={{ minWidth: '30px', maxWidth: '50px', textAlign: 'center', padding: '1px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.bagno || '-'}
        </Typography>
      </TableCell>

      {/* Progress Bar */}
      <TableCell sx={{ minWidth: '100px', textAlign: 'center', padding: '10px' }}>
        {(row.bagno_ready === true || row.bagno_ready === 1 || row.bagno_ready === '1') ? (
          <MattressProgressBar
            currentPhase={row.phase_status}
            hasPendingWidthChange={row.has_pending_width_change}
            operator={row.phase_operator}
          />
        ) : (
          <Typography
            sx={{
              fontWeight: 'bold',
              color: 'error.main',
              fontSize: '0.875rem'
            }}
          >
            Bagno not ready!
          </Typography>
        )}
      </TableCell>

      {/* Edit Actual Layers Icon */}
      <TableCell sx={{ minWidth: '50px', textAlign: 'center', padding: '4px' }}>
        {(() => {
          const isCompleted = row.phase_status === '5 - COMPLETED';

          return (
            <IconButton
              onClick={() => isCompleted && onEditActualLayers && onEditActualLayers(row)}
              disabled={!isCompleted}
              color={isCompleted ? "primary" : "default"}
              size="small"
              sx={{
                padding: '6px',
                cursor: isCompleted ? 'pointer' : 'not-allowed',
                '&:hover': isCompleted ? {
                  backgroundColor: 'primary.light',
                  color: 'primary.dark'
                } : {},
                '&.Mui-disabled': {
                  color: 'grey.400'
                }
              }}
            >
              <IconEdit size={20} />
            </IconButton>
          );
        })()}
      </TableCell>
    </TableRow>
  );
};

export default MattressRowReadOnly;

