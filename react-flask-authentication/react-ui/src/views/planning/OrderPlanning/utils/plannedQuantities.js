export const getTablePlannedQuantities = (table) => {
    const plannedQuantities = {};

    table.rows.forEach(row => {
        Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
            const layers = parseInt(row.layers) || 0;
            const pieces = parseInt(pcs) || 0;
            plannedQuantities[size] = (plannedQuantities[size] || 0) + (pieces * layers);
        });
    });

    return plannedQuantities;
};

export const getTablePlannedByBagno = (table) => {
    const bagnoMap = {};

    table.rows.forEach(row => {
        const bagno = row.bagno || 'Unknown';

        Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
            const layers = parseInt(row.layers) || 0;
            const pieces = parseInt(pcs) || 0;
            const total = pieces * layers;

            if (!bagnoMap[bagno]) bagnoMap[bagno] = {};
            bagnoMap[bagno][size] = (bagnoMap[bagno][size] || 0) + total;
        });
    });

    return bagnoMap;
};

export const getMetersByBagno = (table) => {
    const bagnoMeters = {};
  
    table.rows.forEach(row => {
      const bagno = row.bagno || 'Unknown';
      const consumption = parseFloat(row.expectedConsumption) || 0;
  
      bagnoMeters[bagno] = (bagnoMeters[bagno] || 0) + consumption;
    });
  
    return bagnoMeters;
  };