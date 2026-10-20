import { X } from 'lucide-react';
import type { OperationalMode } from './TopNavbar';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: string; // e.g. "מרכז"
  mode: OperationalMode;
}

interface LogEntry {
  id: string;
  time: string; // Local ISO 8601, e.g. "2026-10-20T12:52:00"
  user: string; // Operator name or "מערכת" for automatic actions
  event_id: string | null; // NULL = action not tied to an event
  action: string;
}

// Local mock data until the audit log is connected to the DB
const AUDIT_LOGS: LogEntry[] = [
  { id: 'log-10', time: '2026-10-20T12:52:00', user: 'ד. כהן', event_id: null, action: 'מעבר למצב אמת' },
  { id: 'log-9', time: '2026-10-20T12:40:00', user: 'מערכת', event_id: 'INC-2060', action: 'האירוע נקלט בזמן אמת מ-1 מקורות' },
  { id: 'log-8', time: '2026-10-20T12:30:00', user: 'ד. כהן', event_id: 'INC-2051', action: 'המלצה: לבחון תגבור כוח חילוץ נוסף לאתר' },
  { id: 'log-7', time: '2026-10-20T12:30:00', user: 'מערכת', event_id: 'INC-2070', action: 'האירוע נקלט מ-3 מקורות פומביים' },
  { id: 'log-6', time: '2026-10-20T12:28:00', user: 'ד. כהן', event_id: 'INC-2051', action: 'צוותי חילוץ באתר; שני לכודים חולצו.' },
  { id: 'log-5', time: '2026-10-20T12:26:00', user: 'ד. כהן', event_id: 'INC-2051', action: 'בוצע: הזנקת כוחות רפואה והצלה בהתאם לצורך.' },
  { id: 'log-4', time: '2026-10-20T12:21:00', user: 'מערכת', event_id: 'INC-2051', action: 'סטטוס האירוע עודכן ל"בטיפול"' },
  { id: 'log-3', time: '2026-10-20T12:15:00', user: 'ר. לוי', event_id: null, action: "ניסיון עריכת תבנית צ'קליסט נחסם: אין הרשאה" },
  { id: 'log-2', time: '2026-10-20T12:10:00', user: 'ד. כהן', event_id: null, action: 'התחברות למערכת' },
  { id: 'log-1', time: '2026-10-20T12:05:00', user: 'מערכת', event_id: 'INC-2051', action: 'האירוע נקלט מ-2 מקורות' },
];

// Format to DD/MM • HH:mm
const formatTime = (iso: string) => {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} • ${hours}:${minutes}`;
};

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, sector, mode }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1120px] max-h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-right dark:bg-slate-900 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">יומן ביקורת</h2>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
              {mode === 'real' ? 'מצב אמת' : 'מצב תרגיל'} • גזרה: {sector}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
            title="סגור"
            aria-label="סגור"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Description Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm text-slate-600 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300">
          כל פעולה בגזרה, כולל ניסיונות שנחסמו. הרשומות לקריאה בלבד • {AUDIT_LOGS.length} רשומות.
        </div>

        {/* Log Entries Table */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900">
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="w-40 py-3.5 text-right font-medium border-b border-slate-200 dark:border-slate-800">זמן</th>
                <th className="w-40 py-3.5 text-right font-medium border-b border-slate-200 dark:border-slate-800">משתמש</th>
                <th className="w-40 py-3.5 text-right font-medium border-b border-slate-200 dark:border-slate-800">אירוע</th>
                <th className="py-3.5 text-right font-medium border-b border-slate-200 dark:border-slate-800">פעולה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
              {AUDIT_LOGS.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3.5 whitespace-nowrap tabular-nums">
                    <span dir="ltr">{formatTime(entry.time)}</span>
                  </td>
                  <td className="py-3.5 whitespace-nowrap">{entry.user}</td>
                  <td className="py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {entry.event_id ?? '—'}
                  </td>
                  <td className="py-3.5 select-text">{entry.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
