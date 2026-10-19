import React from 'react';
import { EventsPanel } from './components/EventsPanel';
import { Map } from './components/Map';
import { mockSectorsData } from './data/mockEvents';

export const App: React.FC = () => {
  const activeSector = mockSectorsData[0];
  const allEvents = mockSectorsData.flatMap((s) => s.events);

  return (
    <div className="min-h-screen bg-[#f3f5f8] p-4 flex gap-4 overflow-hidden" dir="rtl">
      {/* 
        Events panel anchored on the right side of the screen.
      */}
      <div className="w-full max-w-[420px] shrink-0 h-[calc(100vh-2rem)]">
        <EventsPanel sectors={mockSectorsData} />
      </div>
            {/* 
        Map component takes the remaining flex space on the left, filling viewport height.
      */}
      <main className="flex-1 h-[calc(100vh-2rem)] flex flex-col">
        <Map events={allEvents} sector={activeSector} />
      </main>
    </div>
  );
};

export default App;
