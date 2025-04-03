import React from 'react';
import { Box, Typography } from '@mui/material';

const PlannedQuantityBar = ({ table, orderSizes, getTablePlannedQuantities }) => {
  const planned = getTablePlannedQuantities(table);

  const hasRealQty = Object.values(planned).some(qty => qty > 0);
  if (!hasRealQty) return null;

  return (
    <Box 
      display="flex"
      gap={2}
      sx={{
        backgroundColor: "#EFEFEF",
        padding: "4px 8px",
        borderRadius: "8px",
        flexWrap: "wrap",
        maxWidth: "50%",
        justifyContent: "flex-end",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      {Object.entries(planned).map(([size, qty]) => {
        const sizeData = orderSizes.find(s => s.size === size);
        const totalOrdered = sizeData ? sizeData.qty : 1;
        const percentage = totalOrdered ? ((qty / totalOrdered) * 100).toFixed(1) : "N/A";

        return (
          <Typography key={size} variant="body2" sx={{ fontWeight: "bold" }}>
            {size}: {qty} ({percentage !== "NaN" ? percentage + "%" : "N/A"})
          </Typography>
        );
      })}
    </Box>
  );
};

export default PlannedQuantityBar;
