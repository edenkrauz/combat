import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { OperationalMode } from './TopNavbar';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: string; // e.g. "מרכז"
  mode: OperationalMode;
}

/**
 * Audit log row as returned by GET /api/audit-log (audit_log table).
 */
interface AuditLogEntry {
  log_id: string; // BIGINT PK, sent as string
  occurred_at: string; // ISO 8601 UTC
  user_name: string; // Operator name or "מערכת" for automatic actions
  event_id: string | null; // NULL = action not tied to an event
  action: string;
}

// reality_id per mode: 0 = real, non-zero for drill
const REALITY_ID: Record<OperationalMode, number> = { real: 0, drill: 1 };

type LoadState = 'loading' | 'ready' | 'error';

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
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  // Reload whenever the modal opens or the sector / mode changes
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ reality_id: String(REALITY_ID[mode]), sector });

    setLoadState('loading');
    fetch(`/api/audit-log?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AuditLogEntry[]>;
      })
      .then((rows) => {
        setEntries(rows);
        setLoadState('ready');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load audit log:', error);
        setLoadState('error');
      });

    return () => controller.abort();
  }, [isOpen, sector, mode]);

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
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
          כל פעולה בגזרה, כולל ניסיונות שנחסמו. הרשומות לקריאה בלבד
          {loadState === 'ready' && ` • ${entries.length} רשומות.`}
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
              {/* Loading / error / empty states */}
              {(loadState !== 'ready' || entries.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    {loadState === 'loading'
                      ? 'טוען רשומות…'
                      : loadState === 'error'
                      ? 'לא ניתן לטעון את יומן הביקורת'
                      : 'אין רשומות להצגה'}
                  </td>
                </tr>
              )}
              {loadState === 'ready' && entries.map((entry) => (
                <tr key={entry.log_id}>
                  <td className="py-3.5 whitespace-nowrap tabular-nums">
                    <span dir="ltr">{formatTime(entry.occurred_at)}</span>
                  </td>
                  <td className="py-3.5 whitespace-nowrap">{entry.user_name}</td>
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
