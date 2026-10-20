import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Calendar,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import type { SectorGroup, EventItem } from '../types/event';
import { SectorAccordion } from './SectorAccordion';

interface EventsPanelProps {
  sectors: SectorGroup[];
  onFilteredEventsChange?: (events: EventItem[]) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  rocket_impact: 'נפילת רקטה',
  interception_debris: 'רסיסי יירוט',
  fire_hazard: 'שריפה',
  building_damage: 'נזק למבנה',
  uav_interception: 'חדירת / יירוט כטב"ם',
  traffic_block: 'חסימת ציר',
  smoke_hazard: 'עשן סמיך',
  medical_panic: 'נפגע חרדה',
  crowd_alert: 'התרעת התקהלות',
};

export const EventsPanel: React.FC<EventsPanelProps> = ({
  sectors,
  onFilteredEventsChange,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');

  // Dynamic Event Types from data
  const availableEventTypes = useMemo(() => {
    const typeSet = new Set<string>();
    sectors.forEach((s) =>
      s.events.forEach((e) => {
        if (e.event_type) typeSet.add(e.event_type);
      })
    );
    return Array.from(typeSet).map((type) => ({
      value: type,
      label: EVENT_TYPE_LABELS[type] || type,
    }));
  }, [sectors]);

  // Check if any secondary filters are active
  const hasSecondaryFilters =
    Boolean(startDate) ||
    Boolean(endDate) ||
    selectedStatus !== 'all' ||
    selectedUrgency !== 'all' ||
    selectedEventType !== 'all';

  const secondaryFiltersCount = [
    Boolean(startDate),
    Boolean(endDate),
    selectedStatus !== 'all',
    selectedUrgency !== 'all',
    selectedEventType !== 'all',
  ].filter(Boolean).length;

  const hasActiveFilters = searchQuery.trim().length > 0 || hasSecondaryFilters;

  // Reset secondary filters only
  const resetSecondaryFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStatus('all');
    setSelectedUrgency('all');
    setSelectedEventType('all');
  };

  // Reset all filters including search
  const resetAllFilters = () => {
    setSearchQuery('');
    resetSecondaryFilters();
  };

  // Filter logic
  const filteredSectors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sectors.map((sector) => {
      const filteredEvents = sector.events.filter((event) => {
        // 1. Text Search (matches title, location, description, ID, notes)
        if (query) {
          const matchTitle = event.title?.toLowerCase().includes(query);
          const matchDesc = event.description?.toLowerCase().includes(query);
          const matchLocation = (event.sector_description || event.sector)
            ?.toLowerCase()
            .includes(query);
          const matchId = event.event_id?.toLowerCase().includes(query);
          const matchNotes = event.notes?.toLowerCase().includes(query);

          if (!matchTitle && !matchDesc && !matchLocation && !matchId && !matchNotes) {
            return false;
          }
        }

        // 2. Date Range
        if (startDate || endDate) {
          const eventDateStr = event.start_time?.split('T')[0];
          if (eventDateStr) {
            if (startDate && eventDateStr < startDate) {
              return false;
            }
            if (endDate && eventDateStr > endDate) {
              return false;
            }
          }
        }

        // 3. Status
        if (selectedStatus !== 'all' && event.status !== selectedStatus) {
          return false;
        }

        // 4. Urgency Level
        if (selectedUrgency !== 'all') {
          const severity =
            event.threat_severity ||
            (event.threat_level >= 70
              ? 'high'
              : event.threat_level >= 40
              ? 'medium'
              : 'low');
          if (severity !== selectedUrgency) {
            return false;
          }
        }

        // 5. Event Type
        if (selectedEventType !== 'all' && event.event_type !== selectedEventType) {
          return false;
        }

        return true;
      });

      return {
        ...sector,
        events: filteredEvents,
      };
    });
  }, [
    sectors,
    searchQuery,
    startDate,
    endDate,
    selectedStatus,
    selectedUrgency,
    selectedEventType,
  ]);

  const totalFilteredCount = useMemo(
    () => filteredSectors.reduce((acc, s) => acc + s.events.length, 0),
    [filteredSectors]
  );

  const totalEventsCount = useMemo(
    () => sectors.reduce((acc, s) => acc + s.events.length, 0),
    [sectors]
  );

  // Notify parent if callback provided
  useEffect(() => {
    if (onFilteredEventsChange) {
      const allFiltered = filteredSectors.flatMap((s) => s.events);
      onFilteredEventsChange(allFiltered);
    }
  }, [filteredSectors, onFilteredEventsChange]);

  return (
    <aside
      className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-y-auto"
      dir="rtl"
    >
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">אירועים</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {hasActiveFilters ? `${totalFilteredCount} / ${totalEventsCount}` : totalEventsCount}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            איפוס סינונים
          </button>
        )}
      </div>

      {/* Search Bar & Filter Toggle Area */}
      <div className="mb-3.5">
        <div className="flex items-center gap-2">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי כותרת, מיקום, תיאור או מזהה"
              className="h-10 w-full pr-9 pl-8 text-xs bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-colors text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                title="נקה חיפוש"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            aria-expanded={isFilterOpen}
            title={isFilterOpen ? 'הסתר סינון מתקדם' : 'הצג סינון מתקדם'}
            className={`relative h-10 w-10 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isFilterOpen
                ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-xs'
                : hasSecondaryFilters
                ? 'bg-blue-50/60 border-blue-200 text-blue-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {/* Filter Toggle Icon: Three horizontal lines with plus sign */}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="14" y2="12" />
              <line x1="3" y1="18" x2="11" y2="18" />
              <line x1="18" y1="15" x2="18" y2="21" />
              <line x1="15" y1="18" x2="21" y2="18" />
            </svg>

            {/* Active secondary filters dot indicator */}
            {hasSecondaryFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFilterOpen
              ? 'max-h-[460px] opacity-100 mt-3 pt-3 border-t border-slate-100'
              : 'max-h-0 opacity-0 pointer-events-none mt-0 pt-0'
          }`}
        >
          <div className="space-y-3">
            {/* Date Range: מתאריך / עד תאריך */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>מתאריך</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full text-xs px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>עד תאריך</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full text-xs px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
                />
              </div>
            </div>

            {/* Status & Urgency Level */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* סטטוס */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  סטטוס
                </label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-10 w-full text-xs pr-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">הכול</option>
                    <option value="open">פתוח</option>
                    <option value="in_progress">בטיפול</option>
                    <option value="closed">סגור</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* רמת דחיפות */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  רמת דחיפות
                </label>
                <div className="relative">
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="h-10 w-full text-xs pr-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">הכול</option>
                    <option value="high">גבוהה</option>
                    <option value="medium">בינונית</option>
                    <option value="low">נמוכה</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Event Type: סוג אירוע */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                סוג אירוע
              </label>
              <div className="relative">
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="h-10 w-full text-xs pr-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">הכול</option>
                  {availableEventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Secondary Filters Reset / Counter Row */}
            {hasSecondaryFilters && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                <span className="text-[11px] text-slate-400 font-medium">
                  {secondaryFiltersCount} מסננים מופעלים
                </span>
                <button
                  type="button"
                  onClick={resetSecondaryFilters}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>איפוס שדות סינון</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sectors & Events List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {totalFilteredCount === 0 ? (
          <div className="py-10 text-center px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 mt-2">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">לא נמצאו אירועים מתאימים</p>
            <p className="text-xs text-slate-400 mt-1">
              נסה לשנות את החיפוש או לאפס את הסינונים
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                איפוס כל המסננים
              </button>
            )}
          </div>
        ) : (
          filteredSectors
            .filter((sector) => sector.events.length > 0)
            .map((sector) => (
              <SectorAccordion
                key={sector.sector_id}
                sector={sector}
                defaultExpanded={true}
              />
            ))
        )}
      </div>
    </aside>
  );
};
