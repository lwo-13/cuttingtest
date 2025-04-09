const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]; // Custom order for letter sizes

export const sortSizes = (sizes) => {
  return sizes.sort((a, b) => {
    const sizeA = a.size;
    const sizeB = b.size;

    if (!isNaN(sizeA) && !isNaN(sizeB)) {
      return parseInt(sizeA) - parseInt(sizeB);
    }

    const indexA = sizeOrder.indexOf(sizeA);
    const indexB = sizeOrder.indexOf(sizeB);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (!isNaN(sizeA)) return 1;
    if (!isNaN(sizeB)) return -1;

    return sizeA.localeCompare(sizeB);
  });
};