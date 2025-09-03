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
  const bagnoOrder = []; // Track the order of bagno appearance

  if (!table || !table.rows) {
    return { bagnoMap, bagnoOrder };
  }

  table.rows.forEach(row => {
    const bagno = row.bagno && row.bagno !== 'Unknown' ? row.bagno : 'No Bagno';

    const layers = parseInt(row.layers_a);
    if (isNaN(layers) || layers <= 0) return;

    if (!row.piecesPerSize || typeof row.piecesPerSize !== 'object') return;

    // Initialize bagno entry if it doesn't exist and track order
    if (!bagnoMap[bagno]) {
      bagnoMap[bagno] = {};
      bagnoOrder.push(bagno); // Add to order list when first encountered
    }

    Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
      const pieces = parseInt(pcs) || 0;
      if (pieces <= 0) return;

      const total = pieces * layers;
      bagnoMap[bagno][size] = (bagnoMap[bagno][size] || 0) + total;
    });
  });

  return { bagnoMap, bagnoOrder };
};

export const getMetersByBagno = (table) => {
  const bagnoMeters = {};
  const bagnoOrder = []; // Track the order of bagno appearance

  table.rows.forEach(row => {
    const bagno = row.bagno && row.bagno !== 'Unknown' ? row.bagno : 'No Bagno';
    // Use cons_actual if available, otherwise fall back to cons_planned
    const consumption = parseFloat(row.cons_actual) || parseFloat(row.cons_planned) || 0;

    // Track order when first encountered
    if (!bagnoMeters.hasOwnProperty(bagno)) {
      bagnoOrder.push(bagno);
    }

    bagnoMeters[bagno] = (bagnoMeters[bagno] || 0) + consumption;
  });

  return { bagnoMeters, bagnoOrder };
};

export const getWidthsByBagno = (table) => {
  const bagnoWidths = {};
  const bagnoOrder = []; // Track the order of bagno appearance

  // Safety check for invalid table
  if (!table || !table.rows) {
    return { bagnoWidths, bagnoOrder };
  }

  table.rows.forEach(row => {
    const bagno = row.bagno && row.bagno !== 'Unknown' ? row.bagno : 'No Bagno';
    const width = parseFloat(row.width);

    // Skip rows without valid width data
    if (!width || isNaN(width)) return;

    const layers = parseInt(row.layers_a);
    if (isNaN(layers) || layers <= 0) return;

    if (!row.piecesPerSize || typeof row.piecesPerSize !== 'object') return;

    // Use cons_actual if available, otherwise fall back to cons_planned
    const consumption = parseFloat(row.cons_actual) || parseFloat(row.cons_planned) || 0;

    // Track order when first encountered
    if (!bagnoWidths.hasOwnProperty(bagno)) {
      bagnoWidths[bagno] = {};
      bagnoOrder.push(bagno);
    }

    // Initialize width entry if it doesn't exist
    if (!bagnoWidths[bagno][width]) {
      bagnoWidths[bagno][width] = {
        sizeMap: {},
        consumption: 0
      };
    }

    // Add consumption for this width
    bagnoWidths[bagno][width].consumption += consumption;

    // Process each size and add to the total for this width
    Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
      const pieces = parseInt(pcs) || 0;
      if (pieces <= 0) return; // Skip sizes with no pieces

      const total = pieces * layers;
      bagnoWidths[bagno][width].sizeMap[size] = (bagnoWidths[bagno][width].sizeMap[size] || 0) + total;
    });
  });

  return { bagnoWidths, bagnoOrder };
};