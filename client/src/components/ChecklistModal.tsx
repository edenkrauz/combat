import { useState } from 'react';
import { X, CheckSquare, Plus, CheckCircle2 } from 'lucide-react';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  itemsCount: number;
}

const DEFAULT_CHECKLISTS: ChecklistItem[] = [
  {
    id: 'ch-1',
    title: 'נוהל פתיחת אירוע נפילת רקטה / טיל',
    description: 'סדר פעולות ראשוני: אימות מיקום, סריקת חבלן, סגירת מעגל עם כוחות מד״א וכיבוי.',
    category: 'מבצעי',
    itemsCount: 8,
  },
  {
    id: 'ch-2',
    title: 'נוהל שריפה / דליפת חומ״ס באזור תעשייה',
    description: 'הגדרת רדיוסי בידוד, הנחיות לאוכלוסייה, פריסת מחסומי משטרה.',
    category: 'בטיחות וחומ״ס',
    itemsCount: 6,
  },
  {
    id: 'ch-3',
    title: 'נוהל קריסת מבנה מגורים רב-קומתי',
    description: 'הפעלת יחידת חילוץ ארצית, הקמת נקודת ריכוז נפגעים, ניתוק תשתיות גז וחשמל.',
    category: 'חילוץ והצלה',
    itemsCount: 10,
  },
  {
    id: 'ch-4',
    title: 'נוהל חסימת צירים ראשיים ופינוי דחוף',
    description: 'סנכרון מול אגף התנועה של המשטרה, הקצאת צירי חירום לאמבולנסים.',
    category: 'תנועה וצירים',
    itemsCount: 5,
  },
];

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose }) => {
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(DEFAULT_CHECKLISTS[0]);

  if (!isOpen) return null;

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
          {DEFAULT_CHECKLISTS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedChecklist(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedChecklist?.id === item.id
                  ? 'border-blue-500 bg-blue-50/40 shadow-xs dark:bg-blue-950/20 dark:border-blue-600'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-slate-900 leading-snug dark:text-white">
                  {item.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3 dark:text-slate-300">
                {item.description}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  {item.itemsCount} שלבים בנוהל
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
