export const getTablePlannedQuantities = (table) => {
  const plannedQuantities = {};

  table.rows.forEach(row => {
    const layers = parseInt(row.layers_a) || 0;

    Object.entries(row.piecesPerSize || {}).forEach(([size, pcs]) => {
      const pieces = parseInt(pcs) || 0;
      plannedQuantities[size] = (plannedQuantities[size] || 0) + (pieces * layers);
    });
  });

  return plannedQuantities;
};


export const getTablePlannedByBagno = (table) => {
  const bagnoMap = {};

  if (!table || !table.rows) {
    console.warn('Invalid table passed to getTablePlannedByBagno:', table);
    return bagnoMap;
  }

  table.rows.forEach(row => {
    const bagno = row.bagno;
    if (!bagno || bagno === 'Unknown') return;

    const layers = parseInt(row.layers_a);
    if (isNaN(layers) || layers <= 0) return;

    if (!row.piecesPerSize || typeof row.piecesPerSize !== 'object') return;

    if (!bagnoMap[bagno]) {
      bagnoMap[bagno] = {};
    }

    Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
      const pieces = parseInt(pcs) || 0;
      if (pieces <= 0) return;

      const total = pieces * layers;
      bagnoMap[bagno][size] = (bagnoMap[bagno][size] || 0) + total;
    });
  });

  return bagnoMap;
};

export const getMetersByBagno = (table) => {
  const bagnoMeters = {};

  table.rows.forEach(row => {
    const bagno = row.bagno || 'Unknown';
    const consumption = parseFloat(row.cons_real) || 0;

    bagnoMeters[bagno] = (bagnoMeters[bagno] || 0) + consumption;
  });

  return bagnoMeters;
};