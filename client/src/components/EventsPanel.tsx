import React, { useEffect, useState, useRef } from 'react';
import type { SectorGroup, EventItem } from '../types/event';
import { SectorAccordion } from './SectorAccordion';

interface EventsPanelProps {
  sectors: SectorGroup[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: EventItem) => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({
  sectors,
  selectedEventId,
  onSelectEvent,
}) => {
  const allVisibleEvents = sectors.flatMap((sector) => sector.events);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(
    selectedEventId ?? (allVisibleEvents[0]?.event_id ?? null)
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Sync focusedEventId when selectedEventId changes externally
  useEffect(() => {
    if (selectedEventId) {
      setFocusedEventId(selectedEventId);
    }
  }, [selectedEventId]);

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
    <aside className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-hidden" dir="rtl">
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-slate-800">אירועים</h2>
        <div
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5 select-none"
          title="ניווט באמצעות חיצים ו-Enter"
        >
          <span>ניווט:</span>
          <kbd className="px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↑</kbd>
          <kbd className="px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↓</kbd>
          <span className="text-slate-300 mx-0.5">•</span>
          <kbd className="px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px]">Enter</kbd>
        </div>
      </div>

      {/* Sectors & Events List */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 pl-1 custom-scrollbar">
        {sectors.map((sector) => (
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
        ))}
      </div>
    </aside>
  );
};
