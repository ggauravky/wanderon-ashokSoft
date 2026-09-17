import { useMemo } from 'react';
import { getCurrentSeason, getDestinationWeather, calculateTrendingTrips } from '../utils/weatherSeasonEngine';
import { UPCOMING_TRIPS } from '../constants/mockData';

export const useWeatherAndSeason = (customTrips) => {
  const tripsPool = customTrips || UPCOMING_TRIPS;

  const season = useMemo(() => {
    return getCurrentSeason();
  }, []);

  const trendingTrips = useMemo(() => {
    return calculateTrendingTrips(tripsPool);
  }, [tripsPool]);

  const seasonalPicks = useMemo(() => {
    return trendingTrips.filter((t) => t.isSeasonalPick);
  }, [trendingTrips]);

  const getWeatherFor = (location) => {
    return getDestinationWeather(location);
  };

  return {
    season,
    trendingTrips,
    seasonalPicks,
    getWeatherFor
  };
};

export default useWeatherAndSeason;
