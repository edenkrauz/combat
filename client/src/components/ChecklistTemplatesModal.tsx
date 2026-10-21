import React, { useEffect, useState } from 'react';
import { X, ChevronUp, Trash2 } from 'lucide-react';
import {
  addCategoryTask,
  deleteCategoryTask,
  getCategoryTasks,
  getTaskCategories,
  moveCategoryTask,
  type TaskCategory,
} from '../api/taskCategories';

interface ChecklistTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChecklistTemplatesModal: React.FC<ChecklistTemplatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrentRequest = true;
    setIsLoadingCategories(true);
    setError(null);

    getTaskCategories()
      .then((result) => {
        if (!isCurrentRequest) return;
        setCategories(result);
        setActiveCategoryId((current) =>
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
              : 'טעינת קטגוריות המשימות נכשלה',
          );
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingCategories(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeCategoryId === null) return;
    let isCurrentRequest = true;
    setIsLoadingTasks(true);
    setError(null);

    getCategoryTasks(activeCategoryId)
      .then((category) => {
        if (isCurrentRequest) setTasks(category.tasks);
      })
      .catch((requestError: unknown) => {
        if (isCurrentRequest) {
          setTasks([]);
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'טעינת משימות הקטגוריה נכשלה',
          );
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingTasks(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [isOpen, activeCategoryId]);

  if (!isOpen) return null;

  const hasInputText = newTaskText.trim().length > 0;

  const handleAdd = async () => {
    if (!hasInputText || activeCategoryId === null || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const category = await addCategoryTask(activeCategoryId, newTaskText.trim());
      setTasks(category.tasks);
      setCategories((current) =>
        current.map((item) =>
          item.category_id === category.category_id
            ? { ...item, task_count: category.task_count }
            : item,
        ),
      );
      setNewTaskText('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'הוספת המשימה נכשלה',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (activeCategoryId === null || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const category = await deleteCategoryTask(activeCategoryId, index);
      setTasks(category.tasks);
      setCategories((current) =>
        current.map((item) =>
          item.category_id === category.category_id
            ? { ...item, task_count: category.task_count }
            : item,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'מחיקת המשימה נכשלה',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || activeCategoryId === null || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const category = await moveCategoryTask(activeCategoryId, index, index - 1);
      setTasks(category.tasks);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'שינוי סדר המשימות נכשל',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 flex flex-col gap-4 text-right transition-all dark:bg-slate-900 dark:border-slate-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-0.5">
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">
            תבניות צ'קליסט לפי סוג אירוע
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

        {/* Info Banner */}
        <div className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-xl py-2 px-3 text-center text-xs text-slate-600 font-normal dark:bg-slate-800/60 dark:border-slate-700/80 dark:text-slate-300">
          כל משימות התבנית הן משימות חובה – אירוע נסגר רק לאחר השלמת כולן.
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 gap-1 dark:bg-slate-800/80 dark:border-slate-700">
          {categories.map((category) => (
            <button
              key={category.category_id}
              type="button"
              onClick={() => setActiveCategoryId(category.category_id)}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeCategoryId === category.category_id
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/70 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                  : 'text-slate-600 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {category.display_name}
            </button>
          ))}
        </div>

        {error && (
          <p
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 min-h-[160px] max-h-[300px] overflow-y-auto pr-0.5">
          {isLoadingCategories || isLoadingTasks ? (
            <p className="py-8 text-center text-xs text-slate-500" role="status">
              טוען משימות...
            </p>
          ) : (
            tasks.map((task, index) => (
              <div
                key={`${index}-${task}`}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 transition dark:bg-slate-800/80 dark:border-slate-700/80 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-1">
                  <span className="font-mono text-xs font-semibold text-slate-500 shrink-0 w-3 text-center dark:text-slate-400">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-800 select-text leading-relaxed break-words dark:text-slate-100">
                    {task}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <button
                    type="button"
                    onClick={() => void handleMoveUp(index)}
                    disabled={index === 0 || isSaving}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition ${
                      index === 0 || isSaving
                        ? 'border-slate-200 bg-slate-50/60 text-slate-400 cursor-not-allowed dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white'
                    }`}
                    title={index === 0 ? 'המשימה כבר ראשונה' : 'העבר משימה למעלה'}
                    aria-label="העבר משימה למעלה"
                  >
                    <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(index)}
                    disabled={isSaving}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-slate-600 transition cursor-pointer disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950/30 dark:hover:border-red-800 dark:hover:text-red-400"
                    title="מחק משימה מהתבנית"
                    aria-label="מחק משימה"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newTaskText}
            onChange={(event) => setNewTaskText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleAdd();
              }
            }}
            placeholder="משימה חדשה בתבנית"
            maxLength={500}
            disabled={isSaving || activeCategoryId === null}
            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!hasInputText || isSaving || activeCategoryId === null}
            className={`h-9 px-4 rounded-xl border text-xs font-semibold transition whitespace-nowrap ${
              hasInputText && !isSaving && activeCategoryId !== null
                ? 'border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white'
                : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed dark:bg-slate-800/40 dark:border-slate-700/60 dark:text-slate-600'
            }`}
          >
            הוספה
          </button>
        </div>

        {/* Footer with Close Button on Left (in RTL) */}
        <div className="flex justify-start pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs cursor-pointer transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
};
