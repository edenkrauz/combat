import React, { useRef, useState } from 'react';
import { X, Check, Download, Loader2 } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { EventReportData } from '../types/report';
import { EventSummaryPdfDocument } from './EventSummaryPdfDocument';
import { mapEventToReportData } from '../utils/reportMapper';
import { exportElementToPdf } from '../utils/pdfExport';

interface EventSummaryModalProps {
  isOpen: boolean;
  event: EventItem;
  elapsedSeconds: number;
  closedBy?: string;
  closedAtTime?: string;
  checklistTasks?: Array<{ id: string; text: string; completed: boolean }>;
  customReportData?: EventReportData;
  onClose: () => void;
  onExportPdf?: () => void;
}

export const EventSummaryModal: React.FC<EventSummaryModalProps> = ({
  isOpen,
  event,
  elapsedSeconds,
  closedBy = 'ד. כהן',
  closedAtTime,
  checklistTasks,
  customReportData,
  onClose,
  onExportPdf,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Format elapsed time as HH:MM:SS
  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const formattedDuration = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Current or provided closure time formatted as HH:MM
  const closeTimeStr = closedAtTime || (() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  })();

  const isOverTarget = elapsedSeconds >= 120; // 2 minutes target threshold
  const eventIdentifier = event.code || event.event_id?.toUpperCase() || 'INC-EVENT';
  const eventSubtitle = `${eventIdentifier} • ${event.title}`;

  // Build completely dynamic report data from props and state
  const reportData: EventReportData = customReportData || mapEventToReportData({
    event,
    elapsedSeconds,
    closedBy,
    closedAtTime: closeTimeStr,
    checklistTasks,
  });

  const handleDownloadPdf = async () => {
    if (onExportPdf) {
      onExportPdf();
      return;
    }

    if (!pdfTemplateRef.current) {
      console.error('PDF template container ref is not available');
      return;
    }

    try {
      setIsExporting(true);
      const filename = `דוח-אירוע-${reportData.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportElementToPdf(pdfTemplateRef.current, {
        filename,
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('אירעה שגיאה בעת ייצוא ה-PDF. אנא נסה שוב.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="האירוע נסגר"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        dir="rtl"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/90 text-right select-none animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: V mark FIRST (on the extreme right), then Text, then X on LEFT */}
          <div className="flex items-start justify-between p-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col items-start text-right">
                <h2 className="text-xl font-extrabold text-slate-900">האירוע נסגר</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{eventSubtitle}</p>
              </div>
            </div>

            {/* Left side: Close 'X' Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              aria-label="סגירה"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Body Cards: Treatment Duration & Closed By */}
          <div className="p-5 grid grid-cols-2 gap-3.5">
            {/* Right Box (first in RTL): משך טיפול */}
            <div className="rounded-xl border border-slate-200/90 bg-[#fbfcfd] p-4 text-center flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500">משך טיפול</span>
              <div className="my-1.5 font-mono text-2xl font-black text-rose-700 tracking-tight">
                {formattedDuration}
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  isOverTarget ? 'text-rose-700' : 'text-emerald-600'
                }`}
              >
                {isOverTarget ? 'מעל יעד 2 דקות' : 'עמד ביעד 2 דקות'}
              </span>
            </div>

            {/* Left Box (second in RTL): נסגר על ידי */}
            <div className="rounded-xl border border-slate-200/90 bg-[#fbfcfd] p-4 text-center flex flex-col justify-start">
              <span className="text-xs font-medium text-slate-500">נסגר על ידי</span>
              <div className="mt-3 text-base font-bold text-slate-900">
                {closedBy} • {closeTimeStr}
              </div>
            </div>
          </div>

          {/* Footer Actions: PDF Export on RIGHT (start in RTL), 'סיום' on LEFT (end in RTL) */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between gap-3">
            {/* PDF Export Button (Right in RTL / start) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl bg-[#131b2e] hover:bg-slate-900 active:bg-black px-5 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-wait"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                  <span>מייצא דוח PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>ייצוא דוח סיכום אירוע PDF</span>
                </>
              )}
            </button>

            {/* Finish 'סיום' Button (Left in RTL / end) */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            >
              סיום
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen rendered printable container - visible to layout engine, off-screen to user */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '794px',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <EventSummaryPdfDocument ref={pdfTemplateRef} data={reportData} />
      </div>
    </>
  );
};
