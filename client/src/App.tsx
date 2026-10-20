import React, { useState } from 'react';
import { TopNavbar, type OperationalMode } from './components/TopNavbar';
import { OperationalBanner } from './components/OperationalBanner';
import { ChecklistTemplatesModal } from './components/ChecklistTemplatesModal';
import { StatisticsModal } from './components/StatisticsModal';
import { EventsPanel } from './components/EventsPanel';
import { Map } from './components/Map';
import { mockSectorsData } from './data/mockEvents';

export const App: React.FC = () => {

  const activeSector = mockSectorsData[0];
  const allEvents = mockSectorsData.flatMap((s) => s.events);
  const [operationalMode, setOperationalMode] = useState<OperationalMode>('real');
  const [isChecklistsOpen, setIsChecklistsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);

  return (
    <div className="h-screen w-screen bg-[#f3f5f8] flex flex-col font-sans transition-colors overflow-hidden dark:bg-slate-950" dir="rtl">
      {/* 
        Top Navigation Bar with Combat Logo, Sector badge, dynamic Live Clock,
        Operational Actions (Checklists, Audit Log), Mode toggle (אמת / תרגיל),
        User profile and Dark Mode switcher.
      */}
      <TopNavbar
        mode={operationalMode}
        onModeChange={setOperationalMode}
        onOpenChecklists={() => setIsChecklistsOpen(true)}
        onOpenStatistics={() => setIsStatisticsOpen(true)}
      />

      {/* Operational alert strip directly under the navbar */}
      <OperationalBanner mode={operationalMode} />

      {/* Main workspace: Events panel strictly positioned on the right */}
      <main className="flex-1 min-h-0 p-3.5 flex gap-3.5 items-stretch overflow-hidden">
        <div className="w-full max-w-[420px] h-full flex flex-col shrink-0">
          <EventsPanel sectors={mockSectorsData} />
        </div>
        <div className="flex-1 h-full min-h-0 flex flex-col">
          <Map events={allEvents} sector={activeSector} />
        </div>
      </main>

      {/* Checklist Templates Modal Popup */}
      <ChecklistTemplatesModal
        isOpen={isChecklistsOpen}
        onClose={() => setIsChecklistsOpen(false)}
      />

      {/* Statistics Modal Popup */}
      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
        title="סטטיסטיקה"
      >
        {/* TODO: analysts dashboard */}
      </StatisticsModal>
    </div>
  );
};

export default App;
