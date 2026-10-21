import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { EventItem } from '../types/event';
import {
  ensureLeafletHeat,
  extractHeatPoints,
  FIGMA_HEATMAP_OPTIONS,
} from '../utils/leafletHeat';

export interface UseLeafletMapOptions {
  defaultCenter?: [number, number];
  defaultZoom?: number;
  events?: EventItem[];
}

export interface CoordinatesState {
  lat: string;
  lng: string;
}

export const ISRAEL_CENTER_DISTRICT: [number, number] = [32.05, 34.85];
export const DEFAULT_MAP_ZOOM = 11;

export const useLeafletMap = ({
  defaultCenter = ISRAEL_CENTER_DISTRICT,
  defaultZoom = DEFAULT_MAP_ZOOM,
  events,
}: UseLeafletMapOptions = {}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  // Keep fresh reference for async initialization
  const eventsRef = useRef<EventItem[] | undefined>(events);

  const centerLat = defaultCenter[0];
  const centerLng = defaultCenter[1];

  const [centerCoords, setCenterCoords] = useState<CoordinatesState>({
    lat: centerLat.toFixed(2),
    lng: centerLng.toFixed(2),
  });
  const [scaleKmText, setScaleKmText] = useState<string>('6 ק"מ');

  // Helper to calculate pixel scale (distance for 100px)
  const updateMapMetrics = useCallback((map: L.Map) => {
    const center = map.getCenter();
    setCenterCoords({
      lat: center.lat.toFixed(2),
      lng: center.lng.toFixed(2),
    });

    const p1 = map.containerPointToLatLng([0, 0]);
    const p2 = map.containerPointToLatLng([100, 0]);
    const distanceMeters = map.distance(p1, p2);
    const distanceKm = Math.round(distanceMeters / 1000);
    setScaleKmText(`${Math.max(1, distanceKm)} ק"מ`);
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Map with initial focus on Israel Center District
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: defaultZoom,
      zoomControl: false, // Custom floating toolbar
      attributionControl: false,
      minZoom: 8,
      maxZoom: 18,
    });

    mapInstanceRef.current = map;

    // Reliable OpenStreetMap base tiles with light-grey tactical cartography filter
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      className: 'map-tiles-light-grey',
      crossOrigin: true,
    }).addTo(map);

    // Track move & zoom events
    const handleMove = () => updateMapMetrics(map);
    map.on('move', handleMove);
    map.on('zoom', handleMove);

    updateMapMetrics(map);

    // Initialize Heatmap layer on the map instance
    let isCancelled = false;
    ensureLeafletHeat().then(() => {
      if (isCancelled || !mapInstanceRef.current) return;
      if (!heatLayerRef.current) {
        const points = extractHeatPoints(eventsRef.current);
        const heat = L.heatLayer(points, FIGMA_HEATMAP_OPTIONS);
        heat.addTo(mapInstanceRef.current);
        heatLayerRef.current = heat;
      }
    });

    // Ensure size calculations occur once container is measured in flex layout
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (heatLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      map.off('move', handleMove);
      map.off('zoom', handleMove);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLng, defaultZoom, updateMapMetrics]);

  // Update Heatmap points whenever events change
  useEffect(() => {
    eventsRef.current = events;
    if (heatLayerRef.current) {
      const points = extractHeatPoints(events);
      heatLayerRef.current.setLatLngs(points);
    }
  }, [events]);

  // Actions for toolbar
  const zoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const zoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  const recenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([centerLat, centerLng], defaultZoom, { duration: 0.8 });
  }, [centerLat, centerLng, defaultZoom]);

  return {
    mapContainerRef,
    centerCoords,
    scaleKmText,
    zoomIn,
    zoomOut,
    recenter,
  };
};
