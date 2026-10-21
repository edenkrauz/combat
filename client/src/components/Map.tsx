import React from 'react';
import type { EventItem, SectorGroup } from '../types/event';
import { MapView } from './MapView';

export interface MapProps {
  events?: EventItem[];
  sector?: SectorGroup;
  selectedEventId?: string | null;
  onEventSelect?: (event: EventItem) => void;
  className?: string;
}

export const Map: React.FC<MapProps> = ({
  events,
  sector,
  selectedEventId,
  onEventSelect,
  className = '',
}) => {
  return (
    <MapView
      events={events}
      sector={sector}
      selectedEventId={selectedEventId}
      onEventSelect={onEventSelect}
      className={className}
    />
  );
};

export default Map;
