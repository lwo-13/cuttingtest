import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BiasTableHeader = () => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow sx={{ height: "50px" }}>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.pieces')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.usableWidth')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.grossLength')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.pcsSeamToSeam')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.collarettoWidth')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.scrapRolls')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.numberOfRolls')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.numberOfPanels')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.consumption')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.bagno')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.sizes')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.status')}</TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableHead>
  );
};

export default BiasTableHeader;