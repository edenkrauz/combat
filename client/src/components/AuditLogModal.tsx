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
  timestamp: string;
  operator: string;
  action: string;
  details: string;
  level: 'info' | 'warning' | 'action';
}

const AUDIT_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '15:05:10',
    operator: 'ד. כהן',
    action: 'עדכון סטטוס אירוע',
    details: 'אירוע evt-101 (נפילה באזור תעשייה) עודכן לסטטוס "בטיפול". כוחות נוספים הוזנקו.',
    level: 'action',
  },
  {
    id: 'log-2',
    timestamp: '14:58:32',
    operator: 'מוקד 102',
    action: 'קליטת דיווח מבצעי',
    details: 'נפתח אירוע evt-103 (שריפה ליד מחלף גנות) בעקבות נפילת נפל בשטח פתוח.',
    level: 'info',
  },
  {
    id: 'log-3',
    timestamp: '14:53:00',
    operator: 'ד. כהן',
    action: 'הקצאת כוחות',
    details: 'אושר סד״כ של 4 צוותי כיבוי והצלה וצוות חבלנים לאזור בת ים.',
    level: 'action',
  },
  {
    id: 'log-4',
    timestamp: '14:40:15',
    operator: 'מערכת אוטומטית',
    action: 'ניטור מתיחות אזורית',
    details: 'מתיחות אזורית בגזרת מרכז הוגדרה כ"בינונית" על בסיס 8 אירועים פתוחים.',
    level: 'warning',
  },
  {
    id: 'log-5',
    timestamp: '14:15:20',
    operator: 'ד. כהן',
    action: 'התחברות למערכת',
    details: 'התחברות מאומתת לתפקיד קצין מבצעים - חמ״ל גזרת מרכז.',
    level: 'info',
  },
];

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, sector, mode }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[960px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 flex flex-col gap-4 text-right transition-all dark:bg-slate-900 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-0.5">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">
              יומן ביקורת
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
              {sector} • {mode === 'real' ? 'מצב אמת' : 'מצב תרגיל'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
            title="סגור"
            aria-label="סגור"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info Banner Box */}
        <div className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-xl py-2 px-3 text-center text-xs text-slate-600 font-normal dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300">
          כל פעולה בגזרה, כולל ניסיונות שנחסמו. הרשומות לקריאה בלבד • {AUDIT_LOGS.length} רשומות
        </div>

        {/* Log Entries Table */}
        <div className="min-h-[160px] max-h-[400px] overflow-y-auto border border-slate-200/90 rounded-xl dark:border-slate-800">
          <table className="w-full text-xs text-right">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 font-semibold dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">שעה</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">מבצע</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">פעולה</th>
                <th className="px-3 py-2 font-semibold">פרטים</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">סוג</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {AUDIT_LOGS.map((entry) => (
                <tr
                  key={entry.id}
                  className="align-top hover:bg-slate-50/70 transition dark:hover:bg-slate-800/50"
                >
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-500 whitespace-nowrap dark:text-slate-400">
                    {entry.timestamp}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700 whitespace-nowrap dark:text-slate-200">
                    {entry.operator}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap dark:text-white">
                    {entry.action}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 leading-relaxed select-text dark:text-slate-300">
                    {entry.details}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        entry.level === 'action'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : entry.level === 'warning'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {entry.level === 'action' ? 'פעולה מבצעית' : entry.level === 'warning' ? 'התרעה' : 'מידע'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Close Button on Right */}
        <div className="flex justify-start pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs cursor-pointer transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-750"
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
};
