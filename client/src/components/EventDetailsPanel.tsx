import React, { useEffect, useState, useRef } from 'react';
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
  onTaskNoteSave: (taskId: string, note: string) => void;
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
  onTaskNoteSave,
  onCloseEvent,
}) => {
  const [activeTab, setActiveTab] = useState<EventDetailTab>('tasks');
  const [now, setNow] = useState(() => Date.now());
  const [editingNotes, setEditingNotes] = useState<Record<string, boolean>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number>(-1);
  const taskContainerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const TABS: EventDetailTab[] = ['details', 'tasks', 'history'];
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

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    setFocusedTaskIndex(-1);
  }, [event.event_id]);

    const [isCloseFocused, setIsCloseFocused] = useState<boolean>(false);
  const isCloseFocusedRef = useRef(isCloseFocused);
  isCloseFocusedRef.current = isCloseFocused;

  const canCloseEventRef = useRef(canCloseEvent);
  canCloseEventRef.current = canCloseEvent;

  const onCloseEventRef = useRef(onCloseEvent);
  onCloseEventRef.current = onCloseEvent;

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!canCloseEvent && isCloseFocused) {
      setIsCloseFocused(false);
    }
  }, [canCloseEvent, isCloseFocused]);

  // Keep mutable refs for keyboard listener to prevent stale closures
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const focusedTaskIndexRef = useRef(focusedTaskIndex);
  focusedTaskIndexRef.current = focusedTaskIndex;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const statusRef = useRef(status);
  statusRef.current = status;
  const onToggleTaskRef = useRef(onToggleTask);
  onToggleTaskRef.current = onToggleTask;

  // Auto-scroll and focus task inside the container
  useEffect(() => {
    if (activeTab !== 'tasks' || tasks.length === 0 || focusedTaskIndex < 0) return;
    const task = tasks[focusedTaskIndex];
    if (!task) return;
    const taskEl = document.getElementById(`event-task-${task.id}`);
    const container = taskContainerRef.current;
    if (taskEl) {
      taskEl.focus({ preventScroll: true });
    }
    if (taskEl && container) {
      const containerRect = container.getBoundingClientRect();
      const taskRect = taskEl.getBoundingClientRect();

      if (taskRect.top < containerRect.top) {
        container.scrollTo({
          top: container.scrollTop - (containerRect.top - taskRect.top) - 10,
          behavior: 'smooth',
        });
      } else if (taskRect.bottom > containerRect.bottom) {
        container.scrollTo({
          top: container.scrollTop + (taskRect.bottom - containerRect.bottom) + 10,
          behavior: 'smooth',
        });
      }
    }
  }, [focusedTaskIndex, activeTab, tasks]);

  // Keyboard navigation for tabs, tasks, and close event button
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
      // 1. Ignore if typing in text inputs or textareas (e.g. task notes)
      const target = e.target as HTMLElement | null;
      if (isTextInput(target)) {
        return;
      }

      // 2. Ignore if any modal dialog is open
      if (isModalOpen()) {
        return;
      }

      const currentTab = activeTabRef.current;
      const currentTasks = tasksRef.current;
      const currentIndex = focusedTaskIndexRef.current;
      const currentStatus = statusRef.current;
      const closeFocused = isCloseFocusedRef.current;
      const canClose = canCloseEventRef.current;

      // Handling when focus is on "סגירת אירוע" button
      if (closeFocused) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (canClose) {
            onCloseEventRef.current();
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setIsCloseFocused(false);
          panelRef.current?.focus({ preventScroll: true });
          return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setIsCloseFocused(false);
          const tabIndex = TABS.indexOf(currentTab);
          const nextIndex =
            e.key === 'ArrowLeft'
              ? Math.min(tabIndex + 1, TABS.length - 1)
              : Math.max(tabIndex - 1, 0);
          const nextTab = TABS[nextIndex];
          activeTabRef.current = nextTab;
          setActiveTab(nextTab);
          focusedTaskIndexRef.current = -1;
          setFocusedTaskIndex(-1);
          return;
        }
        return;
      }

      // 3. ArrowLeft / ArrowRight: Move between tabs (subtitles) in RTL
      // In RTL: details (0, right), tasks (1, middle), history (2, left)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const tabIndex = TABS.indexOf(currentTab);
        const nextIndex = Math.min(tabIndex + 1, TABS.length - 1);
        const nextTab = TABS[nextIndex];
        activeTabRef.current = nextTab;
        setActiveTab(nextTab);
        focusedTaskIndexRef.current = -1;
        setFocusedTaskIndex(-1);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const tabIndex = TABS.indexOf(currentTab);
        const prevIndex = Math.max(tabIndex - 1, 0);
        const prevTab = TABS[prevIndex];
        activeTabRef.current = prevTab;
        setActiveTab(prevTab);
        focusedTaskIndexRef.current = -1;
        setFocusedTaskIndex(-1);
        return;
      }

      // 4. ArrowUp: Move up
      // From subtitles (currentIndex === -1), if all tasks done (canClose), go up to "סגירת אירוע" button!
      if (e.key === 'ArrowUp') {
        if (currentIndex === -1 && canClose) {
          e.preventDefault();
          setIsCloseFocused(true);
          closeButtonRef.current?.focus({ preventScroll: true });
          return;
        }

        if (currentTab === 'tasks' && currentTasks.length > 0 && currentIndex >= 0) {
          e.preventDefault();
          const prevIdx = currentIndex - 1;
          focusedTaskIndexRef.current = prevIdx;
          setFocusedTaskIndex(prevIdx);
          return;
        }
      }

      // 5. ArrowDown: Move inside active tab's items (tasks)
      if (e.key === 'ArrowDown') {
        if (currentTab === 'tasks' && currentTasks.length > 0) {
          e.preventDefault();
          const nextIdx = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, currentTasks.length - 1);
          focusedTaskIndexRef.current = nextIdx;
          setFocusedTaskIndex(nextIdx);
          return;
        }
      }

      // 6. Enter or Space: Toggle focused task (check/uncheck)
      if (e.key === 'Enter' || e.key === ' ') {
        if (currentTab === 'tasks' && currentTasks.length > 0 && currentIndex >= 0 && currentStatus !== 'closed') {
          const currentTask = currentTasks[currentIndex];
          if (currentTask) {
            e.preventDefault();
            onToggleTaskRef.current(currentTask.id);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section ref={panelRef} tabIndex={-1} className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs focus:outline-none">
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
          <div className={`mt-3 rounded-xl border p-3 transition-all duration-150 ${
            isCloseFocused
              ? 'border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-400/40 shadow-sm'
              : 'border-slate-200 bg-slate-50'
          }`}>
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
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onCloseEvent}
                  onFocus={() => {
                    if (canCloseEvent) {
                      isCloseFocusedRef.current = true;
                      setIsCloseFocused(true);
                    }
                  }}
                  onBlur={() => {
                    isCloseFocusedRef.current = false;
                    setIsCloseFocused(false);
                  }}
                  disabled={!canCloseEvent}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-150 focus:outline-none ${
                    isCloseFocused
                      ? 'bg-emerald-800 ring-4 ring-emerald-500 ring-offset-2 ring-offset-white shadow-xl scale-[1.03]'
                      : canCloseEvent
                      ? 'bg-emerald-700 hover:bg-emerald-800 hover:shadow-md'
                      : 'cursor-not-allowed bg-emerald-700/40'
                  }`}
                >
                  <Check className={`h-4 w-4 ${isCloseFocused ? 'stroke-[3]' : ''}`} />
                  <span>סגירת אירוע</span>
                  {canCloseEvent && (
                    <kbd
                      className={`ms-1.5 inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-bold transition shadow-xs ${
                        isCloseFocused
                          ? 'bg-white text-emerald-900 border border-emerald-300'
                          : 'bg-emerald-800/80 text-emerald-100 border border-emerald-600/50'
                      }`}
                    >
                      Enter ↵
                    </kbd>
                  )}
                </button>
                {isCloseFocused && (
                  <span className="text-xs font-bold text-emerald-700 animate-pulse select-none">
                    ◄ לחץ Enter לסגירת האירוע
                  </span>
                )}
              </div>
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

      <nav className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3" aria-label="פרטי אירוע">
        <div className="flex items-center">
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
              className={`border-b-2 px-3 py-3 text-sm font-semibold transition cursor-pointer ${
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
        </div>

        {/* Keyboard shortcut hint for tabs & missions */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 select-none ps-2" title="ניווט בלשוניות: ← → · ניווט במשימות: ↑ ↓ · סימון: Enter">
          <span>לשוניות:</span>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">←</kbd>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">→</kbd>
          <span className="text-slate-300 mx-0.5">•</span>
          <span>משימות:</span>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↑</kbd>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↓</kbd>
          <span className="text-slate-300 mx-0.5">•</span>
          <kbd className="px-1.5 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">Enter / רווח</kbd>
        </div>
      </nav>

      <div ref={taskContainerRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto bg-white p-4 custom-scrollbar">
        {activeTab === 'tasks' && (
          <>
            {!isHandling && (
              <p dir="rtl" className="flex w-full items-center justify-start gap-2 px-1 py-1 text-right text-sm text-slate-500">
                <LockKeyhole className="h-4 w-4" />
                <span>יש להתחיל טיפול כדי לבצע משימות</span>
              </p>
            )}
            {tasks.map((task, index) => {
              const isComplete = Boolean(completedTasks[task.id]);
              const isFocused = activeTab === 'tasks' && index === focusedTaskIndex;
              return (
                <article
                  key={task.id}
                  id={`event-task-${task.id}`}
                  tabIndex={-1}
                  onFocus={() => setFocusedTaskIndex(index)}
                  onClick={() => setFocusedTaskIndex(index)}
                  className={`rounded-xl border p-3.5 transition cursor-pointer focus:outline-none ${
                    isFocused
                      ? isComplete
                        ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/90 shadow-sm'
                        : 'border-blue-500 ring-2 ring-blue-500/80 bg-blue-50/30 shadow-sm'
                      : isComplete
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3 text-right">
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      checked={isComplete}
                      disabled={status === 'closed'}
                      onChange={() => onToggleTask(task.id)}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-700 disabled:cursor-not-allowed cursor-pointer"
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
                    <div className="mt-2.5 ps-8" dir="rtl">
                      {taskNotes[task.id] && !editingNotes[task.id] && (
                        <p className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-700">
                          <span className="font-semibold">הערה: </span>
                          <span className="whitespace-pre-wrap">{taskNotes[task.id]}</span>
                        </p>
                      )}
                      {editingNotes[task.id] && status !== 'closed' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={draftNotes[task.id] ?? ''}
                            onChange={(change) =>
                              setDraftNotes((previous) => ({
                                ...previous,
                                [task.id]: change.target.value,
                              }))
                            }
                            onKeyDown={(key) => {
                              if (key.key === 'Enter') {
                                key.preventDefault();
                                onTaskNoteSave(task.id, (draftNotes[task.id] ?? '').trim());
                                setEditingNotes((previous) => ({
                                  ...previous,
                                  [task.id]: false,
                                }));
                              }
                            }}
                            placeholder="הערת ביצוע"
                            aria-label={`הערת ביצוע למשימה: ${task.title}`}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onTaskNoteSave(task.id, (draftNotes[task.id] ?? '').trim());
                              setEditingNotes((previous) => ({
                                ...previous,
                                [task.id]: false,
                              }));
                            }}
                            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            שמירה
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingNotes((previous) => ({
                                ...previous,
                                [task.id]: false,
                              }))
                            }
                            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            ביטול
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDraftNotes((previous) => ({
                              ...previous,
                              [task.id]: taskNotes[task.id] ?? '',
                            }));
                            setEditingNotes((previous) => ({
                              ...previous,
                              [task.id]: true,
                            }));
                          }}
                          disabled={status === 'closed'}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-default disabled:text-slate-500"
                        >
                          {taskNotes[task.id] ? 'עריכת הערה' : 'הוספת הערת ביצוע'}
                        </button>
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
