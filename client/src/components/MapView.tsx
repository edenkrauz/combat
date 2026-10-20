import React, { useState, useMemo } from 'react';
import {
  Plus,
  Minus,
  Globe,
  Flame,
  AlertTriangle,
  Rocket,
  Building,
  Target,
} from 'lucide-react';
import type { EventItem, SectorGroup } from '../types/event';
import { rawMockDbEvents } from '../data/mockEvents';
import { formatDbEventToItem } from '../types/event';

export interface MapViewProps {
  events?: EventItem[];
  sector?: SectorGroup;
  selectedEventId?: string | null;
  onEventSelect?: (event: EventItem) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  events: propEvents,
  sector,
  selectedEventId,
  onEventSelect,
  className = '',
}) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Use passed events or fallback to mock data
  const events = useMemo(() => {
    if (propEvents && propEvents.length > 0) return propEvents;
    return rawMockDbEvents.map(formatDbEventToItem);
  }, [propEvents]);

  const activeSectorName = sector?.display_name || 'מרכז • ישראל';
  const tensionLabel = sector?.tension_label || 'מתיחות בינונית';

  // Separate events into geographic clusters (Central/Dan vs Jerusalem)
  const danEvents = useMemo(
    () => events.filter((e) => (e.lat ?? 0) >= 31.95 && (e.lat ?? 0) <= 32.2 && (e.lng ?? 0) <= 35.0),
    [events]
  );

  const jerusalemEvents = useMemo(
    () => events.filter((e) => (e.lat ?? 0) >= 31.65 && (e.lat ?? 0) <= 31.95 && (e.lng ?? 0) > 35.0),
    [events]
  );

  // Dynamic heat intensity & radius calculations based on event concentrations
  const danConcentration = danEvents.length;
  const jerusalemConcentration = jerusalemEvents.length;

  // Dan cluster: 8 events -> higher concentration -> stronger heat intensity
  const danRx = Math.min(115, 80 + danConcentration * 2.5);
  const danRy = Math.min(135, 95 + danConcentration * 2.8);
  const danOpacity = danConcentration >= 6 ? 0.92 : danConcentration >= 3 ? 0.85 : 0.75;

  // Jerusalem cluster: 2 events -> moderate concentration -> localized heat intensity
  const jlmRx = Math.min(90, 58 + jerusalemConcentration * 4.5);
  const jlmRy = Math.min(95, 62 + jerusalemConcentration * 5.0);
  const jlmOpacity = jerusalemConcentration >= 4 ? 0.88 : 0.80;

  // Zoom and pan controls
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.85));
  const handleRecenter = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, .marker-interactive')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Find representative events for the tactical overlay markers
  const rocketEvent = danEvents.find((e) => e.event_type === 'rocket_impact') || danEvents[0];
  const buildingEvent = danEvents.find((e) => e.event_type === 'building_damage') || danEvents[1];
  const debrisEvent = danEvents.find((e) => e.event_type === 'interception_debris') || danEvents[2];
  const uavEvent = danEvents.find((e) => e.event_type === 'uav_interception') || danEvents[3];
  const alertEvent = danEvents.find((e) => e.event_type === 'traffic_block') || danEvents[4];
  const jlmEvent = jerusalemEvents.find((e) => e.event_type === 'terror_and_riot') || jerusalemEvents[0];

  return (
    <div
      className={`relative flex-1 w-full h-full rounded-2xl overflow-hidden border border-slate-200/90 bg-[#eaf1f8] select-none dark:border-slate-800 dark:bg-slate-950 ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      dir="rtl"
    >
      {/* SVG Canvas for Map Cartography, Sectors, Heatmap, and Geographic Labels */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-none transition-transform duration-75"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 1000 650"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '46% 40%',
        }}
      >
        <defs>
          {/* Radial gradient for High Intensity Heatmap (Tel Aviv / Gush Dan Cluster) */}
          <radialGradient id="dangerHeatmapHigh" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#dc2626" stopOpacity="0.90" />
            <stop offset="42%" stopColor="#ea580c" stopOpacity="0.82" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.68" />
            <stop offset="76%" stopColor="#84cc16" stopOpacity="0.48" />
            <stop offset="87%" stopColor="#14b8a6" stopOpacity="0.30" />
            <stop offset="94%" stopColor="#38bdf8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>

          {/* Radial gradient for Moderate Intensity Heatmap (Jerusalem Cluster) */}
          <radialGradient id="dangerHeatmapMedium" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.84" />
            <stop offset="25%" stopColor="#ea580c" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.60" />
            <stop offset="70%" stopColor="#84cc16" stopOpacity="0.40" />
            <stop offset="84%" stopColor="#14b8a6" stopOpacity="0.22" />
            <stop offset="94%" stopColor="#38bdf8" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>

          {/* Soft Heatmap Blur Filter */}
          <filter id="heatmapBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>

        {/* 1. Sea (West / Mediterranean) */}
        <rect width="1000" height="650" fill="#dce9f5" className="dark:fill-[#0c1829]" />

        {/* 2. Land (East / Israel & surrounding geography) */}
        <path
          d="M 380,0 
             L 375,100 
             L 360,180 
             L 320,280 
             L 310,360 
             L 315,440 
             L 260,540 
             L 245,650 
             L 1000,650 
             L 1000,0 Z"
          fill="#edf3f8"
          stroke="#94a3b8"
          strokeWidth="1.2"
          className="dark:fill-[#131f33] dark:stroke-slate-700"
        />


        {/* 4. Administrative Sector Boundaries / Roads */}
        <path
          d="M 520,0 L 530,120 L 590,260 L 630,360 L 570,440 L 590,520 L 610,650"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.3"
          className="dark:stroke-slate-750"
        />

        {/* 5. Heatmap Layers based on Actual Project Data */}
        {showHeatmap && (
          <g className="heatmap-layer">
            {/* Primary Cluster: Gush Dan / Tel Aviv (Stronger Heat Intensity) */}
            {danConcentration > 0 && (
              <ellipse
                cx="415"
                cy="235"
                rx={danRx}
                ry={danRy}
                fill="url(#dangerHeatmapHigh)"
                filter="url(#heatmapBlur)"
                style={{ opacity: danOpacity }}
                className="mix-blend-multiply transition-all duration-300 dark:mix-blend-screen"
              />
            )}

            {/* Secondary Cluster: Jerusalem (Moderate Heat Intensity) */}
            {jerusalemConcentration > 0 && (
              <ellipse
                cx="515"
                cy="295"
                rx={jlmRx}
                ry={jlmRy}
                fill="url(#dangerHeatmapMedium)"
                filter="url(#heatmapBlur)"
                style={{ opacity: jlmOpacity }}
                className="mix-blend-multiply transition-all duration-300 dark:mix-blend-screen"
              />
            )}
          </g>
        )}

        {/* 6. Impact / Alert Radius Circle (Dashed Teal Ring) */}
        <circle
          cx="415"
          cy="265"
          r="16"
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* 7. Geographic City Labels matching Figma Design */}
        <text
          x="465"
          y="26"
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
          fontWeight="600"
          fontFamily="Assistant, sans-serif"
          className="dark:fill-slate-400"
        >
          חיפה
        </text>

        <text
          x="455"
          y="172"
          textAnchor="middle"
          fill="#64748b"
          fontSize="13"
          fontWeight="bold"
          fontFamily="Assistant, sans-serif"
          className="dark:fill-slate-400"
        >
          מרכז
        </text>

        <text
          x="408"
          y="238"
          textAnchor="middle"
          fill="#ffffff"
          stroke="#334155"
          strokeWidth="0.8"
          paintOrder="stroke fill"
          fontSize="12"
          fontWeight="bold"
          fontFamily="Assistant, sans-serif"
        >
          תל אביב
        </text>

        <text
          x="512"
          y="332"
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
          fontWeight="600"
          fontFamily="Assistant, sans-serif"
          className="dark:fill-slate-400"
        >
          ירושלים
        </text>

        <text
          x="355"
          y="365"
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
          fontWeight="600"
          fontFamily="Assistant, sans-serif"
          className="dark:fill-slate-400"
        >
          אשקלון
        </text>

        <text
          x="410"
          y="480"
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
          fontWeight="600"
          fontFamily="Assistant, sans-serif"
          className="dark:fill-slate-400"
        >
          באר שבע
        </text>
      </svg>

      {/* Map Control Toolbar (Floating Top-Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-md p-1 gap-1 text-slate-700 dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-300">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="התקרב (Zoom In)"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="התרחק (Zoom Out)"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 my-0.5 dark:bg-slate-800" />
        <button
          onClick={handleRecenter}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="מרכז מפה (Center Map)"
        >
          <Globe className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer ${
            showHeatmap
              ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-400 dark:hover:bg-slate-800'
          }`}
          title={showHeatmap ? 'הסתר מפת חום (Hide Heatmap)' : 'הצג מפת חום (Show Heatmap)'}
        >
          <Flame className="w-4 h-4" />
        </button>
      </div>

      {/* Tactical Event Markers Overlay (Matching Figma Reference) */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '46% 40%',
        }}
      >
        {/* Dan Cluster Marker 1: Top alert marker (Traffic block / Geha) */}
        {alertEvent && (
          <div
            className="absolute top-[30%] left-[43.1%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto marker-interactive"
            onClick={() => onEventSelect?.(alertEvent)}
          >
            <div
              className={`w-6 h-6 rounded-full bg-slate-600 border-2 border-white shadow-md flex items-center justify-center text-white cursor-pointer hover:scale-110 transition ${
                selectedEventId === alertEvent.event_id ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={alertEvent.title}
            >
              <AlertTriangle className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
          </div>
        )}

        {/* Dan Cluster Marker 2: Rocket impact marker (Bat Yam) */}
        {rocketEvent && (
          <div
            className="absolute top-[34.6%] left-[41.8%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto marker-interactive"
            onClick={() => onEventSelect?.(rocketEvent)}
          >
            <div
              className={`w-6.5 h-6.5 rounded-full bg-[#dc2626] border-2 border-white shadow-md flex items-center justify-center text-white cursor-pointer hover:scale-110 transition ${
                selectedEventId === rocketEvent.event_id ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={rocketEvent.title}
            >
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}

        {/* Dan Cluster Marker 3: Medical incident marker (Holon / Ganot) */}
        {debrisEvent && (
          <div
            className="absolute top-[37.7%] left-[40.6%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto marker-interactive"
            onClick={() => onEventSelect?.(debrisEvent)}
          >
            <div
              className={`w-6.5 h-6.5 rounded-full bg-[#dc2626] border-2 border-white shadow-md flex items-center justify-center text-white cursor-pointer hover:scale-110 transition ${
                selectedEventId === debrisEvent.event_id ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={debrisEvent.title}
            >
              <Plus className="w-4 h-4 text-white stroke-[3]" />
            </div>
          </div>
        )}

        {/* Dan Cluster Marker 4: Building damage marker (Givatayim) */}
        {buildingEvent && (
          <div
            className="absolute top-[35.7%] left-[42.4%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto marker-interactive"
            onClick={() => onEventSelect?.(buildingEvent)}
          >
            <div
              className={`w-6.5 h-6.5 rounded-full bg-[#dc2626] border-2 border-white shadow-md flex items-center justify-center text-white cursor-pointer hover:scale-110 transition ${
                selectedEventId === buildingEvent.event_id ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={buildingEvent.title}
            >
              <Building className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}

        {/* Dan Cluster Marker 5: UAV / Interception debris marker (Rishon LeZion) with dashed circle */}
        {uavEvent && (
          <div
            className="absolute top-[40.8%] left-[41.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto marker-interactive"
            onClick={() => onEventSelect?.(uavEvent)}
          >
            <div
              className={`w-6.5 h-6.5 rounded-full bg-[#0d9488] border-2 border-white shadow-md flex items-center justify-center text-white cursor-pointer hover:scale-110 transition ${
                selectedEventId === uavEvent.event_id ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={uavEvent.title}
            >
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}

        {/* Jerusalem Cluster Marker: Terror & Riot incident */}
        {jlmEvent && (
          <div
            className="absolute top-[45.4%] left-[51.0%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto marker-interactive"
            onClick={() => onEventSelect?.(jlmEvent)}
          >
            <div
              className={`w-7 h-7 rounded-full bg-[#991b1b] border-2 border-[#f59e0b] shadow-md flex items-center justify-center text-white cursor-pointer hover:scale-110 transition ${
                selectedEventId === jlmEvent.event_id ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={jlmEvent.title}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Left Coordinates & Scale Card (Matching Figma Reference) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-2xl px-3.5 py-2.5 shadow-sm text-right text-xs leading-relaxed dark:bg-slate-900/95 dark:border-slate-800">
        <div className="font-bold text-slate-800 dark:text-white tracking-wide">
          מרכז תצוגה • N 32.00 E 34.95
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          100 פיקסלים ≈ 35 ק"מ · גרירה להזזה, גלגלת לזום
        </div>
      </div>

      {/* Bottom-Right Heatmap & Risk Legend Card (Matching Figma Reference) */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-2xl p-3.5 shadow-sm text-right min-w-[240px] space-y-3 dark:bg-slate-900/95 dark:border-slate-800">
        <div>
          {/* Header Line: ריכוז דחיפות • 9 אירועים מוצגים • לפי דחיפות */}
          <div className="flex items-center justify-start gap-1 text-[11px] mb-2 font-medium text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-100">
              ריכוז דחיפות
            </span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-300">
              {events.length} אירועים מוצגים
            </span>
            <span>•</span>
            <span className="text-slate-400 dark:text-slate-500">
              לפי דחיפות
            </span>
          </div>

          {/* Gradient Bar: Red on Left (גבוה) to Teal on Right (נמוך) */}
          <div
            className="h-1.5 w-full rounded-full"
            style={{
              background:
                'linear-gradient(to right, #cf2c2b 0%, #ea580c 25%, #f59e0b 50%, #4ba777 75%, #18a38d 100%)',
            }}
          />

          {/* Labels Below Gradient Bar */}
          <div className="flex items-center justify-between text-[11px] mt-1 text-slate-400 dark:text-slate-500 font-medium">
            <span>גבוה</span>
            <span>נמוך</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* Sector Tension Section */}
        <div>
          <div className="text-[11px] font-medium text-slate-700 mb-1.5 dark:text-slate-300">
            מתיחות אזורית בגזרה
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm border border-amber-400/90 bg-[#fef7ee] inline-block shadow-2xs" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {activeSectorName}
              </span>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {tensionLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
