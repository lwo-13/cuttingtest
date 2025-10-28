import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MattressTableHeader = ({ orderSizes, isClosedOrder = false, productionCenter = '' }) => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>{t('table.mattress')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '10px' }}>{t('table.width')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '150px', maxWidth: '400px', width: 'auto' }}>{t('table.markerName')}</TableCell>

        {/* Dynamic Sizes
        {orderSizes.length > 0 &&
          orderSizes.map((size) => (
            <TableCell align="center" key={size.size}>
              {size.size || t('table.na')}
            </TableCell>
          ))
        } */}

        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.length')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '10px' }}>{t('table.effPercent')}</TableCell>

        <TableCell align="center" sx={{ minWidth: '10px' }}>{t('table.plannedLayers')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '10px' }}>{t('table.actualLayers')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '10px' }}>{t('table.plannedPcs')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '10px' }}>{t('table.actualPcs')}</TableCell>

        <TableCell align="center">{t('table.plannedCons')}</TableCell>
        <TableCell align="center">{t('table.actualCons')}</TableCell>
        {/* <TableCell align="center">{t('table.realCons')}</TableCell> */}

        <TableCell align="center">{t('table.bagno')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '150px' }}>{t('table.progress')}</TableCell>
        {!isClosedOrder && productionCenter !== 'PXE3' && <TableCell align="center" sx={{ minWidth: '50px' }}></TableCell>}

      </TableRow>
    </TableHead>
  );
};

export default MattressTableHeader;
