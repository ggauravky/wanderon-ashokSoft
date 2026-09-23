import { useCallback, useEffect, useState } from 'react';
import { getActiveMarketingBannersApi } from '../services/api.js';
import { groupMarketingBanners } from './bannerGrouping.js';

export default function useMarketingBanners() {
  const [bannersByPlacement, setBanners] = useState(() => groupMarketingBanners());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const refresh = useCallback(() => setRequestVersion((version) => version + 1), []);

  useEffect(() => {
    let active = true;
    getActiveMarketingBannersApi().then((result) => {
      if (active) { setBanners(groupMarketingBanners(result?.banners)); setError(false); }
    }).catch(() => {
      if (active) { setBanners(groupMarketingBanners()); setError(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestVersion]);

  return { bannersByPlacement, loading, error, refresh };
}
