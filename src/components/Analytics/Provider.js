// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { initClarity } from '../../services/analytics';


const AnalyticsProvider = ({ children }) => {
  useEffect(() => {
    initClarity();
  }, []);
  
  return children;
};

export default AnalyticsProvider;