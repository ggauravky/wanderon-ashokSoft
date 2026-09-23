import React, { useState } from 'react';
import ExpeditionRouteMapElevation from './ExpeditionRouteMapElevation';

/**
 * WorkspaceMapTab — now reuses the same rich topo map from the Overview tab
 * so the booking section map matches the overview map style exactly.
 */
const WorkspaceMapTab = ({ itinerary }) => {
  const [activeDay, setActiveDay] = useState(1);

  const destination = itinerary?.destination || 'Spiti Valley';
  const duration = itinerary?.duration || itinerary?.daysCount || itinerary?.days?.length || 7;

  return (
    <div className="space-y-6">
      <ExpeditionRouteMapElevation
        destination={destination}
        duration={duration}
        activeDay={activeDay}
        onSelectDay={setActiveDay}
      />
    </div>
  );
};

export default WorkspaceMapTab;
