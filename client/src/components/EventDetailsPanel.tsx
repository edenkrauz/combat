import React, { useEffect, useState } from 'react';
import { Check, Clock3, LockKeyhole, X } from 'lucide-react';
import type { EventItem, EventStatus } from '../types/event';

export interface EventTask {
  id: string;
  title: string;
}

type EventDetailTab = 'details' | 'tasks' | 'history';

interface EventDetailsPanelProps {
  event: EventItem;
  status: EventStatus;
  tasks: EventTask[];
  completedTasks: Record<string, boolean>;
  taskNotes: Record<string, string>;
  onClose: () => void;
  onStart: () => void;
  onToggleTask: (taskId: string) => void;
  onTaskNoteChange: (taskId: string, note: string) => void;
  onCloseEvent: () => void;
}

const STATUS_LABELS: Record<EventStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  closed: 'נסגר',
};

const STATUS_STYLES: Record<EventStatus, string> = {
  open: 'border-blue-200 bg-blue-50 text-blue-700',
  in_progress: 'border-violet-200 bg-violet-50 text-violet-700',
  closed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({
  event,
  status,
  tasks,
  completedTasks,
  taskNotes,
  onClose,
  onStart,
  onToggleTask,
  onTaskNoteChange,
  onCloseEvent,
}) => {
  const [activeTab, setActiveTab] = useState<EventDetailTab>('tasks');
  const [now, setNow] = useState(() => Date.now());
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const completedCount = tasks.filter((task) => completedTasks[task.id]).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const isHandling = status !== 'open';
  const canCloseEvent = status === 'in_progress' && completedCount === tasks.length;
  const eventStart = Date.parse(event.start_time);
  const elapsedSeconds = Number.isNaN(eventStart)
    ? null
    : Math.max(0, Math.floor((now - eventStart) / 1000));

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <header className="shrink-0 border-b border-slate-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-700">{event.event_id}</span>
              <span aria-hidden="true">•</span>
              <span className="truncate">{event.sector_description || event.sector}</span>
            </div>
            <h2 className="text-xl font-bold leading-tight text-slate-900">{event.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {STATUS_LABELS[status]}
              </span>
              {event.threat_label && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  {event.threat_label}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירת פרטי האירוע"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2" aria-label="התקדמות הטיפול באירוע">
          {(['open', 'in_progress', 'closed'] as const).map((step) => (
            <div key={step}>
              <div
                className={`h-1.5 rounded-full ${
                  status === step ||
                  (step === 'open' && status !== 'open') ||
                  (step === 'in_progress' && status === 'closed')
                    ? step === 'closed' && status === 'closed'
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                    : 'bg-slate-200'
                }`}
              />
              <p
                className={`mt-1 text-center text-xs ${
                  status === step ? 'font-bold text-slate-900' : 'text-slate-400'
                }`}
              >
                {STATUS_LABELS[step]}
              </p>
            </div>
          ))}

        </div>

        <div className="mt-3 flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 px-3 py-2.5">
          <span className="min-w-0 text-sm text-slate-600">
            זמן טיפול מצטבר מאז קליטת האירוע
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {elapsedSeconds !== null && elapsedSeconds >= 120 && (
              <span className="whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                מעל 2 דקות
              </span>
            )}
            <span className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-lg font-bold tabular-nums text-slate-900">
              <Clock3 className="h-4 w-4 text-slate-500" />
              {elapsedSeconds === null
                ? '--:--:--'
                : `${String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:${String(
                    Math.floor((elapsedSeconds % 3600) / 60),
                  ).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`}
            </span>
          </div>
        </div>

        {status === 'open' ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-slate-700">התחלת טיפול תאפשר ביצוע משימות וסגירת האירוע.</p>
            <button
              type="button"
              onClick={onStart}
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              התחלת טיפול
            </button>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-600">משימות שהושלמו</span>
              <span className="font-bold text-slate-900">
                {completedCount}/{tasks.length} • {progress}%
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="התקדמות משימות"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  progress === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {status === 'in_progress' && (
              <button
                type="button"
                onClick={onCloseEvent}
                disabled={!canCloseEvent}
                className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition ${
                  canCloseEvent
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'cursor-not-allowed bg-emerald-700/40'
                }`}
              >
                <Check className="h-4 w-4" />
                סגירת אירוע
              </button>
            )}
            {status === 'closed' && (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Check className="h-4 w-4" />
                האירוע טופל ונסגר
              </p>
            )}
          </div>
        )}
      </header>

      <nav className="flex shrink-0 items-center border-b border-slate-200 px-3" aria-label="פרטי אירוע">
        {([
          ['details', 'פרטים'],
          ['tasks', 'משימות'],
          ['history', 'טיפול ועדכונים'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
              activeTab === tab
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
            {tab === 'tasks' && (
              <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                {completedCount}/{tasks.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
        {activeTab === 'tasks' && (
          <>
            {!isHandling && (
              <p dir="rtl" className="flex w-full items-center justify-start gap-2 px-1 py-1 text-right text-sm text-slate-500">
                <LockKeyhole className="h-4 w-4" />
                <span>יש להתחיל טיפול כדי לבצע משימות</span>
              </p>
            )}
            {tasks.map((task) => {
              const isComplete = Boolean(completedTasks[task.id]);
              return (
                <article
                  key={task.id}
                  className={`rounded-xl border p-3.5 transition ${
                    isComplete
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3 text-right">
                    <input
                      type="checkbox"
                      checked={isComplete}
                      disabled={!isHandling || status === 'closed'}
                      onChange={() => onToggleTask(task.id)}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-700 disabled:cursor-not-allowed"
                    />
                    <span
                      className={`flex-1 text-sm font-semibold leading-relaxed ${
                        isComplete ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </span>
                  </label>
                  {isHandling && (
                    <div className="mt-2.5 ps-8">
                      {taskNotes[task.id] && !expandedNotes[task.id] && (
                        <p className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-700">
                          <span className="font-semibold">הערה: </span>
                          <span className="whitespace-pre-wrap">{taskNotes[task.id]}</span>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedNotes((previous) => ({
                            ...previous,
                            [task.id]: !previous[task.id],
                          }))
                        }
                        disabled={status === 'closed'}
                        aria-expanded={Boolean(expandedNotes[task.id])}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-default disabled:text-slate-500"
                      >
                        {expandedNotes[task.id]
                          ? 'ביטול עריכת הערה'
                          : taskNotes[task.id]
                            ? 'עריכת הערה'
                            : 'הוספת הערת ביצוע'}
                      </button>
                      {expandedNotes[task.id] && (
                        <textarea
                          value={taskNotes[task.id] ?? ''}
                          disabled={status === 'closed'}
                          onChange={(eventChange) =>
                            onTaskNoteChange(task.id, eventChange.target.value)
                          }
                          rows={2}
                          placeholder="כתיבת הערת ביצוע"
                          aria-label={`הערת ביצוע: ${task.title}`}
                          className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none disabled:bg-slate-50"
                        />
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </>
        )}

        {activeTab === 'details' && (
          <div className="space-y-3 text-right">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-900">תיאור האירוע</h3>
              <p className="text-sm leading-relaxed text-slate-600">{event.description}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-900">פרטי דיווח</h3>
              <p className="text-sm text-slate-600">{event.notes || 'לא נוספו פרטים נוספים'}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {event.time_display || event.start_time}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="rounded-xl border border-slate-200 p-4 text-right">
            <h3 className="mb-3 text-sm font-bold text-slate-900">עדכון אחרון</h3>
            <p className="text-sm text-slate-600">
              {status === 'open'
                ? 'האירוע ממתין לתחילת טיפול.'
                : status === 'in_progress'
                  ? 'הטיפול באירוע התחיל.'
                  : 'האירוע טופל ונסגר.'}
            </p>
            {event.notes && <p className="mt-2 text-sm text-slate-500">{event.notes}</p>}
          </div>
        )}
      </div>
    </section>
  );
};
