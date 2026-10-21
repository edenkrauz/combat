export interface CasualtyEntry {
  side: 'כוחותינו' | 'אויב / גורם עוין' | 'אחר';
  sideType: 'friendly' | 'hostile' | 'other';
  injuredCount: number;
  deceasedCount: number;
}

export interface ChecklistReportItem {
  id: string;
  task: string;
  status: 'completed' | 'in_progress' | 'pending';
  statusLabel: string;
  completedBy: string;
  time: string;
  notes?: string;
}

export interface EventTimelineReport {
  startTime: string; // e.g. "20/10/2026 - 17:38"
  ingestedTime: string; // e.g. "20/10/2026 - 17:39"
  closedTime: string; // e.g. "20/10/2026 - 18:15"
  totalDuration: string; // e.g. "00:36:20"
  slaStatus: string; // e.g. "מעל יעד 2 דקות" or "עמד ביעד 2 דקות"
}

export interface EventReportData {
  id: string; // e.g. "INC-2070"
  systemSubtitle?: string; // e.g. "קומבט • ניהול לחימה"
  systemName?: string; // e.g. "מערכת קומבט"
  exportedAt: string; // e.g. "הופק 20/10/2026 - 18:17:20"
  title: string; // e.g. "ירי תלול מסלול ונפילות באזור תעשייה"
  status: string; // e.g. "נסגר"
  urgency: string; // e.g. "מיידי"
  operationalStatus: string; // e.g. "סגור מבצעית"
  accessLevel: string; // e.g. "סודי ביותר"
  mainCategory: string; // e.g. "ירי תמ\"ס"
  secondaryCategories: string; // e.g. "פח\"ע, שריפה וסכנת חומרים מסוכנים"
  region: string; // e.g. "מרכז"
  location: string; // e.g. "אזור תעשייה, בת ים (32.016, 34.750)"
  urgencyLevel: string; // e.g. "מיידי (סיכון 90)"
  reportSource: string; // e.g. "מוקד 100 + כוחות בשטח"
  affectedCount: string; // e.g. "80 נפגעים/מעורבים משוערים"
  description: string;
  timeline: EventTimelineReport;
  closedBy: string; // e.g. "רס\"ן ד. כהן (מפקד משמרת חמ\"ל)"
  casualties: CasualtyEntry[];
  checklistItems: ChecklistReportItem[];
  currentUser?: {
    name: string;
    role?: string;
  };
}

