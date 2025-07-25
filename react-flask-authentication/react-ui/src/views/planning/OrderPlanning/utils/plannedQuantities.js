export const getTablePlannedQuantities = (table) => {
    const plannedQuantities = {};

    table.rows.forEach(row => {
        Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
            // Use actual layers (layers_a) if available and different from planned layers for locked rows
            const isLocked = !row.isEditable;
            const hasActualLayers = row.layers_a && String(row.layers_a) !== String(row.layers);
            const layers = (isLocked && hasActualLayers) ? parseInt(row.layers_a) || 0 : parseInt(row.layers) || 0;

            const pieces = parseInt(pcs) || 0;
            plannedQuantities[size] = (plannedQuantities[size] || 0) + (pieces * layers);
        });
    });

    return plannedQuantities;
};

export const getTablePlannedByBagno = (table) => {
    const bagnoMap = {};
    const bagnoOrder = []; // Track the order of bagno appearance

    // Safety check for invalid table
    if (!table || !table.rows) {
        console.warn('Invalid table passed to getTablePlannedByBagno:', table);
        return { bagnoMap, bagnoOrder };
    }

    table.rows.forEach((row, rowIndex) => {
        // Use "No Bagno" for rows without a valid bagno
        const bagno = row.bagno && row.bagno !== 'Unknown' ? row.bagno : 'No Bagno';

        // Skip rows without valid piecesPerSize
        if (!row.piecesPerSize || typeof row.piecesPerSize !== 'object') {
            return;
        }

        // Use actual layers (layers_a) if available and different from planned layers for locked rows
        const isLocked = !row.isEditable;
        const hasActualLayers = row.layers_a && String(row.layers_a) !== String(row.layers);
        const layers = (isLocked && hasActualLayers) ? parseInt(row.layers_a) : parseInt(row.layers);

        if (isNaN(layers) || layers <= 0) {
            return;
        }

        // Initialize bagno entry if it doesn't exist and track order
        if (!bagnoMap[bagno]) {
            bagnoMap[bagno] = {};
            bagnoOrder.push(bagno); // Add to order list when first encountered
        }

        // Process each size and add to the total
        Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
            const pieces = parseInt(pcs) || 0;
            if (pieces <= 0) return; // Skip sizes with no pieces

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

      // Use actual consumption (cons_actual) if available and different from expected consumption for locked rows
      const isLocked = !row.isEditable;
      const hasActualConsumption = row.cons_actual && row.cons_actual !== row.expectedConsumption;
      const consumption = (isLocked && hasActualConsumption) ? parseFloat(row.cons_actual) || 0 : parseFloat(row.expectedConsumption) || 0;

      // Track order when first encountered
      if (!bagnoMeters.hasOwnProperty(bagno)) {
        bagnoOrder.push(bagno);
      }

      bagnoMeters[bagno] = (bagnoMeters[bagno] || 0) + consumption;
    });

    return { bagnoMeters, bagnoOrder };
  };