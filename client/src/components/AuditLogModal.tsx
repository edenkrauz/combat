import { X, Clock } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-900/30 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                יומן ביקורת מבצעי (Audit Log)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                תיעוד פעולות מפעילים, שינויי סטטוס והחלטות בחמ״ל בזמן אמת
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {AUDIT_LOGS.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition flex items-start gap-3 dark:bg-slate-800/40 dark:border-slate-800 dark:hover:bg-slate-800/70"
            >
              <div className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                {entry.timestamp}
              </div>

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
                <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-300">
                  {entry.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between dark:bg-slate-850 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            מוצגות 5 פעולות אחרונות • תיעוד מאובטח
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
