import { useState } from 'react';
import axios from 'axios';

const useBrandInfo = () => {
  const [brand, setBrand] = useState("");

  const fetchBrandForStyle = async (styleCode) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/zalli/get_brand/${styleCode}`);
      if (response.data.success) {
        setBrand(response.data.brand || "");
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
