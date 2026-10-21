import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode; // e.g. <CheckSquare className="w-4 h-4" />
  footer?: ReactNode; // Footer is hidden when omitted
  maxWidthClassName?: string; // Tailwind max-width of the card
  contentClassName?: string; // Overrides the body's padding / scroll / layout
  children?: ReactNode;
}

/**
 * Generic modal shell: overlay, card, header with close button, scrollable body and optional footer.
 * Clicking the overlay closes the modal; clicks inside the card do not.
 */
export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  maxWidthClassName = 'max-w-2xl',
  contentClassName = 'p-5 max-h-[60vh] overflow-y-auto',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-slate-200 rounded-2xl shadow-2xl w-full ${maxWidthClassName} overflow-hidden text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
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
        <div className={contentClassName}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between dark:bg-slate-850 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
