import { useState } from 'react';
import axios from 'utils/axiosInstance';

const useBrandInfo = () => {
  const [brand, setBrand] = useState("");

  const fetchBrandForStyle = async (styleCode) => {
    try {
      console.log("🔍 Fetching brand for style:", styleCode);
      const response = await axios.get(`/zalli/get_brand/${styleCode}`);
      console.log("🔍 Brand API response:", response.data);
      if (response.data.success) {
        const rawBrand = response.data.brand || "";
        const correctedBrand = rawBrand.toLowerCase() === "intimissim" ? "INTIMISSIMI" : rawBrand.toUpperCase();
        console.log("🔍 Setting brand:", correctedBrand);
        setBrand(correctedBrand);
      } else {
        console.log("🔍 Brand not found for style:", styleCode);
        setBrand("");
      }
    } catch (error) {
      console.error("❌ Failed to fetch brand for style:", styleCode, error);
      setBrand("");
    }
  };

  const clearBrand = () => {
    setBrand("");
  };

  return { brand, fetchBrandForStyle, clearBrand };
};

export default useBrandInfo;
