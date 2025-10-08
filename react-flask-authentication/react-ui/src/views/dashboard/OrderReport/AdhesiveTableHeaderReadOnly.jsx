import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AdhesiveTableHeaderReadOnly = ({ orderSizes }) => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>{t('table.adhesive')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>{t('table.width')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '150px', maxWidth: '400px', width: 'auto' }}>{t('table.markerName')}</TableCell>

        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.length')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>{t('table.effPercent')}</TableCell>

        <TableCell align="center">{t('table.plannedLayers')}</TableCell>
        <TableCell align="center">{t('table.actualLayers')}</TableCell>
        <TableCell align="center">{t('table.plannedPcs')}</TableCell>
        <TableCell align="center">{t('table.actualPcs')}</TableCell>

        <TableCell align="center">{t('table.plannedCons')}</TableCell>
        <TableCell align="center">{t('table.actualCons')}</TableCell>
        {/* <TableCell align="center">{t('table.realCons')}</TableCell> */}

        <TableCell align="center">{t('table.bagno')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '150px' }}>{t('table.progress')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '50px' }}></TableCell>

      </TableRow>
    </TableHead>
  );
};

export default AdhesiveTableHeaderReadOnly;
