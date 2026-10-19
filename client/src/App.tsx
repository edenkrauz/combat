import React from 'react';
import { EventsPanel } from './components/EventsPanel';
import { mockSectorsData } from './data/mockEvents';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f3f5f8] p-4 flex justify-start items-start" dir="rtl">
      {/* 
        Positioned strictly on the right side of the screen, matching the application UI.
      */}
      <div className="mr-0 ml-auto w-full max-w-[420px]">
        <EventsPanel sectors={mockSectorsData} />
      </div>
    </div>
  );
};

export default App;
