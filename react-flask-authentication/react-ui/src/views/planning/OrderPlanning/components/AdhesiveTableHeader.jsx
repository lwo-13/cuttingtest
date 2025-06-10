import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AdhesiveTableHeader = ({ orderSizes }) => {
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

        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.length')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>{t('table.efficiency')}</TableCell>
        <TableCell align="center">{t('table.layers')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.consumption')}</TableCell>
        <TableCell align="center">{t('table.bagno')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '60px' }}>{t('table.status')}</TableCell>
        <TableCell />
      </TableRow>
    </TableHead>
  );
};

export default AdhesiveTableHeader;
