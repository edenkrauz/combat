import React from 'react';
import type { EventReportData } from '../types/report';

interface EventSummaryPdfDocumentProps {
  data: EventReportData;
}

export const EventSummaryPdfDocument = React.forwardRef<HTMLDivElement, EventSummaryPdfDocumentProps>(
  ({ data }, ref) => {
    const completedCount = data.checklistItems.filter((i) => i.status === 'completed').length;
    const totalCount = data.checklistItems.length;

    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          width: '794px',
          height: '1122px', // Exact A4 height at 96 DPI
          maxHeight: '1122px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Assistant', 'Rubik', 'Heebo', system-ui, sans-serif",
          boxSizing: 'border-box',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          textAlign: 'right',
          overflow: 'hidden',
        }}
      >
        <div>
          {/* 1. Header Bar (Dark Navy Banner) */}
          <div
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              padding: '12px 20px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            {/* Top Right: System Subtitle & Main Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500, marginBottom: '2px' }}>
                {data.systemSubtitle || 'קומבט • ניהול לחימה'}
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                דוח סיכום אירוע
              </h1>
            </div>

            {/* Top Left: Event ID & Export Timestamp */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'left' }} dir="ltr">
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>
                {data.id}
              </span>
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500, marginTop: '2px' }}>
                {data.exportedAt}
              </span>
            </div>
          </div>

          {/* 2. Title & Badge Header Section */}
          <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.25 }}>
              {data.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              {/* Neutral Status */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                }}
              >
                סטטוס: {data.status}
              </span>

              {/* Urgency Level */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                }}
              >
                דחיפות {data.urgency}
              </span>

              {/* Operational Status */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                }}
              >
                {data.operationalStatus}
              </span>

              {/* Access Level */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 500,
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  backgroundColor: '#ffffff',
                }}
              >
                {data.accessLevel}
              </span>
            </div>
          </div>

          {/* 3. Section 1: פרטי האירוע (Event Details) */}
          <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderRight: '3px solid #1e293b', paddingRight: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>פרטי האירוע</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 18px', fontSize: '11px' }}>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>קטגוריה ראשית</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.mainCategory}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>קטגוריות נוספות</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.secondaryCategories || '—'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>אזור / גזרה</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.region}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>מיקום</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.location}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>רמת דחיפות</span>
                <span style={{ display: 'block', fontWeight: 800, color: '#dc2626' }}>{data.urgencyLevel}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>מקור הדיווח</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.reportSource}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>מעורבים / מושפעים</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.affectedCount}</span>
              </div>
              <div style={{ gridColumn: 'span 2', paddingTop: '2px' }}>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>תיאור האירוע</span>
                <p
                  style={{
                    fontWeight: 400,
                    color: '#1e293b',
                    lineHeight: 1.45,
                    backgroundColor: '#f8fafc',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '65px',
                    overflow: 'hidden',
                  }}
                >
                  {data.description}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Section 2: ציר זמנים ומשך טיפול (Timeline & Duration) */}
          <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderRight: '3px solid #1e293b', paddingRight: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>ציר זמנים ומשך טיפול</h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px 14px',
                fontSize: '11px',
                backgroundColor: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>זמן האירוע</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.timeline.startTime}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>נקלט במערכת</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.timeline.ingestedTime}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>נסגר</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.timeline.closedTime}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>נסגר על ידי</span>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{data.closedBy}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>משך טיפול כולל</span>
                <span style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: '#dc2626', fontFamily: 'monospace' }}>
                  {data.timeline.totalDuration}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>עמידה ביעד</span>
                <span style={{ display: 'block', fontWeight: 800, color: '#dc2626' }}>{data.timeline.slaStatus}</span>
              </div>
            </div>
          </div>

          {/* 5. Section 3: נפגעים (Casualties Table) */}
          <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderRight: '3px solid #1e293b', paddingRight: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>נפגעים</h3>
            </div>

            <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', textAlign: 'right', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: 700 }}>
                    <th style={{ padding: '6px 12px', textAlign: 'right' }}>צד</th>
                    <th style={{ padding: '6px 12px', textAlign: 'center' }}>פצועים</th>
                    <th style={{ padding: '6px 12px', textAlign: 'center' }}>הרוגים</th>
                  </tr>
                </thead>
                <tbody>
                  {data.casualties.map((item, idx) => {
                    const isFriendly = item.sideType === 'friendly';
                    const isHostile = item.sideType === 'hostile';
                    const textColor = isFriendly ? '#1d4ed8' : isHostile ? '#b91c1c' : '#1e293b';

                    return (
                      <tr key={idx} style={{ borderBottom: idx < data.casualties.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '6px 12px', color: textColor, fontWeight: 700 }}>
                          {item.side}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', color: textColor, fontWeight: 700 }}>
                          {item.injuredCount}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', color: textColor, fontWeight: 700 }}>
                          {item.deceasedCount}
                        </td>
                      </tr>
                    );
                  })}
                  {data.casualties.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>
                        אין דיווח נפגעים
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Section 4: צ'קליסט משימות (Task Checklist Table) */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderRight: '3px solid #1e293b', paddingRight: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                צ'קליסט משימות • {completedCount}/{totalCount} הושלמו
              </h3>
            </div>

            <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', textAlign: 'right', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: 700 }}>
                    <th style={{ padding: '5px 8px', textAlign: 'center', width: '28px' }}>#</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>משימה</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', width: '55px' }}>סטטוס</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', width: '70px' }}>בוצע על ידי</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', width: '55px' }}>שעה</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>הערה</th>
                  </tr>
                </thead>
                <tbody>
                  {data.checklistItems.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: idx < data.checklistItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a' }}>
                        {item.task}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                          }}
                        >
                          {item.statusLabel || 'בוצע'}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', color: '#334155', fontWeight: 500 }}>
                        {item.completedBy || '—'}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#475569', fontFamily: 'monospace', fontSize: '10px' }}>
                        {item.time || '—'}
                      </td>
                      <td style={{ padding: '5px 8px', color: '#64748b', fontSize: '10px' }}>
                        {item.notes || '—'}
                      </td>
                    </tr>
                  ))}
                  {data.checklistItems.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>
                        אין משימות מתועדות
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 7. Footer Bar */}
        <div
          style={{
            paddingTop: '10px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
            marginTop: 'auto',
          }}
        >
          {/* Right Side: Dynamic footer meta string */}
          <div style={{ fontWeight: 500, color: '#475569' }}>
            {data.systemName || 'מערכת קומבט'} - {data.id} • הופק על ידי {data.currentUser?.name || data.closedBy}
          </div>

          {/* Left Side: Page indicator */}
          <div style={{ fontWeight: 600, color: '#64748b' }} dir="rtl">
            עמוד 1 מתוך 1
          </div>
        </div>
      </div>
    );
  }
);

EventSummaryPdfDocument.displayName = 'EventSummaryPdfDocument';
