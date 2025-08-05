import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AdhesiveTableHeaderWithSizes = ({ orderSizes }) => {
  const { t } = useTranslation();
  
  return (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ minWidth: '120px' }}>{t('table.adhesive', 'Adhesive')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>{t('table.width', 'Width [cm]')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '250px' }}>{t('table.markerName', 'Marker Name')}</TableCell>

        {/* Dynamic Sizes */}
        {orderSizes.length > 0 &&
          orderSizes.map((size) => (
            <TableCell align="center" key={size.size}>
              {size.size || t('table.na', 'N/A')}
            </TableCell>
          ))
        }

        <TableCell align="center" sx={{ minWidth: '100px' }}>{t('table.length', 'Length [m]')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '70px' }}>{t('table.efficiency', 'Eff %')}</TableCell>

        <TableCell align="center">{t('spreader.plannedLayers', 'Planned Layers')}</TableCell>
        <TableCell align="center">Planned Cons [m]</TableCell>
        <TableCell align="center">{t('spreader.actualLayers', 'Actual Layers')}</TableCell>
        <TableCell align="center">Actual Cons [m]</TableCell>

        <TableCell align="center">{t('table.bagno', 'Bagno')}</TableCell>
        <TableCell align="center" sx={{ minWidth: '40px' }}></TableCell>
        <TableCell align="center" sx={{ minWidth: '40px' }}></TableCell>
        <TableCell align="center" sx={{ minWidth: '40px' }}></TableCell>

      </TableRow>
    </TableHead>
  );
};

export default AdhesiveTableHeaderWithSizes;
