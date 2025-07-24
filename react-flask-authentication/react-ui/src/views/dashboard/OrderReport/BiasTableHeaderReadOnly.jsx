import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BiasTableHeaderReadOnly = () => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>Collaretto ID</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.usableWidth')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.pcsSeamtoSeam')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.rollWidth')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>{t('table.scrapRolls')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>{t('table.rolls')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.rollsPlanned')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.consPlanned')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.bagno')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.sizes')}</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default BiasTableHeaderReadOnly;
