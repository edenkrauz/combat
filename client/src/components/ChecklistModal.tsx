import { useEffect, useState } from 'react';
import { X, CheckSquare, Plus, CheckCircle2 } from 'lucide-react';
import {
  getCategoryTasks,
  getTaskCategories,
  type TaskCategoryTasks,
} from '../api/taskCategories';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose }) => {
  const [checklists, setChecklists] = useState<TaskCategoryTasks[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrentRequest = true;
    setIsLoading(true);
    setError(null);

    getTaskCategories()
      .then((categories) =>
        Promise.all(categories.map((category) => getCategoryTasks(category.category_id))),
      )
      .then((result) => {
        if (!isCurrentRequest) return;
        setChecklists(result);
        setSelectedCategoryId((current) =>
          result.some((category) => category.category_id === current)
            ? current
            : (result[0]?.category_id ?? null),
        );
      })
      .catch((requestError: unknown) => {
        if (isCurrentRequest) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'טעינת תבניות הצ׳קליסט נכשלה',
          );
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedChecklist =
    checklists.find((category) => category.category_id === selectedCategoryId) ?? null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in select-none"
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                תבניות צ'קליסט מבצעיות
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                נהלי עבודה סדורים ומשימות לביצוע לפי סוג אירוע
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
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <p className="col-span-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          )}
          {isLoading ? (
            <p className="col-span-full py-8 text-center text-sm text-slate-500" role="status">
              טוען תבניות...
            </p>
          ) : checklists.map((item) => (
            <div
              key={item.category_id}
              onClick={() => setSelectedCategoryId(item.category_id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedCategoryId === item.category_id
                  ? 'border-blue-500 bg-blue-50/40 shadow-xs dark:bg-blue-950/20 dark:border-blue-600'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-slate-900 leading-snug dark:text-white">
                  {item.display_name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {item.task_count} משימות
                </span>
              </div>
              <ul className="text-xs text-slate-600 leading-relaxed mb-3 space-y-1 dark:text-slate-300">
                {item.tasks.slice(0, 3).map((task, index) => (
                  <li key={`${index}-${task}`} className="line-clamp-1">
                    {task}
                  </li>
                ))}
                {item.tasks.length > 3 && (
                  <li className="text-slate-400">ועוד {item.tasks.length - 3} משימות...</li>
                )}
              </ul>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  {item.tasks.length} שלבים בנוהל
                </span>
                <span className="text-blue-600 font-medium hover:underline dark:text-blue-400">
                  הפעל צ'קליסט
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between dark:bg-slate-850 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
          >
            סגור
          </button>
          <button
            onClick={() => alert('נוהל הופעל בהצלחה לאירוע הפעיל')}
            disabled={!selectedChecklist}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>שיוך תבנית לאירוע פעיל</span>
          </button>
        </div>
      </div>
    </div>
  );
};
