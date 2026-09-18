import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureMarketingAttribution } from '../utils/marketingAttribution.js';

export default function MarketingAttributionTracker() {
  const location = useLocation();
  useEffect(() => { captureMarketingAttribution(location.search, location.pathname); }, [location.pathname, location.search]);
  return null;
}

