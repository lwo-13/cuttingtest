import { useState } from 'react';
import axios from 'utils/axiosInstance';

const useBrandInfo = () => {
  const [brand, setBrand] = useState("");

  const fetchBrandForStyle = async (styleCode) => {
    try {
      const response = await axios.get(`/zalli/get_brand/${styleCode}`);
      if (response.data.success) {
        const rawBrand = response.data.brand || "";
        const correctedBrand = rawBrand.toLowerCase() === "intimissim" ? "INTIMISSIMI" : rawBrand.toUpperCase();
        setBrand(correctedBrand);
      } else {
        setBrand("");
      }
    } catch (error) {
      console.error("Failed to fetch brand", error);
      setBrand("");
    }
  };

  const clearBrand = () => {
    setBrand("");
  };

  return { brand, fetchBrandForStyle, clearBrand };
};

export default useBrandInfo;
