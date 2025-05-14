const sizeOrder = [
  'XXS', 'XS', 'S', 'M', 'L', 'LL', 'LLL', 'XL', 'XXL', 'XXXL',
  'XSSHO', 'SSHO', 'MSHO', 'LSHO', 'XLSHO',
  'XS/S', 'S/M', 'M/L',
  'V25', 'V30', 'V40',
  '2', '3-4', '5-6', '7-8', '9-10', '11-12',
  '2-3', '4-5', '6-7', '8-9', '10-11', '12-13',
  '0D', '1A', '1B', '1C', '1D', '1E',
  '2A', '2B', '2C', '2D', '2E',
  '3A', '3B', '3C', '3D', '3E',
  '4A', '4B', '4C', '4D', '4E',
  '5A', '5B', '5C', '5D', '5E',
  '6B', '6C',
  '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58',
  '2/3', '4/5', '6/7', '8/9', '10/11', '12/13',
  '1/2', '3/4',
  '1', '2', '3', '4', '5', '6', '7', '8', '10', '12', '14',
  '000', 'ML', 'SM', 'TU', 'UN', 'X/XXL'
];

export const sortSizes = (sizes) => {
  return sizes.sort((a, b) => {
    const sizeA = a.size;
    const sizeB = b.size;

    // If both are numeric
    if (!isNaN(sizeA) && !isNaN(sizeB)) {
      return parseInt(sizeA) - parseInt(sizeB);
    }

    // Lookup in sizeOrder priority
    const indexA = sizeOrder.indexOf(sizeA);
    const indexB = sizeOrder.indexOf(sizeB);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If one is numeric and the other is not
    if (!isNaN(sizeA)) return 1;
    if (!isNaN(sizeB)) return -1;

    // Fallback: alphabetical
    return sizeA.localeCompare(sizeB);
  });
};