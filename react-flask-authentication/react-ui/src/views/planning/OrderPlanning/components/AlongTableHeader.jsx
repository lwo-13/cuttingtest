import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AlongTableHeader = () => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow sx={{ height: "50px" }}>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.pieces')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.usableWidth')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.grossLength')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.collarettoWidth')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.scrapRolls')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.rollsPlanned')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.rollsActual')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.totalCollaretto', 'Total Collaretto [m]')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.plannedConsShort')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.actualConsShort')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.bagno')}</TableCell>
        <TableCell align="center" sx={{ padding: "2px 6px" }}>{t('table.sizes')}</TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableHead>
  );
};

export default AlongTableHeader;
