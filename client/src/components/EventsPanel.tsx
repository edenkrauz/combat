import React, { useState, useMemo } from 'react';
import { Search, Calendar, ChevronDown } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter events dynamically
  const filteredSectors = useMemo(() => {
    return sectors.map((sector) => {
      const filteredEvents = sector.events.filter((event) => {
        // Search term check
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = event.title.toLowerCase().includes(term);
          const matchDesc = event.description.toLowerCase().includes(term);
          const matchLoc = (event.sector_description || event.sector).toLowerCase().includes(term);
          const matchCode = (event.code || event.event_id).toLowerCase().includes(term);
          const matchNotes = (event.notes || '').toLowerCase().includes(term);
          if (!matchTitle && !matchDesc && !matchLoc && !matchCode && !matchNotes) {
            return false;
          }
        }

        // Status filter
        if (statusFilter !== 'all') {
          if (event.status !== statusFilter) return false;
        }

        // Urgency filter
        if (urgencyFilter !== 'all') {
          if (urgencyFilter === 'immediate') {
            if (event.urgency_label !== 'מיידי' && event.threat_level < 90) return false;
          } else if (urgencyFilter === 'high') {
            if (event.urgency_label !== 'גבוהה' && (event.threat_level < 70 || event.threat_level >= 90)) return false;
          } else if (urgencyFilter === 'medium') {
            if (event.urgency_label !== 'בינונית' && (event.threat_level < 40 || event.threat_level >= 70)) return false;
          } else if (urgencyFilter === 'low') {
            if (event.urgency_label !== 'נמוכה' && event.threat_level >= 40) return false;
          }
        }

        // Event Type filter
        if (typeFilter !== 'all') {
          const cats = (event.categories || []).join(' ');
          if (typeFilter === 'terror' && !cats.includes('פח"ע') && !event.event_type.includes('terror')) return false;
          if (typeFilter === 'rocket' && !cats.includes('תלול-מסלול') && !event.event_type.includes('rocket')) return false;
          if (typeFilter === 'riot' && !cats.includes('הפרות סדר') && !event.event_type.includes('riot')) return false;
        }

        return true;
      });

      return {
        ...sector,
        events: filteredEvents,
      };
    });
  }, [sectors, searchTerm, statusFilter, urgencyFilter, typeFilter]);

  return (
    <aside className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">אירועים</h2>
      </div>

      {/* 1. Search Box with Search Icon on Left per Figma */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="חיפוש לפי כותרת, מיקום, תיאור או מזהה"
          className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-black placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-right"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
      </div>

      {/* 2. Date Pickers Row with Calendar Icons on Left per Figma */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* From Date (right) */}
        <div>
          <label className="block text-[11px] text-slate-600 font-medium mb-1 text-right">
            מתאריך
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              placeholder="בחירה"
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none cursor-pointer text-right"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* To Date (left) */}
        <div>
          <label className="block text-[11px] text-slate-600 font-medium mb-1 text-right">
            עד תאריך
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              placeholder="בחירה"
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none cursor-pointer text-right"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Filters Dropdowns Row with Chevron on Left per Figma */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Status */}
        <div>
          <label className="block text-[11px] text-slate-600 font-medium mb-1 text-right">
            סטטוס
          </label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 pl-6 pr-2.5 appearance-none text-[11.5px] rounded-lg border border-slate-200 bg-white text-black font-medium focus:outline-none focus:border-blue-500 cursor-pointer text-right"
            >
              <option value="all">הכול</option>
              <option value="open">פתוח</option>
              <option value="in_progress">בטיפול</option>
              <option value="closed">נסגר</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-[11px] text-slate-600 font-medium mb-1 text-right">
            רמת דחיפות
          </label>
          <div className="relative">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full h-8 pl-6 pr-2.5 appearance-none text-[11.5px] rounded-lg border border-slate-200 bg-white text-black font-medium focus:outline-none focus:border-blue-500 cursor-pointer text-right"
            >
              <option value="all">הכול</option>
              <option value="immediate">מיידי</option>
              <option value="high">גבוהה</option>
              <option value="medium">בינונית</option>
              <option value="low">נמוכה</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-[11px] text-slate-600 font-medium mb-1 text-right">
            סוג אירוע
          </label>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-8 pl-6 pr-2.5 appearance-none text-[11.5px] rounded-lg border border-slate-200 bg-white text-black font-medium focus:outline-none focus:border-blue-500 cursor-pointer text-right"
            >
              <option value="all">הכול</option>
              <option value="terror">פח"ע</option>
              <option value="rocket">תלול-מסלול</option>
              <option value="riot">הפרות סדר</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. Sectors & Events List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {filteredSectors.map((sector) => (
          <SectorAccordion
            key={sector.sector_id}
            sector={sector}
            defaultExpanded={true}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
          />
        ))}

        {filteredSectors.every((s) => s.events.length === 0) && (
          <div className="py-8 text-center text-slate-400 text-xs">
            לא נמצאו אירועים התואמים את החיפוש
          </div>
        )}
      </div>
    </aside>
  );
};
