import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Pencil,
  AlertTriangle,
  Clock,
  Check,
} from 'lucide-react';
import {
  CHECKLIST_TASKS_UPDATED_EVENT,
  getTasksForCategories,
} from '../api/taskCategories';
import type { EventItem, EventStatus } from '../types/event';

interface EventDetailsProps {
  event: EventItem;
  onClose: () => void;
  onUpdateEvent?: (updatedEvent: EventItem) => void;
  onUpdateStatus?: (
    event: EventItem,
    status: EventStatus,
  ) => Promise<EventItem>;
}

type TabKey = 'details' | 'tasks' | 'updates' | 'history';

interface OperationalTask {
  id: string;
  text: string;
  completed: boolean;
}

interface UpdateEntry {
  id: string;
  time: string;
  author: string;
  text: string;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onClose,
  onUpdateEvent,
  onUpdateStatus,
}) => {
  // Editable event state
  const [currentEvent, setCurrentEvent] = useState<EventItem>(event);
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // If event is already in_progress, open on 'tasks'; if open, open ready for treatment
  const [activeTab, setActiveTab] = useState<TabKey>(
    event.status === 'in_progress' ? 'tasks' : 'details'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number>(
    event.status === 'in_progress' ? 0 : -1
  );
  const [isStartFocused, setIsStartFocused] = useState<boolean>(event.status === 'open');
  const [isCloseFocused, setIsCloseFocused] = useState<boolean>(false);

  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const eventCategoriesKey = JSON.stringify(event.categories ?? []);

  const TABS: TabKey[] = ['details', 'tasks', 'updates', 'history'];
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const focusedTaskIndexRef = useRef(focusedTaskIndex);
  focusedTaskIndexRef.current = focusedTaskIndex;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const allTasksComplete =
    !isTasksLoading &&
    !tasksError &&
    tasks.length > 0 &&
    tasks.every((task) => task.completed);
  const isStartFocusedRef = useRef(isStartFocused);
  isStartFocusedRef.current = isStartFocused;
  const isCloseFocusedRef = useRef(isCloseFocused);
  isCloseFocusedRef.current = isCloseFocused;
  const currentEventRef = useRef(currentEvent);
  currentEventRef.current = currentEvent;
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const updateTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recInputRef = useRef<HTMLInputElement | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [newRecommendationText, setNewRecommendationText] = useState('');

  // Updates state
  const [updatesText, setUpdatesText] = useState('');
  const [updatesList, setUpdatesList] = useState<UpdateEntry[]>([]);

  // Elapsed handling timer (ticking from 00:16:52 per Image 2)
  const [elapsedSeconds, setElapsedSeconds] = useState(16 * 60 + 52);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    let latestRequest = 0;
    const categories: string[] = JSON.parse(eventCategoriesKey);
    const loadTasks = (showLoading: boolean) => {
      const requestId = ++latestRequest;
      if (showLoading) setIsTasksLoading(true);
      setTasksError(null);

      getTasksForCategories(categories)
        .then((taskTexts) => {
          if (!isCurrentRequest || requestId !== latestRequest) return;
          const completedByTask = new Map(
            tasksRef.current.map((task) => [
              task.text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('he'),
              task.completed,
            ]),
          );
          setTasks(
            taskTexts.map((text, index) => ({
              id: `event-task-${event.reality_id}-${event.event_id}-${index}`,
              text,
              completed:
                completedByTask.get(
                  text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('he'),
                ) ?? false,
            })),
          );
        })
        .catch((error: unknown) => {
          if (isCurrentRequest && requestId === latestRequest) {
            setTasksError(
              error instanceof Error ? error.message : 'טעינת משימות האירוע נכשלה',
            );
          }
        })
        .finally(() => {
          if (isCurrentRequest && requestId === latestRequest) {
            setIsTasksLoading(false);
          }
        });
    };

    const handleChecklistTasksUpdated = () => loadTasks(false);
    window.addEventListener(CHECKLIST_TASKS_UPDATED_EVENT, handleChecklistTasksUpdated);
    loadTasks(true);

    return () => {
      isCurrentRequest = false;
      window.removeEventListener(
        CHECKLIST_TASKS_UPDATED_EVENT,
        handleChecklistTasksUpdated,
      );
    };
  }, [event.event_id, event.reality_id, eventCategoriesKey]);

  // Reset & focus appropriately when event_id changes
  useEffect(() => {
    setCurrentEvent(event);
    currentEventRef.current = event;
    if (event.status === 'open') {
      setIsStartFocused(true);
      isStartFocusedRef.current = true;
      setActiveTab('details');
      activeTabRef.current = 'details';
      setFocusedTaskIndex(-1);
      focusedTaskIndexRef.current = -1;
      startButtonRef.current?.focus({ preventScroll: true });
    } else {
      setIsStartFocused(false);
      isStartFocusedRef.current = false;
      setActiveTab('tasks');
      activeTabRef.current = 'tasks';
      setFocusedTaskIndex(0);
      focusedTaskIndexRef.current = 0;
    }
    setIsCloseFocused(false);
    isCloseFocusedRef.current = false;
  }, [event.event_id]);

  // Auto-scroll focused task into view
  useEffect(() => {
    if (activeTab !== 'tasks' || tasks.length === 0 || focusedTaskIndex < 0) return;
    const task = tasks[focusedTaskIndex];
    if (!task) return;
    const taskEl = document.getElementById(`detail-task-${task.id}`);
    if (taskEl) {
      taskEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedTaskIndex, activeTab, tasks]);

  // Keyboard navigation for subtitles (ArrowLeft/ArrowRight), missions (ArrowDown/ArrowUp, Enter), and buttons
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
      const target = e.target as HTMLElement | null;
      const isInput = isTextInput(target);
      if (isModalOpen()) return;

      const curTab = activeTabRef.current;
      const curTasks = tasksRef.current;
      const curTaskIdx = focusedTaskIndexRef.current;
      const startFocused = isStartFocusedRef.current;
      const closeFocused = isCloseFocusedRef.current;
      const curEvent = currentEventRef.current;
      const canClose =
        curEvent.status === 'in_progress' &&
        curTasks.length > 0 &&
        curTasks.every((t) => t.completed);

      // If user is typing in text inputs or textarea, let Escape return focus to subtitles
      if (isInput) {
        if (e.key === 'Escape') {
          e.preventDefault();
          target?.blur();
        }
        return;
      }

      // Escape: close details panel
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // 1. When focus is on "התחלת טיפול" (black button):
      if (startFocused) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartHandling();
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setIsStartFocused(false);
          isStartFocusedRef.current = false;
          return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setIsStartFocused(false);
          isStartFocusedRef.current = false;
          const tabIndex = TABS.indexOf(curTab);
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

      // 2. When focus is on "סגירת אירוע" (green button):
      if (closeFocused) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (canClose) {
            handleStatusChange('closed');
          }
          setIsCloseFocused(false);
          isCloseFocusedRef.current = false;
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setIsCloseFocused(false);
          isCloseFocusedRef.current = false;
          return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setIsCloseFocused(false);
          isCloseFocusedRef.current = false;
          const tabIndex = TABS.indexOf(curTab);
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

      // 3. ArrowLeft / ArrowRight: Subtitles (tabs) navigation in RTL
      // details (0, right), tasks (1), updates (2), history (3, left)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const tabIndex = TABS.indexOf(curTab);
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
        const tabIndex = TABS.indexOf(curTab);
        const prevIndex = Math.max(tabIndex - 1, 0);
        const prevTab = TABS[prevIndex];
        activeTabRef.current = prevTab;
        setActiveTab(prevTab);
        focusedTaskIndexRef.current = -1;
        setFocusedTaskIndex(-1);
        return;
      }

      // 4. ArrowUp:
      // If we are on subtitles level (curTaskIdx === -1):
      // - If status === 'open': go UP to "התחלת טיפול"!
      // - If status === 'in_progress' and canClose: go UP to "סגירת אירוע"!
      if (e.key === 'ArrowUp') {
        if (curTaskIdx === -1) {
          if (curEvent.status === 'open') {
            e.preventDefault();
            setIsStartFocused(true);
            isStartFocusedRef.current = true;
            startButtonRef.current?.focus({ preventScroll: true });
            return;
          }
          if (canClose) {
            e.preventDefault();
            setIsCloseFocused(true);
            isCloseFocusedRef.current = true;
            closeButtonRef.current?.focus({ preventScroll: true });
            return;
          }
        }

        if (curTab === 'tasks' && curTasks.length > 0 && curTaskIdx >= 0) {
          e.preventDefault();
          const prevIdx = curTaskIdx - 1;
          focusedTaskIndexRef.current = prevIdx;
          setFocusedTaskIndex(prevIdx);
          return;
        }
      }

      // 5. ArrowDown:
      // If on 'tasks': moves into tasks (index 0, 1, 2...)
      // If on 'updates': moves into textarea to write an update!
      if (e.key === 'ArrowDown') {
        if (curTab === 'tasks' && curTasks.length > 0) {
          e.preventDefault();
          const nextIdx = curTaskIdx < 0 ? 0 : Math.min(curTaskIdx + 1, curTasks.length - 1);
          focusedTaskIndexRef.current = nextIdx;
          setFocusedTaskIndex(nextIdx);
          return;
        }

        if (curTab === 'updates') {
          e.preventDefault();
          updateTextareaRef.current?.focus();
          return;
        }
      }

      // 6. Enter or Space:
      // If in 'tasks' tab and a task is focused: toggle task!
      // If status === 'open' and on subtitles: start treatment!
      if (e.key === 'Enter' || e.key === ' ') {
        if (curTab === 'tasks' && curTasks.length > 0 && curTaskIdx >= 0) {
          const curTask = curTasks[curTaskIdx];
          if (curTask) {
            e.preventDefault();
            handleToggleTask(curTask.id);
            return;
          }
        }

        if (curEvent.status === 'open' && curTaskIdx === -1) {
          e.preventDefault();
          handleStartHandling();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatElapsedTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Toggle task completed
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    if (currentEventRef.current.status === 'open') {
      handleStatusChange('in_progress');
    }
  };

  const completedTasksCount = tasks.filter((t) => t.completed).length;

  // Add recommendation
  const handleAddRecommendation = () => {
    if (!newRecommendationText.trim()) return;
    setRecommendations([...recommendations, newRecommendationText.trim()]);
    setNewRecommendationText('');
  };

  // Add update
  const handleAddUpdate = () => {
    if (!updatesText.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setUpdatesList([
      {
        id: `up-${Date.now()}`,
        time: timeStr,
        author: 'חמ"ל מבצעי',
        text: updatesText.trim(),
      },
      ...updatesList,
    ]);
    setUpdatesText('');
  };

  // Status transitions
  const handleStatusChange = async (newStatus: EventStatus): Promise<boolean> => {
    if (isStatusSaving) return false;
    if (newStatus === currentEvent.status) return true;

    setIsStatusSaving(true);
    setStatusError(null);
    try {
      const updated = onUpdateStatus
        ? await onUpdateStatus(currentEvent, newStatus)
        : { ...currentEvent, status: newStatus };
      currentEventRef.current = updated;
      setCurrentEvent(updated);
      onUpdateEvent?.(updated);
      return true;
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : 'עדכון סטטוס האירוע נכשל',
      );
      return false;
    } finally {
      setIsStatusSaving(false);
    }
  };

  const handleStartHandling = async () => {
    const updated = await handleStatusChange('in_progress');
    if (!updated) return;
    setIsStartFocused(false);
    isStartFocusedRef.current = false;
    setActiveTab('tasks');
    activeTabRef.current = 'tasks';
    setFocusedTaskIndex(0);
    focusedTaskIndexRef.current = 0;
  };

  // Edit form state
  const [editTitle, setEditTitle] = useState(currentEvent.title);
  const [editDesc, setEditDesc] = useState(currentEvent.description);
  const [editBlueInjured, setEditBlueInjured] = useState<number | ''>(
    currentEvent.blue_injured_count ?? ''
  );
  const [editBlueDead, setEditBlueDead] = useState<number | ''>(
    currentEvent.blue_death_count ?? ''
  );
  const [editInvolved, setEditInvolved] = useState<number | ''>(
    currentEvent.involved_count ?? 80
  );

  const handleSaveEdit = () => {
    const updated: EventItem = {
      ...currentEvent,
      title: editTitle,
      description: editDesc,
      blue_injured_count: editBlueInjured === '' ? null : Number(editBlueInjured),
      blue_death_count: editBlueDead === '' ? null : Number(editBlueDead),
      involved_count: editInvolved === '' ? 0 : Number(editInvolved),
      updated_at: new Date().toISOString(),
    };
    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    setIsEditing(false);
  };

  return (
    <section
      aria-label="פרטי אירוע"
      className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-y-auto text-right select-none animate-in fade-in duration-200"
      dir="rtl"
    >
      {statusError && (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          עדכון האירוע נכשל: {statusError}
        </p>
      )}
      {/* 1. TOP HEADER: Navigation & Code */}
      <div className="flex items-start justify-between gap-2 pb-2">
        {/* Right side: Code pill and breadcrumb hierarchy */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-black">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentEvent.code || currentEvent.event_id.toUpperCase()}</span>
            </span>
            <span className="text-[11.5px] text-black font-medium truncate">
              • {currentEvent.categories?.[0] || 'פח"ע'}
              {currentEvent.categories?.[1] ? ` • ${currentEvent.categories[1]}` : ''}
              {' • ישראל, '}
              {currentEvent.sector}
            </span>
          </div>
        </div>

        {/* Left side: Edit Button & Close Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-black transition cursor-pointer shadow-2xs"
            title="עריכת אירוע"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            <span>עריכת אירוע</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-black hover:text-black transition cursor-pointer shadow-2xs"
            title="סגירת תצוגה"
            aria-label="סגירה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN EVENT TITLE */}
      <h1 className="text-[18px] font-bold text-black leading-snug mt-1 mb-2.5">
        {currentEvent.title}
      </h1>

      {/* 3. BADGES ROW */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
        {/* Status Pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          {currentEvent.status === 'open'
            ? 'פתוח'
            : currentEvent.status === 'in_progress'
            ? 'בטיפול'
            : 'נסגר'}
        </span>

        {/* Urgency Pill - with red circle on the left */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff0f3] text-[#b91c1c] border border-rose-200">
          <span>{currentEvent.threat_label || 'דחיפות מיידי'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        </span>

        {/* Categories Pills */}
        {currentEvent.categories && currentEvent.categories.length > 0 ? (
          currentEvent.categories.map((cat, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-black border border-slate-200/60"
            >
              {idx === 0 ? `• ${cat}` : `+ ${cat}`}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-black">
            • פח"ע
          </span>
        )}
      </div>

      {/* 4. LIFECYCLE / STATUS PROGRESS TRACK (matching Image 2) */}
      <div className="mb-3.5">
        <div className="relative flex items-center justify-between pb-2">
          {/* Background track line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 rounded-full z-0" />

          {/* Active progress indicator line */}
          <div
            className="absolute top-0 right-0 h-1 bg-blue-600 rounded-full z-10 transition-all duration-300"
            style={{
              width:
                currentEvent.status === 'open'
                  ? '33.3%'
                  : currentEvent.status === 'in_progress'
                  ? '66.6%'
                  : '100%',
            }}
          />
        </div>

        {/* Stage Labels */}
        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <button
            type="button"
            onClick={() => handleStatusChange('open')}
            className={`font-semibold cursor-pointer transition ${
              currentEvent.status === 'open'
                ? 'text-black font-bold'
                : 'text-slate-400 hover:text-black'
            }`}
          >
            פתוח
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('in_progress')}
            className={`font-semibold cursor-pointer transition ${
              currentEvent.status === 'in_progress'
                ? 'text-black font-bold'
                : 'text-slate-400 hover:text-black'
            }`}
          >
            בטיפול
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('closed')}
            className={`font-semibold cursor-pointer transition ${
              currentEvent.status === 'closed'
                ? 'text-black font-bold'
                : 'text-slate-400 hover:text-black'
            }`}
          >
            נסגר
          </button>
        </div>
      </div>

      {/* 5. CUMULATIVE TIME BANNER (matching Image) */}
      <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 flex items-center justify-between shadow-2xs mb-3">
        {/* Right side: Clock icon + label + digital timer */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="text-xs text-slate-600 font-medium">
            זמן טיפול מצטבר מאז קליטת האירוע
          </span>
          <span className="font-mono font-bold text-base text-black mr-2 tracking-tight">
            {formatElapsedTimer(elapsedSeconds)}
          </span>
        </div>

        {/* Left side: Red pill with text on right and red dot on left */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-[#fff0f3] border border-rose-200/90 whitespace-nowrap">
            <span>מעל 2 דקות</span>
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          </span>
        </div>
      </div>

      {/* 6. ACTION BANNER (Start handling - matching Image) */}
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 mb-4">
        <p className="text-[13px] text-slate-700 leading-normal font-normal">
          {currentEvent.status === 'open'
            ? 'התחלת טיפול תאפשר ביצוע משימות וסגירת האירוע.'
            : currentEvent.status === 'in_progress'
            ? 'האירוע נמצא בטיפול פעיל של הכוחות בשטח.'
            : 'האירוע נסגר והועבר לארכיון המבצעי.'}
        </p>

        {currentEvent.status === 'open' ? (
          <div className="flex items-center gap-2">
            <button
              ref={startButtonRef}
              type="button"
              onClick={handleStartHandling}
              onFocus={() => {
                setIsStartFocused(true);
                isStartFocusedRef.current = true;
              }}
              onBlur={() => {
                setIsStartFocused(false);
                isStartFocusedRef.current = false;
              }}
              className={`font-medium text-[13px] px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap focus:outline-none ${
                isStartFocused
                  ? 'bg-black ring-4 ring-slate-900/40 ring-offset-2 ring-offset-white shadow-xl scale-[1.03] text-white'
                  : 'bg-[#131b2e] hover:bg-black active:bg-slate-900 text-white'
              }`}
            >
              <span>התחלת טיפול</span>
              <kbd
                className={`ms-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-bold transition ${
                  isStartFocused
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                Enter ↵
              </kbd>
            </button>
            {isStartFocused && (
              <span className="text-xs font-bold text-slate-900 animate-pulse select-none">
                ◄ לחץ Enter להתחלת טיפול
              </span>
            )}
          </div>
        ) : currentEvent.status === 'in_progress' ? (
          <div className="flex items-center gap-2">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => handleStatusChange('closed')}
              disabled={!allTasksComplete || isStatusSaving}
              onFocus={() => {
                if (currentEvent.status === 'in_progress' && allTasksComplete) {
                  setIsCloseFocused(true);
                  isCloseFocusedRef.current = true;
                }
              }}
              onBlur={() => {
                setIsCloseFocused(false);
                isCloseFocusedRef.current = false;
              }}
              className={`font-medium text-[13px] px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap focus:outline-none ${
                isCloseFocused
                  ? 'bg-emerald-800 ring-4 ring-emerald-500 ring-offset-2 ring-offset-white shadow-xl scale-[1.03] text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <span>סגירת אירוע</span>
              {allTasksComplete && (
                <kbd
                  className={`ms-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-bold transition shadow-xs ${
                    isCloseFocused
                      ? 'bg-white text-emerald-900 border border-emerald-300'
                      : 'bg-emerald-700 text-emerald-100'
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
        ) : (
          <button
            type="button"
            onClick={() => handleStatusChange('in_progress')}
            className="bg-slate-200 hover:bg-slate-300 text-black font-medium text-[13px] px-4 py-2 rounded-lg transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            פתיחה מחדש
          </button>
        )}
      </div>

      {/* 7. TABS NAVIGATION */}
      <div className="border-b border-slate-200 flex items-center justify-between px-1 mb-4 text-xs font-semibold flex-wrap gap-2">
        {/* Details Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`pb-2.5 transition cursor-pointer ${
            activeTab === 'details'
              ? 'text-black font-bold border-b-2 border-black -mb-[1px]'
              : 'text-slate-500 hover:text-black'
          }`}
        >
          פרטים
        </button>

        {/* Tasks Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'tasks'
              ? 'text-black font-bold border-b-2 border-black -mb-[1px]'
              : 'text-slate-500 hover:text-black'
          }`}
        >
          <span>משימות</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono font-medium">
            {completedTasksCount}/{tasks.length}
          </span>
        </button>

        {/* Updates Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('updates')}
          className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'updates'
              ? 'text-black font-bold border-b-2 border-black -mb-[1px]'
              : 'text-slate-500 hover:text-black'
          }`}
        >
          <span>טיפול ועדכונים</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono font-medium">
            0
          </span>
        </button>

        {/* History Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'history'
              ? 'text-black font-bold border-b-2 border-black -mb-[1px]'
              : 'text-slate-500 hover:text-black'
          }`}
        >
          <span>היסטוריה</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono font-medium">
            1
          </span>
        </button>

        {/* Keyboard shortcut hint for tabs & missions */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 select-none ps-2" title="ניווט במקלדת">
          {currentEvent.status === 'open' && (
            <>
              <span className="text-slate-800 font-bold">התחלת טיפול:</span>
              <kbd className="px-1.5 py-0.2 bg-slate-900 text-white rounded font-mono text-[10px]">Enter</kbd>
              <span className="text-slate-300 mx-0.5">•</span>
            </>
          )}
          {currentEvent.status === 'in_progress' && allTasksComplete && (
            <>
              <span className="text-emerald-700 font-bold">סגירת אירוע:</span>
              <kbd className="px-1 py-0.2 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-mono text-[10px]">↑</kbd>
              <span className="text-slate-300 mx-0.5">•</span>
            </>
          )}
          <span>לשוניות:</span>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">←</kbd>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">→</kbd>
          <span className="text-slate-300 mx-0.5">•</span>
          {activeTab === 'tasks' ? (
            <>
              <span>משימות:</span>
              <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↓</kbd>
              <span className="text-slate-300 mx-0.5">•</span>
              <kbd className="px-1.5 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">Enter</kbd>
            </>
          ) : activeTab === 'updates' ? (
            <>
              <span>לכתיבת עדכון:</span>
              <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↓</kbd>
              <span className="text-slate-300 mx-0.5">•</span>
              <span>לשמירה:</span>
              <kbd className="px-1.5 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">Enter</kbd>
            </>
          ) : null}
        </div>
      </div>

      {/* 8. TAB CONTENT */}

      {/* Tab: Details (פרטים) */}
      {activeTab === 'details' && (
        <div className="space-y-3.5">
          {/* Section: Casualties (נפגעים) */}
          <div>
            <h2 className="text-xs font-bold text-black mb-2">נפגעים</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Blue Side (Our forces) */}
              <div className="bg-[#f2f7ff] border border-blue-100 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-2 text-blue-600 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-xs bg-blue-600 inline-block"></span>
                  <span>צד כחול • כוחותינו</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2 border border-blue-50 text-center">
                    <span className="block text-[11px] text-black">פצועים</span>
                    <span className="text-xl font-bold text-black">
                      {currentEvent.blue_injured_count ?? 4}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-blue-50 text-center">
                    <span className="block text-[11px] text-black">הרוגים</span>
                    <span className="text-xl font-bold text-black">
                      {currentEvent.blue_death_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Red Side (Enemy forces) */}
              <div className="bg-[#fff1f2] border border-rose-100 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-2 text-rose-600 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-xs bg-rose-600 inline-block"></span>
                  <span>צד אדום • כוחות אויב</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2 border border-rose-50 text-center">
                    <span className="block text-[11px] text-black">פצועים</span>
                    <span className="text-xl font-bold text-black">
                      {currentEvent.red_injured_count !== null
                        ? currentEvent.red_injured_count
                        : '—'}
                    </span>
                    {currentEvent.red_injured_count === null && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        לא ידוע
                      </span>
                    )}
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-rose-50 text-center">
                    <span className="block text-[11px] text-black">הרוגים</span>
                    <span className="text-xl font-bold text-black">
                      {currentEvent.red_death_count !== null
                        ? currentEvent.red_death_count
                        : '—'}
                    </span>
                    {currentEvent.red_death_count === null && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        לא ידוע
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Urgency Level & Involved / Affected */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Involved / Affected */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-black font-medium">
                מעורבים / מושפעים
              </span>
              <span className="text-2xl font-extrabold text-black mt-1">
                {currentEvent.involved_count ?? 80}
              </span>
            </div>

            {/* Threat Urgency */}
            <div className="bg-[#fff0f3] border border-rose-200/90 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-black font-medium">
                רמת דחיפות
              </span>
              <span className="text-xl font-extrabold text-rose-700 mt-1">
                {currentEvent.urgency_label || 'מיידי'}
              </span>
            </div>
          </div>

          {/* Section: Description (תיאור) */}
          <div>
            <h2 className="text-xs font-bold text-black mb-1.5">תיאור</h2>
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-3">
              <p className="text-xs text-black leading-relaxed">
                {currentEvent.description}
              </p>
            </div>
          </div>

          {/* Section: Location and Source (מיקום ומקור) */}
          <div>
            <h2 className="text-xs font-bold text-black mb-1.5">מיקום ומקור</h2>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              {/* Categories Row */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium">קטגוריות</span>
                <span className="font-semibold text-black">
                  {currentEvent.categories?.join(' • ') || 'פח"ע • הפרות סדר ואלימות המונית'}
                </span>
              </div>

              {/* Geographic Hierarchy */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium">מיקום גאוגרפי</span>
                <span className="font-semibold text-black">
                  {currentEvent.geo_location_hierarchy || 'אסיה > ישראל > מרכז'}
                </span>
              </div>

              {/* Exact Location */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium">מיקום</span>
                <span className="font-semibold text-black">
                  {currentEvent.exact_location || currentEvent.sector_description || 'כניסה לעיר, ירושלים'}
                </span>
              </div>

              {/* Info Source */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium">מקור המידע</span>
                <span className="font-semibold text-black">
                  {currentEvent.source_label || currentEvent.notes || 'מוקד 100 + דיווחי שטח'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Times (זמנים) */}
          <div>
            <h2 className="text-xs font-bold text-black mb-1.5">זמנים</h2>
            <div className="grid grid-cols-3 gap-2">
              {/* Event Start Time */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] text-slate-500 font-medium">
                  זמן התרחשות
                </span>
                <span className="block text-xs font-bold text-black mt-1">
                  20/10 • 10:33
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  לפני 13 ד'
                </span>
              </div>

              {/* Ingestion Time */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] text-slate-500 font-medium">
                  זמן קליטה במערכת
                </span>
                <span className="block text-xs font-bold text-black mt-1">
                  20/10 • 10:35
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  לפני 11 ד'
                </span>
              </div>

              {/* Last Update */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] text-slate-500 font-medium">
                  עדכון אחרון
                </span>
                <span className="block text-xs font-bold text-black mt-1">
                  20/10 • 10:41
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  לפני 5 ד'
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tasks (משימות) - No numbers */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs text-black font-semibold">
              משימות חובה לטיפול באירוע
            </span>
            <span className="text-xs font-bold text-blue-600">
              {completedTasksCount} מתוך {tasks.length} הושלמו
            </span>
          </div>

          {isTasksLoading && (
            <p className="py-6 text-center text-sm text-slate-500" role="status">
              טוען משימות לפי קטגוריות האירוע...
            </p>
          )}
          {tasksError && (
            <p
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
            >
              טעינת משימות האירוע נכשלה: {tasksError}
            </p>
          )}
          {!isTasksLoading && !tasksError && tasks.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              לא נמצאו משימות לקטגוריות האירוע.
            </p>
          )}

          <div className="space-y-2">
            {tasks.map((task, index) => {
              const isTaskFocused = activeTab === 'tasks' && index === focusedTaskIndex;
              return (
                <div
                  key={task.id}
                  id={`detail-task-${task.id}`}
                  tabIndex={-1}
                  onClick={() => {
                    setFocusedTaskIndex(index);
                    handleToggleTask(task.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer focus:outline-none ${
                    isTaskFocused
                      ? task.completed
                        ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/90 shadow-sm'
                        : 'border-blue-500 ring-2 ring-blue-500/80 bg-blue-50/30 shadow-sm'
                      : task.completed
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                {/* Checkbox only - no number */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                    task.completed
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 text-xs">
                  <span className={task.completed ? 'line-through text-slate-400' : 'text-black font-medium'}>
                    {task.text}
                  </span>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Tab: Treatment & Updates (טיפול ועדכונים) - MATCHING IMAGE 3 */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          {/* Top Yellow Card: Recommendations for next steps */}
          <div className="bg-[#fffdf5] border border-[#fef08a] rounded-xl p-3.5 text-right">
            <h2 className="text-xs font-bold text-black mb-1">
              המלצות להמשך פעולה
            </h2>
            
            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 mb-3 font-normal">
                לא נרשמו המלצות
              </p>
            ) : (
              <ul className="space-y-1 mb-3 text-xs text-black">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Input row */}
            <div className="flex gap-2">
              <input
                ref={recInputRef}
                type="text"
                value={newRecommendationText}
                onChange={(e) => setNewRecommendationText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecommendation()}
                placeholder="הוספת המלצה להמשך פעולה"
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-amber-400 text-right"
              />
              <button
                type="button"
                onClick={handleAddRecommendation}
                className="px-4 h-9 bg-white hover:bg-slate-50 border border-slate-200 text-black rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
              >
                הוספה
              </button>
            </div>
          </div>

          {/* Bottom Card: Treatment updates matching Image 3 */}
          <div>
            <h2 className="text-xs font-bold text-black mb-2">
              עדכוני טיפול
            </h2>

            {/* Textarea box */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 mb-2.5">
              <textarea
                ref={updateTextareaRef}
                rows={3}
                value={updatesText}
                onChange={(e) => setUpdatesText(e.target.value)}
                placeholder="תיעוד פעולה, ממצא או עדכון שהתקבל"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddUpdate();
                  }
                }}
                className="w-full text-xs text-black placeholder:text-slate-400 focus:outline-none resize-none text-right"
              />
            </div>

            {/* Button "הוספת עדכון" aligned to left per Image 3 */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddUpdate}
                className="px-4 py-2 bg-[#8592a6] hover:bg-[#727e91] active:bg-[#606d80] text-white rounded-lg text-xs font-medium cursor-pointer transition shadow-2xs"
              >
                <span>הוספת עדכון</span>
                <kbd className="ms-1.5 px-1.5 py-0.5 text-[10px] font-mono bg-white/20 text-white rounded">Enter ↵</kbd>
              </button>
            </div>

            {/* Existing updates if any */}
            {updatesList.length > 0 && (
              <div className="space-y-2 mt-3">
                {updatesList.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-right"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-black">{entry.author}</span>
                      <span className="font-mono">{entry.time}</span>
                    </div>
                    <p className="text-black">{entry.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: History (היסטוריה) */}
      {activeTab === 'history' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-2.5">
            {/* Timeline bullet dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 mt-1 shrink-0" />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-black border border-slate-200/70">
                  קליטה
                </span>
                <span className="font-mono text-xs text-black font-medium">
                  20/10 • 11:03
                </span>
              </div>

              <div className="font-bold text-black text-xs">
                האירוע נקלט מ-3 מקורות פומביים
              </div>

              <div className="text-slate-500 text-[11.5px]">
                מערכת • קליטה אוטומטית
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. EDIT EVENT MODAL */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          dir="rtl"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 flex flex-col gap-4 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-black">עריכת פרטי אירוע</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-black hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-black mb-1">
                  כותרת האירוע
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-black mb-1">תיאור</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-black focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-black mb-1">
                    פצועים (כחול)
                  </label>
                  <input
                    type="number"
                    value={editBlueInjured}
                    onChange={(e) =>
                      setEditBlueInjured(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-black focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-black mb-1">
                    הרוגים (כחול)
                  </label>
                  <input
                    type="number"
                    value={editBlueDead}
                    onChange={(e) =>
                      setEditBlueDead(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-black focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-black mb-1">
                    מעורבים
                  </label>
                  <input
                    type="number"
                    value={editInvolved}
                    onChange={(e) =>
                      setEditInvolved(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-black focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-black hover:bg-slate-50 cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                שמירת שינויים
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
