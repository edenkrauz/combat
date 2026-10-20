import { X } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 flex flex-col gap-4 text-right transition-all dark:bg-slate-900 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-0.5">
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">
            יומן ביקורת
          </h2>
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
          תיעוד פעולות מפעילים, שינויי סטטוס והחלטות בחמ״ל בזמן אמת
        </div>

        {/* Log Entries List */}
        <div className="flex flex-col gap-2 min-h-[160px] max-h-[300px] overflow-y-auto pr-0.5">
          {AUDIT_LOGS.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-2.5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 transition dark:bg-slate-850 dark:border-slate-800 dark:hover:border-slate-700"
            >
              <span className="font-mono text-xs font-semibold text-slate-500 shrink-0 pt-0.5 pr-1 dark:text-slate-400">
                {entry.timestamp}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {entry.action}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      על ידי <strong className="text-slate-700 dark:text-slate-200">{entry.operator}</strong>
                    </span>
                  </div>
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
                </div>
                <p className="text-xs text-slate-600 leading-relaxed select-text dark:text-slate-300">
                  {entry.details}
                </p>
              </div>
            </div>
          ))}
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
