import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AlongTableHeaderReadOnly = () => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>{t('table.collarettoId')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.usableWidth')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.grossLength')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.collarettoWidth')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>{t('table.scrapRolls')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>{t('table.numberOfRollsShort')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.totalCollaretto')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>{t('table.cons')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.bagno')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.sizes')}</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default AlongTableHeaderReadOnly;
