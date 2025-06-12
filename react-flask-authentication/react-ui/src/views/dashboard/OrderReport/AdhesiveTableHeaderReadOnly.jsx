import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AdhesiveTableHeaderReadOnly = ({ orderSizes }) => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.width')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '400px' }}>{t('table.markerName')}</TableCell>

        {/* Dynamic Sizes */}
        {orderSizes.length > 0 &&
          orderSizes.map((size) => (
            <TableCell align="center" key={size.size}>
              {size.size || t('table.na')}
            </TableCell>
          ))
        }

        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.markerLength')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>{t('table.efficiency')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '80px' }}>{t('table.layers')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.expectedConsumption')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.bagno')}</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default AdhesiveTableHeaderReadOnly;
