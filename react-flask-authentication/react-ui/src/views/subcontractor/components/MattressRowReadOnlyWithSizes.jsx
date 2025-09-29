import React from 'react';
import { TableRow, TableCell, TextField, Typography, IconButton, Tooltip } from '@mui/material';
import { Print, Download, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { IconTool } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const MattressRowReadOnlyWithSizes = ({ row, orderSizes, onPrintMattress, onDownloadMattress, onChangeMattress, onActualLayersChange, editableActualLayers }) => {
  const { t } = useTranslation();
  return (
    <TableRow>
      {/* Mattress Name (short display) */}
      <TableCell sx={{ minWidth: '120px', maxWidth: '150px', textAlign: 'center', padding: '9px' }}>
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
        minWidth: '250px',
        maxWidth: '400px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        <Typography sx={{ textAlign: 'center', fontWeight: 'normal' }}>
          {row.markerName || '-'}
        </Typography>
      </TableCell>

      {/* Pieces Per Size */}
      {orderSizes.map((size) => (
        <TableCell key={size.size} sx={{ minWidth: '60px', maxWidth: '70px', textAlign: 'center', padding: '4px' }}>
          <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
            {row.piecesPerSize?.[size.size] || 0}
          </Typography>
        </TableCell>
      ))}

      {/* Marker Length */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.markerLength || '-'}
        </Typography>
      </TableCell>

      {/* Efficiency */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography variant="body1" sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.efficiency || '-'}
        </Typography>
      </TableCell>

      {/* Planned Layers */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.layers || '-'}
        </Typography>
      </TableCell>

      {/* Planned Consumption (from DB - expectedConsumption) */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {typeof row.expectedConsumption === 'number' ? row.expectedConsumption.toFixed(1) : '-'}
        </Typography>
      </TableCell>

      {/* Actual Layers (KPI) - Editable for subcontractors */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        {row.layers_a && row.layers_updated_at ? (
          <Tooltip
            title={`${t('subcontractor.updatedAt', 'Updated at')}: ${row.layers_updated_at}`}
            placement="top"
            arrow
          >
            <TextField
              variant="outlined"
              value={editableActualLayers[row.id] !== undefined ? editableActualLayers[row.id] : (row.layers_a || '')}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
                onActualLayersChange && onActualLayersChange(row.id, value);
              }}
              sx={{
                width: '100%',
                minWidth: '65px',
                maxWidth: '80px',
                textAlign: 'center',
                "& input": { textAlign: 'center', fontWeight: 'normal' }
              }}
            />
          </Tooltip>
        ) : (
          <TextField
            variant="outlined"
            value={editableActualLayers[row.id] !== undefined ? editableActualLayers[row.id] : (row.layers_a || '')}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
              onActualLayersChange && onActualLayersChange(row.id, value);
            }}
            sx={{
              width: '100%',
              minWidth: '65px',
              maxWidth: '80px',
              textAlign: 'center',
              "& input": { textAlign: 'center', fontWeight: 'normal' }
            }}
          />
        )}
      </TableCell>

      {/* Actual Consumption (calculated from actual layers) */}
      <TableCell sx={{ minWidth: '65px', maxWidth: '80px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {typeof row.cons_actual === 'number' ? row.cons_actual.toFixed(1) : '-'}
        </Typography>
      </TableCell>

      {/* Bagno */}
      <TableCell sx={{ minWidth: '90px', maxWidth: '120px', textAlign: 'center', padding: '4px' }}>
        <Typography sx={{ fontWeight: 'normal', textAlign: 'center' }}>
          {row.bagno || '-'}
        </Typography>
      </TableCell>

      {/* Bagno Ready Status Icon */}
      <TableCell sx={{ minWidth: '40px', textAlign: 'center', padding: '2px' }}>
        <IconButton
          size="small"
          sx={{
            padding: '2px',
            color: row.bagno_ready ? 'success.main' : 'grey.400'
          }}
          disabled
        >
          {row.bagno_ready ? <CheckCircle fontSize="small" /> : <RadioButtonUnchecked fontSize="small" />}
        </IconButton>
      </TableCell>

      {/* Print Icon */}
      <TableCell sx={{ minWidth: '40px', textAlign: 'center', padding: '2px' }}>
        <IconButton
          onClick={() => onPrintMattress && onPrintMattress(row)}
          color="primary"
          size="small"
          sx={{ padding: '2px' }}
        >
          <Print fontSize="small" />
        </IconButton>
      </TableCell>

      {/* Download Icon */}
      <TableCell sx={{ minWidth: '40px', textAlign: 'center', padding: '2px' }}>
        <IconButton
          onClick={() => onDownloadMattress && onDownloadMattress(row)}
          color="secondary"
          size="small"
          sx={{ padding: '2px' }}
        >
          <Download fontSize="small" />
        </IconButton>
      </TableCell>

      {/* Change Icon - Only show if there's a marker */}
      <TableCell sx={{ minWidth: '40px', textAlign: 'center', padding: '2px' }}>
        {row.markerName && row.markerName !== '-' ? (
          <IconButton
            onClick={() => onChangeMattress && onChangeMattress(row)}
            color={row.layers_a ? "inherit" : "primary"}
            size="small"
            disabled={!!row.layers_a}
            sx={{
              padding: '2px',
              opacity: row.layers_a ? 0.4 : 1,
              cursor: row.layers_a ? 'not-allowed' : 'pointer'
            }}
          >
            <IconTool size={20} />
          </IconButton>
        ) : null}
      </TableCell>
    </TableRow>
  );
};

export default MattressRowReadOnlyWithSizes;
