import React, { useState } from 'react';
import { TopNavbar, type OperationalMode } from './components/TopNavbar';
import { OperationalBanner } from './components/OperationalBanner';
import { ChecklistTemplatesModal } from './components/ChecklistTemplatesModal';
import { EventsPanel } from './components/EventsPanel';
import { Map } from './components/Map';
import { mockSectorsData } from './data/mockEvents';

export const App: React.FC = () => {

  const activeSector = mockSectorsData[0];
  const allEvents = mockSectorsData.flatMap((s) => s.events);
  const [operationalMode, setOperationalMode] = useState<OperationalMode>('real');
  const [isChecklistsOpen, setIsChecklistsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex flex-col font-sans transition-colors dark:bg-slate-950" dir="rtl">
      {/* 
        Top Navigation Bar with Combat Logo, Sector badge, dynamic Live Clock,
        Operational Actions (Checklists, Audit Log), Mode toggle (אמת / תרגיל),
        User profile and Dark Mode switcher.
      */}
      <TopNavbar
        mode={operationalMode}
        onModeChange={setOperationalMode}
        onOpenChecklists={() => setIsChecklistsOpen(true)}
      />

      {/* Operational alert strip directly under the navbar */}
      <OperationalBanner mode={operationalMode} />

      {/* Main workspace: Events panel strictly positioned on the right */}
      <main className="flex-1 p-4 flex justify-start items-start">
        <div className="mr-0 ml-auto w-full max-w-[420px]">
          <EventsPanel sectors={mockSectorsData} />
        </div>
        <div className="flex-1 h-[calc(100vh-2rem)] flex flex-col">
          <Map events={allEvents} sector={activeSector} />
        </div>
      </main>

      {/* Checklist Templates Modal Popup */}
      <ChecklistTemplatesModal
        isOpen={isChecklistsOpen}
        onClose={() => setIsChecklistsOpen(false)}
      />
    </div>
  );
};

export default App;
