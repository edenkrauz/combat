import React, { useState } from 'react';
import { X, ChevronUp, Trash2 } from 'lucide-react';

export type CategoryKey = 'rocket' | 'riot' | 'civil' | 'hostile';

export interface CategoryOption {
  id: CategoryKey;
  label: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'hostile', label: 'פח״ע' },
  { id: 'civil', label: 'חירום אזרחי ורפואי' },
  { id: 'riot', label: 'הפרות סדר ואלימות המונית' },
  { id: 'rocket', label: 'תלול-מסלול, ירי רקטי ואווירי' },
];

export const INITIAL_CHECKLISTS: Record<CategoryKey, string[]> = {
  rocket: [
    'התרעת חמ"ל והתרעה לגורמים הרלוונטיים.',
    'הזנקת כוחות רפואה והצלה בהתאם לצורך.',
    'עדכון גורמי הרשות המקומית במקרה של פגיעה באזור מאוכלס.',
    'בדיקת צורך בסיוע נוסף בעקבות נזק לתשתיות.',
  ],
  riot: [
    'העברת התרעה לחמ"ל הרלוונטי.',
    'הזנקת כוחות הביטחון בהתאם לנוהל.',
    'מיפוי צירים חסומים ועדכון גורמי השטח.',
  ],
  civil: [
    'הזנקת מד"א וגורמי רפואה והצלה נוספים.',
    'הזנקת כוחות הביטחון בהתאם לנוהל.',
    'תיאום מול בתי החולים או גורמי הרפואה הרלוונטיים, בהתאם לנוהל.',
  ],
  hostile: [
    'העברת התרעה לחמ"ל הרלוונטי.',
    'הזנקת כוחות הביטחון הרלוונטיים.',
    'הזנקת מד"א במקרה של נפגעים או חשד לנפגעים.',
    'תיאום מול הגורם האחראי על האזור שבו דווח האירוע.',
  ],
};

interface ChecklistTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChecklistTemplatesModal: React.FC<ChecklistTemplatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryKey>('rocket');
  const [checklists, setChecklists] = useState<Record<CategoryKey, string[]>>(INITIAL_CHECKLISTS);
  const [newTaskText, setNewTaskText] = useState('');

  if (!isOpen) return null;

  const currentItems = checklists[activeTab] || [];
  const hasInputText = newTaskText.trim().length > 0;

  // Move item up (e.g. #2 becomes #1, #4 becomes #3)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setChecklists((prev) => {
      const list = [...prev[activeTab]];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      return {
        ...prev,
        [activeTab]: list,
      };
    });
  };

  // Delete item
  const handleDelete = (index: number) => {
    setChecklists((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((_, i) => i !== index),
    }));
  };

  // Add new item
  const handleAdd = () => {
    if (!hasInputText) return;
    setChecklists((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newTaskText.trim()],
    }));
    setNewTaskText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
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

        {/* Info Banner Box */}
        <div className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-xl py-2 px-3 text-center text-xs text-slate-600 font-normal dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300">
          כל משימות התבנית הן משימות חובה – אירוע נסגר רק לאחר השלמת כולן.
        </div>

        {/* Category Tabs (Subpages) */}
        <div className="flex items-center justify-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 gap-1 dark:bg-slate-800 dark:border-slate-700">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === cat.id
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/70 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                  : 'text-slate-600 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="flex flex-col gap-2 min-h-[160px] max-h-[300px] overflow-y-auto pr-0.5">
          {currentItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2.5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 transition dark:bg-slate-850 dark:border-slate-800 dark:hover:border-slate-700"
            >
              {/* Right side: Number and Description */}
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-1">
                <span className="font-mono text-xs font-semibold text-slate-500 shrink-0 w-3 text-center dark:text-slate-400">
                  {index + 1}
                </span>
                <span className="text-xs font-medium text-slate-800 select-text leading-relaxed break-words dark:text-slate-100">
                  {item}
                </span>
              </div>

              {/* Left side: Move Up and Delete buttons */}
              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                {/* Arrow Up button: Moves item up (#2 becomes #1, #4 becomes #3) */}
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition ${
                    index === 0
                      ? 'border-slate-200 bg-slate-50/60 text-slate-400 cursor-not-allowed dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white'
                  }`}
                  title={index === 0 ? 'המשימה כבר ראשונה' : 'העבר משימה למעלה'}
                  aria-label="העבר משימה למעלה"
                >
                  <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.2} />
                </button>

                {/* Trash Delete button */}
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-slate-600 transition cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950/30 dark:hover:border-red-800 dark:hover:text-red-400"
                  title="מחק משימה מהתבנית"
                  aria-label="מחק משימה"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Task Form Row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Text Input (Right) */}
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="משימה חדשה בתבנית"
            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          {/* Add Button (Left): Dismissed/disabled until typing */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!hasInputText}
            className={`h-9 px-4 rounded-xl border text-xs font-semibold transition whitespace-nowrap ${
              hasInputText
                ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-750'
                : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed dark:bg-slate-850 dark:border-slate-800 dark:text-slate-600'
            }`}
          >
            הוספה
          </button>
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
