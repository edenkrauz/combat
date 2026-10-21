import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Pencil,
  AlertTriangle,
  Clock,
  Check,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import type { EventItem, EventStatus } from '../types/event';

interface EventDetailsProps {
  event: EventItem;
  onClose: () => void;
  onUpdateEvent?: (updatedEvent: EventItem) => void;
  completedTaskIds?: string[];
  onCompletedTasksChange?: (eventId: string, completedTaskIds: string[]) => void;
}

type TabKey = 'details' | 'tasks' | 'updates' | 'history';

interface OperationalTask {
  id: string;
  text: string;
  completed: boolean;
}

const DEFAULT_TASKS: Omit<OperationalTask, 'completed'>[] = [
  { id: 't1', text: 'העברת התרעה לחמ"ל הרלוונטי וסגירת גזרה' },
  { id: 't2', text: 'הזנקת כוחות הביטחון, מחסומים וצוותי סריקה' },
  { id: 't3', text: 'הזנקת מד"א וגורמי רפואה למתן טיפול מיידי' },
  { id: 't4', text: 'תיאום מול משטרת מחוז ופיקוד העורף' },
];

interface UpdateEntry {
  id: string;
  time: string;
  author: string;
  text: string;
}

const formatDateTime = (isoString?: string | null): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} • ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
};

const formatTimeAgo = (isoString?: string | null): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return 'עכשיו';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'הרגע';
    if (mins < 60) return `לפני ${mins} ד'`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שע'`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  } catch {
    return '';
  }
};

const getInitialDate = (isoString?: string | null): string => {
  if (!isoString) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '21/10/2026';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '21/10/2026';
  }
};

const getInitialTime = (isoString?: string | null): string => {
  if (!isoString) return '08:33';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '08:33';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return '08:33';
  }
};

const buildIsoDateTime = (
  dateStr: string,
  timeStr: string,
  fallbackIso: string
): string => {
  try {
    const parts = dateStr.trim().split(/[/.-]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
      const timeParts = timeStr.trim().split(':');
      const hours = parseInt(timeParts[0] || '0', 10);
      const mins = parseInt(timeParts[1] || '0', 10);
      const d = new Date(year, month - 1, day, hours, mins, 0);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    return fallbackIso;
  } catch {
    return fallbackIso;
  }
};

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onClose,
  onUpdateEvent,
  completedTaskIds,
  onCompletedTasksChange,
}) => {
  // Editable event state
  const [currentEvent, setCurrentEvent] = useState<EventItem>(event);

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

  // Edit form state
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDesc, setEditDesc] = useState(event.description);
  const [editSource, setEditSource] = useState(event.source_label || event.notes || 'מוקד 101');
  const [editUrgency, setEditUrgency] = useState(event.urgency_label || 'גבוה');
  const [editLocation, setEditLocation] = useState(
    event.exact_location || event.sector_description || ''
  );
  const [editDate, setEditDate] = useState(() =>
    getInitialDate(event.start_time || event.created_at)
  );
  const [editTime, setEditTime] = useState(() =>
    getInitialTime(event.start_time || event.created_at)
  );
  const [editBlueInjured, setEditBlueInjured] = useState<number | ''>(
    event.blue_injured_count ?? ''
  );
  const [editBlueDead, setEditBlueDead] = useState<number | ''>(
    event.blue_death_count ?? ''
  );
  const [editRedInjured, setEditRedInjured] = useState<number | ''>(
    event.red_injured_count ?? ''
  );
  const [editRedDead, setEditRedDead] = useState<number | ''>(
    event.red_death_count ?? ''
  );
  const [editInvolved, setEditInvolved] = useState<number | ''>(
    event.involved_count ?? ''
  );
  const [secondaryCategory, setSecondaryCategory] = useState<string>(
    event.categories?.[1] || ''
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const primaryCategory =
    currentEvent.categories?.[0] ||
    (currentEvent.event_type === 'terror_and_riot'
      ? 'תלול-מסלול, ירי רקטי ואווירי'
      : currentEvent.event_type || 'תלול-מסלול, ירי רקטי ואווירי');

  const openEditModal = () => {
    setEditTitle(currentEvent.title);
    setEditDesc(currentEvent.description);
    setEditSource(currentEvent.source_label || currentEvent.notes || 'מוקד 101');
    setEditUrgency(currentEvent.urgency_label || 'גבוה');
    setEditLocation(currentEvent.exact_location || currentEvent.sector_description || '');
    setEditDate(getInitialDate(currentEvent.start_time || currentEvent.created_at));
    setEditTime(getInitialTime(currentEvent.start_time || currentEvent.created_at));
    setEditBlueInjured(currentEvent.blue_injured_count ?? '');
    setEditBlueDead(currentEvent.blue_death_count ?? '');
    setEditRedInjured(currentEvent.red_injured_count ?? '');
    setEditRedDead(currentEvent.red_death_count ?? '');
    setEditInvolved(currentEvent.involved_count ?? '');
    setSecondaryCategory(currentEvent.categories?.[1] || '');
    setIsAddingCategory(false);
    setNewCategoryInput('');
    setIsEditing(true);
  };

  // Tasks state (no numbers)
  const [tasks, setTasks] = useState<OperationalTask[]>(() =>
    DEFAULT_TASKS.map((t) => ({ ...t, completed: completedTaskIds?.includes(t.id) ?? false }))
  );

  useEffect(() => {
    onCompletedTasksChange?.(
      event.event_id,
      tasks.filter((t) => t.completed).map((t) => t.id)
    );
  }, [tasks]);

  const TABS: TabKey[] = ['details', 'tasks', 'updates', 'history'];
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const focusedTaskIndexRef = useRef(focusedTaskIndex);
  focusedTaskIndexRef.current = focusedTaskIndex;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const isStartFocusedRef = useRef(isStartFocused);
  isStartFocusedRef.current = isStartFocused;
  const isCloseFocusedRef = useRef(isCloseFocused);
  isCloseFocusedRef.current = isCloseFocused;
  const currentEventRef = useRef(currentEvent);
  currentEventRef.current = currentEvent;
  const isEditingRef = useRef(isEditing);
  isEditingRef.current = isEditing;
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const updateTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recInputRef = useRef<HTMLInputElement | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [newRecommendationText, setNewRecommendationText] = useState('');

  // Updates state
  const [updatesText, setUpdatesText] = useState('');
  const [updatesList, setUpdatesList] = useState<UpdateEntry[]>([]);

  // Elapsed handling timer: calculate elapsed seconds since event start_time or created_at
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const referenceTime = event.start_time || event.created_at;
    if (referenceTime) {
      const startTimeMs = new Date(referenceTime).getTime();
      if (!isNaN(startTimeMs)) {
        return Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
      }
    }
    return 0;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      // Pull focus off the event card so Enter/Space don't toggle the panel closed
      sectionRef.current?.focus({ preventScroll: true });
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
      if (isEditingRef.current) return true;
      try {
        return Boolean(document.querySelector('[role="dialog"], .fixed.inset-0'));
      } catch {
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Already handled elsewhere, e.g. the Enter on the event card that opened this panel
      if (e.defaultPrevented) return;

      if (isEditingRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditing(false);
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInput = isTextInput(target);
      if (isModalOpen()) return;

      const curTab = activeTabRef.current;
      const curTasks = tasksRef.current;
      const curTaskIdx = focusedTaskIndexRef.current;
      const startFocused = isStartFocusedRef.current;
      const closeFocused = isCloseFocusedRef.current;
      const curEvent = currentEventRef.current;
      const canClose = curEvent.status === 'in_progress' && curTasks.every((t) => t.completed);

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
  const handleStatusChange = (newStatus: EventStatus) => {
    const updated = { ...currentEvent, status: newStatus };
    currentEventRef.current = updated;
    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
  };

  const handleStartHandling = () => {
    handleStatusChange('in_progress');
    setIsStartFocused(false);
    isStartFocusedRef.current = false;
    setActiveTab('tasks');
    activeTabRef.current = 'tasks';
    setFocusedTaskIndex(0);
    focusedTaskIndexRef.current = 0;
  };

  const handleSaveEdit = () => {
    const categories: string[] = [primaryCategory];
    if (secondaryCategory.trim()) {
      categories.push(secondaryCategory.trim());
    }

    const newStartTime = buildIsoDateTime(
      editDate,
      editTime,
      currentEvent.start_time || currentEvent.created_at || new Date().toISOString()
    );

    const updated: EventItem = {
      ...currentEvent,
      title: editTitle.trim() || currentEvent.title,
      description: editDesc,
      categories,
      source_label: editSource.trim() || undefined,
      notes: editSource.trim() || null,
      urgency_label: editUrgency,
      exact_location: editLocation.trim() || undefined,
      sector_description: editLocation.trim() || currentEvent.sector_description,
      start_time: newStartTime,
      blue_injured_count: editBlueInjured === '' ? null : Number(editBlueInjured),
      blue_death_count: editBlueDead === '' ? null : Number(editBlueDead),
      red_injured_count: editRedInjured === '' ? null : Number(editRedInjured),
      red_death_count: editRedDead === '' ? null : Number(editRedDead),
      involved_count: editInvolved === '' ? null : Number(editInvolved),
      updated_at: new Date().toISOString(),
    };
    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    setIsEditing(false);
  };

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-label="פרטי אירוע"
      className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-y-auto text-right select-none animate-in fade-in duration-200 focus:outline-none dark:bg-slate-900/95 dark:border-slate-800"
      dir="rtl"
    >
      {/* 1. TOP HEADER: Navigation & Code */}
      <div className="flex items-start justify-between gap-2 pb-2">
        {/* Right side: Code pill and breadcrumb hierarchy */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-black dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentEvent.code || currentEvent.event_id.toUpperCase()}</span>
            </span>
            <span className="text-[11.5px] text-slate-800 font-medium truncate dark:text-slate-300">
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
            onClick={openEditModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0a3a78] transition cursor-pointer shadow-2xs dark:bg-slate-800 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-700"
            title="עריכת אירוע"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>עריכת אירוע</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-black hover:text-black transition cursor-pointer shadow-2xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
            title="סגירת תצוגה"
            aria-label="סגירה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN EVENT TITLE */}
      <h1 className="text-[18px] font-bold text-black leading-snug mt-1 mb-2.5 dark:text-white">
        {currentEvent.title}
      </h1>

      {/* 3. BADGES ROW */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
        {/* Status Pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
          {currentEvent.status === 'open'
            ? 'פתוח'
            : currentEvent.status === 'in_progress'
            ? 'בטיפול'
            : 'נסגר'}
        </span>

        {/* Urgency Pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff0f3] text-[#b91c1c] border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
          <span>
            {currentEvent.threat_label ||
              (currentEvent.threat_level >= 70
                ? 'סיכון גבוה'
                : currentEvent.threat_level >= 40
                ? 'סיכון בינוני'
                : 'סיכון נמוך')}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500"></span>
        </span>

        {/* Categories Pills */}
        {currentEvent.categories && currentEvent.categories.length > 0 ? (
          currentEvent.categories.map((cat, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              {idx === 0 ? `• ${cat}` : `+ ${cat}`}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            • {currentEvent.event_type || 'פח"ע'}
          </span>
        )}
      </div>

      {/* 4. LIFECYCLE / STATUS PROGRESS TRACK */}
      <div className="mb-3.5">
        <div className="relative flex items-center justify-between pb-2">
          {/* Background track line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 rounded-full z-0 dark:bg-slate-800" />

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
                ? 'text-black font-bold dark:text-white'
                : 'text-slate-400 hover:text-black dark:text-slate-500 dark:hover:text-slate-200'
            }`}
          >
            פתוח
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('in_progress')}
            className={`font-semibold cursor-pointer transition ${
              currentEvent.status === 'in_progress'
                ? 'text-black font-bold dark:text-white'
                : 'text-slate-400 hover:text-black dark:text-slate-500 dark:hover:text-slate-200'
            }`}
          >
            בטיפול
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('closed')}
            className={`font-semibold cursor-pointer transition ${
              currentEvent.status === 'closed'
                ? 'text-black font-bold dark:text-white'
                : 'text-slate-400 hover:text-black dark:text-slate-500 dark:hover:text-slate-200'
            }`}
          >
            נסגר
          </button>
        </div>
      </div>

      {/* 5. CUMULATIVE TIME BANNER */}
      <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 flex items-center justify-between shadow-2xs mb-3 dark:bg-slate-800/80 dark:border-slate-700">
        {/* Right side: Clock icon + label + digital timer */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600 shrink-0 dark:text-slate-400" />
          <span className="text-xs text-slate-600 font-medium dark:text-slate-300">
            זמן טיפול מצטבר מאז קליטת האירוע
          </span>
          <span className="font-mono font-bold text-base text-black mr-2 tracking-tight dark:text-white">
            {formatElapsedTimer(elapsedSeconds)}
          </span>
        </div>

        {/* Left side: Red pill with duration info */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-[#fff0f3] border border-rose-200/90 whitespace-nowrap dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
            <span>{elapsedSeconds >= 120 ? 'מעל 2 דקות' : 'עד 2 דקות'}</span>
            <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500"></span>
          </span>
        </div>
      </div>

      {/* 6. ACTION BANNER */}
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 mb-4 dark:bg-blue-950/30 dark:border-blue-900/50">
        <p className="text-[13px] text-slate-700 leading-normal font-normal dark:text-slate-300">
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
                  ? 'bg-black ring-4 ring-slate-900/40 ring-offset-2 ring-offset-white shadow-xl scale-[1.03] text-white dark:ring-offset-slate-900 dark:ring-blue-500/50'
                  : 'bg-[#131b2e] hover:bg-black active:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              <span>התחלת טיפול</span>
              <kbd
                className={`ms-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-bold transition ${
                  isStartFocused
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'bg-slate-800 text-slate-200 dark:bg-slate-700'
                }`}
              >
                Enter ↵
              </kbd>
            </button>
          </div>
        ) : currentEvent.status === 'in_progress' ? (
          <div className="flex items-center gap-2">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => handleStatusChange('closed')}
              onFocus={() => {
                if (currentEvent.status === 'in_progress' && tasks.every((t) => t.completed)) {
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
                  ? 'bg-emerald-800 ring-4 ring-emerald-500 ring-offset-2 ring-offset-white shadow-xl scale-[1.03] text-white dark:ring-offset-slate-900'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-650 dark:hover:bg-emerald-600'
              }`}
            >
              <span>סגירת אירוע</span>
              {tasks.every((t) => t.completed) && (
                <kbd
                  className={`ms-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-bold transition shadow-xs ${
                    isCloseFocused
                      ? 'bg-white text-emerald-900 border border-emerald-300'
                      : 'bg-emerald-700 text-emerald-100 dark:bg-emerald-800'
                  }`}
                >
                  Enter ↵
                </kbd>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleStatusChange('in_progress')}
            className="bg-slate-200 hover:bg-slate-300 text-black font-medium text-[13px] px-4 py-2 rounded-lg transition cursor-pointer shrink-0 whitespace-nowrap dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
          >
            פתיחה מחדש
          </button>
        )}
      </div>

      {/* 7. TABS NAVIGATION */}
      <div className="border-b border-slate-200 flex items-center justify-between px-1 mb-4 text-xs font-semibold flex-wrap gap-2 dark:border-slate-800">
        {/* Details Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`pb-2.5 transition cursor-pointer ${
            activeTab === 'details'
              ? 'text-black font-bold border-b-2 border-black -mb-[1px] dark:text-white dark:border-white'
              : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
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
              ? 'text-black font-bold border-b-2 border-black -mb-[1px] dark:text-white dark:border-white'
              : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>משימות</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono font-medium dark:bg-slate-800 dark:text-slate-300">
            {completedTasksCount}/{tasks.length}
          </span>
        </button>

        {/* Updates Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('updates')}
          className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'updates'
              ? 'text-black font-bold border-b-2 border-black -mb-[1px] dark:text-white dark:border-white'
              : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>טיפול ועדכונים</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono font-medium dark:bg-slate-800 dark:text-slate-300">
            {updatesList.length}
          </span>
        </button>

        {/* History Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'history'
              ? 'text-black font-bold border-b-2 border-black -mb-[1px] dark:text-white dark:border-white'
              : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>היסטוריה</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono font-medium dark:bg-slate-800 dark:text-slate-300">
            1
          </span>
        </button>

        {/* Keyboard shortcut hint for tabs & missions */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 select-none ps-2 dark:text-slate-400" title="ניווט במקלדת">
          {currentEvent.status === 'open' && (
            <>
              <span className="text-slate-800 font-bold dark:text-slate-200">התחלת טיפול:</span>
              <kbd className="px-1.5 py-0.2 bg-slate-900 text-white rounded font-mono text-[10px] dark:bg-slate-700">Enter</kbd>
              <span className="text-slate-300 mx-0.5 dark:text-slate-600">•</span>
            </>
          )}
          {currentEvent.status === 'in_progress' && tasks.every((t) => t.completed) && (
            <>
              <span className="text-emerald-700 font-bold dark:text-emerald-400">סגירת אירוע:</span>
              <kbd className="px-1 py-0.2 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-mono text-[10px] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">↑</kbd>
              <span className="text-slate-300 mx-0.5 dark:text-slate-600">•</span>
            </>
          )}
          <span>לשוניות:</span>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">←</kbd>
          <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">→</kbd>
          <span className="text-slate-300 mx-0.5 dark:text-slate-600">•</span>
          {activeTab === 'tasks' ? (
            <>
              <span>משימות:</span>
              <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">↑</kbd>
              <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">↓</kbd>
              <span className="text-slate-300 mx-0.5 dark:text-slate-600">•</span>
              <kbd className="px-1.5 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">Enter</kbd>
            </>
          ) : activeTab === 'updates' ? (
            <>
              <span>לכתיבת עדכון:</span>
              <kbd className="px-1 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">↓</kbd>
              <span className="text-slate-300 mx-0.5 dark:text-slate-600">•</span>
              <span>לשמירה:</span>
              <kbd className="px-1.5 py-0.2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">Enter</kbd>
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
            <h2 className="text-xs font-bold text-black mb-2 dark:text-white">נפגעים</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Blue Side (Our forces) */}
              <div className="bg-[#f2f7ff] border border-blue-100 rounded-xl p-2.5 dark:bg-blue-950/30 dark:border-blue-900/50">
                <div className="flex items-center gap-1.5 mb-2 text-blue-600 font-semibold text-xs dark:text-blue-400">
                  <span className="w-2 h-2 rounded-xs bg-blue-600 inline-block dark:bg-blue-400"></span>
                  <span>צד כחול • כוחותינו</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2 border border-blue-50 text-center dark:bg-slate-900/90 dark:border-blue-900/40">
                    <span className="block text-[11px] text-slate-700 dark:text-slate-300">פצועים</span>
                    <span className="text-xl font-bold text-black dark:text-white">
                      {currentEvent.blue_injured_count ?? 0}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-blue-50 text-center dark:bg-slate-900/90 dark:border-blue-900/40">
                    <span className="block text-[11px] text-slate-700 dark:text-slate-300">הרוגים</span>
                    <span className="text-xl font-bold text-black dark:text-white">
                      {currentEvent.blue_death_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Red Side (Enemy forces) */}
              <div className="bg-[#fff1f2] border border-rose-100 rounded-xl p-2.5 dark:bg-rose-950/30 dark:border-rose-900/50">
                <div className="flex items-center gap-1.5 mb-2 text-rose-600 font-semibold text-xs dark:text-rose-400">
                  <span className="w-2 h-2 rounded-xs bg-rose-600 inline-block dark:bg-rose-400"></span>
                  <span>צד אדום • כוחות אויב</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2 border border-rose-50 text-center dark:bg-slate-900/90 dark:border-rose-900/40">
                    <span className="block text-[11px] text-slate-700 dark:text-slate-300">פצועים</span>
                    <span className="text-xl font-bold text-black dark:text-white">
                      {currentEvent.red_injured_count !== null
                        ? currentEvent.red_injured_count
                        : '—'}
                    </span>
                    {currentEvent.red_injured_count === null && (
                      <span className="block text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">
                        לא ידוע
                      </span>
                    )}
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-rose-50 text-center dark:bg-slate-900/90 dark:border-rose-900/40">
                    <span className="block text-[11px] text-slate-700 dark:text-slate-300">הרוגים</span>
                    <span className="text-xl font-bold text-black dark:text-white">
                      {currentEvent.red_death_count !== null
                        ? currentEvent.red_death_count
                        : '—'}
                    </span>
                    {currentEvent.red_death_count === null && (
                      <span className="block text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">
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
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between dark:bg-slate-800/80 dark:border-slate-700">
              <span className="text-[11px] text-slate-700 font-medium dark:text-slate-300">
                מעורבים / מושפעים
              </span>
              <span className="text-2xl font-extrabold text-black mt-1 dark:text-white">
                {currentEvent.involved_count ?? currentEvent.deployed_forces ?? 0}
              </span>
            </div>

            {/* Threat Urgency */}
            <div className="bg-[#fff0f3] border border-rose-200/90 rounded-xl p-3 flex flex-col justify-between dark:bg-rose-950/30 dark:border-rose-900/50">
              <span className="text-[11px] text-slate-700 font-medium dark:text-slate-300">
                רמת דחיפות
              </span>
              <span className="text-xl font-extrabold text-rose-700 mt-1 dark:text-rose-400">
                {currentEvent.urgency_label ||
                  currentEvent.threat_label ||
                  (currentEvent.threat_level >= 70
                    ? 'מיידי'
                    : currentEvent.threat_level >= 40
                    ? 'גבוהה'
                    : 'רגילה')}
              </span>
            </div>
          </div>

          {/* Section: Description (תיאור) */}
          <div>
            <h2 className="text-xs font-bold text-black mb-1.5 dark:text-white">תיאור</h2>
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-3 dark:bg-slate-800/60 dark:border-slate-700">
              <p className="text-xs text-black leading-relaxed dark:text-slate-200">
                {currentEvent.description}
              </p>
            </div>
          </div>

          {/* Section: Location and Source (מיקום ומקור) */}
          <div>
            <h2 className="text-xs font-bold text-black mb-1.5 dark:text-white">מיקום ומקור</h2>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs dark:bg-slate-800/80 dark:border-slate-700 dark:divide-slate-700/60">
              {/* Categories Row */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium dark:text-slate-400">קטגוריות</span>
                <span className="font-semibold text-black dark:text-slate-100">
                  {currentEvent.categories?.join(' • ') || currentEvent.event_type || 'פח"ע'}
                </span>
              </div>

              {/* Geographic Hierarchy */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium dark:text-slate-400">מיקום גאוגרפי</span>
                <span className="font-semibold text-black dark:text-slate-100">
                  {currentEvent.geo_location_hierarchy || `ישראל > ${currentEvent.sector}`}
                </span>
              </div>

              {/* Exact Location */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium dark:text-slate-400">מיקום</span>
                <span className="font-semibold text-black dark:text-slate-100">
                  {currentEvent.exact_location || currentEvent.sector_description || currentEvent.sector}
                </span>
              </div>

              {/* Info Source */}
              <div className="flex items-center justify-between py-2.5 px-3">
                <span className="text-slate-500 font-medium dark:text-slate-400">מקור המידע</span>
                <span className="font-semibold text-black dark:text-slate-100">
                  {currentEvent.source_label || currentEvent.notes || 'מוקד 100 + דיווחי שטח'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Times (זמנים) */}
          <div>
            <h2 className="text-xs font-bold text-black mb-1.5 dark:text-white">זמנים</h2>
            <div className="grid grid-cols-3 gap-2">
              {/* Event Start Time */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center dark:bg-slate-800/80 dark:border-slate-700">
                <span className="block text-[11px] text-slate-500 font-medium dark:text-slate-400">
                  זמן התרחשות
                </span>
                <span className="block text-xs font-bold text-black mt-1 dark:text-white">
                  {currentEvent.time_display || formatDateTime(currentEvent.start_time)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">
                  {formatTimeAgo(currentEvent.start_time)}
                </span>
              </div>

              {/* Ingestion Time */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center dark:bg-slate-800/80 dark:border-slate-700">
                <span className="block text-[11px] text-slate-500 font-medium dark:text-slate-400">
                  זמן קליטה במערכת
                </span>
                <span className="block text-xs font-bold text-black mt-1 dark:text-white">
                  {formatDateTime(currentEvent.created_at)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">
                  {formatTimeAgo(currentEvent.created_at)}
                </span>
              </div>

              {/* Last Update */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center dark:bg-slate-800/80 dark:border-slate-700">
                <span className="block text-[11px] text-slate-500 font-medium dark:text-slate-400">
                  עדכון אחרון
                </span>
                <span className="block text-xs font-bold text-black mt-1 dark:text-white">
                  {formatDateTime(currentEvent.updated_at)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">
                  {formatTimeAgo(currentEvent.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tasks (משימות) - No numbers */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-black font-semibold dark:text-slate-200">
              משימות חובה לטיפול באירוע
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {completedTasksCount} מתוך {tasks.length} הושלמו
            </span>
          </div>

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
                        ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/90 shadow-sm dark:bg-emerald-950/40 dark:border-emerald-500'
                        : 'border-blue-500 ring-2 ring-blue-500/80 bg-blue-50/30 shadow-sm dark:bg-blue-950/40 dark:border-blue-500'
                      : task.completed
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-800/60 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Checkbox only */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                      task.completed
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="flex-1 text-xs">
                    <span className={task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-black font-medium dark:text-slate-200'}>
                      {task.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Treatment & Updates (טיפול ועדכונים) */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          {/* Top Yellow Card: Recommendations for next steps */}
          <div className="bg-[#fffdf5] border border-[#fef08a] rounded-xl p-3.5 text-right dark:bg-amber-950/20 dark:border-amber-900/40">
            <h2 className="text-xs font-bold text-black mb-1 dark:text-amber-200">
              המלצות להמשך פעולה
            </h2>
            
            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 mb-3 font-normal dark:text-slate-400">
                לא נרשמו המלצות
              </p>
            ) : (
              <ul className="space-y-1 mb-3 text-xs text-black dark:text-slate-200">
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
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-amber-400 text-right dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddRecommendation}
                className="px-4 h-9 bg-white hover:bg-slate-50 border border-slate-200 text-black rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
              >
                הוספה
              </button>
            </div>
          </div>

          {/* Bottom Card: Treatment updates */}
          <div>
            <h2 className="text-xs font-bold text-black mb-2 dark:text-white">
              עדכוני טיפול
            </h2>

            {/* Textarea box */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 mb-2.5 dark:bg-slate-800/80 dark:border-slate-700">
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
                className="w-full text-xs text-black placeholder:text-slate-400 focus:outline-none resize-none text-right dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            {/* Button "הוספת עדכון" */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddUpdate}
                className="px-4 py-2 bg-[#8592a6] hover:bg-[#727e91] active:bg-[#606d80] text-white rounded-lg text-xs font-medium cursor-pointer transition shadow-2xs dark:bg-slate-700 dark:hover:bg-slate-600"
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
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-right dark:bg-slate-800/70 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 dark:text-slate-400">
                      <span className="font-semibold text-black dark:text-slate-200">{entry.author}</span>
                      <span className="font-mono">{entry.time}</span>
                    </div>
                    <p className="text-black dark:text-slate-200">{entry.text}</p>
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
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 mt-1 shrink-0 dark:bg-slate-400" />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-black border border-slate-200/70 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                  קליטה
                </span>
                <span className="font-mono text-xs text-black font-medium dark:text-slate-300">
                  {formatDateTime(currentEvent.created_at || currentEvent.start_time)}
                </span>
              </div>

              <div className="font-bold text-black text-xs dark:text-white">
                {currentEvent.notes || 'קליטת אירוע במערכת המבצעית'}
              </div>

              <div className="text-slate-500 text-[11.5px] dark:text-slate-400">
                {currentEvent.source_label || 'מערכת • קליטה אוטומטית'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. EDIT EVENT MODAL */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          dir="rtl"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right dark:bg-slate-900 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex flex-col items-start gap-0.5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  עריכת אירוע
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentEvent.code || currentEvent.event_id.toUpperCase()} • {primaryCategory}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 cursor-pointer transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                title="סגירה"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Box 1: פרטי האירוע */}
              <div className="relative rounded-xl border border-slate-200 p-4 pt-5 space-y-4 dark:border-slate-700">
                <span className="absolute -top-2.5 right-4 bg-white px-2 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  פרטי האירוע
                </span>

                {/* קטגוריה ראשית */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    קטגוריה ראשית
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800">
                      {primaryCategory}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      נקבעת בקליטה ואינה ניתנת לשינוי
                    </span>
                  </div>
                  {secondaryCategory ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                        <span>{secondaryCategory}</span>
                        <button
                          type="button"
                          onClick={() => setSecondaryCategory('')}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                          title="הסר קטגוריה נוספת"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  ) : isAddingCategory ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="שם קטגוריה נוספת..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCategoryInput.trim()) {
                              setSecondaryCategory(newCategoryInput.trim());
                              setIsAddingCategory(false);
                            }
                          }
                        }}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryInput.trim()) {
                            setSecondaryCategory(newCategoryInput.trim());
                            setIsAddingCategory(false);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium cursor-pointer"
                      >
                        הוסף
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                      >
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer pt-0.5"
                    >
                      <span className="font-bold">+ שיוך לקטגוריה נוספת</span>
                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                        • רשות, רק כשהאירוע חוצה קטגוריות
                      </span>
                    </button>
                  )}
                </div>

                {/* כותרת */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    כותרת *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                {/* תיאור */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    תיאור
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 resize-y dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                {/* מקור המידע & רמת דחיפות */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      מקור המידע
                    </label>
                    <input
                      type="text"
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      רמת דחיפות
                    </label>
                    <div className="relative">
                      <select
                        value={editUrgency}
                        onChange={(e) => setEditUrgency(e.target.value)}
                        className="w-full h-10 px-3 pl-8 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      >
                        <option value="מיידי">מיידי</option>
                        <option value="גבוה">גבוה</option>
                        <option value="גבוהה">גבוהה</option>
                        <option value="בינונית">בינונית</option>
                        <option value="נמוכה">נמוכה</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: מיקום וזמן */}
              <div className="relative rounded-xl border border-slate-200 p-4 pt-5 space-y-4 dark:border-slate-700">
                <span className="absolute -top-2.5 right-4 bg-white px-2 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  מיקום וזמן
                </span>

                {/* מיקום (תיאור) * */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    מיקום (תיאור) *
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                {/* תאריך התרחשות & שעת התרחשות */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      תאריך התרחשות
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full h-10 pr-9 pl-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      שעת התרחשות
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full h-10 pr-9 pl-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: נפגעים, כוחות ונוכחות ישראלית */}
              <div className="relative rounded-xl border border-slate-200 p-4 pt-5 space-y-4 dark:border-slate-700">
                <span className="absolute -top-2.5 right-4 bg-white px-2 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  נפגעים, כוחות ונוכחות ישראלית
                </span>

                {/* צד כחול */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300">
                        כחול
                      </span>
                      <span>צד כחול – פצועים</span>
                    </div>
                    <input
                      type="text"
                      placeholder="לא ידוע"
                      value={editBlueInjured === '' ? '' : editBlueInjured}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '' || val === 'לא ידוע') setEditBlueInjured('');
                        else if (!isNaN(Number(val))) setEditBlueInjured(Number(val));
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300">
                        כחול
                      </span>
                      <span>צד כחול – הרוגים</span>
                    </div>
                    <input
                      type="text"
                      placeholder="לא ידוע"
                      value={editBlueDead === '' ? '' : editBlueDead}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '' || val === 'לא ידוע') setEditBlueDead('');
                        else if (!isNaN(Number(val))) setEditBlueDead(Number(val));
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* צד אדום */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300">
                        אדום
                      </span>
                      <span>צד אדום – פצועים</span>
                    </div>
                    <input
                      type="text"
                      placeholder="לא ידוע"
                      value={editRedInjured === '' ? '' : editRedInjured}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '' || val === 'לא ידוע') setEditRedInjured('');
                        else if (!isNaN(Number(val))) setEditRedInjured(Number(val));
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300">
                        אדום
                      </span>
                      <span>צד אדום – הרוגים</span>
                    </div>
                    <input
                      type="text"
                      placeholder="לא ידוע"
                      value={editRedDead === '' ? '' : editRedDead}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '' || val === 'לא ידוע') setEditRedDead('');
                        else if (!isNaN(Number(val))) setEditRedDead(Number(val));
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* מעורבים / מושפעים */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    מעורבים / מושפעים
                  </label>
                  <input
                    type="text"
                    placeholder="לא ידוע"
                    value={editInvolved === '' ? '' : editInvolved}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val === '' || val === 'לא ידוע') setEditInvolved('');
                      else if (!isNaN(Number(val))) setEditInvolved(Number(val));
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl dark:border-slate-800 dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-6 py-2.5 rounded-lg bg-[#0f172a] hover:bg-black text-white font-bold text-sm shadow-sm cursor-pointer transition dark:bg-blue-600 dark:hover:bg-blue-700"
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
