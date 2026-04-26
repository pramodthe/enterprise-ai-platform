import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { AppMode, AppUser } from './types';

function buildLocalUser(): AppUser {
  const name = import.meta.env.VITE_APP_USER_NAME?.trim();
  const email = import.meta.env.VITE_APP_USER_EMAIL?.trim();
  return {
    displayName: name || 'User',
    email: email || 'local@dev',
  };
}

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('dashboard');
  const user = buildLocalUser();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f3f4f6] font-sans">
      <div
        className={`
              absolute inset-0 z-0 flex items-center justify-center
              transition-all duration-500 ease-in-out
              ${currentMode !== 'dashboard'
            ? 'scale-95 opacity-50 blur-[5px] pointer-events-none'
            : 'scale-100 opacity-100 blur-0'
          }
            `}
      >
        <Dashboard onSelectMode={setCurrentMode} user={user} />
      </div>

      {currentMode !== 'dashboard' && (
        <div className="absolute inset-0 z-20 flex justify-center bg-slate-900/15 animate-in fade-in duration-300">
          <ChatInterface mode={currentMode} onBack={() => setCurrentMode('dashboard')} />
        </div>
      )}
    </div>
  );
}

export default App;
