import React, { useState } from 'react';
import { ChevronDown, RotateCw, Sparkles } from 'lucide-react';
import type { EventAnalysis, Insight, SimilarEvent } from '../api/eventAnalysis';
import type { EventAnalysisState } from '../hooks/useEventAnalysis';
import type { EventItem, EventStatus } from '../types/event';

const STATUS_LABELS: Record<EventStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  closed: 'סגור',
};

const SEVERITY_PILL: Record<NonNullable<EventItem['threat_severity']>, [string, string]> = {
  high: [
    'bg-[#fff0f3] text-rose-600 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
    'bg-rose-600 dark:bg-rose-500',
  ],
  medium: [
    'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    'bg-amber-500',
  ],
  low: [
    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
    'bg-emerald-500',
  ],
};

const INSIGHT_GROUPS: { key: keyof EventAnalysis['insights']; title: string }[] = [
  { key: 'patterns', title: 'דפוסים שזוהו' },
  { key: 'lessons', title: 'מסקנות מהעבר' },
  { key: 'recommendations', title: 'המלצות לטיפול' },
];

const chip =
  'inline-flex items-center h-[18px] px-1.5 rounded text-[10.5px] border whitespace-nowrap';

function casualties(injured: number | null, dead: number | null): string {
  if (injured === null && dead === null) return 'לא ידוע';
  return `פצועים ${injured ?? '—'} · הרוגים ${dead ?? '—'}`;
}

function windowTitle(days: number): string {
  return days === 7 ? 'אירועים דומים מהשבוע האחרון' : `אירועים דומים מ-${days} הימים האחרונים`;
}

interface SimilarEventsTabButtonProps {
  active: boolean;
  onClick: () => void;
  state: EventAnalysisState;
}

/** The "אירועים דומים" tab, styled like the other EventDetails tabs. */
export const SimilarEventsTabButton: React.FC<SimilarEventsTabButtonProps> = ({
  active,
  onClick,
  state,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer ${
      active
        ? 'text-black font-bold border-b-2 border-black -mb-[1px] dark:text-white dark:border-white'
        : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
    }`}
  >
    <span>אירועים דומים</span>
    {state.status === 'loading' && (
      <span
        className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"
        aria-label="הניתוח בטעינה"
      />
    )}
    {state.status === 'ready' && (
      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono font-medium dark:bg-slate-800 dark:text-slate-300">
        {state.analysis.similar_events.length}
      </span>
    )}
  </button>
);

const SimilarEventCard: React.FC<{
  similar: SimilarEvent;
  open: boolean;
  onToggle: () => void;
}> = ({ similar, open, onToggle }) => {
  const { event, match, reasons } = similar;
  const [pill, dot] = SEVERITY_PILL[event.threat_severity ?? 'low'];
  const details = [
    { k: 'מספר אירוע', v: event.event_id },
    { k: 'סטטוס', v: STATUS_LABELS[event.status] },
    { k: 'נפגעים – צד כחול', v: casualties(event.blue_injured_count, event.blue_death_count) },
    { k: 'נפגעים – צד אדום', v: casualties(event.red_injured_count, event.red_death_count) },
    { k: 'רמת איום', v: `${event.threat_level}/100` },
    { k: 'כוחות שהוזנקו', v: String(event.deployed_forces) },
  ];

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden dark:bg-slate-900 ${
        open
          ? 'border-slate-300 shadow-sm dark:border-slate-600'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${event.title} – ${open ? 'כיווץ פרטים' : 'הרחבת פרטים'}`}
        className="w-full flex flex-col gap-1.5 px-3 py-2.5 text-right cursor-pointer hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-slate-800/60"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-black dark:text-white">
            {event.title}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[11px] font-semibold border whitespace-nowrap ${pill}`}
          >
            <span>{event.threat_label}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{event.sector_description || event.sector}</span>
          {!!event.categories?.length && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{event.categories.join(' + ')}</span>
            </>
          )}
          <span className="w-[3px] h-[3px] rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="font-mono">{event.time_display}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <span
            className={`${chip} font-semibold ${
              match === 'high'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900/60'
                : 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/60'
            }`}
          >
            {match === 'high' ? 'התאמה גבוהה' : 'התאמה בינונית'}
          </span>
          {reasons.map((reason) => (
            <span
              key={reason}
              className={`${chip} text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700`}
            >
              {reason}
            </span>
          ))}
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-2.5 px-3 pt-0.5 pb-3 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <h4 className="mt-2 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
              תיאור מלא
            </h4>
            <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
              {event.description || 'לא תועד תיאור'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {details.map(({ k, v }) => (
              <div key={k} className="flex flex-col min-w-0">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{k}</span>
                <b className="text-xs font-medium text-black truncate dark:text-white">{v}</b>
              </div>
            ))}
          </div>
          {event.notes && (
            <div>
              <h4 className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">הערות</h4>
              <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                {event.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InsightList: React.FC<{ title: string; items: Insight[] }> = ({ title, items }) => (
  <div className="flex flex-col gap-1">
    <h4 className="text-xs font-semibold text-black dark:text-white">{title}</h4>
    <ul className="list-disc ps-4 flex flex-col gap-1.5 marker:text-violet-500 dark:marker:text-violet-400">
      {items.map((item) => (
        <li key={item.text} className="text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
          <span>{item.text}</span>
          {item.based_on.length > 0 && (
            <span className="block mt-px text-[11px] text-slate-400 dark:text-slate-500">
              מבוסס על: {item.based_on.join(' · ')}
            </span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

interface SimilarEventsTabProps {
  state: EventAnalysisState;
  onRetry: () => void;
}

/** Content of the "אירועים דומים" tab: similar events and AI insights. */
export const SimilarEventsTab: React.FC<SimilarEventsTabProps> = ({ state, onRetry }) => {
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  if (state.status === 'loading') {
    return (
      <div className="flex flex-col gap-2 py-1" role="status" aria-live="polite">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          מאתר אירועים דומים ומנתח את הטיפול בהם…
        </span>
        <div className="h-[46px] rounded-lg bg-slate-100 animate-pulse dark:bg-slate-800" />
        <div className="h-[46px] rounded-lg bg-slate-100 animate-pulse dark:bg-slate-800" />
        <div className="h-[90px] rounded-lg bg-slate-100 animate-pulse dark:bg-slate-800" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
        <span className="text-[13px] text-slate-700 dark:text-slate-300">
          לא ניתן היה לטעון את ניתוח האירועים הדומים: {state.error}
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-300 bg-white text-black cursor-pointer hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
        >
          <RotateCw size={12} aria-hidden="true" />
          ניסיון חוזר
        </button>
      </div>
    );
  }

  const { similar_events, insights, window_days } = state.analysis;

  return (
    <section aria-label="אירועים דומים" className="flex flex-col gap-2.5">
      <h3 className="text-[13px] font-semibold text-black dark:text-white">{windowTitle(window_days)}</h3>

      {similar_events.length === 0 ? (
        <span className="text-xs italic text-slate-400 dark:text-slate-500">
          לא נמצאו אירועים דומים
        </span>
      ) : (
        similar_events.map((similar) => (
          <SimilarEventCard
            key={similar.event.event_id}
            similar={similar}
            open={openCardId === similar.event.event_id}
            onToggle={() =>
              setOpenCardId((id) => (id === similar.event.event_id ? null : similar.event.event_id))
            }
          />
        ))
      )}

      <section
        aria-label="תובנות והמלצות לטיפול"
        className="flex flex-col gap-2.5 p-3 rounded-lg border border-violet-200 bg-linear-to-b from-violet-50 to-white to-70% dark:border-violet-900/60 dark:from-violet-950/40 dark:to-slate-900"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="shrink-0 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          <h3 className="text-[13px] font-semibold text-black dark:text-white">תובנות והמלצות לטיפול</h3>
        </div>
        {INSIGHT_GROUPS.map(({ key, title }) =>
          insights[key].length > 0 ? <InsightList key={key} title={title} items={insights[key]} /> : null,
        )}
        <div className="pt-2 border-t border-dashed border-violet-200 text-[11px] leading-normal text-slate-500 dark:border-violet-900/60 dark:text-slate-400">
          התובנות וההמלצות נוצרו אוטומטית מתוך המידע המתועד במערכת בלבד, ואינן מחליפות הערכת מצב ושיקול
          דעת מבצעי. עובדות היסטוריות מוצגות בכרטיסים שלמעלה.
        </div>
      </section>
    </section>
  );
};
