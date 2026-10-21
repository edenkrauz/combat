import type { EventItem } from '../types/event';
import type { EventReportData, ChecklistReportItem, CasualtyEntry } from '../types/report';

interface BuildReportOptions {
  event: EventItem;
  elapsedSeconds?: number;
  closedBy?: string;
  closedAtTime?: string;
  checklistTasks?: Array<{ id: string; text: string; completed: boolean }>;
  currentUser?: { name: string; role?: string };
}

const formatDateTimeHebrew = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
  } catch {
    return String(dateInput);
  }
};

const formatTimeOnly = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return String(dateInput);
  }
};

export const mapEventToReportData = ({
  event,
  elapsedSeconds = 0,
  closedBy = 'ד. כהן',
  closedAtTime,
  checklistTasks,
  currentUser = { name: 'ד. כהן', role: 'מפקד משמרת חמ"ל' },
}: BuildReportOptions): EventReportData => {
  const eventId = event.code || event.event_id?.toUpperCase() || 'INC-UNKNOWN';

  // Duration
  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const totalDuration = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const slaStatus = elapsedSeconds >= 120 ? 'מעל יעד 2 דקות' : 'עמד ביעד 2 דקות';

  // Casualties
  const casualties: CasualtyEntry[] = [
    {
      side: 'כוחותינו',
      sideType: 'friendly',
      injuredCount: event.blue_injured_count ?? 0,
      deceasedCount: event.blue_death_count ?? 0,
    },
    {
      side: 'אויב / גורם עוין',
      sideType: 'hostile',
      injuredCount: event.red_injured_count ?? 0,
      deceasedCount: event.red_death_count ?? 0,
    },
  ];

  // Checklist Items
  const currentCloseTime = closedAtTime || formatTimeOnly(new Date());
  const defaultTasks = [
    { id: 't1', text: 'העברת התרעה לחמ"ל הרלוונטי וסגירת גזרה', completed: true },
    { id: 't2', text: 'הזנקת כוחות הביטחון, מחסומים וצוותי סריקה', completed: true },
    { id: 't3', text: 'הזנקת מד"א וגורמי רפואה למתן טיפול מיידי', completed: true },
    { id: 't4', text: 'תיאום מול משטרת מחוז ופיקוד העורף', completed: true },
  ];

  const sourceTasks = checklistTasks && checklistTasks.length > 0 ? checklistTasks : defaultTasks;
  const checklistItems: ChecklistReportItem[] = sourceTasks.map((t, idx) => ({
    id: t.id || `task-${idx}`,
    task: t.text,
    status: t.completed ? 'completed' : 'pending',
    statusLabel: t.completed ? 'בוצע' : 'ממתין',
    completedBy: t.completed ? closedBy : '—',
    time: t.completed ? currentCloseTime : '—',
    notes: t.completed ? 'הושלם ותואם במלואו' : '',
  }));

  const mainCategory = event.categories?.[0] || event.event_type || 'פח"ע';
  const secondaryCategories = event.categories?.slice(1).join(', ') || '—';

  return {
    id: eventId,
    systemSubtitle: 'קומבט • ניהול לחימה',
    systemName: 'מערכת קומבט',
    exportedAt: `הופק ${formatDateTimeHebrew(new Date())}`,
    title: event.title,
    status: event.status === 'closed' ? 'נסגר' : event.status === 'in_progress' ? 'בטיפול' : 'פתוח',
    urgency: event.urgency_label || (event.threat_level >= 70 ? 'מיידי' : event.threat_level >= 40 ? 'גבוהה' : 'רגילה'),
    operationalStatus: event.status === 'closed' ? 'סגור מבצעית' : 'פעיל בשטח',
    accessLevel: 'שמור / מבצעי',
    mainCategory,
    secondaryCategories,
    region: event.sector || 'מרכז',
    location: event.exact_location || event.sector_description || (event.lat && event.lng ? `${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}` : event.sector),
    urgencyLevel: `${event.urgency_label || 'מיידי'} (רמת איום: ${event.threat_level})`,
    reportSource: event.source_label || event.notes || 'מוקד 100 + דיווחי שטח',
    affectedCount: event.involved_count ? `${event.involved_count} מעורבים / מושפעים` : 'לא דווח',
    description: event.description || 'ללא תיאור נוסף',
    timeline: {
      startTime: formatDateTimeHebrew(event.start_time),
      ingestedTime: formatDateTimeHebrew(event.created_at || event.start_time),
      closedTime: closedAtTime ? `${formatDateTimeHebrew(new Date()).split(' - ')[0]} - ${closedAtTime}` : formatDateTimeHebrew(event.updated_at || new Date()),
      totalDuration,
      slaStatus,
    },
    closedBy,
    casualties,
    checklistItems,
    currentUser,
  };
};

