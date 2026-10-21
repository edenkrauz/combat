import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import type { SectorGroup, EventItem } from '../types/event';
import { SectorAccordion } from './SectorAccordion';

interface EventsPanelProps {
  sectors: SectorGroup[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: EventItem) => void;
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
  selectedEventId,
  onSelectEvent,
  onFilteredEventsChange,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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
    selectedStatus !== 'all' ||
    selectedUrgency !== 'all' ||
    selectedEventType !== 'all';

  const hasActiveFilters = searchQuery.trim().length > 0 || hasSecondaryFilters;

  // Reset secondary filters only
  const resetSecondaryFilters = () => {
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

        // 2. Status
        if (selectedStatus !== 'all') {
          if (event.status !== selectedStatus) {
            return false;
          }
        }

        // 3. Urgency Level
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

        // 4. Event Type
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
    selectedStatus,
    selectedUrgency,
    selectedEventType,
  ]);

  const allVisibleEvents = useMemo(
    () => filteredSectors.flatMap((sector) => sector.events),
    [filteredSectors]
  );

  const [focusedEventId, setFocusedEventId] = useState<string | null>(
    selectedEventId ?? (allVisibleEvents[0]?.event_id ?? null)
  );

  const totalFilteredCount = allVisibleEvents.length;
  const totalEventsCount = useMemo(
    () => sectors.reduce((acc, s) => acc + s.events.length, 0),
    [sectors]
  );

  // Notify parent if callback provided
  useEffect(() => {
    if (onFilteredEventsChange) {
      onFilteredEventsChange(allVisibleEvents);
    }
  }, [allVisibleEvents, onFilteredEventsChange]);

  // Sync focusedEventId when selectedEventId changes externally
  useEffect(() => {
    if (selectedEventId) {
      setFocusedEventId(selectedEventId);
    }
  }, [selectedEventId]);

  // Ensure focusedEventId is still valid when filtered events change
  useEffect(() => {
    if (allVisibleEvents.length > 0) {
      const stillVisible = allVisibleEvents.some((e) => e.event_id === focusedEventId);
      if (!stillVisible) {
        setFocusedEventId(allVisibleEvents[0].event_id);
      }
    } else {
      setFocusedEventId(null);
    }
  }, [allVisibleEvents, focusedEventId]);

  // Auto-scroll focused card inside container view
  useEffect(() => {
    if (!focusedEventId) return;
    const cardEl = document.getElementById(`event-card-${focusedEventId}`);
    const container = scrollContainerRef.current;
    if (cardEl && container) {
      cardEl.focus({ preventScroll: true });

      const containerRect = container.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();

      if (cardRect.top < containerRect.top) {
        container.scrollTo({
          top: container.scrollTop - (containerRect.top - cardRect.top) - 10,
          behavior: 'smooth',
        });
      } else if (cardRect.bottom > containerRect.bottom) {
        container.scrollTo({
          top: container.scrollTop + (cardRect.bottom - containerRect.bottom) + 10,
          behavior: 'smooth',
        });
      }
    }
  }, [focusedEventId]);

  // Global keyboard navigation: ArrowUp/ArrowDown, Enter, Escape, Home, End
  useEffect(() => {
    const isTextInput = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (tag === 'INPUT') {
        const inputType = (el as HTMLInputElement).type;
        return inputType !== 'checkbox' && inputType !== 'radio' && inputType !== 'button';
      }
      return false;
    };

    const isModalOpen = (): boolean => {
      try {
        return Boolean(document.querySelector('[role="dialog"], .backdrop-blur-sm'));
      } catch {
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Never intercept when typing inside text inputs, textareas, or selects
      const target = e.target as HTMLElement | null;
      if (isTextInput(target)) {
        return;
      }

      // 2. Ignore if a modal dialog is open
      if (isModalOpen()) {
        return;
      }

      // 3. Escape: Close event details panel if open
      if (e.key === 'Escape') {
        if (selectedEventId) {
          e.preventDefault();
          const current = allVisibleEvents.find((item) => item.event_id === selectedEventId);
          if (current) {
            onSelectEvent?.(current);
          }
          return;
        }
      }

      // When event details panel is open, allow it to handle its own navigation
      if (selectedEventId) {
        return;
      }

      // 4. Arrow navigation (ArrowDown / ArrowUp) on events list
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (allVisibleEvents.length === 0) return;
        e.preventDefault();

        const currentActiveId = focusedEventId;
        const currentIndex = allVisibleEvents.findIndex(
          (item) => item.event_id === currentActiveId
        );

        let nextIndex = 0;
        if (currentIndex === -1) {
          nextIndex = e.key === 'ArrowDown' ? 0 : allVisibleEvents.length - 1;
        } else {
          if (e.key === 'ArrowDown') {
            nextIndex = Math.min(currentIndex + 1, allVisibleEvents.length - 1);
          } else {
            nextIndex = Math.max(currentIndex - 1, 0);
          }
        }

        const nextEvent = allVisibleEvents[nextIndex];
        if (nextEvent) {
          setFocusedEventId(nextEvent.event_id);
        }
        return;
      }

      // 5. Enter: Open / Select the focused event
      if (e.key === 'Enter') {
        const currentActiveId = focusedEventId;
        const currentEvent = allVisibleEvents.find((item) => item.event_id === currentActiveId);
        if (currentEvent) {
          e.preventDefault();
          onSelectEvent?.(currentEvent);
        }
        return;
      }

      // 6. Home / End: Quick jump to first / last event
      if (e.key === 'Home') {
        if (allVisibleEvents.length === 0) return;
        e.preventDefault();
        const first = allVisibleEvents[0];
        if (first) {
          setFocusedEventId(first.event_id);
        }
        return;
      }

      if (e.key === 'End') {
        if (allVisibleEvents.length === 0) return;
        e.preventDefault();
        const last = allVisibleEvents[allVisibleEvents.length - 1];
        if (last) {
          setFocusedEventId(last.event_id);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allVisibleEvents, focusedEventId, selectedEventId, onSelectEvent]);

  return (
    <aside
      className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-hidden dark:bg-slate-900/95 dark:border-slate-800"
      dir="rtl"
    >
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between shrink-0 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">אירועים</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {hasActiveFilters
              ? `${totalFilteredCount} / ${totalEventsCount}`
              : totalEventsCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors dark:text-blue-400 dark:hover:text-blue-300"
            >
              איפוס סינונים
            </button>
          )}

          <div
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5 select-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            title="ניווט באמצעות חיצים ו-Enter"
          >
            <span>ניווט:</span>
            <kbd className="px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">↑</kbd>
            <kbd className="px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">↓</kbd>
            <span className="text-slate-300 mx-0.5 dark:text-slate-600">•</span>
            <kbd className="px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">Enter</kbd>
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Toggle Area */}
      <div className="mb-3.5 shrink-0">
        <div className="flex items-center gap-2">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי כותרת, מיקום, תיאור או מזהה"
              className="h-10 w-full pr-9 pl-8 text-xs bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-colors text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700"
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
                ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-xs dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-400'
                : hasSecondaryFilters
                ? 'bg-blue-50/60 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
            }`}
          >
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

            {hasSecondaryFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFilterOpen
              ? 'max-h-[300px] opacity-100 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800'
              : 'max-h-0 opacity-0 pointer-events-none mt-0 pt-0'
          }`}
        >
          <div className="space-y-3">
            {/* Status & Urgency Level */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* סטטוס */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                  סטטוס
                </label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-10 w-full text-xs pr-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                  >
                    <option value="all">הכול</option>
                    <option value="open">פתוח</option>
                    <option value="in_progress">בטיפול</option>
                    <option value="closed">סגור</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none dark:text-slate-500" />
                </div>
              </div>

              {/* רמת דחיפות */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                  רמת דחיפות
                </label>
                <div className="relative">
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="h-10 w-full text-xs pr-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                  >
                    <option value="all">הכול</option>
                    <option value="high">סיכון גבוה</option>
                    <option value="medium">סיכון בינוני</option>
                    <option value="low">סיכון נמוך</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none dark:text-slate-500" />
                </div>
              </div>
            </div>

            {/* סוג אירוע */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 dark:text-slate-300">
                סוג אירוע
              </label>
              <div className="relative">
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="h-10 w-full text-xs pr-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                >
                  <option value="all">כל הסוגים</option>
                  {availableEventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none dark:text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sectors & Events List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 pl-1 custom-scrollbar"
      >
        {totalFilteredCount === 0 ? (
          <div className="py-10 text-center px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 mt-2 dark:bg-slate-800/40 dark:border-slate-700/60">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 dark:bg-slate-800 dark:text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">לא נמצאו אירועים מתאימים</p>
            <p className="text-xs text-slate-400 mt-1">
              נסה לשנות את החיפוש או לאפס את הסינונים
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900/60"
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
                selectedEventId={selectedEventId}
                focusedEventId={focusedEventId}
                onSelectEvent={(event) => {
                  setFocusedEventId(event.event_id);
                  onSelectEvent?.(event);
                }}
                onFocusEvent={(event) => {
                  setFocusedEventId(event.event_id);
                }}
              />
            ))
        )}
      </div>
    </aside>
  );
};
